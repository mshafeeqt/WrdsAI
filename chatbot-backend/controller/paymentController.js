// server/paymentRoutes.js
import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import bodyParser from "body-parser";
import Transaction from "../model/Transaction.js";
import User from "../model/User.js";
import bcrypt from "bcryptjs";
import sendPasswordMail from "../middleware/sendPasswordMail.js";
import sendReceiptMail from "../middleware/mailWithAttachment.js";
// import generateReceipt from "../utils/generateReceipt.js";
import { generateReceipt } from "../middleware/generateReceipt.js";
import { calculatePlanExpiry } from "../utils/dateUtils.js";
import { getTokenLimit } from "../utils/planTokens.js";
import { generateReceiptNo } from "../utils/generateReceiptNo.js";
import { COUPONS } from "../utils/coupons.js";

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Parse JSON bodies for normal routes
router.use(bodyParser.json());

// ----------------- Number → Words Helper -----------------
function numberToWords(num) {
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function integerToWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + integerToWords(n % 100) : "")
      );
    if (n < 1000000) {
      const thousands = Math.floor(n / 1000);
      const rem = n % 1000;
      return (
        integerToWords(thousands) +
        " Thousand" +
        (rem ? " " + integerToWords(rem) : "")
      );
    }
    return n.toString();
  }

  if (typeof num !== "number" || Number.isNaN(num)) return "Zero";
  if (num === 0) return "Zero";

  // split integer & decimal
  const parts = num.toString().split(".");
  const integerPart = parseInt(parts[0]);
  const decimalPart = parts[1] ? parts[1].slice(0, 2) : null; // upto 2 digits

  let words = integerToWords(integerPart);

  if (decimalPart && parseInt(decimalPart) > 0) {
    words += " Point";
    for (const digit of decimalPart) {
      words += " " + a[parseInt(digit)];
    }
  }

  return words;
}

// ✅ Validate Coupon (NO existing logic touched)
router.post("/validate-coupon", async (req, res) => {
  try {
    const { couponCode, amount } = req.body;
    console.log("Validating coupon:", couponCode, "for amount:", amount);
    if (!couponCode) {
      return res.json({
        success: true,
        discount: 0,
        finalAmount: amount,
      });
    }

    const coupon = COUPONS[couponCode];
    console.log(COUPONS[couponCode], "COUPONS[couponCode]");
    console.log(coupon, ":::::::::::::::::");
    console.log(!coupon, !coupon.isActive, ":::::::::::::::::OOOOOOOOOOOOO");
    if (!coupon || !coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    const discount = Math.round((amount * coupon.discountPercent) / 100);
    const finalAmount = amount - discount;

    return res.json({
      success: true,
      coupon: coupon.code,
      discount,
      finalAmount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2) After successful UPI payment → verify → generate PDF → send email
router.post("/create-upi", async (req, res) => {
  try {
    const {
      email,
      fullName,
      planName,
      subscriptionType,
      amount,
      discount,
      gst,
      total,
      paymentMethod,
      transactionId,
      date,
      amountInWords,
    } = req.body;

    if (!email || !transactionId) {
      return res.status(400).json({
        success: false,
        message: "Email and Transaction ID are required",
      });
    }

    const receiptNo = await generateReceiptNo();

    // const amountInWords = numberToWords(Number(total));

    // --------- 1️⃣ Generate PDF Receipt ---------
    const receiptData = {
      // receiptNo: `RCP-${Date.now()}`,
      receiptNo: receiptNo,
      date: date || new Date().toISOString().split("T")[0],
      fullName,
      planName,
      subscriptionType,
      amount,
      discount: discount || 0,
      gst,
      total,
      paymentMethod,
      transactionId,
      amountInWords,
    };
    console.log("receiptData **************", receiptData);

    // const pdfPath = await generateReceipt(receiptData);
    const pdfBuffer = await generateReceipt(receiptData);

    // --------- 2️⃣ Send PDF via Email ---------
    await sendReceiptMail(email, fullName, pdfBuffer);

    console.log("📩 PDF SENT SUCCESSFULLY TO::::::::::", email);
    console.log("📄 PDF PATH:", pdfBuffer);

    // --------- 3️⃣ Send response to frontend ---------
    res.status(200).json({
      success: true,
      message: "UPI Payment Verified & Receipt Sent to Email",
      pdf: pdfBuffer,
    });
  } catch (err) {
    console.error("create-upi Error:", err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ✅ Price constants (same as authController.js)
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

router.post("/upgrade-plan", async (req, res) => {
  const { email, subscriptionPlan, childPlan, subscriptionType, couponCode } =
    req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // const basePrice =
  //   BASE_PRICES_INR[subscriptionPlan][childPlan][subscriptionType];

  const priceINR =
    BASE_PRICES_INR[subscriptionPlan]?.[childPlan]?.[subscriptionType];

  if (!priceINR) {
    return res.status(400).json({ error: "Invalid plan selection" });
  }

  // const gstAmount = Math.round(basePrice * 0.18);
  // const totalAmount = basePrice + gstAmount;

  let discount = 0;
  if (couponCode) {
    const coupon = COUPONS[couponCode];
    if (coupon && coupon.isActive) {
      discount = Math.round((priceINR * coupon.discountPercent) / 100);
    }
  }

  const discountedPrice = priceINR - discount;

  // ✅ GST 18% on discounted price
  const gstAmount = Math.round(discountedPrice * 0.18 * 100) / 100;

  // ✅ Total in paise (for Razorpay)
  const totalAmountINR = Math.round((discountedPrice + gstAmount) * 100);

  // ❌ do NOT create new user
  // ❌ do NOT send password mail

  res.json({
    success: true,
    basePrice: priceINR, // ₹
    discount,
    gstAmount, // ₹
    totalAmount: totalAmountINR / 100, // ₹ (frontend display)
    totalAmountPaise: totalAmountINR, // 💳 Razorpay
    // totalAmount: 1, // ₹ (frontend display) - STATIC AS REQUESTED
    // totalAmountPaise: 100, // 💳 Razorpay (100 paise = 1 INR) - STATIC AS REQUESTED
    userId: user._id,
  });
});

// 1) Create Order (frontend calls this to get order.id)
router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receiptId } = req.body;

    if (!amount) return res.status(400).json({ error: "amount is required" });

    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency,
      receipt: receiptId || `rcpt_${Date.now()}`,
      payment_capture: 1, // auto-capture
    };

    const order = await razorpay.orders.create(options);
    // return order object to frontend
    res.json({ success: true, order });
  } catch (err) {
    console.error("create-order err:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2) Verify Payment (frontend posts payload returned by Razorpay handler)
// router.post("/verify-payment", async (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       email,
//       isUpgrade,
//       subscriptionPlan,
//       childPlan,
//       subscriptionType,
//     } = req.body;

//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return res.status(400).json({ success: false, error: "invalid payload" });
//     }

//     const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
//     shasum.update(razorpay_order_id + "|" + razorpay_payment_id);
//     const generated_signature = shasum.digest("hex");

//     if (generated_signature === razorpay_signature) {
//       // payment verified
//       // TODO: update order status in your DB here

//       // Save transaction to DB
//       try {
//         // Fetch payment details to get amount
//         const payment = await razorpay.payments.fetch(razorpay_payment_id);

//         const newTransaction = new Transaction({
//           razorpay_order_id,
//           razorpay_payment_id,
//           amount: payment.amount / 100, // amount in paise
//           currency: payment.currency,
//           status: "success",
//         });

//         await newTransaction.save();
//         console.log("Transaction saved:", newTransaction);
//       } catch (dbError) {
//         console.error("Error saving transaction:", dbError);
//         // Continue as payment is verified
//       }

//       // Update user password and send email
//       if (email) {
//         try {
//           const user = await User.findOne({ email });
//           if (user) {
//             // ✅ Determine recipient email/name (needed for both new \u0026 upgrade)
//             const recipientEmail = ["<13", "13-14", "15-17"].includes(
//               user.ageGroup
//             )
//               ? user.parentEmail
//               : email;
//             const recipientName = ["<13", "13-14", "15-17"].includes(
//               user.ageGroup
//             )
//               ? user.parentName
//               : user.firstName;

//             // ✅ Update subscription details if upgrade
//             if (req.body.isUpgrade) {
//               // const basePrice =
//               //   BASE_PRICES_INR[req.body.subscriptionPlan][req.body.childPlan][
//               //     req.body.subscriptionType
//               //   ];

//               // const gstAmount = Math.round(basePrice * 0.18);
//               // const totalAmount = basePrice + gstAmount;

//               const priceINR =
//                 BASE_PRICES_INR[req.body.subscriptionPlan]?.[
//                   req.body.childPlan
//                 ]?.[req.body.subscriptionType];

//               if (!priceINR) {
//                 return res
//                   .status(400)
//                   .json({ error: "Invalid plan selection" });
//               }

//               // ✅ GST 18%
//               const gstAmount = Math.round(priceINR * 0.18 * 100) / 100;

//               // ✅ Total in paise
//               const totalAmountINR = Math.round((priceINR + gstAmount) * 100);

//               user.subscriptionPlan = req.body.subscriptionPlan;
//               user.childPlan = req.body.childPlan;
//               user.subscriptionType = req.body.subscriptionType;

//               user.basePriceINR = priceINR;
//               user.gstAmount = gstAmount;
//               user.totalPriceINR = totalAmountINR / 100;

//               user.planStartDate = new Date();
//               user.subscriptionStatus = "active";
//               user.isActive = true;

//               await user.save();
//               console.log(`✅ Plan upgraded for ${email}`);
//             } else {
//               // ❌ Only generate password for NEW registrations (not upgrades)
//               // -------- Generate Password --------
//               const cleanName = user.firstName
//                 .replace(/\s+/g, "")
//                 .toLowerCase();
//               const passwordPart =
//                 cleanName.length >= 4
//                   ? cleanName.slice(0, 4)
//                   : cleanName.padEnd(4, cleanName[0]);
//               const year = new Date(user.dateOfBirth).getFullYear();
//               const generatedPassword = `${passwordPart}@${year}`;

//               const hashedPassword = await bcrypt.hash(generatedPassword, 10);

//               user.password = hashedPassword;
//               user.subscriptionStatus = "active";
//               user.isActive = true;

//               await user.save();

//               // ---- Send Password Email (NEW users only) ----
//               await sendPasswordMail(
//                 recipientEmail,
//                 recipientName,
//                 generatedPassword
//               );
//               console.log(`📧 Password email sent to ${recipientEmail}`);
//             }

//             // ---- Send Receipt Email (BOTH new \u0026 upgrade) ----
//             // const pdfPath = "C:/Users/AAC/OneDrive/Desktop/Meeral/chatbot_carbon/RECEIPT-1 (1).pdf";

//             // ⏳ DELAY EMAIL BY 4 MINUTES
//             // --------------------------------------------------
//             // setTimeout(async () => {
//             //   try {
//             //     // SEND PASSWORD MAIL
//             //     await sendPasswordMail(
//             //       recipientEmail,
//             //       recipientName,
//             //       generatedPassword
//             //     );
//             //     console.log(
//             //       `📩 Password email sent after 4 min → ${recipientEmail}`
//             //     );
//             //   } catch (err) {
//             //     console.error("4 min delayed email error:", err);
//             //   }
//             // }, 120000); // 4 minutes = 240000ms
//             // }, 43200000); // 12 hours

//             // const receiptData = {
//             //   transactionId: razorpay_payment_id,
//             //   date: new Date().toLocaleDateString(),
//             //   customerName: `${user.firstName} ${user.lastName}`,
//             //   email: recipientEmail,
//             //   planName: `${user.subscriptionPlan} - ${user.childPlan}`,
//             //   amount: user.totalPriceINR || "N/A", // Ensure this field exists or fetch from payment details
//             //   currency: "INR",
//             // };
//             const amountInWords = numberToWords(
//               Number(user.totalPriceINR || 0)
//             );

//             console.log("user::::", user);

//             const receiptData = {
//               receiptNo: `RCP-${Date.now()}`,
//               date: new Date().toISOString().split("T")[0],
//               fullName: `${user.firstName} ${user.lastName}`,
//               planName: `${user.subscriptionPlan} - ${user.childPlan}`,
//               subscriptionType: user.subscriptionType,
//               amount: user.basePriceINR || 0,
//               // gst: ((user.totalPriceINR * 18) / 100).toFixed(2),
//               gst: user.gstAmount || 0,
//               // total: (user.totalPriceINR * 1.18).toFixed(2),
//               total: user.totalPriceINR || 0,
//               paymentMethod: "Online",
//               transactionId: razorpay_payment_id,
//               amountInWords: amountInWords, // later fix
//             };
//             console.log("receiptData ::::::::::", receiptData);

//             const dynamicPdfPath = await generateReceipt(receiptData);
//             await sendReceiptMail(
//               recipientEmail,
//               recipientName,
//               dynamicPdfPath
//             );
//             console.log(`Receipt email sent to ${recipientEmail}`);
//           }
//         } catch (userError) {
//           console.error("Error updating user password:", userError);
//         }
//       }

//       return res.json({
//         success: true,
//         message: "Payment verified",
//         transactionId: razorpay_payment_id,
//       });
//     } else {
//       return res
//         .status(400)
//         .json({ success: false, error: "Invalid signature" });
//     }
//   } catch (err) {
//     console.error("verify-payment err:", err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

router.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      email,
      isUpgrade,
      subscriptionPlan,
      childPlan,
      subscriptionType,
      discount, // 🔥 Extract discount from frontend
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    // 🔐 Verify Razorpay signature
    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    shasum.update(razorpay_order_id + "|" + razorpay_payment_id);
    const digest = shasum.digest("hex");

    if (digest !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    // 💳 Fetch payment info
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    // 🧾 Save transaction
    await Transaction.create({
      razorpay_order_id,
      razorpay_payment_id,
      amount: payment.amount / 100,
      currency: payment.currency,
      status: "success",
    });

    // 👤 Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    // 📆 SET PLAN DATES (NEW + UPGRADE BOTH)
    user.planStartDate = new Date();
    user.planExpiryDate = calculatePlanExpiry(subscriptionType);
    user.planExpiryEmailSent = false;
    user.subscriptionStatus = "active";
    user.isActive = true;
    user.discountINR = discount || 0; // 🔥 Store the discount value

    // 🔁 Update plan details first (Upgrade case)
    if (isUpgrade) {
      user.subscriptionPlan = subscriptionPlan;
      user.childPlan = childPlan;
      user.subscriptionType = subscriptionType;

      // ✅ Update Tokens using utility
      const newTokenLimit = getTokenLimit({ subscriptionPlan, childPlan });
      user.remainingTokens = newTokenLimit;
      user.tokensConsumed = 0; // Reset consumed
    } else if (!user.subscriptionPlan) {
      // Fallback for new users if not already set
      user.subscriptionPlan = subscriptionPlan;
      user.childPlan = childPlan;
      user.subscriptionType = subscriptionType;
    }

    // 💰 CALCULATE PRICING (Now uses updated user fields OR actual payment)
    // We use the actual payment amount to ensure 100% accuracy on what was paid
    const actualTotal = payment.amount / 100;
    user.totalPriceINR = actualTotal;

    // user.totalPriceINR = 1;

    // Lookup base price from constant for the receipt breakdown
    const basePriceLookup =
      BASE_PRICES_INR[user.subscriptionPlan]?.[user.childPlan]?.[
        user.subscriptionType
      ];

    if (basePriceLookup) {
      // If we found a matching price, use it for the breakdown
      user.basePriceINR = basePriceLookup;

      // ✅ Re-calculate GST based on discounted price if discount exists
      const discountedBase = basePriceLookup - (discount || 0);
      user.gstAmount = Math.round(discountedBase * 0.18 * 100) / 100;
    } else {
      // Fallback calculation if lookup fails
      user.basePriceINR = Math.round((actualTotal / 1.18) * 100) / 100;
      user.gstAmount =
        Math.round((actualTotal - user.basePriceINR) * 100) / 100;
    }

    if (!isUpgrade && !user.remainingTokens) {
      // ✅ New User - Ensure tokens are set based on registration data
      const tokenLimit = getTokenLimit({
        subscriptionPlan: user.subscriptionPlan,
        childPlan: user.childPlan,
      });
      user.remainingTokens = tokenLimit;
      user.tokensConsumed = 0;
    }

    // 🔐 New user → generate password
    if (!isUpgrade && !user.password) {
      const clean = user.firstName.toLowerCase().slice(0, 4);
      const year = new Date(user.dateOfBirth).getFullYear();
      const password = `${clean}@${year}`;
      user.password = await bcrypt.hash(password, 10);

      const sendTo = ["<13", "13-14", "15-17"].includes(user.ageGroup)
        ? user.parentEmail
        : user.email;

      const sendName = ["<13", "13-14", "15-17"].includes(user.ageGroup)
        ? user.parentName
        : user.firstName;

      await sendPasswordMail(sendTo, sendName, password);

      // ⏳ DELAY EMAIL BY 4 MINUTES
      // setTimeout(async () => {
      //   try {
      //     // SEND PASSWORD MAIL
      //     await sendPasswordMail(sendTo, sendName, password);
      //     console.log(`📩 Password email sent after 4 min → ${sendTo}`);
      //   } catch (err) {
      //     console.error("12 hour delayed email error:", err);
      //   }
      //   // }, 120000); // 4 minutes = 240000ms
      // }, 43200000); // 12 hours
    }

    await user.save();
    const amountInWords = numberToWords(Number(user.totalPriceINR || 0));

    const receiptNo = await generateReceiptNo();

    // 📄 Generate receipt
    const receiptData = {
      // receiptNo: `RCP-${Date.now()}`,
      receiptNo: receiptNo,
      date: new Date().toISOString().split("T")[0],
      fullName: `${user.firstName} ${user.lastName}`,
      planName: `${user.subscriptionPlan} - ${user.childPlan}`,
      subscriptionType: user.subscriptionType,
      amount: user.basePriceINR,
      discount: user.discountINR || 0,
      gst: user.gstAmount,
      total: user.totalPriceINR,
      paymentMethod: "Online",
      transactionId: razorpay_payment_id,
      amountInWords: amountInWords,
    };

    // const pdfPath = await generateReceipt(receiptData);
    const pdfBuffer = await generateReceipt(receiptData);

    // 📧 Send receipt mail
    const recipientEmail = ["<13", "13-14", "15-17"].includes(user.ageGroup)
      ? user.parentEmail
      : user.email;

    const recipientName = ["<13", "13-14", "15-17"].includes(user.ageGroup)
      ? user.parentName
      : user.firstName;

    try {
      await sendReceiptMail(recipientEmail, recipientName, pdfBuffer);
      console.log(`Receipt email sent to ${recipientEmail}`);
    } catch (mailError) {
      console.error("Failed to send receipt email:", mailError);
    }

    res.json({
      success: true,
      message: "Payment verified, plan activated & receipt sent",
      expiryDate: user.planExpiryDate,
      transactionId: razorpay_payment_id,
    });
  } catch (err) {
    console.error("verify-payment error:", err);
    res.status(500).json({ error: err.message });
  }
});

// paymentController.js (only the verify-payment handler - replace existing handler with this)
// router.post("/verify-payment", async (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       email,
//     } = req.body;

//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return res.status(400).json({ success: false, error: "invalid payload" });
//     }

//     // verify signature
//     const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
//     shasum.update(razorpay_order_id + "|" + razorpay_payment_id);
//     const generated_signature = shasum.digest("hex");

//     if (generated_signature !== razorpay_signature) {
//       return res
//         .status(400)
//         .json({ success: false, error: "Invalid signature" });
//     }

//     // Payment verified by signature -- fetch payment details from Razorpay for accuracy
//     const payment = await razorpay.payments.fetch(razorpay_payment_id);

//     // Save transaction (best-effort)
//     try {
//       const newTransaction = new Transaction({
//         razorpay_order_id,
//         razorpay_payment_id,
//         amount: payment.amount / 100, // convert paise -> rupees
//         currency: payment.currency,
//         method: payment.method,
//         status: payment.status || "captured",
//         createdAt: new Date(payment.created_at * 1000), // if provided in seconds
//       });
//       await newTransaction.save();
//       console.log("Transaction saved:", newTransaction._id);
//     } catch (dbErr) {
//       console.error("Could not save transaction:", dbErr);
//       // continue — don't block sending receipt if DB saving fails
//     }

//     // Find related user (use provided email OR search by metadata if you store order->user mapping)
//     let recipientEmail = email;
//     let recipientName = "";
//     let user = null;
//     if (email) {
//       user = await User.findOne({ email });
//       // If the user is a minor and you stored parentEmail, consider that in send
//       if (user) {
//         const isMinor = ["<13", "13-14", "15-17"].includes(user.ageGroup);
//         recipientEmail = isMinor ? user.parentEmail || user.email : user.email;
//         recipientName = isMinor
//           ? user.parentName || user.firstName
//           : user.firstName;
//       }
//     }

//     // If user not found but email passed, use that email
//     if (!recipientEmail && email) recipientEmail = email;

//     // Build receipt data for PDF
//     const receiptData = {
//       transactionId: razorpay_payment_id,
//       date: new Date(
//         payment.created_at ? payment.created_at * 1000 : Date.now()
//       ).toLocaleDateString("en-IN"),
//       customerName: user
//         ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
//           recipientName ||
//           "Customer"
//         : recipientName || "Customer",
//       email: recipientEmail || "not-provided",
//       planName: user
//         ? `${user.subscriptionPlan || ""} - ${user.childPlan || ""}`.trim()
//         : "Subscription",
//       amount: (payment.amount / 100).toFixed(2),
//       currency: payment.currency || "INR",
//       paymentMethod: payment.method || "UPI",
//     };

//     // Generate receipt PDF (returns absolute path)
//     const pdfPath = await generateReceipt(receiptData);

//     // send email with PDF attachment
//     if (recipientEmail) {
//       await sendReceiptMail(
//         recipientEmail,
//         recipientName || receiptData.customerName,
//         pdfPath
//       );
//       console.log(`Receipt sent to ${recipientEmail}`);
//     } else {
//       console.warn("No recipient email available — receipt not emailed.");
//     }

//     // Optionally: set user's password and send password mail (if that flow needed)
//     if (user) {
//       try {
//         const cleanName = (user.firstName || "")
//           .replace(/\s+/g, "")
//           .toLowerCase();
//         const passwordPart =
//           cleanName.length >= 4
//             ? cleanName.slice(0, 4)
//             : cleanName.padEnd(4, cleanName[0] || "x");
//         const year = user.dateOfBirth
//           ? new Date(user.dateOfBirth).getFullYear()
//           : new Date().getFullYear();
//         const generatedPassword = `${passwordPart}@${year}`;
//         const hashedPassword = await bcrypt.hash(generatedPassword, 10);
//         user.password = hashedPassword;
//         user.subscriptionStatus = "active";
//         user.isActive = true;
//         await user.save();

//         // send password mail to same recipient (or parent email if minor)
//         await sendPasswordMail(
//           recipientEmail,
//           recipientName || user.firstName,
//           generatedPassword
//         );
//         console.log(`Password email sent to ${recipientEmail}`);
//       } catch (pwErr) {
//         console.error("Error generating/saving password:", pwErr);
//       }
//     }

//     return res.json({
//       success: true,
//       message: "Payment verified and receipt/email processed",
//       transactionId: razorpay_payment_id,
//     });
//   } catch (err) {
//     console.error("verify-payment err:", err);
//     return res.status(500).json({ success: false, error: err.message });
//   }
// });

// 3) Webhook (Razorpay will call this on events)
router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }), // raw needed for signature verification
  (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body)
      .digest("hex");

    if (expectedSignature === signature) {
      const payload = JSON.parse(req.body.toString());
      console.log("Webhook verified. Event:", payload.event);
      // Handle events: payment.captured, payment.failed, order.paid etc.
      // e.g. if (payload.event === "payment.captured") { update DB }
      res.status(200).send("ok");
    } else {
      console.error("Webhook signature mismatch");
      res.status(400).send("invalid signature");
    }
  },
);

export default router;

// // server/paymentRoutes.js
// import express from "express";
// import Razorpay from "razorpay";
// import crypto from "crypto";
// import bodyParser from "body-parser";
// import Transaction from "../model/Transaction.js";
// import User from "../model/User.js";
// import bcrypt from "bcryptjs";
// import sendPasswordMail from "../middleware/sendPasswordMail.js";
// import sendReceiptMail from "../middleware/mailWithAttachment.js";
// import generateReceipt from "../utils/generateReceipt.js";

// const router = express.Router();

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// // Parse JSON bodies for normal routes
// router.use(bodyParser.json());

// // 1) Create Order (frontend calls this to get order.id)
// router.post("/create-order", async (req, res) => {
//   try {
//     const { amount, currency = "INR", receiptId } = req.body;

//     if (!amount) return res.status(400).json({ error: "amount is required" });

//     const options = {
//       amount: Math.round(amount * 100), // amount in paise
//       currency,
//       receipt: receiptId || `rcpt_${Date.now()}`,
//       payment_capture: 1, // auto-capture
//     };

//     const order = await razorpay.orders.create(options);
//     // return order object to frontend
//     res.json({ success: true, order });
//   } catch (err) {
//     console.error("create-order err:", err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// // 2) Verify Payment (frontend posts payload returned by Razorpay handler)
// router.post("/verify-payment", async (req, res) => {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email } =
//       req.body;

//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return res.status(400).json({ success: false, error: "invalid payload" });
//     }

//     const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
//     shasum.update(razorpay_order_id + "|" + razorpay_payment_id);
//     const generated_signature = shasum.digest("hex");

//     if (generated_signature === razorpay_signature) {
//       // payment verified
//       // TODO: update order status in your DB here

//       // Save transaction to DB
//       try {
//         // Fetch payment details to get amount
//         const payment = await razorpay.payments.fetch(razorpay_payment_id);

//         const newTransaction = new Transaction({
//           razorpay_order_id,
//           razorpay_payment_id,
//           amount: payment.amount / 100, // amount in paise
//           currency: payment.currency,
//           status: "success"
//         });

//         await newTransaction.save();
//         console.log("Transaction saved:", newTransaction);

//       } catch (dbError) {
//         console.error("Error saving transaction:", dbError);
//         // Continue as payment is verified
//       }

//       // Update user password and send email
//       if (email) {
//         try {
//           const user = await User.findOne({ email });
//           if (user) {
//             // -------- Generate Password --------
//             const cleanName = user.firstName.replace(/\s+/g, "").toLowerCase();
//             const passwordPart =
//               cleanName.length >= 4
//                 ? cleanName.slice(0, 4)
//                 : cleanName.padEnd(4, cleanName[0]);
//             const year = new Date(user.dateOfBirth).getFullYear();
//             const generatedPassword = `${passwordPart}@${year}`;

//             const hashedPassword = await bcrypt.hash(generatedPassword, 10);

//             user.password = hashedPassword;
//             await user.save();

//             // ---- Send Email ----
//             const recipientEmail = ["<13", "13-14", "15-17"].includes(user.ageGroup) ? user.parentEmail : email;
//             const recipientName = ["<13", "13-14", "15-17"].includes(user.ageGroup) ? user.parentName : user.firstName;
//             await sendPasswordMail(recipientEmail, recipientName, generatedPassword);
//             console.log(`Password generated and email sent to ${recipientEmail}`);
//             // ---- Send Receipt Email ----
//             // ---- Send Receipt Email ----
//             // const pdfPath = "C:/Users/AAC/OneDrive/Desktop/Meeral/chatbot_carbon/RECEIPT-1 (1).pdf";

//             const receiptData = {
//               transactionId: razorpay_payment_id,
//               date: new Date().toLocaleDateString(),
//               customerName: `${user.firstName} ${user.lastName}`,
//               email: recipientEmail,
//               planName: `${user.subscriptionPlan} - ${user.childPlan}`,
//               amount: user.totalPriceINR || "N/A", // Ensure this field exists or fetch from payment details
//               currency: "INR"
//             };

//             const dynamicPdfPath = await generateReceipt(receiptData);
//             await sendReceiptMail(recipientEmail, recipientName, dynamicPdfPath);
//             console.log(`Receipt email sent to ${recipientEmail}`);
//           }
//         } catch (userError) {
//           console.error("Error updating user password:", userError);
//         }
//       }

//       return res.json({
//         success: true,
//         message: "Payment verified",
//         transactionId: razorpay_payment_id
//       });
//     } else {
//       return res
//         .status(400)
//         .json({ success: false, error: "Invalid signature" });
//     }
//   } catch (err) {
//     console.error("verify-payment err:", err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// });

// // 3) Webhook (Razorpay will call this on events)
// router.post(
//   "/webhook",
//   bodyParser.raw({ type: "application/json" }), // raw needed for signature verification
//   (req, res) => {
//     const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
//     const signature = req.headers["x-razorpay-signature"];

//     const expectedSignature = crypto
//       .createHmac("sha256", secret)
//       .update(req.body)
//       .digest("hex");

//     if (expectedSignature === signature) {
//       const payload = JSON.parse(req.body.toString());
//       console.log("Webhook verified. Event:", payload.event);
//       // Handle events: payment.captured, payment.failed, order.paid etc.
//       // e.g. if (payload.event === "payment.captured") { update DB }
//       res.status(200).send("ok");
//     } else {
//       console.error("Webhook signature mismatch");
//       res.status(400).send("invalid signature");
//     }
//   }
// );

// export default router;
