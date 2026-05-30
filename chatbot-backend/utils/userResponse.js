import { getTokenLimit } from "./planTokens.js";
import { checkPlanExpiry } from "./dateUtils.js";

export const buildUserResponseByAgeGroup = (user) => {
  const isMinor = ["<13", "13-14", "15-17"].includes(user.ageGroup);

  return {
    id: user.id || user._id,

    firstName: user.firstName,
    lastName: user.lastName,
    dateOfBirth: user.dateOfBirth,
    ageGroup: user.ageGroup,
    className: user.className,

    // 🔑 Email & Mobile (age based)
    email: isMinor ? user.parentEmail : user.email,
    mobile: isMinor ? user.parentMobile : user.mobile,

    // 🔑 Parent details at root level (for frontend auto-fill)
    parentName: isMinor ? user.parentName : null,
    parentEmail: isMinor ? user.parentEmail : null,
    parentMobile: isMinor ? user.parentMobile : null,

    // 🔑 Subscription
    subscription: {
      subscriptionPlan: user.subscriptionPlan,
      childPlan: user.childPlan,
      subscriptionType: user.subscriptionType,
      status: user.subscriptionStatus,
      isActive: user.isActive,
      remainingTokens: user.remainingTokens, // ✅ From DB (Balance)
      basePriceINR: user.basePriceINR,
      gstAmount: user.gstAmount,
      totalPriceINR: user.totalPriceINR,
      currency: user.currency,

      // ✅ Plan Validity
      planExpiryDate: user.planExpiryDate,
      isPlanExpired: checkPlanExpiry(user),
    },
  };
};
