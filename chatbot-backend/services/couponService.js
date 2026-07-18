import { Op } from "sequelize";
import { PgCoupon, PgCouponRedemption } from "../postgres/models.js";

function normalizeCouponCode(code) {
  return String(code || "").trim().toUpperCase();
}

function calculateDiscount(coupon, basePriceINR) {
  if (!coupon) return 0;

  if (coupon.discountType === "percentage") {
    const percentageDiscount = (basePriceINR * Number(coupon.discountValue || 0)) / 100;
    const maxDiscount = Number(coupon.maxDiscountINR || 0);
    const cappedDiscount = maxDiscount > 0 ? Math.min(percentageDiscount, maxDiscount) : percentageDiscount;
    return Math.round(Math.min(cappedDiscount, basePriceINR) * 100) / 100;
  }

  return Math.round(Math.min(Number(coupon.discountValue || 0), basePriceINR) * 100) / 100;
}

export async function applyCoupon({ couponCode, basePriceINR }) {
  const code = normalizeCouponCode(couponCode);

  if (!code) {
    return {
      coupon: null,
      couponCode: null,
      discountINR: 0,
    };
  }

  const now = new Date();
  const coupon = await PgCoupon.findOne({
    where: {
      code,
      isActive: true,
      [Op.and]: [
        { [Op.or]: [{ startsAt: null }, { startsAt: { [Op.lte]: now } }] },
        { [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gte]: now } }] },
      ],
    },
  });

  if (!coupon) {
    const error = new Error("Invalid or expired coupon code");
    error.statusCode = 400;
    throw error;
  }

  if (coupon.maxRedemptions) {
    const redemptionCount = await PgCouponRedemption.count({ where: { code } });
    if (redemptionCount >= coupon.maxRedemptions) {
      const error = new Error("Coupon redemption limit reached");
      error.statusCode = 400;
      throw error;
    }
  }

  return {
    coupon,
    couponCode: code,
    discountINR: calculateDiscount(coupon, basePriceINR),
  };
}

