import bcrypt from "bcryptjs";
import { PgUser } from "../postgres/models.js";
import { calculatePlanExpiry } from "../utils/dateUtils.js";
import { getTokenLimit } from "../utils/planTokens.js";
import { calculatePriceBreakdown, FREE_TRIAL_PLAN, FREE_TRIAL_TYPE } from "./subscriptionPricing.js";

const MINOR_AGE_GROUPS = new Set(["<13", "13-14", "15-17"]);

export function getAgeGroup(dateOfBirth) {
  const today = new Date();
  const birth = new Date(dateOfBirth);

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  if (age < 13) return "<13";
  if (age <= 14) return "13-14";
  if (age <= 17) return "15-17";
  return "18+";
}

export function isMinorAgeGroup(ageGroup) {
  return MINOR_AGE_GROUPS.has(ageGroup);
}

function requireValue(value, message) {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error(message);
  }
}

export async function buildRegistrationPayload(input, { hashPassword = true } = {}) {
  const {
    firstName,
    lastName,
    userRole = "Student",
    className,
    schoolName,
    email,
    password,
    mobile,
    dateOfBirth,
    parentName,
    parentEmail,
    parentMobile,
    subscriptionPlan,
    childPlan,
    subscriptionType,
  } = input || {};

  requireValue(firstName, "First name is required");
  requireValue(lastName, "Last name is required");
  requireValue(userRole, "User role is required");
  requireValue(password, "Password is required");
  requireValue(dateOfBirth, "Date of birth is required");
  requireValue(subscriptionPlan, "Subscription plan is required");
  requireValue(subscriptionType, "Subscription type is required");
  requireValue(schoolName, "School name is required");

  const finalAgeGroup = getAgeGroup(dateOfBirth);
  const isMinor = isMinorAgeGroup(finalAgeGroup);
  const normalizedUserRole = String(userRole || "").trim().toLowerCase();
  const isStudentRegistration = normalizedUserRole === "student";
  const cleanedClassName = String(className || "").trim();
  const cleanedSchoolName = String(schoolName || "").trim();

  if (isStudentRegistration && !cleanedClassName) {
    throw new Error("Class is required for students");
  }

  if (isMinor && (!parentName || !parentEmail || !parentMobile)) {
    throw new Error("Parent details required for users under 18");
  }

  const finalEmail = (isMinor ? parentEmail : email)?.trim().toLowerCase();
  requireValue(finalEmail, "Email is required");

  const finalMobile = isMinor ? parentMobile : mobile;
  const phoneRegex = /^\+\d{7,15}$/;

  if (finalMobile && !phoneRegex.test(finalMobile)) {
    throw new Error("Invalid mobile number format. Please use country code with number.");
  }

  const passwordHash = hashPassword ? await bcrypt.hash(password, 10) : input.passwordHash;

  return {
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    userRole: String(userRole).trim(),
    className: isStudentRegistration ? cleanedClassName : null,
    schoolName: cleanedSchoolName,
    email: finalEmail,
    mobile: finalMobile || null,
    dateOfBirth,
    ageGroup: finalAgeGroup,
    parentName: isMinor ? parentName : null,
    parentEmail: isMinor ? parentEmail : null,
    parentMobile: isMinor ? parentMobile : null,
    country: "India",
    subscriptionPlan,
    childPlan: childPlan || null,
    subscriptionType,
    passwordHash,
    isMinor,
    welcomeName: isMinor ? parentName || firstName : firstName,
  };
}

export async function assertEmailAvailable(email, { transaction } = {}) {
  const existingUser = await PgUser.findOne({ where: { email }, transaction });

  if (existingUser) {
    throw new Error("Account already exists with this email");
  }
}

export function isFreeTrialRegistration(payload) {
  return payload.subscriptionPlan === FREE_TRIAL_PLAN || payload.subscriptionType === FREE_TRIAL_TYPE;
}

export function getRegistrationPrice(payload, discountINR = 0) {
  if (isFreeTrialRegistration(payload)) {
    return {
      basePriceINR: 0,
      discountINR: 0,
      taxableAmountINR: 0,
      gstAmount: 0,
      totalPriceINR: 0,
      amountPaise: 0,
      currency: "INR",
    };
  }

  return calculatePriceBreakdown({
    subscriptionPlan: payload.subscriptionPlan,
    childPlan: payload.childPlan,
    subscriptionType: payload.subscriptionType,
    discountINR,
  });
}

export async function createUserFromRegistrationPayload(payload, priceBreakdown, { transaction } = {}) {
  const tokenLimit = getTokenLimit({
    subscriptionPlan: payload.subscriptionPlan,
    childPlan: payload.childPlan,
  });

  return PgUser.create(
    {
      firstName: payload.firstName,
      lastName: payload.lastName,
      userRole: payload.userRole,
      className: payload.className,
      schoolName: payload.schoolName,
      email: payload.email,
      mobile: payload.mobile,
      dateOfBirth: new Date(payload.dateOfBirth),
      ageGroup: payload.ageGroup,
      parentName: payload.parentName,
      parentEmail: payload.parentEmail,
      parentMobile: payload.parentMobile,
      country: payload.country,
      subscriptionPlan: payload.subscriptionPlan,
      childPlan: payload.childPlan,
      subscriptionType: payload.subscriptionType,
      basePriceINR: priceBreakdown.basePriceINR,
      discountINR: priceBreakdown.discountINR,
      gstAmount: priceBreakdown.gstAmount,
      totalPriceINR: priceBreakdown.totalPriceINR,
      currency: priceBreakdown.currency,
      subscriptionStatus: "active",
      isActive: true,
      password: payload.passwordHash,
      remainingTokens: tokenLimit,
      planStartDate: new Date(),
      planExpiryDate: calculatePlanExpiry(payload.subscriptionType),
    },
    { transaction },
  );
}
