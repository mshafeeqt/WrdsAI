/**
 * Calculates the expiry date based on the subscription type and current date.
 * Logic:
 * - Free Trial (1 week): Adds 7 days.
 * - 1 Month/Monthly: Adds the total number of days in the current month.
 * - 3 Months: Adds three calendar months.
 * - 1 Year/Yearly: Adds the total number of days in the current year.
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

  if (subscriptionType === "Free Trial (1 week)") {
    expiryDate.setDate(expiryDate.getDate() + 7);
  } else if (subscriptionType === "Monthly" || subscriptionType === "1 Month") {
    // Get total days in current month
    const daysInMonth = new Date(year, month, 0).getDate();
    expiryDate.setDate(expiryDate.getDate() + daysInMonth);
  } else if (subscriptionType === "3 Months") {
    expiryDate.setMonth(expiryDate.getMonth() + 3);
  } else if (subscriptionType === "Yearly" || subscriptionType === "1 Year") {
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
