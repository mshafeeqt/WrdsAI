import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import aiRoutes from "./routes/aiRoutes.js";
import { connectPG } from "./postgres/connect.js";
import bodyParser from "body-parser";
import { getAISearchResults } from "./controller/searchController.js"; // Import the search controller
import {
  getUserSearchHistory,
  getUserTokenStats,
} from "./controller/searchController.js";
import { grokSearchResults } from "./controller/groksearchController.js";
import { grokUserSearchHistory } from "./controller/groksearchController.js";
// import { createUPIPayment } from "./controller/paymentController.js";
import paymentRoutes from "./controller/paymentController.js";
import nodemailer from "nodemailer";
// import { runAuto } from "./scripts/auto.js";

// Load environment variables first
dotenv.config();
// runAuto();

console.log("API Key exists:", !!process.env.OPENAI_API_KEY); // Debug check

// Debug log to verify env loading
console.log(
  "OpenRouter Key:",
  process.env.OPENAI_API_KEY ? "Loaded" : "Missing"
);

const app = express();

//  CORS middleware add karo
// app.use(
//   cors({
//     origin: "http://localhost:5173", // tamaru React frontend URL
//     methods: ["GET", "POST"],
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
app.use(express.json());
// Middleware to parse JSON requests
app.use(bodyParser.json());

// app.use((req, res, next) => {
//   const year = 2026;
//   const month = 1;
//   const date = 21;
//   const time = "155900";

//   const shutdownDateString = `${year}${String(month).padStart(2, "0")}${String(
//     date
//   ).padStart(2, "0")}${time}`;

//   const downDate = new Date(
//     year,
//     month - 1,
//     date,
//     parseInt(time.substring(0, 2)),
//     parseInt(time.substring(2, 4)),
//     parseInt(time.substring(4, 6))
//   );

//   const currentDate = new Date();

//   const currentYear = currentDate.getFullYear();
//   const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
//   const currentDay = String(currentDate.getDate()).padStart(2, "0");
//   const currentHours = String(currentDate.getHours()).padStart(2, "0");
//   const currentMinutes = String(currentDate.getMinutes()).padStart(2, "0");
//   const currentSeconds = String(currentDate.getSeconds()).padStart(2, "0");
//   const currentDateString = `${currentYear}${currentMonth}${currentDay}${currentHours}${currentMinutes}${currentSeconds}`;

//   if (currentDate >= downDate) {
//     return res.status(503).json({
//       success: false,
//       error: "Service Unavailable",
//       message: "No operations are allowed.",
//       shutdownDate: shutdownDateString,
//       currentDate: currentDateString,
//     });
//   }

//   next();
// });

app.use("/api/ai", aiRoutes);
app.use("/api/payments", paymentRoutes); // ✅ New AI Search Routes
// app.use("/api", searchRoutes);

app.use((req, res, next) => {
  res.locals.env = process.env;
  next();
});

app.post("/search", getAISearchResults);
app.post("/Searchhistory", getUserSearchHistory); // changed to POST
app.post("/userTokenStats", getUserTokenStats); // combined chat+search token stats for profile

app.post("/grokSearch", grokSearchResults); // changed to POST
app.post("/grokSearchhistory", grokUserSearchHistory); // changed to POST

// app.use(express.static("public"));
app.use("/assets", express.static("assets"));

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com", // Set in .env file
    pass: process.env.EMAIL_PASS || "your-app-password", // Gmail App Password
  },
});

app.get("/test-mail", async (req, res) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "your-test-email@gmail.com",
      subject: "SMTP Test",
      text: "If you receive this, Gmail SMTP works!",
    });
    res.send("Mail sent!");
  } catch (err) {
    console.log("SMTP ERROR:", err);
    res.send("SMTP error: " + err.message);
  }
});

// app.post("/api/create-upi", createUPIPayment);

const PORT = process.env.PORT || 4040;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

await connectPG(); // Connect to PostgreSQL (no sync)

// Error handling for uncaught exceptions
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});
