/**
 * Calculates the expiry date based on the subscription type and current date.
 * Logic:
 * - Monthly: Adds the total number of days in the current month to the start date.
 * - Yearly: Adds the total number of days in the current year to the start date.
 * @param {string} subscriptionType - "Monthly" or "Yearly"
 * @returns {Date} The calculated expiry date.
 */
export const calculatePlanExpiry = (subscriptionType) => {
  const startDate = new Date();
  const expiryDate = new Date(startDate);

  // ⚡ STATIC 5 MINUTE EXPIRY (FOR TESTING ONLY)
  // expiryDate.setMinutes(expiryDate.getMinutes() + 3);
  // return expiryDate;

  //  Original Logic (Commented out for testing)
  const year = startDate.getFullYear();
  const month = startDate.getMonth() + 1; // 1-12

  if (subscriptionType === "Monthly") {
    // Get total days in current month
    const daysInMonth = new Date(year, month, 0).getDate();
    expiryDate.setDate(expiryDate.getDate() + daysInMonth);
  } else if (subscriptionType === "Yearly") {
    // Get total days in current year
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const daysInYear = isLeap ? 366 : 365;
    expiryDate.setDate(expiryDate.getDate() + daysInYear);
  } else if (subscriptionType === "One Time") {
    return null;
  }

  return expiryDate;
};

/**
 * Checks if the plan is expired.
 * @param {Object} user
 * @returns {boolean}
 */
export const checkPlanExpiry = (user) => {
  if (!user.planExpiryDate) return false; // No expiry date set
  return new Date() > new Date(user.planExpiryDate);
};
