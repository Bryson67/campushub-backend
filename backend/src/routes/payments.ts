// backend/src/routes/payments.ts
import { ConvexHttpClient } from "convex/browser";
import Mpesa from "daraja-sdk";
import express from "express";

const router = express.Router();

// Initialize Convex HTTP client
const CONVEX_URL =
  process.env.CONVEX_URL || "https://peaceful-aardvark-549.convex.cloud";
console.log("🔧 Using CONVEX_URL:", CONVEX_URL);
const convexClient = new ConvexHttpClient(CONVEX_URL);

// Initialize Daraja SDK
const mpesa = new Mpesa({
  consumerKey: process.env.MPESA_CONSUMER_KEY!,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
  passkey: process.env.MPESA_PASSKEY!,
  environment: process.env.NODE_ENV === "production" ? "live" : "sandbox",
});

console.log(
  "📦 M-Pesa initialized with environment:",
  process.env.NODE_ENV === "production" ? "live" : "sandbox",
);
console.log("📦 Using Shortcode:", process.env.MPESA_SHORTCODE);

// Map to store pending payments
const pendingPayments = new Map<
  string,
  {
    userId: string;
    username: string;
    tournamentId: string;
    amount: number;
    phone: string;
  }
>();

// Generate unique reference
const generateReference = () => {
  return `CAMP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

// --------------------------
// Initiate Payment with Daraja SDK
// --------------------------
router.post("/pay", async (req, res) => {
  try {
    const { phone, amount, userId, username, tournamentId } = req.body;

    if (!phone || !amount || !userId || !username || !tournamentId) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    // Format phone (ensure 254 format)
    const formattedPhone = phone.startsWith("0")
      ? "254" + phone.slice(1)
      : phone.startsWith("254")
        ? phone
        : "254" + phone;

    const accountRef = generateReference();

    console.log("📤 Initiating M-Pesa STK Push:", {
      phone: formattedPhone,
      amount,
      reference: accountRef,
      userId,
      tournamentId,
    });

    // STK Push via Daraja SDK
    const response = await mpesa.stkPush({
      BusinessShortCode: process.env.MPESA_SHORTCODE!,
      Amount: Number(amount),
      PartyA: formattedPhone,
      PhoneNumber: formattedPhone,
      CallBackURL:
        process.env.MPESA_CALLBACK_URL ||
        "https://campushub-api-6830.onrender.com/api/daraja-webhook",
      AccountReference: accountRef,
      TransactionDesc: `Tournament Entry Fee - ${tournamentId}`,
    });

    console.log("✅ M-Pesa response:", response);

    // Store pending payment
    const checkoutId =
      response.CheckoutRequestID || response.checkout_request_id;
    pendingPayments.set(checkoutId, {
      userId,
      username,
      tournamentId,
      amount: Number(amount),
      phone: formattedPhone,
    });

    res.json({
      success: true,
      message: "STK push sent",
      checkoutId: checkoutId,
      data: response,
    });
  } catch (err: any) {
    console.error("❌ Error initiating payment:", err.message);
    if (err.response) {
      console.error("❌ M-Pesa error:", err.response.data);
    }
    res.status(500).json({
      success: false,
      error: err.message || "Payment initiation failed",
    });
  }
});

// --------------------------
// M-Pesa Webhook (Callback)
// --------------------------
router.post("/daraja-webhook", async (req, res) => {
  try {
    console.log("🔥 DARAJA WEBHOOK HIT:", req.body);

    const { Body } = req.body;
    const { stkCallback } = Body || {};

    if (!stkCallback) {
      console.log("❌ No stkCallback in webhook");
      return res.status(200).send("Event ignored");
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
      stkCallback;

    // Only process successful payments
    if (ResultCode !== 0) {
      console.log("❌ Payment failed:", ResultDesc);
      return res.status(200).send("Payment failed");
    }

    const pending = pendingPayments.get(CheckoutRequestID);
    if (!pending) {
      console.warn("⚠ No pending payment found for", CheckoutRequestID);
      return res.status(200).send("Transaction not found");
    }

    // Extract M-Pesa receipt number
    const mpesaReceipt = CallbackMetadata?.Item?.find(
      (item: any) => item.Name === "MpesaReceiptNumber",
    )?.Value;

    if (!mpesaReceipt) {
      console.warn("⚠ No receipt found in callback");
      return res.status(200).send("No receipt found");
    }

    console.log(`✅ Payment successful: ${mpesaReceipt}`);

    // Add player to Convex DB
    await convexClient.mutation("players:addPlayer" as any, {
      userId: pending.userId,
      name: pending.username,
      tournamentId: pending.tournamentId,
      phoneNumber: pending.phone,
      amount: pending.amount,
      mpesaReceipt: mpesaReceipt,
      createdAt: new Date().toISOString(),
    });

    pendingPayments.delete(CheckoutRequestID);
    res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (err) {
    console.error("❌ Webhook processing error:", err);
    res.status(500).json({ success: false, error: "Webhook failed" });
  }
});

// --------------------------
// Test Endpoint
// --------------------------
router.get("/test-mpesa", async (req, res) => {
  try {
    // Test the connection by getting a token
    const token = await mpesa.getAccessToken();
    res.json({
      success: true,
      message: "M-Pesa connected!",
      token: token.substring(0, 20) + "...",
    });
  } catch (err: any) {
    console.error("❌ M-Pesa test error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
