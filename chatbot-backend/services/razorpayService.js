import crypto from "crypto";
import axios from "axios";

const RAZORPAY_ORDERS_URL = "https://api.razorpay.com/v1/orders";

function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const error = new Error("Razorpay is not configured");
    error.statusCode = 503;
    throw error;
  }

  return { keyId, keySecret };
}

export function getRazorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID || "";
}

export async function createRazorpayOrder({ amountPaise, currency = "INR", receipt, notes }) {
  const { keyId, keySecret } = getRazorpayConfig();

  const response = await axios.post(
    RAZORPAY_ORDERS_URL,
    {
      amount: amountPaise,
      currency,
      receipt,
      notes,
    },
    {
      auth: {
        username: keyId,
        password: keySecret,
      },
      timeout: 15000,
    },
  );

  return response.data;
}

export function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const { keySecret } = getRazorpayConfig();

  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const payload = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(payload)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(String(signature));

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function verifyRazorpayWebhookSignature({ rawBody, signature }) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    const error = new Error("Razorpay webhook secret is not configured");
    error.statusCode = 503;
    throw error;
  }

  if (!rawBody || !signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(String(signature));

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
