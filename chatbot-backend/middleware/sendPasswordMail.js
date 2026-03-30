// import nodemailer from "nodemailer";
// import path from "path";
// import ejs from "ejs";
// import { fileURLToPath } from "url";

// // const transporter = nodemailer.createTransport({
// //   host: "sandbox.smtp.mailtrap.io",
// //   port: 2525,
// //   auth: {
// //     user: "0885458121f6ea",
// //     pass: "726c1be7850752",
// //   },
// // });

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Looking to send emails in production? Check out our Email API/SMTP product!
// // const transporter = nodemailer.createTransport({
// //   host: "sandbox.smtp.mailtrap.io",
// //   port: 2525,
// //   auth: {
// //     user: "39703f65d41de4",
// //     pass: "4a129ece9c1d41",
// //   },
// // });

// // Looking to send emails in production? Check out our Email API/SMTP product!
// var transporter = nodemailer.createTransport({
//   host: "sandbox.smtp.mailtrap.io",
//   port: 2525,
//   auth: {
//     user: "f16095e93d6eed",
//     pass: "11d9f9e9e8da27",
//   },
// });

// const sendPasswordMail = async (email, firstName, password) => {
//   try {
//     const templatePath = path.join(
//       __dirname,
//       "email-templates",
//       "send_password.ejs"
//     );

//     const htmlData = await ejs.renderFile(templatePath, {
//       firstName,
//       email,
//       password,
//       loginUrl: "http://localhost:5173/login",
//       logoUrl: "http://localhost:5173/assets/Msg_logo.png",
//     });

//     const mailOptions = {
//       from: '"Kush Software" <no-reply@kushsoftware.com>',
//       to: email,
//       subject: "Your Login Credentials",
//       html: htmlData,
//     };

//     console.log("📩 Email sent successfully!");
//     await transporter.sendMail(mailOptions);
//   } catch (error) {
//     console.log("Email sending error:", error);
//   }
// };

// // module.exports = sendPasswordMail;
// export default sendPasswordMail;

import nodemailer from "nodemailer";
import path from "path";
import ejs from "ejs";
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

const sendPasswordMail = async (email, firstName, password) => {
  try {
    const templatePath = path.join(
      __dirname,
      "email_templates",
      "send_password.ejs"
    );

    const htmlData = await ejs.renderFile(templatePath, {
      firstName,
      email,
      password,
      // loginUrl: "http://localhost:5173/login",
      // loginUrl: "https://carbon-chatbot-kappa.vercel.app/login",
      loginUrl: `${process.env.FRONTEND_URL}/login`,
      logoUrl: "https://backend.wrdsai.com/assets/wrdsai.png",
      // loginUrl: "${process.env.FRONTEND_URL}/assets/wrdsai.png",
    });

    const mailOptions = {
      from: `"WrdsAI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Login Credentials - WrdsAI",
      html: htmlData,
    };

    // console.log("📩 Email sent successfully!");
    // await transporter.sendMail(mailOptions);
    // console.log("📩 Password Email sent successfully!");

    const info = await transporter.sendMail(mailOptions);

    console.log("📩 Password Email sent successfully:", info.messageId);
  } catch (error) {
    console.log("Email sending error:", error);
  }
};

// module.exports = sendPasswordMail;
export default sendPasswordMail;
