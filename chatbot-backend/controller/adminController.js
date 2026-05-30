import bcrypt from "bcryptjs";
import { PgUser } from "../postgres/models.js";
import { getTokenLimit } from "../utils/planTokens.js";
import { calculatePlanExpiry } from "../utils/dateUtils.js";
import sendPasswordMail from "../middleware/sendPasswordMail.js";
 
// ✅ Keep pricing same as normal registration (authController)
const BASE_PRICES_INR = {
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
    "Boost Up": { Monthly: 999, "1 Month": 999, "3 Months": 2997, Yearly: 10999, "1 Year": 10999 },
  },
  "WrdsAi Nxt": {
    "Boost Up": { Monthly: 999, "1 Month": 999, "3 Months": 2997, Yearly: 10999, "1 Year": 10999 },
  },
};
 
const getAgeGroup = (dateOfBirth) => {
  if (!dateOfBirth) return "";
 
  const today = new Date();
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return "";
 
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
 
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
 
  if (age < 13) return "<13";
  if (age >= 13 && age <= 14) return "13-14";
  if (age >= 15 && age <= 17) return "15-17";
  return "18+";
};
 
export const createUserManually = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      mobile,
      dateOfBirth,
      className,
      ageGroup,
      parentName,
      parentEmail,
      parentMobile,
      subscriptionPlan,
      childPlan,
      subscriptionType,
    } = req.body;
 
    const finalAgeGroup = getAgeGroup(dateOfBirth) || ageGroup || "";
    const parentAgeGroups = ["<13", "13-14", "15-17"];
    const isUnder18 = parentAgeGroups.includes(finalAgeGroup);
 
    // ✅ Normalize email/mobile based on ageGroup (under 18 → parent details)
    const finalEmail = (isUnder18 ? parentEmail : email)?.trim().toLowerCase();
    const finalMobile = isUnder18 ? parentMobile : mobile;
    const phoneRegex = /^\+\d{7,15}$/;
 
    // ✅ Basic required validation (matches UI expectations)
    if (!firstName || !lastName || !dateOfBirth) {
      return res
        .status(400)
        .json({ message: "firstName, lastName, dateOfBirth required" });
    }
 
    if (isUnder18) {
      if (!parentName || !parentEmail || !parentMobile) {
        return res.status(400).json({
          message: "parentName, parentEmail, parentMobile required for under 18",
        });
      }
    } else {
      if (!finalEmail || !finalMobile) {
        return res
          .status(400)
          .json({ message: "email and mobile required for 18+" });
      }
    }
 
    if (finalMobile && !phoneRegex.test(finalMobile)) {
      return res.status(400).json({
        message:
          "Invalid mobile number format. Please use country code with number (e.g. +919876543210)",
      });
    }
 
    if (!subscriptionPlan || !subscriptionType) {
      return res
        .status(400)
        .json({ message: "subscriptionPlan and subscriptionType required" });
    }
 
    const effectiveSubscriptionPlan = subscriptionPlan;
    const effectiveChildPlan =
      effectiveSubscriptionPlan === "Free Trial" ? null : childPlan;
    const effectiveSubscriptionType =
      effectiveSubscriptionPlan === "Free Trial" ? "Free Trial (1 week)" : subscriptionType;
 
    if (effectiveSubscriptionPlan !== "Free Trial" && !effectiveChildPlan) {
      return res.status(400).json({ message: "childPlan is required" });
    }
 
    // ❌ duplicate check
    const exists = await PgUser.findOne({ where: { email: finalEmail } });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }
 
    // 🔑 Password logic (same as authController Free Trial logic)
    const cleanName = (firstName || "").replace(/\s+/g, "").toLowerCase();
    const passwordPart =
      cleanName.length >= 4
        ? cleanName.slice(0, 4)
        : cleanName.padEnd(4, cleanName[0] || "x");
    const year = dateOfBirth
      ? new Date(dateOfBirth).getFullYear()
      : new Date().getFullYear();
    const generatedPassword = `${passwordPart}@${year}`;
 
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);
 
    // 🎯 Token limit by plan
    const tokenLimit = getTokenLimit({
      subscriptionPlan: effectiveSubscriptionPlan,
      childPlan: effectiveChildPlan,
    });
 
    // 📆 Plan validity
    const startDate = new Date();
    const expiryDate = calculatePlanExpiry(effectiveSubscriptionType);
 
    // 💰 Price fields (same calculation as normal registration)
    const basePriceINR =
      effectiveSubscriptionPlan === "Free Trial"
        ? 0
        : BASE_PRICES_INR[effectiveSubscriptionPlan]?.[effectiveChildPlan]?.[
            effectiveSubscriptionType
          ] || 0;
    const discountINR = 0;
    const gstAmount =
      effectiveSubscriptionPlan === "Free Trial"
        ? 0
        : Math.round(basePriceINR * 0.18 * 100) / 100;
    const totalPriceINR =
      effectiveSubscriptionPlan === "Free Trial"
        ? 0
        : Math.round((basePriceINR + gstAmount) * 100) / 100;
 
    const user = await PgUser.create({
      firstName,
      lastName,
      email: finalEmail,
      mobile: finalMobile,
      dateOfBirth: new Date(dateOfBirth),
      ageGroup: finalAgeGroup,
      className,

      parentName: isUnder18 ? parentName : "",
      parentEmail: isUnder18 ? parentEmail : "",
      parentMobile: isUnder18 ? parentMobile : "",
 
      subscriptionPlan: effectiveSubscriptionPlan,
      childPlan: effectiveChildPlan,
      subscriptionType: effectiveSubscriptionType,
      basePriceINR,
      discountINR,
      gstAmount,
      totalPriceINR,
 
      password: hashedPassword,
      remainingTokens: tokenLimit,
 
      planStartDate: startDate,
      planExpiryDate: expiryDate,
    });
 
    // ✅ Email password (same recipients rule as authController)
    const recipientEmail = isUnder18 ? parentEmail : finalEmail;
    const recipientName = isUnder18 ? parentName : firstName;
    let mailSent = true;
    try {
      await sendPasswordMail(recipientEmail, recipientName, generatedPassword);
    } catch (e) {
      mailSent = false;    
      console.warn("⚠️ createUserManually mail failed:", e?.message || e);
    }
 
    res.status(201).json({
      message: "User created successfully",
      loginEmail: finalEmail,
      password: generatedPassword, // admin can copy
      mailSent,
      userId: user.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create user" });
  }
};
