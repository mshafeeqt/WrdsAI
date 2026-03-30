// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema(
//   {
//     username: { type: String, required: true, unique: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     remainingTokens: { type: Number, default: 50000 },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("User", userSchema);

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: false, unique: true },
    mobile: { type: String, required: false },
    // country: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    ageGroup: { type: String, required: true },

    parentName: { type: String, required: false },
    parentEmail: { type: String, required: false },
    parentMobile: { type: String, required: false },

    subscriptionPlan: { type: String, required: true },
    childPlan: { type: String, required: false },
    subscriptionType: { type: String, required: true },
    basePriceINR: { type: Number, required: false },
    discountINR: { type: Number, required: false },
    gstAmount: { type: Number, required: false },
    totalPriceINR: { type: Number, required: false },
    password: { type: String, required: false },
    remainingTokens: { type: Number },

    // ✅ Plan Validity Tracking
    planStartDate: { type: Date },
    planExpiryDate: { type: Date },
    planExpiryEmailSent: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
