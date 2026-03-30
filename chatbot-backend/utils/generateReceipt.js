// generateReceipt.js (enhancement - keeps same export)
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const numberToWords = (num) => {
  // very small util for rupees (or use a library). keep simple for small amounts.
  // For full production use, use 'number-to-words' or 'num-words' package.
  return `${num} Rupees`; // placeholder — implement if needed
};

const generateReceipt = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const receiptsDir = path.join(__dirname, "../receipts");
      if (!fs.existsSync(receiptsDir))
        fs.mkdirSync(receiptsDir, { recursive: true });

      const fileName = `receipt_${data.transactionId || Date.now()}.pdf`;
      const filePath = path.join(receiptsDir, fileName);
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(20).text("Payment Receipt", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text("Kush Software", { align: "center" });
      doc.text("123 Tech Park, Innovation City", { align: "center" });
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      doc.fontSize(10).text(`Date: ${data.date}`, { align: "right" });
      doc.text(`Transaction ID: ${data.transactionId}`, { align: "left" });
      doc.moveDown();

      doc.text(`Customer Name: ${data.customerName}`);
      doc.text(`Email: ${data.email}`);
      doc.moveDown();

      const tableTop = doc.y;
      doc.font("Helvetica-Bold");
      doc.text("Description", 50, tableTop);
      doc.text("Amount", 400, tableTop, { align: "right" });
      doc.font("Helvetica");

      const rowTop = tableTop + 20;
      doc.text(
        `${data.planName} (${data.paymentMethod || "Payment"})`,
        50,
        rowTop
      );
      doc.text(`${data.currency} ${data.amount}`, 400, rowTop, {
        align: "right",
      });

      const totalTop = rowTop + 30;
      doc
        .moveTo(50, totalTop - 10)
        .lineTo(550, totalTop - 10)
        .stroke();
      doc.font("Helvetica-Bold");
      doc.text("Total Paid:", 250, totalTop, { align: "right" });
      doc.text(`${data.currency} ${data.amount}`, 400, totalTop, {
        align: "right",
      });

      doc
        .fontSize(10)
        .text(`In Words: ${numberToWords(data.amount)}`, 50, totalTop + 40);

      doc.fontSize(10).text("Thank you for your business!", 50, 700, {
        align: "center",
        width: 500,
      });

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};

export default generateReceipt;



