export const DEFAULT_SUBSCRIPTION_PLAN = "WrdsAI Nxt";
export const DEFAULT_CHILD_PLAN = "Boost Up";
export const FREE_TRIAL_PLAN = "Free Trial";
export const FREE_TRIAL_TYPE = "Free Trial (1 week)";

export const BASE_PRICES_INR = Object.freeze({
  WrdsAI: {
    "Glow Up": { Monthly: 83.9, "1 Month": 83.9, "3 Months": 251.7, Yearly: 922.86, "1 Year": 922.86 },
    "Level Up": { Monthly: 168.64, "1 Month": 168.64, "3 Months": 505.92, Yearly: 1694.09, "1 Year": 1694.09 },
    "Rise Up": { Monthly: 338.14, "1 Month": 338.14, "3 Months": 1014.42, Yearly: 3388.98, "1 Year": 3388.98 },
  },
  WrdsAIPro: {
    "Step Up": { Monthly: 422.88, "1 Month": 422.88, "3 Months": 1268.64, Yearly: 4651.69, "1 Year": 4651.69 },
    "Speed Up": { Monthly: 761.86, "1 Month": 761.86, "3 Months": 2285.58, Yearly: 7626.44, "1 Year": 7626.44 },
    "Scale Up": { Monthly: 1355.09, "1 Month": 1355.09, "3 Months": 4065.27, Yearly: 13558.5, "1 Year": 13558.5 },
  },
  "WrdsAI Nxt": {
    "Boost Up": { Monthly: 499, "1 Month": 499, "3 Months": 1299, Yearly: 3999, "1 Year": 3999 },
  },
  "WrdsAi Nxt": {
    "Boost Up": { Monthly: 499, "1 Month": 499, "3 Months": 1299, Yearly: 3999, "1 Year": 3999 },
  },
});

export function getPlanPriceINR({ subscriptionPlan, childPlan, subscriptionType }) {
  return BASE_PRICES_INR[subscriptionPlan]?.[childPlan]?.[subscriptionType] || null;
}

export function calculatePriceBreakdown({ subscriptionPlan, childPlan, subscriptionType, discountINR = 0 }) {
  const basePriceINR = getPlanPriceINR({ subscriptionPlan, childPlan, subscriptionType });

  if (!basePriceINR) {
    throw new Error("Invalid plan selection");
  }

  const safeDiscountINR = Math.max(0, Math.min(Number(discountINR) || 0, basePriceINR));
  const totalPriceINR = Math.round((basePriceINR - safeDiscountINR) * 100) / 100;
  const taxableAmountINR = Math.round((totalPriceINR / 1.18) * 100) / 100;
  const gstAmount = Math.round((totalPriceINR - taxableAmountINR) * 100) / 100;
  const amountPaise = Math.round(totalPriceINR * 100);

  return {
    basePriceINR,
    discountINR: safeDiscountINR,
    taxableAmountINR,
    gstAmount,
    totalPriceINR,
    amountPaise,
    currency: "INR",
  };
}
