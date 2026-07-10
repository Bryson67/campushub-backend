import { ConvexHttpClient } from "convex/browser";
import express from "express";
import IntaSend from "intasend-node";

const router = express.Router();

// Initialize Convex HTTP client
const CONVEX_URL =
  process.env.CONVEX_URL || "https://peaceful-aardvark-549.convex.cloud";
console.log("🔧 Using CONVEX_URL:", CONVEX_URL);
const convexClient = new ConvexHttpClient(CONVEX_URL);

// Initialize IntaSend with your credentials
const intasend = new IntaSend(
  process.env.INTASEND_PUBLISHABLE_KEY!,
  process.env.INTASEND_SECRET_KEY!,
  {
    test: process.env.INTASEND_MODE !== "live", // false for live
  },
);

console.log(
  "📦 IntaSend initialized with mode:",
  process.env.INTASEND_MODE || "live",
);
console.log("📦 Using Wallet ID:", process.env.INTASEND_WALLET_ID);

// Map to store pending payments keyed by transaction reference
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

// Helper to generate unique reference
const generateReference = () => {
  return `CAMP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

// --------------------------
// Initiate Payment with IntaSend
// --------------------------
router.post("/pay", async (req, res) => {
  try {
    const { phone, amount, userId, username, tournamentId } = req.body;

    if (!phone || !amount || !userId || !username || !tournamentId) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }

    // Format phone (remove 0 or +254, ensure 254 format)
    const formattedPhone = phone.startsWith("0")
      ? "254" + phone.slice(1)
      : phone.startsWith("254")
        ? phone
        : "254" + phone;

    // Generate unique reference
    const accountRef = generateReference();

    console.log("📤 Initiating IntaSend payment:", {
      phone: formattedPhone,
      amount,
      reference: accountRef,
      userId,
      tournamentId,
      walletId: process.env.INTASEND_WALLET_ID,
    });

    // Initiate STK Push via IntaSend
    const wallets = intasend.wallets();

    const payload = {
      first_name: username || "Player",
      last_name: "User",
      email: `${userId}@campushub.com`,
      host:
        process.env.INTASEND_CALLBACK_URL ||
        "https://campushub-backend-oqxj.onrender.com",
      amount: Number(amount),
      phone_number: formattedPhone,
      api_ref: accountRef,
      wallet_id: process.env.INTASEND_WALLET_ID,
    };
    console.log("📤 IntaSend payload:", payload);

    const response = await wallets.fundMPesa(payload);

    console.log("✅ IntaSend response:", JSON.stringify(response, null, 2));

    // Store pending payment using the api_ref as key
    const transactionId = response.transaction?.id || response.id || accountRef;
    pendingPayments.set(accountRef, {
      userId,
      username,
      tournamentId,
      amount: Number(amount),
      phone: formattedPhone,
    });

    console.log(
      `🕒 STK push sent. Transaction ID: ${transactionId}. Waiting for callback...`,
    );

    res.json({
      success: true,
      message: "STK push sent",
      checkoutId: transactionId,
      reference: accountRef,
      data: response,
    });
  } catch (err: any) {
    console.error("❌ Error initiating payment:", err.message || err);
    if (err.response) {
      console.error("❌ IntaSend error response:", err.response.data);
      console.error("❌ IntaSend error status:", err.response.status);
    }
    res.status(500).json({
      success: false,
      error: err.message || "Payment initiation failed",
      details: err.response?.data || null,
    });
  }
});

// --------------------------
// IntaSend Webhook (Callback)
// --------------------------
router.post("/webhook", async (req, res) => {
  try {
    console.log("🔥 WEBHOOK HIT:", JSON.stringify(req.body, null, 2));

    const { event, data } = req.body;

    // Only process successful payments
    if (
      event !== "payment.successful" &&
      event !== "mpesa.stk.push.successful" &&
      event !== "charge.completed"
    ) {
      console.log("❌ Ignoring event:", event);
      return res.status(200).send("Event ignored");
    }

    // Get transaction reference - check multiple possible fields
    const transactionRef =
      data.api_ref || data.reference || data.transaction_id || data.id;

    console.log(`🔍 Looking for transaction ref: ${transactionRef}`);

    // Lookup pending payment
    const pending = pendingPayments.get(transactionRef);
    if (!pending) {
      console.warn(`⚠ No pending payment found for ${transactionRef}`);
      console.log(
        "📋 Available pending keys:",
        Array.from(pendingPayments.keys()),
      );
      return res.status(200).send("Transaction not found");
    }

    // Extract Mpesa receipt
    const mpesaReceipt =
      data.mpesa_receipt ||
      data.receipt_number ||
      data.transaction_id ||
      data.id;

    if (!mpesaReceipt) {
      console.warn("⚠ No receipt found in callback");
      return res.status(200).send("No receipt found");
    }

    console.log(`✅ Payment successful: ${mpesaReceipt}`);

    // Add player to Convex DB
    try {
      await convexClient.mutation("players:addPlayer" as any, {
        userId: pending.userId,
        name: pending.username,
        tournamentId: pending.tournamentId,
        phoneNumber: pending.phone,
        amount: pending.amount,
        mpesaReceipt: mpesaReceipt,
        createdAt: new Date().toISOString(),
      });
      console.log("✅ Player added successfully:", mpesaReceipt);
    } catch (err) {
      console.error("❌ Failed to add player to DB:", err);
    }

    // Remove from pending map
    pendingPayments.delete(transactionRef);

    res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (err) {
    console.error("❌ Webhook processing error:", err);
    res.status(500).json({ success: false, error: "Webhook failed" });
  }
});

// --------------------------
// Payment Status Endpoint
// --------------------------
router.get("/status/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Check if still pending
    for (const [key, value] of pendingPayments.entries()) {
      if (key === transactionId || value.phone === transactionId) {
        return res.json({
          success: true,
          status: "pending",
          payment: value,
          reference: key,
        });
      }
    }

    // Check transaction status with IntaSend
    try {
      const wallets = intasend.wallets();
      // Use the correct SDK method to fetch transaction details
      const status = await wallets.transactions(transactionId);

      return res.json({
        success: true,
        status: status.status || "completed",
        data: status,
      });
    } catch (error) {
      return res.json({
        success: true,
        status: "not found or completed",
      });
    }
  } catch (err) {
    console.error("❌ Error checking payment status:", err);
    res.status(500).json({ success: false, error: "Status check failed" });
  }
});

// --------------------------
// Test endpoint to verify IntaSend connection
// --------------------------
router.get("/test-intasend", async (req, res) => {
  try {
    console.log("🔍 Testing IntaSend connection...");
    console.log(
      "🔑 Publishable Key:",
      process.env.INTASEND_PUBLISHABLE_KEY ? "✅ Set" : "❌ Not set",
    );
    console.log(
      "🔑 Secret Key:",
      process.env.INTASEND_SECRET_KEY ? "✅ Set" : "❌ Not set",
    );
    console.log(
      "🔑 Wallet ID:",
      process.env.INTASEND_WALLET_ID || "❌ Not set",
    );
    console.log("🔑 Mode:", process.env.INTASEND_MODE || "live");

    // Try to get wallets list
    const wallets = intasend.wallets();
    const result = await wallets.list();

    console.log("✅ IntaSend wallets list:", JSON.stringify(result, null, 2));

    res.json({
      success: true,
      message: "IntaSend connected!",
      data: result,
      walletId: process.env.INTASEND_WALLET_ID,
    });
  } catch (err: any) {
    console.error("❌ IntaSend test failed:", err.message);
    console.error("❌ Full error:", err);

    if (err.response) {
      console.error("❌ Error response data:", err.response.data);
      console.error("❌ Error response status:", err.response.status);
    }

    res.status(500).json({
      success: false,
      error: err.message || "Unknown error",
      details: err.response?.data || err.stack || null,
      statusCode: err.response?.status || 500,
    });
  }
});

// --------------------------
// Debug test endpoint with direct API call
// --------------------------
router.get("/test-intasend-debug", async (req, res) => {
  try {
    console.log("🔍 Debugging IntaSend connection...");

    // Log the environment variables
    console.log("📋 Environment check:");
    console.log(
      "  INTASEND_PUBLISHABLE_KEY:",
      process.env.INTASEND_PUBLISHABLE_KEY ? "✅ Set" : "❌ Not set",
    );
    console.log(
      "  INTASEND_SECRET_KEY:",
      process.env.INTASEND_SECRET_KEY ? "✅ Set" : "❌ Not set",
    );
    console.log(
      "  INTASEND_WALLET_ID:",
      process.env.INTASEND_WALLET_ID || "❌ Not set",
    );
    console.log("  INTASEND_MODE:", process.env.INTASEND_MODE || "live");

    // Log the first few characters of the keys for verification
    const pubKey = process.env.INTASEND_PUBLISHABLE_KEY || "";
    const secKey = process.env.INTASEND_SECRET_KEY || "";
    console.log(
      "  Publishable Key (first 15 chars):",
      pubKey.substring(0, 15) + "...",
    );
    console.log(
      "  Secret Key (first 15 chars):",
      secKey.substring(0, 15) + "...",
    );

    // Try to make a direct API call using fetch
    const apiUrl = "https://api.intasend.com/api/v1/wallets/";
    console.log(`📤 Making direct API call to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secKey}`,
        "Content-Type": "application/json",
      },
    });

    const text = await response.text();
    console.log(`📦 Response status: ${response.status}`);
    console.log(`📦 Response body:`, text.substring(0, 500));

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { raw: text };
    }

    res.json({
      success: response.ok,
      status: response.status,
      data: data,
      message: response.ok ? "IntaSend API connected!" : "API call failed",
      debug: {
        pubKeyPrefix: pubKey.substring(0, 10) + "...",
        secKeyPrefix: secKey.substring(0, 10) + "...",
        walletId: process.env.INTASEND_WALLET_ID,
        mode: process.env.INTASEND_MODE,
      },
    });
  } catch (err: any) {
    console.error("❌ Debug error:", err.message);
    console.error("❌ Stack:", err.stack);
    res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack,
    });
  }
});

// --------------------------
// Test payment endpoint
// --------------------------
router.post("/test-payment", async (req, res) => {
  try {
    console.log("🧪 Testing payment endpoint...");

    const { phone, amount } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({
        success: false,
        error: "Phone and amount are required",
      });
    }

    // Format phone
    const formattedPhone = phone.startsWith("0")
      ? "254" + phone.slice(1)
      : phone.startsWith("254")
        ? phone
        : "254" + phone;

    const accountRef = generateReference();

    console.log("📤 Test payment initiated:", {
      phone: formattedPhone,
      amount,
      reference: accountRef,
    });

    const wallets = intasend.wallets();

    const payload = {
      first_name: "Test",
      last_name: "User",
      email: "test@campushub.com",
      host:
        process.env.INTASEND_CALLBACK_URL ||
        "https://campushub-backend-oqxj.onrender.com",
      amount: Number(amount),
      phone_number: formattedPhone,
      api_ref: accountRef,
      wallet_id: process.env.INTASEND_WALLET_ID,
    };

    console.log("📤 Test payload:", payload);

    const response = await wallets.fundMPesa(payload);

    console.log("✅ Test payment response:", JSON.stringify(response, null, 2));

    res.json({
      success: true,
      message: "Test STK push sent",
      reference: accountRef,
      data: response,
    });
  } catch (err: any) {
    console.error("❌ Test payment error:", err.message);
    if (err.response) {
      console.error("❌ Error response:", err.response.data);
    }
    res.status(500).json({
      success: false,
      error: err.message,
      details: err.response?.data || null,
    });
  }
});

export default router;
