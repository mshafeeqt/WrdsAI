import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PgUser } from "../postgres/models.js";
// import { sendPasswordMail } from "../services/mailService.js";
import sendPlanExpiredMail from "../middleware/sendPlanExpiredMail.js";
import { getTokenLimit } from "../utils/planTokens.js";
import { buildUserResponseByAgeGroup } from "../utils/userResponse.js";
import { calculatePlanExpiry, checkPlanExpiry } from "../utils/dateUtils.js";
import { getGlobalTokenStats } from "../utils/tokenLimit.js";
import sendResetPasswordMail from "../middleware/sendResetPasswordMail.js";
import {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  signAuthToken,
} from "../middleware/auth.js";

// ... (existing imports and constants) ...

export const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email & Password required" });
    }

    email = email.trim().toLowerCase(); // 💡 Prevents case mismatch

    const user = await PgUser.findOne({ where: { email } });

    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.password) {
      return res.status(400).json({
        error:
          "Password not set for this account. Please reset or register again.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(400).json({ error: "Incorrect Password" });

    // ✅ Check Plan Expiry
    const isPlanExpired = checkPlanExpiry(user);
    // if (isPlanExpired && !user.planExpiryEmailSent) {
    //   // Send email
    //   const recipientName = ["<13", "13-14", "15-17"].includes(user.ageGroup) ? user.parentName : user.firstName;
    //   await sendPlanExpiredMail(user.email, recipientName || user.firstName);

    //   user.planExpiryEmailSent = true;
    //   await user.save();
    //   console.log(`Plan expired for ${user.email}. Email sent.`);
    // }
    if (isPlanExpired) {
      if (!user.planExpiryEmailSent) {
        const recipientName = ["<13", "13-14", "15-17"].includes(user.ageGroup)
          ? user.parentName
          : user.firstName;

        console.log("dateOfBirth:::::", user.dateOfBirth);
        console.log("ageGroup:::::", user.ageGroup);

        await sendPlanExpiredMail(user.email, recipientName || user.firstName, {
          firstName: user.firstName,
          lastName: user.lastName,
          dateOfBirth: user.dateOfBirth,
          email: user.email,
          mobile: user.mobile,
          ageGroup: user.ageGroup,
          parentName: user.parentName,
          parentEmail: user.parentEmail,
          parentMobile: user.parentMobile,
        });
        user.planExpiryEmailSent = true;
      }

      user.subscriptionStatus = "expired";
      user.isActive = false;
      await user.save();
    }

    // ✅ Sync remainingTokens from usage history (respecting planStartDate)
    const stats = await getGlobalTokenStats(user.email);
    user.remainingTokens = stats.remainingTokens;
    // We don't necessarily need to save to DB here, as it's purely for the response,
    // but saving ensures consistency if other parts of the app read from DB.
    await user.save();

    const token = signAuthToken(user);
    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    res.json({
      status: 200,
      message: "Login successful",
      data: buildUserResponseByAgeGroup(user),
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed", details: err.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const stats = await getGlobalTokenStats(req.user.email);
    req.user.remainingTokens = stats.remainingTokens;
    await req.user.save();

    return res.json({
      status: 200,
      data: buildUserResponseByAgeGroup(req.user),
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to load current user",
      details: err.message,
    });
  }
};

export const logoutUser = (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    ...getAuthCookieOptions(),
    maxAge: undefined,
  });

  return res.json({ status: 200, message: "Logged out successfully" });
};

const wrdsAIOptions = ["Glow Up", "Level Up", "Rise Up"];
const wrdsAIProOptions = ["Step Up", "Speed Up", "Scale Up"];
const wrdsAINxtOptions = ["Boost Up"];
const subscriptionTypes = ["Monthly", "Yearly"];

// FIXED PRICES IN USD (કદી બદલવાના નહીં)
// const BASE_PRICES_USD = {
//   WrdsAI: {
//     "Glow Up": { Monthly: 0.99, Yearly: 10.99 },
//     "Level Up": { Monthly: 1.99, Yearly: 21.99 },
//     "Rise Up": { Monthly: 3.99, Yearly: 39.99 },
//   },
//   WrdsAIPro: {
//     "Step Up": { Monthly: 2.99, Yearly: 32.99 },
//     "Speed Up": { Monthly: 4.99, Yearly: 54.99 },
//     "Scale Up": { Monthly: 9.99, Yearly: 99.99 },
//   },
// };

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

// BEST FREE + UNLIMITED + SUPER FAST USD → INR API
const getLiveUSDRate = async () => {
  try {
    const response = await fetch(
      "https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/usd/inr.json"
    );
    if (!response.ok) throw new Error("API failed");
    const data = await response.json();
    const rate = Math.round(data.inr * 100) / 100; // 2 decimal places
    console.log("Live USD → INR Rate:", rate);
    return rate;
  } catch (err) {
    console.error("Currency API failed:", err.message);
    console.log("Using fallback rate: 85 INR");
    return 85; // emergency fallback
  }
};

// AGE GROUP AUTO CALCULATOR
const getAgeGroup = (dob) => {
  const today = new Date();
  const birth = new Date(dob);

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

export const registerUser = async (req, res) => {
  try {
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
      // ageGroup,
      parentName,
      parentEmail,
      parentMobile,
      subscriptionPlan, // "WrdsAI" or "WrdsAI Pro"
      childPlan, // "Glow Up", "Scale Up" etc.
      subscriptionType, // "Monthly" or "Yearly"
    } = req.body;

    const finalAgeGroup = getAgeGroup(dateOfBirth);
    const normalizedUserRole = String(userRole || "").trim().toLowerCase();
    const isStudentRegistration = normalizedUserRole === "student";
    const cleanedClassName = String(className || "").trim();
    const cleanedSchoolName = String(schoolName || "").trim();

    // Required fields validation
    if (
      !firstName ||
      !lastName ||
      !userRole ||
      !password ||
      !dateOfBirth ||
      // !ageGroup ||
      !subscriptionPlan ||
      // !childPlan ||
      !subscriptionType
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (isStudentRegistration && !cleanedClassName) {
      return res.status(400).json({ error: "Class is required for students" });
    }

    if (!cleanedSchoolName) {
      return res.status(400).json({ error: "School name is required" });
    }

    // Parent validation for minors
    if (["<13", "13-14", "15-17"].includes(finalAgeGroup)) {
      if (!parentName || !parentEmail || !parentMobile) {
        return res
          .status(400)
          .json({ error: "Parent details required for users under 18" });
      }
    }

    const isMinor = ["<13", "13-14", "15-17"].includes(finalAgeGroup);

    // Final login email (for <13, parent email is used)
    const finalEmail = (isMinor ? parentEmail : email)?.trim().toLowerCase();
    console.log("Final Email for registration::::", finalEmail);
    const finalMobile = isMinor ? parentMobile : mobile;
    const hashedPassword = await bcrypt.hash(password, 10);

    const phoneRegex = /^\+\d{7,15}$/;

    if (finalMobile && !phoneRegex.test(finalMobile)) {
      return res.status(400).json({
        error:
          "Invalid mobile number format. Please use country code with number (e.g. +919876543210)",
      });
    }

    // Check duplicate email
    const existingUser = await PgUser.findOne({ where: { email: finalEmail } });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Account already exists with this email" });
    }

    // if (subscriptionPlan === "Free Trial") {
    //   try {
    //     const cleanName = (firstName || "").replace(/\s+/g, "").toLowerCase();
    //     const passwordPart =
    //       cleanName.length >= 4
    //         ? cleanName.slice(0, 4)
    //         : cleanName.padEnd(4, cleanName[0] || "x");
    //     const year = dateOfBirth
    //       ? new Date(dateOfBirth).getFullYear()
    //       : new Date().getFullYear();
    //     const generatedPassword = `${passwordPart}@${year}`;

    //     const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    //     const user = new User({
    //       firstName,
    //       lastName,
    //       email: finalEmail,
    //       mobile: finalMobile || null,
    //       dateOfBirth: new Date(dateOfBirth),
    //       ageGroup: finalAgeGroup,
    //       parentName: ["<13", "13-14", "15-17"].includes(finalAgeGroup)
    //         ? parentName
    //         : null,
    //       parentEmail: ["<13", "13-14", "15-17"].includes(finalAgeGroup)
    //         ? parentEmail
    //         : null,
    //       parentMobile: ["<13", "13-14", "15-17"].includes(finalAgeGroup)
    //         ? parentMobile
    //         : null,
    //       country: "India",

    //       subscriptionPlan: "Free Trial",
    //       childPlan: null,
    //       subscriptionType: "One Time",

    //       basePriceINR: 0,
    //       gstAmount: 0,
    //       totalPriceINR: 0,
    //       currency: "INR",
    //       subscriptionStatus: "active",
    //       isActive: true,

    //       password: hashedPassword,
    //       remainingTokens: 3000,
    //     });

    //     await user.save();

    //     const recipientEmail = ["<13", "13-14", "15-17"].includes(finalAgeGroup)
    //       ? parentEmail
    //       : finalEmail;
    //     const recipientName = ["<13", "13-14", "15-17"].includes(finalAgeGroup)
    //       ? parentName
    //       : firstName;

    //     await sendPasswordMail(
    //       recipientEmail,
    //       recipientName,
    //       generatedPassword
    //     );

    //     console.log(
    //   `Free Trial password email sent to ${recipientEmail} → ${generatedPassword}`
    // );

    //     return res.status(201).json({
    //       success: true,
    //       message: "Free Trial activated. Password sent to email.",
    //       loginEmail: finalEmail,
    //       remainingTokens: 3000,
    //       user: {
    //         id: user._id,
    //         subscription: { priceINR: 0, plan: "Free Trial" },
    //       },
    //     });
    //   } catch (err) {
    //     console.error("Free trial registration error:", err);
    //     return res.status(500).json({
    //       error: "Free trial registration failed",
    //       details: err.message,
    //     });
    //   }
    // }

    if (subscriptionPlan === "Free Trial") {
      try {
        const tokenLimit = getTokenLimit({
          subscriptionPlan: "Free Trial",
        });

        // 3️⃣ Create user
        const user = await PgUser.create({
          firstName,
          lastName,
          userRole,
          className: isStudentRegistration ? cleanedClassName : null,
          schoolName: cleanedSchoolName,
      email: finalEmail,
          mobile: finalMobile || null,
          dateOfBirth: new Date(dateOfBirth),
          ageGroup: finalAgeGroup,
          parentName: ["<13", "13-14", "15-17"].includes(finalAgeGroup)
            ? parentName
            : null,
          parentEmail: ["<13", "13-14", "15-17"].includes(finalAgeGroup)
            ? parentEmail
            : null,
          parentMobile: ["<13", "13-14", "15-17"].includes(finalAgeGroup)
            ? parentMobile
            : null,
          country: "India",

          subscriptionPlan: "Free Trial",
          childPlan: null,
          subscriptionType: "One Time",

          basePriceINR: 0,
          gstAmount: 0,
          totalPriceINR: 0,
          currency: "INR",
          subscriptionStatus: "active",
          isActive: true,

          password: hashedPassword,
          remainingTokens: tokenLimit,
          planStartDate: new Date(),
          planExpiryDate: calculatePlanExpiry("One Time"),
        });

        // Removed user.save() as create already saves the user

        // 5️⃣ Return response
        return res.status(201).json({
          success: true,
          message: "Free Trial activated. You can now log in.",
          loginEmail: finalEmail,
          remainingTokens: tokenLimit,
          // user: {
          //   id: user._id,
          //   subscription: { priceINR: 0, plan: "Free Trial" },
          // },
          user: buildUserResponseByAgeGroup(user),
        });
      } catch (err) {
        console.error("Free trial registration error:", err);
        return res.status(500).json({
          error: "Free trial registration failed",
          details: err.message,
        });
      }
    }

    // Get USD price
    // let priceUSD = 0;
    // if (subscriptionPlan === "WrdsAI") {
    //   priceUSD = BASE_PRICES_USD.WrdsAI[childPlan]?.[subscriptionType];
    // } else if (subscriptionPlan === "WrdsAI Pro") {
    //   priceUSD = BASE_PRICES_USD.WrdsAI Pro[childPlan]?.[subscriptionType];
    // }

    // if (!priceUSD) {
    //   return res.status(400).json({ error: "Invalid plan selection" });
    // }

    // // Fetch live exchange rate
    // const usdToInrRate = await getLiveUSDRate();

    // // Calculate final amount in INR with GST
    // const baseAmountINR = Math.round(priceUSD * usdToInrRate * 100) / 100;
    // const gstAmount = Math.round(baseAmountINR * 0.18 * 100) / 100;
    // const totalAmountINR = Math.round((baseAmountINR + gstAmount) * 100);

    // INR price
    const priceINR =
      BASE_PRICES_INR[subscriptionPlan]?.[childPlan]?.[subscriptionType];
    console.log("priceINR:::::", priceINR);

    if (!priceINR) {
      return res.status(400).json({ error: "Invalid plan selection" });
    }

    // GST (18%)
    const gstAmount = Math.round(priceINR * 0.18 * 100) / 100;

    // Total payable amount
    const totalAmountINR = Math.round((priceINR + gstAmount) * 100);


    // const totalAmountINR = 100; // 1 INR in paise

    const tokenLimit = getTokenLimit({
      subscriptionPlan,
      childPlan,
    });

    // Create user directly. Payment is disabled for now, so login should work immediately.
    const user = await PgUser.create({
      firstName,
      lastName,
      userRole,
      className: isStudentRegistration ? cleanedClassName : null,
      schoolName: cleanedSchoolName,
      email: finalEmail,
      mobile: finalMobile || null,
      dateOfBirth: new Date(dateOfBirth),
      ageGroup: finalAgeGroup,
      parentName: ["<13", "13-14", "15-17"].includes(finalAgeGroup)
        ? parentName
        : null,
      parentEmail: ["<13", "13-14", "15-17"].includes(finalAgeGroup)
        ? parentEmail
        : null,
      parentMobile: ["<13", "13-14", "15-17"].includes(finalAgeGroup)
        ? parentMobile
        : null,
      country: "India", // Hardcoded for Indian GST

      // Subscription details
      subscriptionPlan,
      childPlan,
      subscriptionType,

      remainingTokens: tokenLimit, // ✅ AA J JAGYA
      // priceUSD,
      // exchangeRateUsed: usdToInrRate,
      basePriceINR: priceINR,
      discountINR: 0,
      gstAmount,
      totalPriceINR: totalAmountINR / 100, // stored as rupees (with decimals)
      currency: "INR",
      subscriptionStatus: "active",
      isActive: true,
      password: hashedPassword,
      planStartDate: new Date(),
      planExpiryDate: calculatePlanExpiry(subscriptionType),
    });

    res.status(201).json({
      success: true,
      message: "Registration complete. You can now log in.",
      loginEmail: finalEmail,
      priceBreakdown: {
        plan: `${subscriptionPlan} - ${childPlan} (${subscriptionType})`,
        // usd: `$${priceUSD}`,
        // rate: `1 USD = ₹${usdToInrRate}`,
        base: `₹${priceINR}`,
        discount: "₹0",
        gst: `₹${gstAmount} (18%)`,
        total: `₹${totalAmountINR / 100}`,
      },

      user: buildUserResponseByAgeGroup(user),
      // user: {
      //   id: user._id,
      //   subscription: {
      //     priceINR: totalAmountINR / 100,
      //   },
      // },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({
      error: "Registration failed",
      details: err.message,
    });
  }
};

// Prices (USD)
// const wrdsAIPrices = {
//   "Glow Up": { Monthly: 0.99, Yearly: 10.99 },
//   "Level Up": { Monthly: 1.99, Yearly: 21.99 },
//   "Rise Up": { Monthly: 3.99, Yearly: 39.99 },
// };

// const wrdsAIProPrices = {
//   "Step Up": { Monthly: 2.99, Yearly: 32.99 },
//   "Speed Up": { Monthly: 4.99, Yearly: 54.99 },
//   "Scale Up": { Monthly: 9.99, Yearly: 99.99 },
// };

// // USD → INR conversion
// const USD_TO_INR = 85;

// export const registerUser = async (req, res) => {
//   try {
//     const {
//       firstName,
//       lastName,
//       email,
//       mobile,
//       // country,
//       dateOfBirth,
//       ageGroup,
//       parentName,
//       parentEmail,
//       parentMobile,
//       subscriptionPlan,
//       childPlan,
//       subscriptionType,
//     } = req.body;

//     if (
//       !firstName ||
//       !lastName ||
//       !dateOfBirth ||
//       !ageGroup ||
//       !subscriptionPlan ||
//       !childPlan ||
//       !subscriptionType
//     ) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     // Parent validation if age < 18
//     if (["<13", "13-14", "15-17"].includes(ageGroup)) {
//       if (!parentName || !parentEmail || !parentMobile) {
//         return res.status(400).json({
//           error: "Parent information required for users under 18",
//         });
//       }
//     }

//     // If <13 → Parent email becomes login email
//     const finalEmail = ageGroup === "<13" ? parentEmail : email;

//     // Check if user already exists
//     // const existingUser = await User.findOne({
//     //   $or: [{ email }, { username }, { mobile }]
//     // });

//     // if (existingUser) {
//     //   return res.status(400).json({
//     //     error: "Email, Username or Mobile number already exists"
//     //   });
//     // }

//     // Check duplicates
//     const existingUser = await User.findOne({
//       $or: [{ email: finalEmail }],
//     });

//     if (existingUser) {
//       return res.status(400).json({ error: "Account already exists" });
//     }

//     // ---------------- PRICE LOGIC ----------------

//     let selectedPriceUSD = 0;

//     // NOVA plans
//     if (novaOptions.includes(childPlan)) {
//       selectedPriceUSD = novaPrices[childPlan][subscriptionType];
//     }

//     // SUPERNOVA plans
//     else if (superNovaOptions.includes(childPlan)) {
//       selectedPriceUSD = superNovaPrices[childPlan][subscriptionType];
//     }

//     // Convert USD -> INR
//     // const finalAmountINR = Math.round(selectedPriceUSD * USD_TO_INR);
//     const finalAmountINR = 1;

//     // -------- Generate Password --------

//     // Create user with all fields
//     const user = new User({
//       firstName,
//       lastName,
//       email: finalEmail,
//       mobile,
//       dateOfBirth: new Date(dateOfBirth), // Convert to Date object
//       ageGroup,
//       parentName,
//       parentEmail,
//       parentMobile,
//       subscriptionPlan,
//       childPlan,
//       subscriptionType,
//       priceUSD: selectedPriceUSD,
//       priceINR: finalAmountINR,
//     });

//     await user.save();

//     res.status(201).json({
//       // message: "User registered successfully",
//       message: "Registration successful.",
//       loginEmail: finalEmail,
//       // autoGeneratedPassword: generatedPassword,
//       user: {
//         id: user._id,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         // email: user.email,
//         email: finalEmail,
//         mobile: user.mobile,
//         dateOfBirth: user.dateOfBirth,
//         subscription: {
//           plan: subscriptionPlan,
//           childPlan,
//           type: subscriptionType,
//           priceUSD: selectedPriceUSD,
//           priceINR: finalAmountINR,
//         },
//         remainingTokens: user.remainingTokens,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({
//       error: "Registration failed",
//       details: err.message,
//     });
//   }
// };

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await PgUser.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("ERORR: JWT_SECRET is missing in .env");
      return res
        .status(500)
        .json({ error: "Server configuration error (JWT_SECRET missing)" });
    }

    if (!process.env.FRONTEND_URL) {
      console.error("ERROR: FRONTEND_URL is missing in .env");
      return res.status(500).json({
        error: "Forgot password failed",
        details: "FRONTEND_URL missing in backend .env file. ",
      });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "30m",
    });

    user.resetPasswordToken = token;
    user.resetPasswordExpire = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    // Generate accurate reset link pointing to FRONTEND
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?id=${user.id}&token=${token}`;

    await sendResetPasswordMail(
      user.email,
      user.firstName || "User",
      resetLink
    );

    res.json({ message: "Reset password link sent to email" });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR 👉", err);
    res.status(500).json({
      error: "Forgot password failed",
      details: err.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await PgUser.destroy({ where: { id } });

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully", id });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { id, token, password } = req.body;

    if (!id || !token || !password) {
      return res.status(400).json({
        error:
          "Invalid reset data. All fields (id, token, password) are required.",
      });
    }

    // Find user with valid token and expiration
    const user = await PgUser.findOne({
      where: {
        id,
        resetPasswordToken: token,
      },
    });

    if (!user) {
      return res
        .status(400)
        .json({ error: "Reset link is invalid or has expired." });
    }

    if (
      user.resetPasswordExpire &&
      new Date(user.resetPasswordExpire).getTime() < Date.now()
    ) {
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      await user.save();

      return res
        .status(400)
        .json({ error: "Reset link is invalid or has expired." });
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      await user.save();

      return res
        .status(400)
        .json({ error: "Reset link is invalid or has expired." });
    }

    // Hash new password
    user.password = await bcrypt.hash(password, 10);

    // Clear reset tokens
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    await user.save();

    res.json({
      message:
        "Password reset successful! You can now login with your new password.",
    });
  } catch (err) {
    console.error("RESET PASSWORD ERROR 👉", err);
    res
      .status(500)
      .json({ error: "Reset password failed", details: err.message });
  }
};

export const changePassword = async (req, res) => {
  // try {
  //   const { userId, currentPassword, newPassword } = req.body;

  //   if (!userId || !currentPassword || !newPassword) {
  //     return res.status(400).json({
  //       error: "User ID, current password and new password are required",
  //     });
  //   }

  //   const user = await User.findById(userId);
  //   if (!user) {
  //     return res.status(404).json({ error: "User not found" });
  //   }

  //   if (!user.password) {
  //     return res.status(400).json({
  //       error: "Password not set for this account",
  //     });
  //   }

  //   // ✅ Verify current password
  //   const isMatch = await bcrypt.compare(currentPassword, user.password);
  //   if (!isMatch) {
  //     return res.status(400).json({
  //       error: "Current password is incorrect",
  //     });
  //   }

  //   // ✅ Prevent same password reuse
  //   const isSamePassword = await bcrypt.compare(newPassword, user.password);
  //   if (isSamePassword) {
  //     return res.status(400).json({
  //       error: "New password must be different from old password",
  //     });
  //   }

  //   // ✅ Hash & save new password
  //   user.password = await bcrypt.hash(newPassword, 10);
  //   await user.save();

  //   res.json({
  //     success: true,
  //     message: "Password changed successfully",
  //   });
  // } catch (err) {
  //   console.error("CHANGE PASSWORD ERROR 👉", err);
  //   res.status(500).json({
  //     error: "Change password failed",
  //     details: err.message,
  //   });
  // }
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // 1️⃣ user find karo
    const user = await PgUser.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2️⃣ current password check karo
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    // 3️⃣ new password hash karo
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4️⃣ password update karo
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await PgUser.findAll({ order: [["createdAt", "DESC"]] });

    // Use Promise.all to fetch up-to-date stats for every user
    const formattedUsers = await Promise.all(
      users.map(async (user) => {
        try {
          // ✅ Get dynamic, real-time stats (single source of truth)
          const stats = await getGlobalTokenStats(user.email);

          return {
            _id: user.id,
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            mobile: user.mobile,
            schoolName: user.schoolName,
            subscriptionPlan: user.subscriptionPlan,
            childPlan: user.childPlan,
            planStartDate: user.planStartDate,
            subscriptionType: user.subscriptionType,
            // Use calculated values from stats
            remainingTokens: stats.remainingTokens,
            tokensConsumed: stats.totalTokensUsed,
            totalTokens: stats.limit,
          };
        } catch (err) {
          console.error(`Error fetching stats for ${user.email}:`, err.message);
          // Fallback if something fails (e.g. user not found logic, though redundant here)
          const fallbackLimit = getTokenLimit({
            subscriptionPlan: user.subscriptionPlan,
            childPlan: user.childPlan,
          });
          return {
            _id: user.id,
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            mobile: user.mobile,
            schoolName: user.schoolName,
            subscriptionPlan: user.subscriptionPlan,
            childPlan: user.childPlan,
            planStartDate: user.planStartDate,
            subscriptionType: user.subscriptionType,
            remainingTokens: user.remainingTokens ?? fallbackLimit,
            tokensConsumed: 0,
            totalTokens: fallbackLimit,
          };
        }
      })
    );

    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};
