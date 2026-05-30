import express from "express";
import { getAIResponse } from "../controller/aiController.js";
import { getChatHistory } from "../controller/aiController.js";
import { getAllSessions } from "../controller/aiController.js";
import { registerUser, loginUser } from "../controller/authController.js";
import { savePartialResponse } from "../controller/aiController.js";
import { translatetolanguage } from "../controller/aiController.js";
import { getSmartAIResponse } from "../controller/smartAiController.js";
import { getSmartAiHistory } from "../controller/smartAiController.js";
import { getSmartAIAllSessions } from "../controller/smartAiController.js";
import { getSmartAIProResponse } from "../controller/smartAiProController.js";
import { getSmartAiProHistory } from "../controller/smartAiProController.js";
import { getSmartAIProAllSessions } from "../controller/smartAiProController.js";
import { saveSmartAIPartialResponse } from "../controller/smartAiController.js";
import { saveSmartAIProPartialResponse } from "../controller/smartAiProController.js";
import { forgotPassword, resetPassword } from "../controller/authController.js";
import { changePassword, getAllUsers, deleteUser } from "../controller/authController.js";
import { createUserManually } from "../controller/adminController.js";
import { getSmartAINxtResponse } from "../controller/smartAiNxtController.js";
import { getSmartAiNxtHistory } from "../controller/smartAiNxtController.js";
import { getSmartAINxtAllSessions } from "../controller/smartAiNxtController.js";
import { saveSmartAINxtPartialResponse } from "../controller/smartAiNxtController.js";
import { getMathChapters } from "../controller/chapterController.js";
import { getRagHealth, rebuildRagIndex } from "../controller/ragController.js";
import testPrepRoutes from "./testPrepRoutes.js";
import progressRoutes from "./progressRoutes.js";


const router = express.Router();

// Register route
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", changePassword);

router.post("/ask", getAIResponse);
router.post("/history", getChatHistory);
router.post("/get_user_sessions", getAllSessions);
router.post("/save_partial", savePartialResponse);
router.post("/SmartAIask", getSmartAIResponse);
router.post("/SmartAIhistory", getSmartAiHistory);
router.post("/save_smartAi_partial", saveSmartAIPartialResponse);
router.post("/get_smartAi_sessions", getSmartAIAllSessions);
router.post("/SmartAIProask", getSmartAIProResponse);
router.post("/save_smartAi_Pro_partial", saveSmartAIProPartialResponse);
router.post("/SmartAIProhistory", getSmartAiProHistory);
router.post("/get_smartAi_Pro_sessions", getSmartAIProAllSessions);

router.post("/SmartAINxt_ask", getSmartAINxtResponse);
router.post("/save_smartAi_Nxt_partial", saveSmartAINxtPartialResponse);
router.post("/SmartAINxt_history", getSmartAiNxtHistory);
router.post("/get_smartAi_Nxt_sessions", getSmartAINxtAllSessions);


router.get("/get_all_users", getAllUsers);
router.delete("/delete_user/:id", deleteUser);
router.post("/createUserManually", createUserManually);
router.get("/math-chapters", getMathChapters);
router.get("/rag/health", getRagHealth);
router.post("/rag/rebuild", rebuildRagIndex);
router.use("/test-prep", testPrepRoutes);
router.use("/progress", progressRoutes);

// router.post("/translate", translatetolanguage);

export default router;
