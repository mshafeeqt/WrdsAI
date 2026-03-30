// import ReceiptCounter from "../models/ReceiptCounter.js";
import ReceiptCounter from "../model/ReceiptCounter.js";

export const generateReceiptNo = async () => {
  const currentYear = new Date().getFullYear();

  const counter = await ReceiptCounter.findOneAndUpdate(
    { year: currentYear },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const serial = String(counter.seq).padStart(3, "0");

  return `RCP-${currentYear}-${serial}`;
};
