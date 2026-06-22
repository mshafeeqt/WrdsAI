import fs from "fs";
import path from "path";
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import {
  analyzePageText,
  collectFigureRefsFromText,
  isTextLikelyCorrupted,
} from "./mathPdfAnalysis.js";

const INDEX_FILE_NAME = "ExerciseQuestionIndex.json";
const LEGACY_INDEX_FILE_NAMES = ["MathDataEmbeddings.json", "MathDataIndex.json"];
const FIGURE_TEXT_PATTERN =
  /\b(?:figure|fig\.?|diagram|shown\s+below|given\s+below|in\s+the\s+figure)\b/i;
const FIGURE_REF_PATTERN = /\b(?:figure|fig\.?)\s*([A-Z]?\d+(?:\.\d+)+)\b/gi;

let cachedIndex = null;
let cachedMtime = 0;
let cachedLegacyIndex = null;
let cachedLegacyIndexPath = "";
let cachedLegacyMtime = 0;

function resolveBackendBasePath() {
  let basePath = path.join(process.cwd(), "chatbot-backend");
  if (!fs.existsSync(basePath)) {
    basePath = process.cwd();
  }
  return basePath;
}

function getIndexPath() {
  return path.join(resolveBackendBasePath(), "Math_Data", INDEX_FILE_NAME);
}

function getMathDataDir() {
  return path.join(resolveBackendBasePath(), "Math_Data");
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

function normalizeText(value = "") {
  return String(value || "")
    .replace(/\\/g, "/")
    .replace(/&/g, " and ")
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function normalizeExercise(value = "") {
  return String(value || "").trim().toUpperCase();
}

function normalizeQuestionNo(value = "") {
  return String(value || "").trim().toLowerCase().replace(/\.$/, "");
}

function loadExerciseQuestionIndex() {
  const indexPath = getIndexPath();
  if (!fs.existsSync(indexPath)) return [];

  const mtime = fs.statSync(indexPath).mtimeMs;
  if (cachedIndex && cachedMtime === mtime) {
    return cachedIndex;
  }

  const parsed = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  cachedIndex = Array.isArray(parsed) ? parsed : [];
  cachedMtime = mtime;
  return cachedIndex;
}

function loadLegacyMathIndex() {
  const basePath = resolveBackendBasePath();
  const candidatePaths = LEGACY_INDEX_FILE_NAMES.map((fileName) =>
    path.join(basePath, fileName),
  ).filter((filePath) => fs.existsSync(filePath));

  if (!candidatePaths.length) return [];

  const indexPath = candidatePaths.find((filePath) => {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  });

  if (!indexPath) return [];

  const mtime = fs.statSync(indexPath).mtimeMs;
  if (
    cachedLegacyIndex &&
    cachedLegacyIndexPath === indexPath &&
    cachedLegacyMtime === mtime
  ) {
    return cachedLegacyIndex;
  }

  const parsed = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  cachedLegacyIndex = Array.isArray(parsed) ? parsed : [];
  cachedLegacyIndexPath = indexPath;
  cachedLegacyMtime = mtime;
  return cachedLegacyIndex;
}

function chapterMatches(candidate = "", target = "") {
  const normalizedCandidate = normalizeText(candidate);
  const normalizedTarget = normalizeText(target);
  if (!normalizedCandidate || !normalizedTarget) return false;
  if (normalizedCandidate === normalizedTarget) return true;

  const candidateParts = normalizedCandidate.split(" ").filter(Boolean);
  const targetParts = normalizedTarget.split(" ").filter(Boolean);
  const candidateChapterName = candidateParts.slice(-4).join(" ");
  const targetChapterName = targetParts.slice(-4).join(" ");

  return (
    normalizedCandidate.includes(normalizedTarget) ||
    normalizedTarget.includes(normalizedCandidate) ||
    candidateChapterName === targetChapterName ||
    Boolean(candidateChapterName && targetChapterName.includes(candidateChapterName)) ||
    Boolean(targetChapterName && candidateChapterName.includes(targetChapterName))
  );
}

function collectFigureRefs(question = {}) {
  const refs = new Set(Array.isArray(question.figureRefs) ? question.figureRefs : []);
  const text = String(question.text || "");
  FIGURE_REF_PATTERN.lastIndex = 0;
  let match = FIGURE_REF_PATTERN.exec(text);

  while (match) {
    if (match[1]) refs.add(match[1]);
    match = FIGURE_REF_PATTERN.exec(text);
  }

  return Array.from(refs);
}

function shouldUseVisionFallback(question = {}, hasFigureReference = false) {
  return false;
}

export async function findExerciseQuestion({ selectedChapter, exercise, questionNo } = {}) {
  if (!selectedChapter || !questionNo) return null;

  const index = loadExerciseQuestionIndex();
  const normalizedExercise = exercise ? normalizeExercise(exercise) : "";
  const normalizedQuestionNo = normalizeQuestionNo(questionNo);

  if (index.length) {
    const chapterMatchesForQuestion = index.filter(
      (item) =>
        normalizeQuestionNo(item.questionNo) === normalizedQuestionNo &&
        (item.chapterId === selectedChapter || chapterMatches(item.chapterId, selectedChapter)),
    );
    const exerciseMatches = normalizedExercise
      ? chapterMatchesForQuestion.filter(
          (item) => normalizeExercise(item.exercise) === normalizedExercise,
        )
      : chapterMatchesForQuestion;

    const exactMatch =
      exerciseMatches.find((item) => item.chapterId === selectedChapter) ||
      exerciseMatches.find((item) => chapterMatches(item.chapterId, selectedChapter)) ||
      null;

    if (normalizedExercise && exactMatch) return exactMatch;
    if (!normalizedExercise && chapterMatchesForQuestion.length === 1) {
      console.log(
        `[RAG] Question number ${questionNo} resolved without exercise because it is unique in selected chapter.`,
      );
      return chapterMatchesForQuestion[0];
    }
  }

  if (!normalizedExercise) return null;

  const legacyMatch = findExerciseQuestionInLegacyIndex({
    selectedChapter,
    exercise: normalizedExercise,
    questionNo: normalizedQuestionNo,
  });
  if (legacyMatch) return legacyMatch;

  return findExerciseQuestionInSelectedPdf({
    selectedChapter,
    exercise: normalizedExercise,
    questionNo: normalizedQuestionNo,
  });
}

function findExerciseQuestionInLegacyIndex({ selectedChapter, exercise, questionNo }) {
  const legacyIndex = loadLegacyMathIndex();
  if (!legacyIndex.length) return null;

  const chapterChunks = legacyIndex
    .filter((chunk) => chapterMatches(chunk.chapter, selectedChapter))
    .sort(
      (a, b) =>
        Number(a.metadata?.chunkIndex ?? 0) - Number(b.metadata?.chunkIndex ?? 0),
    );

  if (!chapterChunks.length) return null;

  const sourcePdf =
    chapterChunks.find((chunk) => chunk.metadata?.source)?.metadata?.source ||
    `${selectedChapter}.pdf`;
  const chapterText = chapterChunks.map((chunk) => chunk.content || "").join(" ");
  const questionText = extractExerciseQuestionText({
    chapterText,
    exercise,
    questionNo,
  });

  if (!questionText) return null;

  console.log(
    `[RAG] Exact exercise question extracted from legacy math index: ${selectedChapter}, exercise ${exercise}, question ${questionNo}`,
  );

  return {
    chapterId: selectedChapter,
    exercise,
    questionNo,
    page: null,
    text: questionText,
    rawText: questionText,
    figureRefs: collectFigureRefs({ text: questionText }),
    ...analyzePageText(questionText),
    pageImagePath: "",
    fallbackPageImageRequired: false,
    sourcePdf,
    source: "legacy-math-index",
    needsReview: true,
  };
}

function extractExerciseQuestionText({ chapterText, exercise, questionNo }) {
  const normalizedText = String(chapterText || "").replace(/\s+/g, " ").trim();
  const exercisePattern = new RegExp(
    `\\bEXERCISE\\s+${escapeRegExp(exercise)}\\b`,
    "gi",
  );
  const exerciseMatches = Array.from(normalizedText.matchAll(exercisePattern));
  if (!exerciseMatches.length) return "";

  for (let index = exerciseMatches.length - 1; index >= 0; index--) {
    const exerciseMatch = exerciseMatches[index];
    const nextExerciseMatch = exerciseMatches[index + 1];
    const exerciseSection = normalizedText.slice(
      exerciseMatch.index + exerciseMatch[0].length,
      nextExerciseMatch?.index,
    );
    const questionText = extractQuestionFromExerciseSection({
      exerciseSection: trimAtNextChapterSection(exerciseSection),
      questionNo,
    });

    if (questionText) return questionText;
  }

  return "";
}

function trimAtNextChapterSection(exerciseSection = "") {
  const sectionBoundary = /\b\d+\.\d+(?!\d)\s*[A-Za-z][A-Za-z\s]{2,}/.exec(
    exerciseSection,
  );

  if (!sectionBoundary) return exerciseSection;
  return exerciseSection.slice(0, sectionBoundary.index);
}

function extractQuestionFromExerciseSection({ exerciseSection, questionNo }) {
  const questionPattern = new RegExp(
    `(?:^|\\s)${escapeRegExp(questionNo)}\\.(?!\\d)\\s*`,
    "i",
  );
  const questionMatch = questionPattern.exec(exerciseSection);
  if (!questionMatch) return "";

  const questionStart = questionMatch.index + questionMatch[0].search(/\d/);
  const markerLength = questionMatch[0].slice(questionMatch[0].search(/\d/)).length;
  const afterQuestionNo = exerciseSection.slice(questionStart + markerLength);
  const nextQuestionMatch = /(?:^|\s)\d+\.(?!\d)\s*/.exec(afterQuestionNo);
  const questionBody = nextQuestionMatch
    ? afterQuestionNo.slice(0, nextQuestionMatch.index)
    : afterQuestionNo;

  return `${questionNo}. ${questionBody}`.replace(/\s+/g, " ").trim();
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function listPdfFilesRecursively(dirPath) {
  const results = [];
  if (!fs.existsSync(dirPath)) return results;

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

function buildChapterIdFromPdf(pdfPath) {
  return path
    .relative(getMathDataDir(), pdfPath)
    .replace(/\\/g, "/")
    .replace(/\.pdf$/i, "");
}

function findPdfForChapter(selectedChapter = "") {
  return listPdfFilesRecursively(getMathDataDir()).find((pdfPath) =>
    chapterMatches(buildChapterIdFromPdf(pdfPath), selectedChapter),
  );
}

function normalizeWhitespace(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

async function extractPdfPages(pdfPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const pdf = await pdfjsLib.getDocument(getPdfJsOptions(data)).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const layoutItems = content.items
      .map((item) => ({
        text: normalizeWhitespace(item.str),
        x: Math.round(item.transform?.[4] || 0),
        y: Math.round(item.transform?.[5] || 0),
      }))
      .filter((item) => item.text);
    pages.push({
      pageNumber,
      rawText: normalizeWhitespace(content.items.map((item) => item.str).join(" ")),
      layoutItems,
    });
  }

  return pages;
}

function normalizeMathToken(token = "") {
  return String(token || "")
    .replace(/[]/g, "(")
    .replace(/[]/g, ")")
    .replace(/−/g, "-")
    .trim();
}

function tokenToLatex(token = "") {
  const normalized = normalizeMathToken(token);
  if (normalized === "π") return "\\pi";
  if (/^(sin|cos|tan|log)$/i.test(normalized)) return `\\${normalized.toLowerCase()}`;
  return normalized;
}

function formatApproachToken(tokens = []) {
  const sorted = [...tokens].sort((a, b) => a.x - b.x);
  const joined = sorted.map((item) => normalizeMathToken(item.text)).join(" ");
  const variable = tokens.find((item) => /^[a-zA-Z]$/.test(normalizeMathToken(item.text)))?.text || "x";
  const afterArrow = joined.split(/→|->/).pop()?.replace(variable, "").trim();
  let approach = normalizeMathToken(afterArrow || "");
  if (approach === "-") {
    const arrowToken = sorted.find((item) => /→|->/.test(normalizeMathToken(item.text)));
    const numericAfterArrow = sorted.find(
      (item) => arrowToken && item.x > arrowToken.x && /^[0-9]+$/.test(normalizeMathToken(item.text)),
    );
    if (numericAfterArrow) approach = `-${normalizeMathToken(numericAfterArrow.text)}`;
  }
  return {
    variable: tokenToLatex(variable),
    approach: approach ? tokenToLatex(approach.replace(/\s+/g, "")) : "",
  };
}

function formatMathRow(tokens = []) {
  const sorted = [...tokens].sort((a, b) => a.x - b.x);
  const parts = [];

  for (let index = 0; index < sorted.length; index++) {
    const current = sorted[index];
    const token = normalizeMathToken(current.text);
    if (!token || /^lim$/i.test(token) || token === "→") continue;

    if (/^[a-zA-Z]$/.test(token)) {
      const exponent = sorted[index + 1];
      const exponentToken = normalizeMathToken(exponent?.text || "");
      const exponentDenominator = sorted[index + 2];
      const exponentDenominatorToken = normalizeMathToken(exponentDenominator?.text || "");
      if (
        exponent &&
        exponent.y > current.y + 2 &&
        exponent.x >= current.x &&
        exponent.x <= current.x + 15 &&
        /^[0-9]+$/.test(exponentToken)
      ) {
        if (
          exponentDenominator &&
          exponent.y > current.y + 8 &&
          exponentDenominator.y > current.y &&
          exponentDenominator.y < exponent.y &&
          Math.abs(exponentDenominator.x - exponent.x) <= 4 &&
          /^[0-9]+$/.test(exponentDenominatorToken)
        ) {
          parts.push(`${tokenToLatex(token)}^{\\frac{${exponentToken}}{${exponentDenominatorToken}}}`);
          index += 2;
          continue;
        }
        parts.push(`${tokenToLatex(token)}^{${exponentToken}}`);
        index += 1;
        continue;
      }
    }

    parts.push(tokenToLatex(token));
  }

  return parts
    .join(" ")
    .replace(/\s+([,.)])/g, "$1")
    .replace(/([(])\s+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function buildLimitLatexFromLayout(questionItems = [], questionNo = "") {
  const limItem = questionItems.find((item) => /^lim$/i.test(item.text));
  if (!limItem) return "";

  const lowerTokens = questionItems.filter(
    (item) =>
      item.y < limItem.y &&
      item.y >= limItem.y - 12 &&
      item.x >= limItem.x - 4 &&
      item.x <= limItem.x + 22,
  );
  const { variable, approach } = formatApproachToken(lowerTokens);
  const lowerTokenSet = new Set(lowerTokens);
  const expressionTokens = questionItems.filter(
    (item) =>
      item.x > limItem.x + 12 &&
      !lowerTokenSet.has(item) &&
      !String(item.text).match(/^\d+\.$/),
  );
  const numeratorTokens = expressionTokens.filter((item) => item.y > limItem.y + 2);
  const denominatorTokens = expressionTokens.filter((item) => item.y < limItem.y - 2);
  const middleTokens = expressionTokens.filter(
    (item) => Math.abs(item.y - limItem.y) <= 6 && !["lim"].includes(item.text),
  );

  const numerator = formatMathRow(numeratorTokens);
  const denominator = formatMathRow(denominatorTokens);
  const middle = formatMathRow(middleTokens);
  const limit = `\\lim_{${variable}${approach ? ` \\to ${approach}` : ""}}`;
  const expression =
    numerator && denominator
      ? `\\frac{${numerator}}{${denominator}}`
      : middle || numerator || denominator;

  if (!expression) return "";
  return `${questionNo}. $$${limit} ${expression}$$`;
}

function buildLayoutQuestionText(page = {}, questionNo = "") {
  const items = Array.isArray(page.layoutItems) ? page.layoutItems : [];
  const marker = items.find(
    (item) =>
      /^\d+\.$/.test(item.text) &&
      normalizeQuestionNo(item.text) === normalizeQuestionNo(`${questionNo}.`),
  );
  if (!marker) return "";

  const nextMarker = items.find(
    (item) =>
      /^\d+\.$/.test(item.text) &&
      item.y >= marker.y - 8 &&
      item.y <= marker.y + 8 &&
      item.x > marker.x,
  );
  const nextLowerMarker = items.find(
    (item) =>
      /^\d+\.$/.test(item.text) &&
      Math.abs(item.x - marker.x) <= 20 &&
      item.y < marker.y,
  );
  const rightEdge = nextMarker ? nextMarker.x - 4 : marker.x + 130;
  const bottomEdge = nextLowerMarker ? nextLowerMarker.y + 24 : marker.y - 32;
  const questionItems = items.filter(
    (item) =>
      item.x >= marker.x &&
      item.x < rightEdge &&
      item.y >= bottomEdge &&
      item.y <= marker.y + 32,
  );

  return buildLimitLatexFromLayout(questionItems, questionNo);
}

async function findExerciseQuestionInSelectedPdf({ selectedChapter, exercise, questionNo }) {
  const pdfPath = findPdfForChapter(selectedChapter);
  if (!pdfPath) return null;

  try {
    const chapterId = buildChapterIdFromPdf(pdfPath);
    const sourcePdf = path.relative(getMathDataDir(), pdfPath).replace(/\\/g, "/");
    const pages = await extractPdfPages(pdfPath);
    const chapterText = pages
      .map((page) => ` [[PAGE:${page.pageNumber}]] ${page.rawText}`)
      .join(" ");
    const question = extractExerciseQuestionWithPage({
      chapterText,
      exercise,
      questionNo,
    });

    if (!question?.text) return null;

    const page = pages.find((item) => item.pageNumber === question.page);
    const rawText = question.text;
    const layoutQuestionText = buildLayoutQuestionText(page, questionNo);
    const questionText = layoutQuestionText || question.text;
    const analysis = analyzePageText(questionText, page?.rawText || "");
    const textCorrupted = Boolean(
      !layoutQuestionText && (analysis.textCorrupted || isTextLikelyCorrupted(rawText)),
    );

    console.log(
      `[RAG] Exact exercise question extracted on-demand from PDF: ${chapterId}, exercise ${exercise}, question ${questionNo}`,
    );

    return {
      chapterId,
      exercise,
      questionNo,
      page: question.page,
      text: questionText,
      rawText,
      pageImagePath: "",
      crop: null,
      figureRefs: collectFigureRefsFromText(questionText),
      mathDetected: analysis.mathDetected,
      diagramDetected: analysis.diagramDetected,
      textCorrupted,
      fallbackPageImageRequired: false,
      sourcePdf,
      source: "selected-pdf-on-demand",
      needsReview: true,
    };
  } catch (error) {
    console.warn(`[RAG] On-demand selected PDF lookup failed: ${error.message}`);
    return null;
  }
}

function extractExerciseQuestionWithPage({ chapterText, exercise, questionNo }) {
  const questionText = extractExerciseQuestionText({ chapterText, exercise, questionNo });
  if (!questionText) return null;

  const beforeQuestion = chapterText.slice(
    0,
    chapterText.indexOf(questionText.replace(/^\d+\.\s*/, "")),
  );
  const pageMarkers = Array.from(beforeQuestion.matchAll(/\[\[PAGE:(\d+)\]\]/g));
  const page = pageMarkers.length
    ? Number(pageMarkers[pageMarkers.length - 1][1])
    : 1;

  return {
    text: questionText,
    page,
  };
}

export function buildExerciseQuestionContext(question, selectedChapter) {
  const figureRefs = collectFigureRefs(question);
  const hasFigureReference =
    Boolean(question?.hasFigureReference) ||
    figureRefs.length > 0 ||
    FIGURE_TEXT_PATTERN.test(String(question?.text || ""));
  const requiresVisionFallback = shouldUseVisionFallback(question, hasFigureReference);

  if (hasFigureReference) {
    console.log(
      `[RAG] Figure reference detected for exercise ${question.exercise} question ${question.questionNo}.`,
    );
  }

  if (requiresVisionFallback) {
    console.log(
      `[RAG] Math-heavy/corrupted text detected for exercise ${question.exercise} question ${question.questionNo}. Using text-only LaTeX reconstruction.`,
    );
  }

  const contextLines = [
    `Selected chapter: ${selectedChapter || question.chapterId || ""}`,
    `Exercise: ${question.exercise || ""}`,
    `Question number: ${question.questionNo || ""}`,
    "Question text:",
    question.text || "",
    "",
    "Figure references:",
    figureRefs.length ? figureRefs.join(", ") : "None detected",
    "",
    `Page: ${question.page ?? "unknown"}`,
    `Math detected: ${Boolean(question.mathDetected)}`,
    `Text corrupted: ${Boolean(question.textCorrupted)}`,
  ];

  if (hasFigureReference) {
    contextLines.push(
      "",
      "Warning: This question may require a diagram/figure. If figure image data is not available, do not hallucinate the diagram.",
    );
  }

  const enrichedQuestion = {
    ...question,
    figureRefs,
    hasFigureReference,
  };

  return {
    chapter: selectedChapter || question.chapterId || "",
    contextText: contextLines.join("\n").trim(),
    matches: [enrichedQuestion],
    chunks: [enrichedQuestion],
    source: "exercise-question-index",
    isExactExerciseMatch: true,
    hasFigureReference,
    figureRefs,
    pageImagePath: "",
    mathDetected: Boolean(question.mathDetected),
    fallbackPageImageRequired: false,
    textCorrupted: Boolean(question.textCorrupted),
    requiresVisionFallback: false,
  };
}
