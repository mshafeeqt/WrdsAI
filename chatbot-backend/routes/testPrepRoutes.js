import express from "express";
import { generateTestPrepQuestions } from "../controller/testPrepController.js";
import {
  getRecentTestScores,
  getUserAnalyticsSummary,
  logUserQuestionEvent,
  submitTestAttempt,
} from "../controller/testAnalyticsController.js";

const router = express.Router();

router.post("/questions", generateTestPrepQuestions);
router.post("/submit", submitTestAttempt);
router.post("/recent-scores", getRecentTestScores);
router.post("/question-event", logUserQuestionEvent);
router.post("/analytics", getUserAnalyticsSummary);

export default router;
