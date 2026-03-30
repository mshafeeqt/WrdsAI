import mongoose from "mongoose";

const GroksearchHistorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    email: { type: String, required: true },
    query: { type: String, required: true },
    summary: String,
    tokenUsage: {
    promptTokens: Number,
    summaryTokens: Number,
    linkTokens: Number,
    totalTokens: Number
  },
    category: { type: String, default: "general" },
    resultsCount: { type: Number, default: 0 }, // optional, to store how many results returned
    raw: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("GrokSearchHistory", GroksearchHistorySchema);
