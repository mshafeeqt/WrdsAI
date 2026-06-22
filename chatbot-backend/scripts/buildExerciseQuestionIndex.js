import fs from "fs";
import path from "path";
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import {
  analyzePageText,
  collectFigureRefsFromText,
  detectMathContent,
  detectScienceDiagramContent,
  isTextLikelyCorrupted,
} from "../utils/mathPdfAnalysis.js";

const EXERCISE_PATTERN = /\bEXERCISE\s+([A-Z]?\d+(?:\.\d+)+)\b/gi;
const QUESTION_START_PATTERN = /(?:^|\s)(\d+)\.(?!\d)\s*/g;

function resolveBackendBasePath() {
  let basePath = path.join(process.cwd(), "chatbot-backend");
  if (!fs.existsSync(basePath)) {
    basePath = process.cwd();
  }
  return basePath;
}
function getPdfJsOptions(data) {
  return {
    data,
    standardFontDataUrl: path.join(
      resolveBackendBasePath(),
      "node_modules/pdfjs-dist/standard_fonts/",
    ),
  };
}

function listPdfFilesRecursively(dirPath) {
  const results = [];

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...listPdfFilesRecursively(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) {
      results.push(fullPath);
    }
  }

  return results;
}

function normalizeWhitespace(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function buildChapterId(pdfPath, mathDataDir) {
  return path
    .relative(mathDataDir, pdfPath)
    .replace(/\\/g, "/")
    .replace(/\.pdf$/i, "");
}

async function extractPdfPages(pdfPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const pdf = await pdfjsLib.getDocument(getPdfJsOptions(data)).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const rawText = normalizeWhitespace(content.items.map((item) => item.str).join(" "));
    pages.push({ pageNumber, rawText });
  }

  return pages;
}

function detectExerciseNumber(text = "") {
  EXERCISE_PATTERN.lastIndex = 0;
  const match = EXERCISE_PATTERN.exec(text);
  return match?.[1] || null;
}

function detectQuestionNumbers(text = "") {
  const numbers = new Set();
  QUESTION_START_PATTERN.lastIndex = 0;
  let match = QUESTION_START_PATTERN.exec(text);

  while (match) {
    numbers.add(match[1]);
    match = QUESTION_START_PATTERN.exec(text);
  }

  return Array.from(numbers);
}

function buildPageIndexEntry({ page, chapterId, sourcePdf, pageImagePath }) {
  const analysis = analyzePageText(page.rawText, page.ocrText);
  const combinedText = [page.rawText, page.ocrText].filter(Boolean).join(" ");

  return {
    chapterId,
    sourcePdf,
    page: page.pageNumber,
    rawText: page.rawText,
    ocrText: page.ocrText,
    pageImagePath,
    exercise: detectExerciseNumber(combinedText),
    questionNumbers: detectQuestionNumbers(combinedText),
    figureRefs: analysis.figureRefs,
    mathDetected: analysis.mathDetected,
    diagramDetected: analysis.diagramDetected,
    textCorrupted: analysis.textCorrupted,
  };
}

function splitQuestions(sectionText, sectionStartPage) {
  const starts = [];
  QUESTION_START_PATTERN.lastIndex = 0;
  let match = QUESTION_START_PATTERN.exec(sectionText);

  while (match) {
    starts.push({
      questionNo: match[1],
      start: match.index + match[0].indexOf(match[1]),
    });
    match = QUESTION_START_PATTERN.exec(sectionText);
  }

  return starts.map((current, index) => {
    const next = starts[index + 1];
    const text = normalizeWhitespace(sectionText.slice(current.start, next?.start));
    const pageMarker = /\[\[PAGE:(\d+)\]\]/.exec(text);

    return {
      questionNo: current.questionNo,
      page: pageMarker ? Number(pageMarker[1]) : sectionStartPage,
      text: normalizeWhitespace(text.replace(/\[\[PAGE:\d+\]\]/g, "")),
    };
  });
}

function trimAtNextChapterSection(sectionText = "") {
  const sectionBoundary = /\b\d+\.\d+(?!\d)\s*[A-Za-z][A-Za-z\s]{2,}/.exec(sectionText);
  if (!sectionBoundary) return sectionText;
  return sectionText.slice(0, sectionBoundary.index);
}

function buildExerciseEntriesFromPages(pageEntries) {
  const questions = [];
  let currentExercise = null;
  let sectionText = "";
  let sectionStartPage = null;

  function flushSection() {
    if (!currentExercise || !sectionText) return;

    const cleanSection = trimAtNextChapterSection(sectionText);
    for (const question of splitQuestions(cleanSection, sectionStartPage)) {
      if (!question.text) continue;

      const pageEntry =
        pageEntries.find((entry) => entry.page === question.page) ||
        pageEntries.find((entry) => entry.exercise === currentExercise) ||
        pageEntries[0];
      const rawText = question.text;
      const combinedQuestionText = [question.text, pageEntry?.ocrText].filter(Boolean).join(" ");
      const mathDetected =
        detectMathContent(combinedQuestionText) || Boolean(pageEntry?.mathDetected);
      const diagramDetected =
        detectScienceDiagramContent(combinedQuestionText) || Boolean(pageEntry?.diagramDetected);
      const textCorrupted = isTextLikelyCorrupted(question.text);
      const fallbackPageImageRequired = false;

      questions.push({
        chapterId: pageEntry.chapterId,
        exercise: currentExercise,
        questionNo: question.questionNo,
        page: question.page,
        text: question.text,
        rawText,
        pageImagePath: pageEntry?.pageImagePath || "",
        crop: null,
        figureRefs: collectFigureRefsFromText(combinedQuestionText),
        mathDetected,
        diagramDetected,
        textCorrupted,
        fallbackPageImageRequired,
        sourcePdf: pageEntry.sourcePdf,
      });
    }
  }

  for (const pageEntry of pageEntries) {
    const pageText = ` [[PAGE:${pageEntry.page}]] ${pageEntry.rawText}`;
    const matches = Array.from(pageText.matchAll(EXERCISE_PATTERN));

    if (!matches.length) {
      if (currentExercise) sectionText += ` ${pageText}`;
      continue;
    }

    let cursor = 0;
    for (const match of matches) {
      if (currentExercise) {
        sectionText += ` ${pageText.slice(cursor, match.index)}`;
        flushSection();
      }

      currentExercise = match[1];
      sectionStartPage = pageEntry.page;
      sectionText = pageText.slice(match.index + match[0].length);
      cursor = match.index + match[0].length;
    }
  }

  flushSection();
  return questions;
}

async function buildExerciseQuestionIndex() {
  const backendBasePath = resolveBackendBasePath();
  const mathDataDir = path.join(backendBasePath, "Math_Data");
  const exerciseOutputPath = path.join(mathDataDir, "ExerciseQuestionIndex.json");
  const pageOutputPath = path.join(mathDataDir, "MathPageIndex.json");
  const pdfFiles = listPdfFilesRecursively(mathDataDir);
  const exerciseIndex = [];
  const pageIndex = [];

  for (const pdfPath of pdfFiles) {
    const chapterId = buildChapterId(pdfPath, mathDataDir);
    const sourcePdf = path.relative(mathDataDir, pdfPath).replace(/\\/g, "/");
    console.log(`[ExerciseIndex] Reading ${sourcePdf}`);

    try {
      const pages = await extractPdfPages(pdfPath);
      const pageEntries = [];

      for (const page of pages) {
        page.ocrText = "";
        const pageEntry = buildPageIndexEntry({
          page,
          chapterId,
          sourcePdf,
          pageImagePath: "",
        });

        pageEntries.push(pageEntry);
        pageIndex.push(pageEntry);
      }

      const questions = buildExerciseEntriesFromPages(pageEntries);
      exerciseIndex.push(...questions);
      console.log(`[ExerciseIndex] Found ${questions.length} questions in ${sourcePdf}`);
    } catch (error) {
      console.warn(`[ExerciseIndex] Failed to process ${sourcePdf}: ${error.message}`);
      exerciseIndex.push({
        chapterId,
        exercise: "",
        questionNo: "",
        page: null,
        text: "",
        rawText: "",
        pageImagePath: "",
        crop: null,
        figureRefs: [],
        mathDetected: false,
        diagramDetected: false,
        textCorrupted: true,
        fallbackPageImageRequired: false,
        sourcePdf,
        needsReview: true,
        error: error.message,
      });
    }
  }

  fs.writeFileSync(exerciseOutputPath, JSON.stringify(exerciseIndex, null, 2));
  fs.writeFileSync(pageOutputPath, JSON.stringify(pageIndex, null, 2));
  console.log(`[ExerciseIndex] Wrote ${exerciseIndex.length} entries to ${exerciseOutputPath}`);
  console.log(`[ExerciseIndex] Wrote ${pageIndex.length} page entries to ${pageOutputPath}`);
}

buildExerciseQuestionIndex().catch((error) => {
  console.error("[ExerciseIndex] Build failed:", error);
  process.exitCode = 1;
});
