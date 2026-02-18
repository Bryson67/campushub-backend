// backend/src/routes/payments.ts
import { ConvexHttpClient } from "convex/browser";
import express from "express";
import { api } from "../../../convex/_generated/api";
import { stkPush } from "../mpesa";

const router = express.Router();

// Initialize Convex HTTP client
const CONVEX_URL = "https://peaceful-aardvark-549.convex.cloud"; // <-- PUT YOUR URL HERE
console.log("🔧 Using hardcoded CONVEX_URL:", CONVEX_URL);

// Initialize Convex HTTP client with hardcoded URL
const convexClient = new ConvexHttpClient(CONVEX_URL);

// Map to store pending payments keyed by CheckoutRequestID
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
// Initiate Payment
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
      : phone;

    // Account reference
    const accountRef = `${userId}-${tournamentId}`;

    // Send STK push
    const stkResponse = await stkPush(
      formattedPhone,
      Number(amount),
      accountRef,
    );

    // Store pending payment
    pendingPayments.set(stkResponse.CheckoutRequestID, {
      userId,
      username,
      tournamentId,
      amount: Number(amount),
      phone: formattedPhone,
    });

    console.log("🕒 STK push sent. Waiting for callback...");

    res.json({
      success: true,
      message: "STK push sent",
      checkoutId: stkResponse.CheckoutRequestID,
    });
  } catch (err: any) {
    console.error("❌ Error initiating payment:", err.message || err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --------------------------
// M-Pesa Callback
// --------------------------
router.post("/mpesa/callback", async (req, res) => {
  try {
    const callback = req.body.Body.stkCallback;
    const { CheckoutRequestID, ResultCode, CallbackMetadata } = callback;

    console.log("🔥 CALLBACK HIT:", callback);

    // Always respond to M-Pesa immediately
    res.status(200).send("Callback received");

    // Only process successful payments
    if (ResultCode !== 0) {
      console.log("❌ Payment failed or cancelled:", callback);
      return;
    }

    // Lookup pending payment
    const pending = pendingPayments.get(CheckoutRequestID);
    if (!pending) {
      console.warn("⚠ No pending payment found for", CheckoutRequestID);
      return;
    }

    // Extract Mpesa receipt
    const mpesaReceipt = CallbackMetadata.Item.find(
      (i: any) => i.Name === "MpesaReceiptNumber",
    )?.Value;

    if (!mpesaReceipt) {
      console.warn("⚠ No MpesaReceiptNumber found in callback");
      return;
    }

    // Add player to Convex DB using HTTP client
    try {
      await convexClient.mutation(api.players.addPlayer, {
        userId: pending.userId,
        name: pending.username, // Use 'name' field with the username value
        tournamentId: pending.tournamentId,
        phoneNumber: pending.phone,
        amount: pending.amount,
        mpesaReceipt: mpesaReceipt as string,
        createdAt: new Date().toISOString(),
      });

      console.log("✅ Player added successfully:", mpesaReceipt);
    } catch (err) {
      console.error("❌ Failed to add player to DB:", err);
    }

    // Remove from pending map
    pendingPayments.delete(CheckoutRequestID);
  } catch (err) {
    console.error("❌ Callback processing error:", err);
  }
});

// Optional: Get payment status endpoint
router.get("/status/:checkoutId", (req, res) => {
  const { checkoutId } = req.params;
  const pending = pendingPayments.get(checkoutId);

  if (pending) {
    res.json({
      success: true,
      status: "pending",
      payment: pending,
    });
  } else {
    res.json({
      success: true,
      status: "completed or not found",
    });
  }
});

export default router;
