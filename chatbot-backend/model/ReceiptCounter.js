import mongoose from "mongoose";

const receiptCounterSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    unique: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model("ReceiptCounter", receiptCounterSchema);
