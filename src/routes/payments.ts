import { ConvexHttpClient } from "convex/browser";
import express from "express";
import IntaSend from "intasend-node";

const router = express.Router();

// Initialize Convex HTTP client
const CONVEX_URL =
  process.env.CONVEX_URL || "https://peaceful-aardvark-549.convex.cloud";
console.log("🔧 Using CONVEX_URL:", CONVEX_URL);
const convexClient = new ConvexHttpClient(CONVEX_URL);

// Initialize IntaSend
// IntaSend constructor expects (publishableKey, secretKey, options?)
const intasend = new IntaSend(
  process.env.INTASEND_PUBLISHABLE_KEY || "",
  process.env.INTASEND_SECRET_KEY || "",
  { test: process.env.INTASEND_MODE !== "live" },
);

console.log(
  "📦 IntaSend initialized with mode:",
  process.env.INTASEND_MODE || "live",
);
console.log("📦 Using Wallet ID:", process.env.INTASEND_WALLET_ID);

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

    const formattedPhone = phone.startsWith("0")
      ? "254" + phone.slice(1)
      : phone.startsWith("254")
        ? phone
        : "254" + phone;

    const accountRef = generateReference();

    console.log("📤 Initiating IntaSend payment:", {
      phone: formattedPhone,
      amount,
      reference: accountRef,
      userId,
      tournamentId,
      walletId: process.env.INTASEND_WALLET_ID,
    });

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

    const response = await wallets.fundMPesa(payload);

    const transactionId = response.transaction?.id || response.id || accountRef;
    pendingPayments.set(accountRef, {
      userId,
      username,
      tournamentId,
      amount: Number(amount),
      phone: formattedPhone,
    });

    console.log("✅ STK push sent. Transaction ID:", transactionId);

    res.json({
      success: true,
      message: "STK push sent",
      checkoutId: transactionId,
      reference: accountRef,
      data: response,
    });
  } catch (err: any) {
    console.error("❌ Error initiating payment:", err.message);
    if (err.response) {
      console.error("❌ IntaSend error:", err.response.data);
    }
    res.status(500).json({
      success: false,
      error: err.message || "Payment initiation failed",
    });
  }
});

// --------------------------
// IntaSend Webhook
// --------------------------
router.post("/webhook", async (req, res) => {
  try {
    console.log("🔥 WEBHOOK HIT:", req.body);

    const { event, data } = req.body;

    if (
      event !== "payment.successful" &&
      event !== "mpesa.stk.push.successful" &&
      event !== "charge.completed"
    ) {
      console.log("❌ Ignoring event:", event);
      return res.status(200).send("Event ignored");
    }

    const transactionRef =
      data.api_ref || data.reference || data.transaction_id || data.id;
    const pending = pendingPayments.get(transactionRef);
    if (!pending) {
      console.warn("⚠ No pending payment found for", transactionRef);
      return res.status(200).send("Transaction not found");
    }

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
// Test Endpoints
// --------------------------
router.get("/test-intasend", async (req, res) => {
  try {
    const wallets = intasend.wallets();
    const result = await wallets.list();
    res.json({ success: true, message: "IntaSend connected!", data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/test-intasend-debug", async (req, res) => {
  try {
    const secKey = process.env.INTASEND_SECRET_KEY;
    const response = await fetch("https://api.intasend.com/api/v1/wallets/", {
      headers: { Authorization: `Bearer ${secKey}` },
    });
    const text = await response.text();
    res.json({
      success: response.ok,
      status: response.status,
      data: text.substring(0, 500),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/test-payment", async (req, res) => {
  try {
    const { phone, amount } = req.body;
    if (!phone || !amount) {
      return res
        .status(400)
        .json({ success: false, error: "Phone and amount required" });
    }

    const formattedPhone = phone.startsWith("0")
      ? "254" + phone.slice(1)
      : phone.startsWith("254")
        ? phone
        : "254" + phone;

    const accountRef = generateReference();
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

    const response = await wallets.fundMPesa(payload);
    res.json({
      success: true,
      message: "Test STK push sent",
      reference: accountRef,
      data: response,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
