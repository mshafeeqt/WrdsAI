import express from "express";
import { generateTestPrepQuestions } from "../controller/testPrepController.js";

const router = express.Router();

router.post("/questions", generateTestPrepQuestions);

export default router;
