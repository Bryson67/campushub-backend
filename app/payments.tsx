// backend/src/routes/payments.ts
import axios from "axios";
import { ConvexHttpClient } from "convex/browser";
import express from "express";

const router = express.Router();

// Initialize Convex HTTP client
const CONVEX_URL =
  process.env.CONVEX_URL || "https://peaceful-aardvark-549.convex.cloud";
console.log("🔧 Using CONVEX_URL:", CONVEX_URL);
const convexClient = new ConvexHttpClient(CONVEX_URL);

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

// --------------------------
// Initiate Payment with Sunny Payments REST API
// --------------------------
router.post("/pay", async (req, res) => {
  try {
    const { phone, amount, userId, username, tournamentId } = req.body;

    if (!phone || !amount || !userId || !username || !tournamentId) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    // Format phone
    const formattedPhone = phone.startsWith("0")
      ? "254" + phone.slice(1)
      : phone.startsWith("254")
        ? phone
        : "254" + phone;

    // Generate reference
    const accountRef = `CAMP-${Date.now()}`;

    console.log("📤 Initiating Sunny Payment:", {
      phone: formattedPhone,
      amount,
      reference: accountRef,
      userId,
      tournamentId,
    });

    // Call Sunny Payments REST API
    const response = await axios.post(
      "https://api.sunnypayments.com/v1/mpesa/stkpush",
      {
        phoneNumber: formattedPhone,
        amount: Number(amount),
        accountReference: accountRef,
        transactionDesc: `Tournament Entry Fee - ${tournamentId}`,
        callbackUrl:
          process.env.SUNNY_CALLBACK_URL ||
          "https://campushub-api-6830.onrender.com/api/webhook",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.SUNNY_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("✅ Sunny Payment response:", response.data);

    // Store pending payment
    const transactionId =
      response.data.checkout_request_id || response.data.id || accountRef;
    pendingPayments.set(transactionId, {
      userId,
      username,
      tournamentId,
      amount: Number(amount),
      phone: formattedPhone,
    });

    res.json({
      success: true,
      message: "STK push sent",
      checkoutId: transactionId,
      data: response.data,
    });
  } catch (err: any) {
    console.error("❌ Error initiating payment:", err.message);
    if (err.response) {
      console.error("❌ Sunny error:", err.response.data);
    }
    res.status(500).json({
      success: false,
      error: err.message || "Payment initiation failed",
    });
  }
});

// --------------------------
// Sunny Webhook
// --------------------------
router.post("/webhook", async (req, res) => {
  try {
    console.log("🔥 WEBHOOK HIT:", req.body);

    const { event, data } = req.body;

    // Only process successful payments
    if (
      event !== "payment.successful" &&
      event !== "mpesa.stk.push.successful"
    ) {
      console.log("❌ Ignoring event:", event);
      return res.status(200).send("Event ignored");
    }

    const transactionRef =
      data.checkout_request_id || data.transaction_id || data.id;
    const pending = pendingPayments.get(transactionRef);

    if (!pending) {
      console.warn("⚠ No pending payment found for", transactionRef);
      return res.status(200).send("Transaction not found");
    }

    const mpesaReceipt =
      data.mpesa_receipt || data.receipt_number || data.transaction_id;

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

    pendingPayments.delete(transactionRef);
    res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (err) {
    console.error("❌ Webhook processing error:", err);
    res.status(500).json({ success: false, error: "Webhook failed" });
  }
});

// --------------------------
// Test Endpoint
// --------------------------
router.get("/test-sunny", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.sunnypayments.com/v1/health",
      {
        headers: {
          Authorization: `Bearer ${process.env.SUNNY_SECRET_KEY}`,
        },
      },
    );
    res.json({
      success: true,
      message: "Sunny connected!",
      data: response.data,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
