import {
  getStudentProgress,
  getTeacherProgress as getTeacherProgressData,
} from "../services/progress/progressService.js";

function cleanText(value = "") {
  return String(value || "").trim();
}

export async function getMyProgress(req, res) {
  try {
    const email = cleanText(req.body?.email || req.query?.email).toLowerCase();
    const progress = await getStudentProgress(email);

    res.json(progress);
  } catch (error) {
    console.error("getMyProgress error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to load progress",
    });
  }
}

export async function getTeacherProgress(req, res) {
  try {
    const email = cleanText(req.body?.email || req.query?.email).toLowerCase();
    const progress = await getTeacherProgressData(email);

    res.json(progress);
  } catch (error) {
    console.error("getTeacherProgress error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to load teacher progress",
    });
  }
}
