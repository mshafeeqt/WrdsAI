import ejs from "ejs";
import path from "path";
import nodemailer from "nodemailer";

const sendResetPasswordMail = async (email, name, resetLink) => {
  try {
    const templatePath = path.join(
      process.cwd(),
      "middleware/email_templates/reset_password.ejs"
    );

    const html = await ejs.renderFile(templatePath, {
      name,
      resetLink,
    });

    // const transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASS,
    //   },
    // });
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

    await transporter.sendMail({
      from: `"WrdsAI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Your Password",
      html,
    });

    console.log("✅ Reset password email sent to:::::::::::::", email);
  } catch (error) {
    console.error("❌ Reset password mail error:", error);
    throw error;
  }
};

export default sendResetPasswordMail;

// import nodemailer from "nodemailer";
// import path from "path";
// import ejs from "ejs";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // ✅ SAME Gmail SMTP method (COMMON & CORRECT)
// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS, // Gmail App Password
//   },
// });

// const sendResetPasswordMail = async (email, firstName, resetLink) => {
//   try {
//     const templatePath = path.join(
//       __dirname,
//       "email_templates",
//       "reset_password.ejs"
//     );

//     const htmlData = await ejs.renderFile(templatePath, {
//       name: firstName,
//       resetLink,
//     });

//     const mailOptions = {
//       from: `"WrdsAI" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: "Reset Your Password - WrdsAI",
//       html: htmlData,
//     };

//     const info = await transporter.sendMail(mailOptions);
//     console.log("📩 Reset Password Email sent:", info.messageId);
//   } catch (error) {
//     console.error("❌ Reset password mail error:", error);
//     throw error;
//   }
// };

// export default sendResetPasswordMail;
