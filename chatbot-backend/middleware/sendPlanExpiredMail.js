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

const sendPlanExpiredMail = async (email, firstName, userData) => {
  try {
    const templatePath = path.join(
      __dirname,
      "email_templates",
      "plan_expired.ejs"
    );

    console.log("dateOfBirth:::::", userData.dateOfBirth);
    console.log("ageGroup:::::", userData.ageGroup);

    // const upgradeUrl = `${process.env.FRONTEND_URL}/register?isUpgrade=true&firstName=${encodeURIComponent(userData.firstName)}&lastName=${encodeURIComponent(userData.lastName)}&email=${encodeURIComponent(userData.email)}&mobile=${encodeURIComponent(userData.mobile || "")}&dateOfBirth=${encodeURIComponent(userData.dateOfBirth || "")}&ageGroup=${encodeURIComponent(userData.ageGroup)}&parentName=${encodeURIComponent(userData.parentName || "")}&parentEmail=${encodeURIComponent(userData.parentEmail || "")}&parentMobile=${encodeURIComponent(userData.parentMobile || "")}`;

    const upgradeUrl = `${
      process.env.FRONTEND_URL
    }/register?isUpgrade=true&firstName=${encodeURIComponent(
      userData.firstName
    )}&lastName=${encodeURIComponent(
      userData.lastName
    )}&email=${encodeURIComponent(userData.email)}&mobile=${encodeURIComponent(
      userData.mobile || ""
    )}&dateOfBirth=${encodeURIComponent(
      userData.dateOfBirth || ""
    )}&ageGroup=${encodeURIComponent(
      userData.ageGroup
    )}&parentName=${encodeURIComponent(
      userData.parentName || ""
    )}&parentEmail=${encodeURIComponent(
      userData.parentEmail || ""
    )}&parentMobile=${encodeURIComponent(userData.parentMobile || "")}`;

    const htmlData = await ejs.renderFile(templatePath, {
      firstName,
      // upgradeUrl: "https://carbon-chatbot-kappa.vercel.app/register", // Redirect to register page
      // upgradeUrl: "http://localhost:5173/register", // Redirect to register page
      upgradeUrl,
    });

    const mailOptions = {
      from: `"WrdsAI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your WrdsAI Plan Has Expired - Renew Now",
      html: htmlData,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📩 Plan Expired Email sent successfully:", info.messageId);
  } catch (error) {
    console.log("Email sending error:", error);
  }
};

export default sendPlanExpiredMail;
