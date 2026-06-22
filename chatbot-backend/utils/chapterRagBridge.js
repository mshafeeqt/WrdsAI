import axios from "axios";
import { getChapterRagContext as getLocalChapterRagContext } from "./ragHelper.js";
import { parseExerciseQuery } from "./exerciseQueryParser.js";
import {
  buildExerciseQuestionContext,
  findExerciseQuestion,
} from "./exerciseQuestionLookup.js";

const PYTHON_RAG_COOLDOWN_MS = 60_000;
let pythonRagUnavailableUntil = 0;

function normalizeRemoteResponse(data, chapterName) {
  const retrievalType = data?.retrieval_type || "semantic";
  const exactResult = data?.exact_result || null;
  const isExactQuestion =
    retrievalType === "question" || exactResult?.type === "question";
  const isExactPage =
    retrievalType === "page" || exactResult?.type === "page";

  const resolvedChapter = exactResult?.chapter_id || data?.chapter || chapterName;
  const resolvedChapterName = String(resolvedChapter).split("/").filter(Boolean).pop() || resolvedChapter;

  return {
    chapter: resolvedChapter,
    resolvedChapter,
    resolvedChapterName,
    contextText: data?.context_text || "",
    matches: Array.isArray(data?.matches) ? data.matches : [],
    source: isExactQuestion
      ? "python-exact-question-index"
      : isExactPage
        ? "python-exact-page-index"
        : "python-semantic-rag",
    retrievalType,
    exactResult,
    isExactExerciseMatch: isExactQuestion,
    isExactPageMatch: isExactPage,
  };
}
function getPythonRagUrl() {
  if (Date.now() < pythonRagUnavailableUntil) return "";
  return (process.env.PYTHON_RAG_URL || "").trim();
}

async function fetchPythonRagContext(query, chapterName, options = {}) {
  const pythonRagUrl = getPythonRagUrl();
  if (!pythonRagUrl) return null;

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
    pythonRagUnavailableUntil = Date.now() + PYTHON_RAG_COOLDOWN_MS;
    console.warn(
      "Python RAG unavailable, falling back to local JS RAG:",
      error.response?.data || error.message,
    );
    return null;
  }
}

export async function getChapterRagContext(query, chapterName, options = {}) {
  const exerciseQuery = parseExerciseQuery(query);

  if (exerciseQuery.isExerciseQuery) {
    console.log(
      `[RAG] Exercise query detected for chapter "${chapterName}":`,
      exerciseQuery,
    );
  }

  if (exerciseQuery.hasFigureReference) {
    console.log(
      `[RAG] Figure reference detected in query for chapter "${chapterName}": ${exerciseQuery.figureRefs.join(", ") || "diagram mentioned"}`,
    );
  }

  const pythonContext = await fetchPythonRagContext(query, chapterName, options);

  if (pythonContext?.isExactExerciseMatch || pythonContext?.isExactPageMatch) {
    console.log(
      `[RAG] Python exact retrieval used for chapter "${chapterName}".`,
    );
    return pythonContext;
  }

  if (exerciseQuery.questionNo) {
    const exactQuestion = await findExerciseQuestion({
      selectedChapter: chapterName,
      exercise: exerciseQuery.exercise,
      questionNo: exerciseQuery.questionNo,
    });

    if (exactQuestion) {
      console.log(
        `[RAG] Exact exercise question match found: ${chapterName}, exercise ${exerciseQuery.exercise}, question ${exerciseQuery.questionNo}`,
      );

      return buildExerciseQuestionContext(
        {
          ...exactQuestion,
          hasFigureReference:
            exactQuestion.hasFigureReference || exerciseQuery.hasFigureReference,
          figureRefs: [
            ...new Set([
              ...(Array.isArray(exactQuestion.figureRefs) ? exactQuestion.figureRefs : []),
              ...exerciseQuery.figureRefs,
            ]),
          ],
        },
        chapterName,
      );
    }

    console.log(
      `[RAG] Local exact exercise lookup failed for ${chapterName}, exercise ${exerciseQuery.exercise}, question ${exerciseQuery.questionNo}.`,
    );

  }

  if (pythonContext) {
    if (pythonContext.retrievalType === "semantic") {
      console.log("[RAG] Python semantic RAG fallback used.");
    }
    return pythonContext;
  }

  console.log("[RAG] Local JS RAG fallback used.");
  return getLocalChapterRagContext(query, chapterName, options);
}
