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
  return {
    chapter: data?.chapter || chapterName,
    contextText: data?.context_text || "",
    matches: Array.isArray(data?.matches) ? data.matches : [],
  };
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
      `[RAG] Exact exercise lookup failed for ${chapterName}, exercise ${exerciseQuery.exercise}, question ${exerciseQuery.questionNo}. Falling back to semantic RAG.`,
    );
    console.log("[RAG] Semantic RAG fallback used.");
  }

  const pythonRagUrl = (process.env.PYTHON_RAG_URL || "").trim();

  if (!pythonRagUrl || Date.now() < pythonRagUnavailableUntil) {
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
    pythonRagUnavailableUntil = Date.now() + PYTHON_RAG_COOLDOWN_MS;
    console.warn(
      "Python RAG unavailable, falling back to local JS RAG:",
      error.response?.data || error.message,
    );
    return getLocalChapterRagContext(query, chapterName, options);
  }
}
