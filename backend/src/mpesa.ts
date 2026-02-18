// backend/src/mpesa.ts
import axios from "axios";
import dotenv from "dotenv";
import moment from "moment";

dotenv.config(); // Load .env at the very top

// ----------------------
// ENV VARIABLES
// ----------------------
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL;

if (!CONSUMER_KEY || !CONSUMER_SECRET || !CALLBACK_URL) {
  throw new Error(
    "Missing MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, or MPESA_CALLBACK_URL in .env",
  );
}

// Sandbox fixed values
const SHORTCODE = "174379";
const PASSKEY =
  "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
const BASE_URL = "https://sandbox.safaricom.co.ke";

// ----------------------
// GET ACCESS TOKEN
// ----------------------
export async function getAccessToken(): Promise<string> {
  try {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString(
      "base64",
    );

    const res = await axios.get(
      `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      },
    );

    console.log("✅ Access token acquired:", res.data.access_token);
    return res.data.access_token;
  } catch (err: any) {
    console.error(
      "❌ Failed to get access token:",
      err.response?.data || err.message,
    );
    throw err;
  }
}

// ----------------------
// STK PUSH
// ----------------------
export async function stkPush(
  phone: string,
  amount: number,
  accountRef: string,
) {
  if (phone.startsWith("0")) phone = "254" + phone.slice(1);

  const timestamp = moment().format("YYYYMMDDHHmmss");
  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString(
    "base64",
  );

  const token = await getAccessToken();

  const payload = {
    BusinessShortCode: SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phone,
    PartyB: SHORTCODE,
    PhoneNumber: phone,
    CallBackURL: CALLBACK_URL,
    AccountReference: accountRef,
    TransactionDesc: "Tournament Entry Fee",
  };

  console.log("📤 Sending STK push with payload:", payload);

  try {
    const res = await axios.post(
      `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    console.log("✅ STK push response:", res.data);
    return res.data;
  } catch (err: any) {
    console.error(
      "❌ STK push failed with status:",
      err.response?.status,
      "data:",
      err.response?.data || err.message,
    );
    throw err;
  }
}
