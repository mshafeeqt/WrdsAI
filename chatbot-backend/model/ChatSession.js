// import mongoose from "mongoose";

// const messageSchema = new mongoose.Schema(
//   {
//     prompt: String,
//     response: String,
//     wordCount: Number,
//     tokensUsed: Number,
//     totalTokensUsed: Number,
//     botName: String,
//     create_time: { type: Date, default: Date.now }
//   },
//   { _id: false }
// );

// const chatSessionSchema = new mongoose.Schema(
//   {
//     sessionId: { type: String, required: true },
//     email: { type: String, required: true }, // link with user
//     history: [messageSchema],
//     create_time: { type: Date, default: Date.now }
//   },
//   { timestamps: true }
// );

// export default mongoose.model("ChatSession", chatSessionSchema);

import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    filename: String,
    cloudinaryUrl: String, // Store Cloudinary URL
    publicId: String, // Store Cloudinary public ID for deletion if needed
    content: String, // Extracted content
    wordCount: Number,
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    prompt: String,
    response: String,
    //  partialResponse: String,
    wordCount: Number,
    tokensUsed: Number,
    totalTokensUsed: Number,
    botName: String,
    create_time: { type: Date, default: Date.now },
    // File attachment fields
    files: [fileSchema],
    hasFiles: Boolean,
    fileWordCount: Number,
    type: { type: String }, // ✅ Add type field
  },
  { _id: false }
);

const chatSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true },
    email: { type: String, required: true }, // link with user
    history: [messageSchema],
    grandTotalTokens: { type: Number, default: 0 }, // ✅ Add this line
    create_time: { type: Date, default: Date.now },
    type: { type: String, default: "chat" }, // ✅ Add type field
  },
  { timestamps: true }
);

export default mongoose.model("ChatSession", chatSessionSchema);
