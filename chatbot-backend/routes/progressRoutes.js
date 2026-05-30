import express from "express";
import { getMyProgress } from "../controller/progressController.js";

const router = express.Router();

router.post("/my-progress", getMyProgress);

export default router;
