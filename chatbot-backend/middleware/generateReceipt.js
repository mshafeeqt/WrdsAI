// import PDFDocument from "pdfkit";
// import path from "path";
// import fs from "fs";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// /**
//  * Generates a PDF receipt matching the specific design requirements.
//  * @param {Object} data - Receipt data
//  * @returns {Promise<Buffer>}
//  */
// export const generateReceipt = (data) => {
//   return new Promise((resolve, reject) => {
//     try {
//       const doc = new PDFDocument({ size: "A4", margin: 50 });
//       const buffers = [];

//       doc.on("data", (chunk) => buffers.push(chunk));
//       doc.on("end", () => resolve(Buffer.concat(buffers)));
//       doc.on("error", (err) => reject(err));

//       // --- 1. Logo ---
//       // Adjusted path to reach frontend assets from backend folder
//       const logoPath = path.join(__dirname, "../assets/words1.png");
//       if (fs.existsSync(logoPath)) {
//         doc.image(logoPath, 50, 40, { width: 100 });
//       }

//       // --- 2. Header ---
//       doc.moveDown(4);
//       doc
//         .font("Helvetica-Bold")
//         .fontSize(16)
//         .text("PAYMENT RECEIPT", { align: "center" });
//       doc.moveDown();

//       // --- 3. Upper Info Block ---
//       doc
//         .strokeColor("#000000")
//         .lineWidth(1)
//         .moveTo(50, doc.y)
//         .lineTo(550, doc.y)
//         .stroke();

//       doc.moveDown(1);

//       const startX = 50;
//       let currentY = doc.y;
//       const lineHeight = 15;

//       doc.font("Helvetica-Bold").fontSize(10).text("Receipt No:", startX, currentY);
//       doc.font("Helvetica").text(data.receiptNo, startX + 70, currentY);

//       currentY += lineHeight;
//       doc.font("Helvetica-Bold").text("Date:", startX, currentY);
//       doc.font("Helvetica").text(data.date, startX + 70, currentY);

//       currentY += lineHeight;
//       doc.font("Helvetica-Bold").text("GST No.:", startX, currentY);
//       doc.font("Helvetica").text("27ABNCS5951R1Z8", startX + 70, currentY);

//       currentY += lineHeight;
//       doc.font("Helvetica-Bold").text("Received From :", startX, currentY);
//       doc.font("Helvetica").text((data.fullName || "").toUpperCase(), startX + 90, currentY);

//       doc.moveDown(2);

//       // --- 4. Payment Details Section ---
//       doc.font("Helvetica-Bold").fontSize(11).text("Payment Details", 50);
//       doc.moveDown(0.5);

//       // --- Table Functions ---
//       const tableTop = doc.y;
//       const col1X = 50;
//       const col2X = 300; // split point
//       const tableWidth = 500;
//       const rowHeight = 25;

//       const drawRow = (y, label, value, isBold = false) => {
//         // Border rect
//         doc.rect(col1X, y, tableWidth, rowHeight).stroke();
//         // Vertical divider
//         doc.moveTo(col2X, y).lineTo(col2X, y + rowHeight).stroke();

//         // Text
//         doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(10);

//         // Vertically center text
//         const textY = y + 8;

//         doc.text(label, col1X + 10, textY);
//         doc.text(value, col2X + 10, textY);
//       };

//       // Table Header
//       doc.save();
//       doc.fillColor("#f0f0f0");
//       doc.rect(col1X, tableTop, tableWidth, rowHeight).fillAndStroke("#f0f0f0", "#000000");
//       doc.fillColor("#000000");
//       doc.moveTo(col2X, tableTop).lineTo(col2X, tableTop + rowHeight).stroke();
//       doc.font("Helvetica-Bold").fontSize(10);
//       doc.text("Field", col1X + 10, tableTop + 8);
//       doc.text("Details", col2X + 10, tableTop + 8);
//       doc.restore();

//       let currentRowY = tableTop + rowHeight;

//       // Rows
//       drawRow(currentRowY, "Subscription Plan", data.planName);
//       currentRowY += rowHeight;

//       drawRow(currentRowY, "Subscription Type", data.subscriptionType);
//       currentRowY += rowHeight;

//       drawRow(currentRowY, "Amount", `₹ ${Number(data.amount).toFixed(2)}`, true);
//       currentRowY += rowHeight;

//       drawRow(currentRowY, "GST (18%)", `₹ ${Number(data.gst).toFixed(2)}`, true);
//       currentRowY += rowHeight;

//       drawRow(currentRowY, "Total Received", `₹ ${Number(data.total).toFixed(2)}`, true);
//       currentRowY += rowHeight;

//       doc.moveDown(1);

//       // Amount in Words
//       const wordsY = currentRowY + 10;
//       doc.font("Helvetica-Bold").text("Amount in Words :", 50, wordsY);
//       doc.font("Helvetica").text(`${data.amountInWords} INR`, 140, wordsY);

//       // --- 5. Transaction Info ---
//       const txY = wordsY + 30;
//       doc.font("Helvetica-Bold").fontSize(11).text("Transaction Info", 50, txY);

//       doc
//         .strokeColor("#000000")
//         .lineWidth(1)
//         .moveTo(50, txY + 15)
//         .lineTo(550, txY + 15)
//         .stroke();

//       const txContentY = txY + 25;
//       doc.font("Helvetica-Bold").fontSize(10).text("Payment Method:", 50, txContentY);
//       doc.font("Helvetica").text(data.paymentMethod || "Online", 140, txContentY);

//       doc.font("Helvetica-Bold").text("Transaction ID:", 50, txContentY + 15);
//       doc.font("Helvetica").text(data.transactionId, 140, txContentY + 15);

//       // --- 6. Acknowledgement ---
//       const ackY = txContentY + 45;
//       doc.font("Helvetica-Bold").fontSize(11).text("Acknowledgement", 50, ackY);

//       doc
//         .strokeColor("#000000")
//         .lineWidth(1)
//         .moveTo(50, ackY + 15)
//         .lineTo(550, ackY + 15)
//         .stroke();

//       doc.font("Helvetica").fontSize(9).text(
//         "We hereby confirm receipt of the above payment towards WrdsAI access. Access will remain active for the duration of the purchased term from the date of the receipt.",
//         50,
//         ackY + 25,
//         { width: 500 }
//       );

//       doc.font("Helvetica-Bold").text("Note:", 50, ackY + 60, { continued: true });
//       doc.font("Helvetica").text(" Payment once made is not refundable.");

//       doc.text("For any queries, please contact – ", 50, ackY + 85, { continued: true });
//       doc.fillColor("blue").text("support@wrdsai.com", { link: "mailto:support@wrdsai.com", underline: true });
//       doc.fillColor("black");

//       doc.end();
//     } catch (err) {
//       reject(err);
//     }
//   });
// };

import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

/**
 * Generates a PDF receipt matching the specific design requirements.
 * @param {Object} data - Receipt data
 * @returns {Promise<Buffer>}
 */
export const generateReceipt = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // 0. FONT (₹ SUPPORT – HOSTINGER SAFE)
      // ================================
      const fontPath = path.join(
        process.cwd(),
        "assets",
        "NotoSans-Regular.ttf"
      );
      if (fs.existsSync(fontPath)) {
        doc.registerFont("NotoSans", fontPath);
        doc.font("NotoSans");
      }

      // ================================
      // 1. LOGO (HOSTINGER SAFE PATH)
      // ================================
      const logoPath = path.join(
        process.cwd(), // /home/uXXXX/domains/yourdomain/public_html
        "assets",
        "wrdsai.png"
      );

      console.log("LOGO PATH:", logoPath);
      console.log("LOGO EXISTS:", fs.existsSync(logoPath));

      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 40, { width: 100 });
      }

      // 2. HEADER LINE (ABOVE TITLE)
      // ================================
      doc.moveDown(3);

      const lineY = doc.y;
      doc
        .strokeColor("#000000")
        .lineWidth(1)
        .moveTo(50, lineY)
        .lineTo(550, lineY)
        .stroke();

      // ================================
      // 2. HEADER
      // ================================
      doc.moveDown(1);
      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .text("PAYMENT RECEIPT", { align: "center" });
      doc.moveDown(1);

      // ================================
      // 3. UPPER INFO BLOCK
      // ================================
      // doc
      //   .strokeColor("#000000")
      //   .lineWidth(1)
      //   .moveTo(50, doc.y)
      //   .lineTo(550, doc.y)
      //   .stroke();

      // doc.moveDown(1);

      const startX = 50;
      let currentY = doc.y;
      const lineHeight = 15;

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Receipt No:", startX, currentY);
      doc.font("Helvetica").text(data.receiptNo, startX + 70, currentY);

      currentY += lineHeight;
      doc.font("Helvetica-Bold").text("Date:", startX, currentY);
      doc.font("Helvetica").text(data.date, startX + 70, currentY);

      currentY += lineHeight;
      doc.font("Helvetica-Bold").text("GST No.:", startX, currentY);
      doc.font("Helvetica").text("27ABNCS5951R1Z8", startX + 70, currentY);

      currentY += lineHeight;
      doc.font("Helvetica-Bold").text("Received From :", startX, currentY);
      doc
        .font("Helvetica")
        .text((data.fullName || "").toUpperCase(), startX + 90, currentY);

      doc.moveDown(2);

      // ================================
      // 4. PAYMENT DETAILS TABLE
      // ================================
      doc.font("Helvetica-Bold").fontSize(11).text("Payment Details", 50);
      doc.moveDown(0.5);

      const tableTop = doc.y;
      const col1X = 50;
      const col2X = 300;
      const tableWidth = 500;
      const rowHeight = 25;

      const drawRow = (y, label, value, isBold = false) => {
        doc.rect(col1X, y, tableWidth, rowHeight).stroke();
        doc
          .moveTo(col2X, y)
          .lineTo(col2X, y + rowHeight)
          .stroke();

        doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(10);
        const textY = y + 8;
        doc.text(label, col1X + 10, textY);
        doc.text(value, col2X + 10, textY);
      };

      // Table Header (NO fillAndStroke bug)
      doc.rect(col1X, tableTop, tableWidth, rowHeight).stroke();
      doc
        .moveTo(col2X, tableTop)
        .lineTo(col2X, tableTop + rowHeight)
        .stroke();
      doc.font("Helvetica-Bold").fontSize(10);
      doc.text("Field", col1X + 10, tableTop + 8);
      doc.text("Details", col2X + 10, tableTop + 8);

      let currentRowY = tableTop + rowHeight;

      drawRow(currentRowY, "Subscription Plan", data.planName);
      currentRowY += rowHeight;

      drawRow(currentRowY, "Subscription Type", data.subscriptionType);
      currentRowY += rowHeight;

      drawRow(
        currentRowY,
        "Amount",
        `${Number(data.amount).toFixed(2)}`,
        true
      );
      currentRowY += rowHeight;

      drawRow(
        currentRowY,
        "Discount",
        `${Number(data.discount || 0).toFixed(2)}`,
        true
      );
      currentRowY += rowHeight;

      drawRow(
        currentRowY,
        "GST (18%)",
        `${Number(data.gst).toFixed(2)}`,
        true
      );
      currentRowY += rowHeight;

      drawRow(
        currentRowY,
        "Total Received",
        `${Number(data.total).toFixed(2)}`,
        true
      );

      // ================================
      // 5. AMOUNT IN WORDS
      // ================================
      const wordsY = currentRowY + 35;
      doc.font("Helvetica-Bold").text("Amount in Words :", 50, wordsY);
      doc.font("Helvetica").text(`${data.amountInWords} INR`, 150, wordsY);

      // ================================
      // 6. TRANSACTION INFO
      // ================================
      const txY = wordsY + 30;
      doc.font("Helvetica-Bold").fontSize(11).text("Transaction Info", 50, txY);

      doc
        .moveTo(50, txY + 15)
        .lineTo(550, txY + 15)
        .stroke();

      const txContentY = txY + 25;
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Payment Method:", 50, txContentY);
      doc
        .font("Helvetica")
        .text(data.paymentMethod || "Online", 150, txContentY);

      doc.font("Helvetica-Bold").text("Transaction ID:", 50, txContentY + 15);
      doc.font("Helvetica").text(data.transactionId, 150, txContentY + 15);

      // ================================
      // 7. ACKNOWLEDGEMENT
      // ================================
      const ackY = txContentY + 45;
      doc.font("Helvetica-Bold").fontSize(11).text("Acknowledgement", 50, ackY);
      doc
        .moveTo(50, ackY + 15)
        .lineTo(550, ackY + 15)
        .stroke();

      doc
        .font("Helvetica")
        .fontSize(9)
        .text(
          "We hereby confirm receipt of the above payment towards WrdsAI access. Access will remain active for the duration of the purchased term from the date of the receipt.",
          50,
          ackY + 25,
          { width: 500 }
        );

      doc
        .font("Helvetica-Bold")
        .text("Note:", 50, ackY + 60, { continued: true });
      doc.font("Helvetica").text(" Payment once made is not refundable.");

      doc.text("For any queries, please contact – ", 50, ackY + 85, {
        continued: true,
      });
      doc.fillColor("blue").text("support@wrdsai.com", {
        link: "mailto:support@wrdsai.com",
        underline: true,
      });
      doc.fillColor("black");

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
