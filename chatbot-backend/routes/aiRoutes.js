import express from "express";
import { getAIResponse } from "../controller/aiController.js";
import { getChatHistory } from "../controller/aiController.js";
import { getAllSessions } from "../controller/aiController.js";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../controller/authController.js";
import { savePartialResponse } from "../controller/aiController.js";
import { translatetolanguage } from "../controller/aiController.js";
import { forgotPassword, resetPassword } from "../controller/authController.js";
import { changePassword, getAllUsers, deleteUser } from "../controller/authController.js";
import { createUserManually } from "../controller/adminController.js";
import { getSmartAINxtResponse } from "../controller/smartAiNxtController.js";
import { getSmartAiNxtHistory } from "../controller/smartAiNxtController.js";
import { getSmartAINxtAllSessions } from "../controller/smartAiNxtController.js";
import { saveSmartAINxtPartialResponse } from "../controller/smartAiNxtController.js";
import { getMathChapters } from "../controller/chapterController.js";
import { getRagHealth, rebuildRagIndex } from "../controller/ragController.js";
import { getPracticeHistory, savePracticeMessage } from "../controller/practiceHistoryController.js";
import testPrepRoutes from "./testPrepRoutes.js";
import progressRoutes from "./progressRoutes.js";
import { normalizeUserRole, requireAuth, requireRole, USER_ROLES } from "../middleware/auth.js";


const router = express.Router();

// Register route
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", requireAuth, getCurrentUser);
router.post("/logout", logoutUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.use(requireAuth);

const useAuthenticatedEmail = (req, res, next) => {
  const userRole = normalizeUserRole(req.user.userRole);

  req.body = {
    ...(req.body || {}),
    email: req.user.email,
    userRole,
    platformContext: userRole === USER_ROLES.TEACHER ? "teacher" : "student",
  };
  next();
};

router.post("/change-password", changePassword);

router.post("/ask", useAuthenticatedEmail, getAIResponse);
router.post("/practice/ask", requireRole(USER_ROLES.STUDENT), useAuthenticatedEmail, getAIResponse);
router.post("/practice/history", requireRole(USER_ROLES.STUDENT), useAuthenticatedEmail, getPracticeHistory);
router.post("/practice/history/message", requireRole(USER_ROLES.STUDENT), useAuthenticatedEmail, savePracticeMessage);
router.post("/history", useAuthenticatedEmail, getChatHistory);
router.post("/get_user_sessions", useAuthenticatedEmail, getAllSessions);
router.post("/save_partial", useAuthenticatedEmail, savePartialResponse);
router.post("/SmartAINxt_ask", useAuthenticatedEmail, getSmartAINxtResponse);
router.post("/save_smartAi_Nxt_partial", useAuthenticatedEmail, saveSmartAINxtPartialResponse);
router.post("/SmartAINxt_history", useAuthenticatedEmail, getSmartAiNxtHistory);
router.post("/get_smartAi_Nxt_sessions", useAuthenticatedEmail, getSmartAINxtAllSessions);


router.get("/get_all_users", requireRole(USER_ROLES.TEACHER), getAllUsers);
router.delete("/delete_user/:id", requireRole(USER_ROLES.TEACHER), deleteUser);
router.post("/createUserManually", requireRole(USER_ROLES.TEACHER), createUserManually);
router.get("/math-chapters", getMathChapters);
router.get("/rag/health", getRagHealth);
router.post("/rag/rebuild", requireRole(USER_ROLES.TEACHER), rebuildRagIndex);
router.use("/test-prep", requireRole(USER_ROLES.STUDENT), useAuthenticatedEmail, testPrepRoutes);
router.use("/progress", useAuthenticatedEmail, progressRoutes);

// router.post("/translate", translatetolanguage);

export default router;
