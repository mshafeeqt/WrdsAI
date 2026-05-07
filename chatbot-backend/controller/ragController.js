import axios from "axios";

function getPythonRagBaseUrl() {
  const baseUrl = (process.env.PYTHON_RAG_URL || "").trim();
  if (!baseUrl) {
    const error = new Error("PYTHON_RAG_URL is not configured");
    error.statusCode = 500;
    throw error;
  }
  return baseUrl.replace(/\/$/, "");
}

export async function getRagHealth(_req, res) {
  try {
    const baseUrl = getPythonRagBaseUrl();
    const response = await axios.get(`${baseUrl}/rag/health`, {
      timeout: 10000,
    });

    return res.json({
      success: true,
      ragService: response.data,
    });
  } catch (error) {
    const status =
      error.statusCode || error.response?.status || 500;

    return res.status(status).json({
      success: false,
      message: "Failed to reach Python RAG service",
      details: error.response?.data || error.message,
    });
  }
}

export async function rebuildRagIndex(_req, res) {
  try {
    const baseUrl = getPythonRagBaseUrl();
    const response = await axios.post(
      `${baseUrl}/rag/index/rebuild`,
      {},
      {
        timeout: 300000,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return res.json({
      success: true,
      result: response.data,
    });
  } catch (error) {
    const status =
      error.statusCode || error.response?.status || 500;

    return res.status(status).json({
      success: false,
      message: "Failed to rebuild Python RAG index",
      details: error.response?.data || error.message,
    });
  }
}
