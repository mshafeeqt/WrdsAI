import bcrypt from "bcryptjs";
import User from "../model/User.js";
import { getTokenLimit } from "../utils/planTokens.js";
import { calculatePlanExpiry } from "../utils/dateUtils.js";
import sendPasswordMail from "../middleware/sendPasswordMail.js";
 
// ✅ Keep pricing same as normal registration (authController)
const BASE_PRICES_INR = {
  WrdsAI: {
    "Glow Up": { Monthly: 83.9, Yearly: 922.86 },
    "Level Up": { Monthly: 168.64, Yearly: 1694.09 },
    "Rise Up": { Monthly: 338.14, Yearly: 3388.98 },
  },
  WrdsAIPro: {
    "Step Up": { Monthly: 422.88, Yearly: 4651.69 },
    "Speed Up": { Monthly: 761.86, Yearly: 7626.44 },
    "Scale Up": { Monthly: 1355.09, Yearly: 13558.5 },
  },
  "WrdsAI Nxt": {
    "Boost Up": { Monthly: 999, Yearly: 10999 },
  },
  "WrdsAi Nxt": {
    "Boost Up": { Monthly: 999, Yearly: 10999 },
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
    const finalEmail = isUnder18 ? parentEmail : email;
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
      effectiveSubscriptionPlan === "Free Trial" ? "One Time" : subscriptionType;
 
    if (effectiveSubscriptionPlan !== "Free Trial" && !effectiveChildPlan) {
      return res.status(400).json({ message: "childPlan is required" });
    }
 
    // ❌ duplicate check
    const exists = await User.findOne({ email: finalEmail });
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
 
    const user = await User.create({
      firstName,
      lastName,
      email: finalEmail,
      mobile: finalMobile,
      dateOfBirth: new Date(dateOfBirth),
      ageGroup: finalAgeGroup,
 
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
      userId: user._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create user" });
  }
};