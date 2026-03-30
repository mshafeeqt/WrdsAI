// import nodemailer from "nodemailer";
// import path from "path";
// import ejs from "ejs";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Reuse same transporter configuration as sendPasswordMail
// const transporter = nodemailer.createTransport({
//   host: "sandbox.smtp.mailtrap.io",
//   port: 2525,
//   auth: {
//     user: "39703f65d41de4",
//     pass: "4a129ece9c1d41",
//   },
// });

// /**
//  * Sends an email with a receipt PDF attachment.
//  * @param {string} email Recipient email address
//  * @param {string} firstName Recipient first name (for template)
//  * @param {string} pdfPath Absolute path to the PDF file to attach
//  */
// const sendReceiptMail = async (email, firstName, pdfPath) => {
//   try {
//     const templatePath = path.join(
//       __dirname,
//       "email-templates",
//       "send_password.ejs"
//     ); // reuse same template for consistency
//     const htmlData = await ejs.renderFile(templatePath, {
//       firstName,
//       email,
//       password: "",
//       loginUrl: "http://localhost:5173/login",
//       logoUrl: "http://localhost:5173/assets/Msg_logo.png",
//     });

//     const mailOptions = {
//       from: '"Kush Software" <no-reply@kushsoftware.com>',
//       to: email,
//       subject: "Your Payment Receipt",
//       html: htmlData,
//       attachments: [
//         {
//           filename: path.basename(pdfPath),
//           path: pdfPath,
//         },
//       ],
//     };

//     await transporter.sendMail(mailOptions);
//     console.log("📩 Receipt email sent successfully!");
//   } catch (error) {
//     console.error("Receipt email sending error:", error);
//   }
// };

// export default sendReceiptMail;

import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ SAME SMTP AS sendMail.js
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Sends an email with a receipt PDF attachment.
 * @param {string} email Recipient email address
 * @param {string} firstName Recipient first name (for template)
 * @param {Buffer} pdfBuffer Generated PDF buffer
//  * @param {string} pdfPath Absolute path to the PDF file to attach
 */
const sendReceiptMail = async (email, firstName, pdfBuffer) => {
  try {
    // Simple HTML email for receipt
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Receipt</h1>
          </div>
          <div class="content">
            <p>Dear ${firstName},</p>
            <p>Thank you for your payment! Your transaction has been completed successfully.</p>
            <p>Please find your payment receipt attached to this email.</p>
            <p>If you have any questions, feel free to contact our support team.</p>
            <p>Best regards,<br><strong>WrdsAI Team</strong></p>
          </div>
         
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"WrdsAI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Payment Receipt - WrdsAI Subscription",
      html: htmlContent,
      // attachments: [
      //   {
      //     filename: path.basename(pdfPath),
      //     path: pdfPath,
      //   },
      // ],
      attachments: [
        {
          filename: "WrdsAI_Receipt.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };
    console.log("path:::", path);
    console.log("pdfPath:::", pdfBuffer);

    await transporter.sendMail(mailOptions);
    console.log("📩 Receipt email sent successfully!");
  } catch (error) {
    console.error("Receipt email sending error:", error);
  }
};

export default sendReceiptMail;
