import { sequelize } from "../postgres/connect.js";
import {
  PgCouponRedemption,
  PgPayment,
  PgPaymentOrder,
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
import { createRazorpayOrder, getRazorpayKeyId, verifyRazorpaySignature } from "../services/razorpayService.js";
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
        user: buildUserResponseByAgeGroup(result.user),
        payment: {
          id: result.payment.id,
          status: result.payment.status,
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

      if (paymentOrder.status === "paid") {
        throw new Error("Payment order has already been completed");
      }

      const registrationPayload = paymentOrder.registrationPayload;
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
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          amountPaise: paymentOrder.amountPaise,
          currency: paymentOrder.currency,
          status: "captured",
          couponCode: paymentOrder.couponCode,
          discountINR: paymentOrder.discountINR,
          priceBreakdown: paymentOrder.priceBreakdown,
          rawPayload: req.body,
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
      await paymentOrder.save({ transaction });

      return { user, registrationPayload, payment };
    });

    await sendWelcomeEmailSafely({
      email: result.registrationPayload.email,
      name: result.registrationPayload.welcomeName,
      userId: result.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Payment verified and registration complete. You can now log in.",
      loginEmail: result.registrationPayload.email,
      user: buildUserResponseByAgeGroup(result.user),
      payment: {
        id: result.payment.id,
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

