import { getUserProgress } from "../services/progress/progressService.js";

function cleanText(value = "") {
  return String(value || "").trim();
}

export async function getMyProgress(req, res) {
  try {
    const email = cleanText(req.body?.email || req.query?.email).toLowerCase();
    const progress = await getUserProgress(email);

    res.json(progress);
  } catch (error) {
    console.error("getMyProgress error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to load progress",
    });
  }
}
