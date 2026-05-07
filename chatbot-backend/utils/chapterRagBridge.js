import axios from "axios";
import { getChapterRagContext as getLocalChapterRagContext } from "./ragHelper.js";

function normalizeRemoteResponse(data, chapterName) {
  return {
    chapter: data?.chapter || chapterName,
    contextText: data?.context_text || "",
    matches: Array.isArray(data?.matches) ? data.matches : [],
  };
}

export async function getChapterRagContext(query, chapterName, options = {}) {
  const pythonRagUrl = (process.env.PYTHON_RAG_URL || "").trim();

  if (!pythonRagUrl) {
    return getLocalChapterRagContext(query, chapterName, options);
  }

  try {
    const response = await axios.post(
      `${pythonRagUrl.replace(/\/$/, "")}/rag/chapters/retrieve`,
      {
        query,
        chapter: chapterName,
        top_k: options.topK,
        score_threshold: options.minSimilarity,
        max_context_chars: options.maxContextChars,
      },
      {
        timeout: 15000,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return normalizeRemoteResponse(response.data, chapterName);
  } catch (error) {
    console.warn(
      "Python RAG unavailable, falling back to local JS RAG:",
      error.response?.data || error.message,
    );
    return getLocalChapterRagContext(query, chapterName, options);
  }
}
