import mongoose from "mongoose";

const searchHistorySchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    query: { type: String, required: true },
    category: { type: String, default: "general" },
    resultsCount: { type: Number, default: 0 }, // optional, to store how many results returned
    raw: { type: Boolean, default: false },
     summaryWordCount: { type: Number, default: 0 }, // ✅ optional, if you want to store word count
    summaryTokenCount: { type: Number, default: 0 }, // ✅ NEW field added
    summary: { type: String }, // ✅ optional: store summary text
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("SearchHistory", searchHistorySchema);
