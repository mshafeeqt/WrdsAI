import express from "express";
import { getAISearchResults } from "../controller/searchController.js";
import { getUserSearchHistory } from "../controller/searchController.js";

const router = express.Router();

// GET: /api/search?query=xyz&category=climate
router.post("/search", getAISearchResults);
router.post("/Searchhistory", getUserSearchHistory); // changed to POST

export default router;
