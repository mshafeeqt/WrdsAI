import express from "express";
import { getMyProgress, getTeacherProgress } from "../controller/progressController.js";
import { requireRole, USER_ROLES } from "../middleware/auth.js";

const router = express.Router();

router.post("/my-progress", requireRole(USER_ROLES.STUDENT), getMyProgress);
router.post("/teacher-progress", requireRole(USER_ROLES.TEACHER), getTeacherProgress);

export default router;
