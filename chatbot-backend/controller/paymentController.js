import { sequelize } from "../postgres/connect.js";
import {
  PgCouponRedemption,
  PgPayment,
  PgPaymentOrder,
  PgUser,
} from "../postgres/models.js";
import { buildUserResponseByAgeGroup } from "../utils/userResponse.js";
import { sendWelcomeEmail } from "../services/mailService.js";
import { applyCoupon } from "../services/couponService.js";
import {
  assertEmailAvailable,
  buildRegistrationPayload,
  createUserFromRegistrationPayload,
  getRegistrationPrice,
  isFreeTrialRegistration,
} from "../services/registrationPayloadService.js";
import {
  createRazorpayOrder,
  getRazorpayKeyId,
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
} from "../services/razorpayService.js";
import { randomUUID } from "crypto";

function formatPriceBreakdown(priceBreakdown, couponCode = null) {
  return {
    basePriceINR: priceBreakdown.basePriceINR,
    discountINR: priceBreakdown.discountINR,
    gstAmount: priceBreakdown.gstAmount,
    totalPriceINR: priceBreakdown.totalPriceINR,
    amountPaise: priceBreakdown.amountPaise,
    currency: priceBreakdown.currency,
    couponCode,
  };
}

async function sendWelcomeEmailSafely({ email, name, userId }) {
  try {
    await sendWelcomeEmail({ email, name });
  } catch (error) {
    console.error("[payment-registration] Welcome email dispatch failed", {
      userId,
      email,
      message: error?.message,
      code: error?.code,
    });
  }
}


async function completeFullyDiscountedRegistration({ registrationPayload, priceBreakdown, couponResult }) {
  const syntheticPaymentId = `coupon_free_${randomUUID()}`;

  const result = await sequelize.transaction(async (transaction) => {
    await assertEmailAvailable(registrationPayload.email, { transaction });

    const paymentOrder = await PgPaymentOrder.create(
      {
        purpose: "registration",
        email: registrationPayload.email,
        razorpayOrderId: syntheticPaymentId,
        amountPaise: 0,
        currency: priceBreakdown.currency,
        status: "paid",
        couponCode: couponResult.couponCode,
        discountINR: priceBreakdown.discountINR,
        priceBreakdown: formatPriceBreakdown(priceBreakdown, couponResult.couponCode),
        registrationPayload,
        razorpayPayload: { provider: "coupon", paymentId: syntheticPaymentId },
      },
      { transaction },
    );

    const user = await createUserFromRegistrationPayload(
      registrationPayload,
      priceBreakdown,
      { transaction },
    );

    const payment = await PgPayment.create(
      {
        userId: user.id,
        paymentOrderId: paymentOrder.id,
        email: registrationPayload.email,
        razorpayOrderId: syntheticPaymentId,
        razorpayPaymentId: syntheticPaymentId,
        razorpaySignature: null,
        amountPaise: 0,
        currency: priceBreakdown.currency,
        status: "coupon_discount",
        couponCode: couponResult.couponCode,
        discountINR: priceBreakdown.discountINR,
        priceBreakdown: formatPriceBreakdown(priceBreakdown, couponResult.couponCode),
        rawPayload: { provider: "coupon", couponCode: couponResult.couponCode },
      },
      { transaction },
    );

    await PgCouponRedemption.create(
      {
        couponId: couponResult.coupon?.id || null,
        userId: user.id,
        paymentId: payment.id,
        code: couponResult.couponCode,
        discountINR: priceBreakdown.discountINR,
      },
      { transaction },
    );

    paymentOrder.userId = user.id;
    await paymentOrder.save({ transaction });

    return { user, payment };
  });

  await sendWelcomeEmailSafely({
    email: registrationPayload.email,
    name: registrationPayload.welcomeName,
    userId: result.user.id,
  });

  return result;
}

async function completePaidRegistrationFromOrder({
  paymentOrder,
  razorpayPaymentId,
  razorpaySignature = null,
  rawPayload,
  transaction,
}) {
  const registrationPayload = paymentOrder.registrationPayload;

  if (!registrationPayload?.email) {
    const error = new Error("Registration payload missing for payment order");
    error.statusCode = 400;
    throw error;
  }

  if (paymentOrder.status === "paid") {
    const existingPayment = await PgPayment.findOne({
      where: { razorpayOrderId: paymentOrder.razorpayOrderId },
      transaction,
    });
    const existingUser = paymentOrder.userId
      ? await PgUser.findByPk(paymentOrder.userId, { transaction })
      : null;

    return {
      alreadyCompleted: true,
      user: existingUser,
      registrationPayload,
      payment: existingPayment,
    };
  }

  if (Number(paymentOrder.amountPaise) !== Number(rawPayload?.amount)) {
    const error = new Error("Payment amount does not match order amount");
    error.statusCode = 400;
    throw error;
  }

  if (String(paymentOrder.currency).toUpperCase() !== String(rawPayload?.currency || "INR").toUpperCase()) {
    const error = new Error("Payment currency does not match order currency");
    error.statusCode = 400;
    throw error;
  }

  await assertEmailAvailable(registrationPayload.email, { transaction });

  const user = await createUserFromRegistrationPayload(
    registrationPayload,
    paymentOrder.priceBreakdown,
    { transaction },
  );

  const payment = await PgPayment.create(
    {
      userId: user.id,
      paymentOrderId: paymentOrder.id,
      email: registrationPayload.email,
      razorpayOrderId: paymentOrder.razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      amountPaise: paymentOrder.amountPaise,
      currency: paymentOrder.currency,
      status: rawPayload?.status || "captured",
      couponCode: paymentOrder.couponCode,
      discountINR: paymentOrder.discountINR,
      priceBreakdown: paymentOrder.priceBreakdown,
      rawPayload,
    },
    { transaction },
  );

  if (paymentOrder.couponCode) {
    await PgCouponRedemption.create(
      {
        couponId: null,
        userId: user.id,
        paymentId: payment.id,
        code: paymentOrder.couponCode,
        discountINR: paymentOrder.discountINR,
      },
      { transaction },
    );
  }

  paymentOrder.userId = user.id;
  paymentOrder.status = "paid";
  paymentOrder.razorpayPayload = {
    ...(paymentOrder.razorpayPayload || {}),
    latestPayment: rawPayload,
  };
  await paymentOrder.save({ transaction });

  return { user, registrationPayload, payment, alreadyCompleted: false };
}

async function markPaymentOrderFailed({ paymentOrder, payment, transaction }) {
  if (!paymentOrder || paymentOrder.status === "paid") {
    return;
  }

  const failedPaymentId = payment?.id || `failed_${paymentOrder.razorpayOrderId}_${Date.now()}`;
  const existingPayment = await PgPayment.findOne({
    where: { razorpayPaymentId: failedPaymentId },
    transaction,
  });

  if (!existingPayment) {
    await PgPayment.create(
      {
        userId: paymentOrder.userId || null,
        paymentOrderId: paymentOrder.id,
        email: paymentOrder.email,
        razorpayOrderId: paymentOrder.razorpayOrderId,
        razorpayPaymentId: failedPaymentId,
        razorpaySignature: null,
        amountPaise: paymentOrder.amountPaise,
        currency: paymentOrder.currency,
        status: payment?.status || "failed",
        couponCode: paymentOrder.couponCode,
        discountINR: paymentOrder.discountINR,
        priceBreakdown: paymentOrder.priceBreakdown,
        rawPayload: payment || {},
      },
      { transaction },
    );
  }

  paymentOrder.status = "failed";
  paymentOrder.razorpayPayload = {
    ...(paymentOrder.razorpayPayload || {}),
    latestFailure: payment || {},
  };
  await paymentOrder.save({ transaction });
}

export async function previewRegistrationCoupon(req, res) {
  try {
    const { couponCode, registration } = req.body || {};
    const registrationInput = registration || req.body;
    const registrationPayload = await buildRegistrationPayload(registrationInput);

    if (isFreeTrialRegistration(registrationPayload)) {
      return res.status(400).json({ error: "Free Trial does not require a coupon" });
    }

    const basePrice = getRegistrationPrice(registrationPayload, 0);
    const couponResult = await applyCoupon({
      couponCode,
      basePriceINR: basePrice.basePriceINR,
    });
    const priceBreakdown = getRegistrationPrice(registrationPayload, couponResult.discountINR);

    return res.json({
      success: true,
      applied: Boolean(couponResult.couponCode),
      message: couponResult.couponCode ? "Coupon code applied." : "No coupon applied.",
      priceBreakdown: formatPriceBreakdown(priceBreakdown, couponResult.couponCode),
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      error: error.message || "Unable to apply coupon",
    });
  }
}
export async function createRegistrationPaymentOrder(req, res) {
  try {
    const { couponCode, registration } = req.body || {};
    const registrationInput = registration || req.body;
    const registrationPayload = await buildRegistrationPayload(registrationInput);

    if (isFreeTrialRegistration(registrationPayload)) {
      return res.status(400).json({ error: "Free Trial does not require payment" });
    }

    await assertEmailAvailable(registrationPayload.email);

    const basePrice = getRegistrationPrice(registrationPayload, 0);
    const couponResult = await applyCoupon({
      couponCode,
      basePriceINR: basePrice.basePriceINR,
    });
    const priceBreakdown = getRegistrationPrice(registrationPayload, couponResult.discountINR);

    if (priceBreakdown.amountPaise <= 0) {
      const result = await completeFullyDiscountedRegistration({
        registrationPayload,
        priceBreakdown,
        couponResult,
      });

      return res.status(201).json({
        success: true,
        registrationComplete: true,
        message: "Coupon applied. Registration complete. You can now log in.",
        loginEmail: registrationPayload.email,
        priceBreakdown: formatPriceBreakdown(priceBreakdown, couponResult.couponCode),
        user: result.user ? buildUserResponseByAgeGroup(result.user) : null,
        payment: {
          id: result.payment?.id || null,
          status: result.payment?.status || "paid",
        },
      });
    }

    const receipt = `reg_${Date.now()}`;
    const razorpayOrder = await createRazorpayOrder({
      amountPaise: priceBreakdown.amountPaise,
      currency: priceBreakdown.currency,
      receipt,
      notes: {
        purpose: "registration",
        email: registrationPayload.email,
        plan: registrationPayload.subscriptionPlan,
        childPlan: registrationPayload.childPlan || "",
        subscriptionType: registrationPayload.subscriptionType,
        couponCode: couponResult.couponCode || "",
      },
    });

    await PgPaymentOrder.create({
      purpose: "registration",
      email: registrationPayload.email,
      razorpayOrderId: razorpayOrder.id,
      amountPaise: priceBreakdown.amountPaise,
      currency: priceBreakdown.currency,
      status: "created",
      couponCode: couponResult.couponCode,
      discountINR: priceBreakdown.discountINR,
      priceBreakdown: formatPriceBreakdown(priceBreakdown, couponResult.couponCode),
      registrationPayload,
      razorpayPayload: razorpayOrder,
    });

    return res.status(201).json({
      success: true,
      keyId: getRazorpayKeyId(),
      orderId: razorpayOrder.id,
      amount: priceBreakdown.amountPaise,
      currency: priceBreakdown.currency,
      priceBreakdown: formatPriceBreakdown(priceBreakdown, couponResult.couponCode),
      prefill: {
        name: `${registrationPayload.firstName} ${registrationPayload.lastName}`.trim(),
        email: registrationPayload.email,
        contact: registrationPayload.mobile || registrationPayload.parentMobile || "",
      },
    });
  } catch (error) {
    console.error("[payment-registration] Create order failed", {
      message: error?.message,
      statusCode: error?.statusCode,
      code: error?.code,
    });

    return res.status(error.statusCode || 400).json({
      error: error.message || "Unable to create payment order",
    });
  }
}

export async function verifyRegistrationPayment(req, res) {
  const {
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  } = req.body || {};

  try {
    const isSignatureValid = verifyRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isSignatureValid) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    const result = await sequelize.transaction(async (transaction) => {
      const paymentOrder = await PgPaymentOrder.findOne({
        where: { razorpayOrderId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!paymentOrder) {
        throw new Error("Payment order not found");
      }

      return completePaidRegistrationFromOrder({
        paymentOrder,
        razorpayPaymentId,
        razorpaySignature,
        rawPayload: {
          ...req.body,
          amount: paymentOrder.amountPaise,
          currency: paymentOrder.currency,
          status: "captured",
        },
        transaction,
      });
    });

    if (!result.alreadyCompleted) {
      await sendWelcomeEmailSafely({
        email: result.registrationPayload.email,
        name: result.registrationPayload.welcomeName,
        userId: result.user.id,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Payment verified and registration complete. You can now log in.",
      loginEmail: result.registrationPayload.email,
      user: result.user ? buildUserResponseByAgeGroup(result.user) : null,
      payment: {
        id: result.payment?.id || null,
        razorpayPaymentId,
        razorpayOrderId,
      },
    });
  } catch (error) {
    console.error("[payment-registration] Verify payment failed", {
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      message: error?.message,
      code: error?.code,
    });

    return res.status(400).json({
      error: error.message || "Payment verification failed",
    });
  }
}

function parseWebhookPayload(rawBody) {
  if (Buffer.isBuffer(rawBody)) {
    return JSON.parse(rawBody.toString("utf8"));
  }

  if (typeof rawBody === "string") {
    return JSON.parse(rawBody);
  }

  return rawBody || {};
}

export async function handleRazorpayWebhook(req, res) {
  const signature = req.headers["x-razorpay-signature"];
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(JSON.stringify(req.body || {}));

  try {
    const isSignatureValid = verifyRazorpayWebhookSignature({
      rawBody,
      signature,
    });

    if (!isSignatureValid) {
      console.warn("[razorpay-webhook] Invalid signature", {
        eventId: req.headers["x-razorpay-event-id"] || null,
      });
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const event = parseWebhookPayload(rawBody);
    const eventName = event.event;
    const payment = event.payload?.payment?.entity || null;
    const order = event.payload?.order?.entity || null;
    const razorpayOrderId = payment?.order_id || order?.id || null;

    if (!razorpayOrderId) {
      console.warn("[razorpay-webhook] Event missing order id", {
        eventName,
        eventId: event.id || null,
      });
      return res.status(200).json({ received: true, ignored: true });
    }

    if (eventName === "payment.failed") {
      await sequelize.transaction(async (transaction) => {
        const paymentOrder = await PgPaymentOrder.findOne({
          where: { razorpayOrderId },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        await markPaymentOrderFailed({ paymentOrder, payment, transaction });
      });

      return res.status(200).json({ received: true });
    }

    if (eventName !== "payment.captured") {
      return res.status(200).json({ received: true, ignored: true });
    }

    if (!payment?.id) {
      console.warn("[razorpay-webhook] Captured payment event missing payment id", {
        orderId: razorpayOrderId,
        eventId: event.id || null,
      });
      return res.status(200).json({ received: true, ignored: true });
    }

    const result = await sequelize.transaction(async (transaction) => {
      const paymentOrder = await PgPaymentOrder.findOne({
        where: { razorpayOrderId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!paymentOrder) {
        console.warn("[razorpay-webhook] Payment order not found", {
          orderId: razorpayOrderId,
          paymentId: payment.id,
          eventId: event.id || null,
        });
        return null;
      }

      return completePaidRegistrationFromOrder({
        paymentOrder,
        razorpayPaymentId: payment.id,
        razorpaySignature: null,
        rawPayload: payment,
        transaction,
      });
    });

    if (result && !result.alreadyCompleted) {
      await sendWelcomeEmailSafely({
        email: result.registrationPayload.email,
        name: result.registrationPayload.welcomeName,
        userId: result.user.id,
      });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("[razorpay-webhook] Processing failed", {
      message: error?.message,
      code: error?.code,
    });

    return res.status(error.statusCode || 500).json({
      error: error.message || "Webhook processing failed",
    });
  }
}
