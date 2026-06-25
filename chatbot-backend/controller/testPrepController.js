import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";
import { getChapterRagContext } from "../utils/chapterRagBridge.js";

let basePath = path.join(process.cwd(), "chatbot-backend");
if (!fs.existsSync(basePath)) {
  basePath = process.cwd();
}

dotenv.config({ path: path.join(basePath, ".env"), quiet: true });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const QUESTION_COUNT = 10;
const MODEL_TIMEOUT_MS = 25000;
const MAX_CONTEXT_CHARS = 9000;
const MIN_FALLBACK_CONTEXT_SENTENCES = 8;
const PRIMARY_TEST_MODEL = "gpt-5-nano";
const FALLBACK_TEST_MODEL = "gpt-4o-mini";
const VERIFY_TEST_ANSWERS_WITH_AI = process.env.TEST_PREP_VERIFY_ANSWERS === "true";

function parseChapterMeta(chapterId = "") {
  const parts = String(chapterId || "").split("/").filter(Boolean);
  return {
    className: parts[0] || "",
    subjectName: parts[1] || "",
    chapterName: parts[2] || parts[parts.length - 1] || "",
  };
}

function cleanText(value = "") {
  return String(value || "")
    .replace(/\r?\n+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[•]/g, " ")
    .replace(/^\s*[-*]\s+/, "")
    .replace(/\s+([,.;:?])/g, "$1")
    .trim();
}

function normalizeMathText(value = "") {
  return cleanText(value)
    .replace(/\\theta\b/gi, "theta")
    .replace(/\\pi\b/gi, "pi")
    .replace(/\\alpha\b/gi, "alpha")
    .replace(/\\beta\b/gi, "beta")
    .replace(/\\gamma\b/gi, "gamma")
    .replace(/\\sin\b/gi, "sin")
    .replace(/\\cos\b/gi, "cos")
    .replace(/\\tan\b/gi, "tan")
    .replace(/\\cot\b/gi, "cot")
    .replace(/\\sec\b/gi, "sec")
    .replace(/\\cosec\b/gi, "cosec")
    .replace(/\\sqrt\b/gi, "sqrt")
    .replace(/\\times\b/gi, "x")
    .replace(/\\div\b/gi, "/")
    .replace(/\\pm\b/gi, "+/-")
    .replace(/\\degree\b/gi, "degrees")
    .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/gi, "$1/$2")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/\btheta\b/gi, "θ")
    .replace(/\bpi\b/gi, "π")
    .replace(/\balpha\b/gi, "α")
    .replace(/\bbeta\b/gi, "β")
    .replace(/\bgamma\b/gi, "γ")
    .replace(/\blambda\b/gi, "λ")
    .replace(/\bphi\b/gi, "φ")
    .replace(/\bmu\b/gi, "μ")
    .replace(/\bsin\s*\(\s*θ\s*\)/gi, "sin θ")
    .replace(/\bcos\s*\(\s*θ\s*\)/gi, "cos θ")
    .replace(/\btan\s*\(\s*θ\s*\)/gi, "tan θ")
    .replace(/\bcot\s*\(\s*θ\s*\)/gi, "cot θ")
    .replace(/\bsec\s*\(\s*θ\s*\)/gi, "sec θ")
    .replace(/\bcosec\s*\(\s*θ\s*\)/gi, "cosec θ")
    .replace(/\bsin\s*\(\s*π\s*\)/gi, "sin π")
    .replace(/\bcos\s*\(\s*π\s*\)/gi, "cos π")
    .replace(/\btan\s*\(\s*π\s*\)/gi, "tan π")
    .replace(/(\d+)\s*degrees\b/gi, "$1°")
    .replace(/(\d+)\s*degree\b/gi, "$1°");
}

function normalizeLabel(text = "") {
  return normalizeMathText(text)
    .replace(/^[A-D][.)]\s*/i, "")
    .replace(/^(ans|answer)\s*[:\-]\s*/i, "")
    .trim();
}

function extractJsonBlock(text = "") {
  const fencedJson = text.match(/```json\s*([\s\S]*?)```/i);
  if (fencedJson?.[1]) return fencedJson[1].trim();

  const fenced = text.match(/```[\w-]*\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const objectStart = text.indexOf("{");
  const objectEnd = text.lastIndexOf("}");
  if (objectStart !== -1 && objectEnd > objectStart) {
    return text.slice(objectStart, objectEnd + 1);
  }

  const arrayStart = text.indexOf("[");
  const arrayEnd = text.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    return text.slice(arrayStart, arrayEnd + 1);
  }

  return text.trim();
}

function escapeLikelyLatexBackslashes(text = "") {
  return String(text || "").replace(
    /\\(theta|pi|alpha|beta|gamma|sin|cos|tan|cot|sec|cosec|sqrt|frac|times|div|pm|degree|leq|geq|neq|cdot|lambda|mu|phi)\b/g,
    "\\\\$1",
  );
}

async function withTimeout(promise, timeoutMs) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
      timeoutMs,
    );
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

function extractChatCompletionText(response) {
  const messageContent = response?.choices?.[0]?.message?.content;

  if (typeof messageContent === "string") {
    return messageContent.trim();
  }

  if (Array.isArray(messageContent)) {
    return messageContent
      .map((part) => {
        if (typeof part === "string") return part;
        if (part?.type === "text" && typeof part?.text === "string") return part.text;
        return "";
      })
      .join("")
      .trim();
  }

  return "";
}

function buildOpenAIResponsesInput(messages = []) {
  return messages
    .filter((message) => message?.role && typeof message?.content === "string")
    .map((message) => ({
      role: message.role,
      content: [
        {
          type: message.role === "assistant" ? "output_text" : "input_text",
          text: message.content,
        },
      ],
    }));
}

function extractOpenAIResponseText(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const fragments = [];

  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      const text =
        typeof content?.text === "string"
          ? content.text
          : typeof content?.output_text === "string"
            ? content.output_text
            : "";

      if (text) {
        fragments.push(text);
      }
    }
  }

  return fragments.join("\n").trim();
}

async function createTestModelCompletion({ model, messages, maxCompletionTokens }) {
  if (model === PRIMARY_TEST_MODEL) {
    const response = await withTimeout(
      fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input: buildOpenAIResponsesInput(messages),
          reasoning: { effort: "low" },
          max_output_tokens: maxCompletionTokens,
        }),
      }),
      MODEL_TIMEOUT_MS,
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = await response.json();
    return {
      rawContent: extractOpenAIResponseText(data),
      finishReason: data?.status || "",
    };
  }

  const response = await withTimeout(
    openai.chat.completions.create({
      model,
      messages,
      max_completion_tokens: maxCompletionTokens,
    }),
    MODEL_TIMEOUT_MS,
  );

  return {
    rawContent: extractChatCompletionText(response),
    finishReason: response?.choices?.[0]?.finish_reason || "",
  };
}

async function getTestModelContent({ messages, maxCompletionTokens }) {
  const attempts = [PRIMARY_TEST_MODEL, FALLBACK_TEST_MODEL];
  let lastError = null;

  for (const model of attempts) {
    try {
      const { rawContent, finishReason } = await createTestModelCompletion({
        model,
        messages,
        maxCompletionTokens,
      });

      if (rawContent) {
        return {
          rawContent,
          modelUsed: model,
        };
      }

      lastError = new Error(
        `${model} returned empty content${finishReason ? ` (finish_reason: ${finishReason})` : ""}.`,
      );
      console.warn(`Test generation model ${model} returned empty content.`);
    } catch (error) {
      lastError = error;
      console.warn(`Test generation model ${model} failed: ${error.message}`);
    }
  }

  throw lastError || new Error("All configured test generation models failed.");
}

function parseQuestionsPayload(rawContent = "") {
  const extracted = extractJsonBlock(rawContent);

  try {
    const parsed = JSON.parse(extracted);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (Array.isArray(parsed?.questions)) {
      return parsed.questions;
    }
  } catch (error) {
    const escaped = escapeLikelyLatexBackslashes(extracted);
    const reparsed = JSON.parse(escaped);
    if (Array.isArray(reparsed)) {
      return reparsed;
    }
    if (Array.isArray(reparsed?.questions)) {
      return reparsed.questions;
    }
  }

  throw new Error("The model returned an invalid JSON structure.");
}

function splitIntoSentences(text = "") {
  return String(text || "")
    .split(/(?<=[.?!])\s+/)
    .map((sentence) => cleanText(sentence))
    .filter(Boolean)
    .filter((sentence) => sentence.length >= 30 && sentence.length <= 220)
    .filter((sentence) => !/\breprint\b|\bpage\b|\bfigure\b|\btable\b/i.test(sentence));
}

function buildCleanContext(ragContext) {
  const sentences = Array.isArray(ragContext?.matches)
    ? ragContext.matches
        .map((match) => cleanText(match?.content))
        .filter(Boolean)
        .flatMap(splitIntoSentences)
    : [];

  const seen = new Set();
  const unique = [];

  for (const sentence of sentences) {
    const key = sentence.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(sentence);
  }

  return unique.join("\n").slice(0, MAX_CONTEXT_CHARS);
}

function getCleanContextSentences(contextText = "") {
  return String(contextText || "")
    .split("\n")
    .map((sentence) => cleanText(sentence))
    .filter(Boolean)
    .filter((sentence) => sentence.length >= 20 && sentence.length <= 220);
}

function getDifficultyLabel(rawDifficulty = "") {
  const value = String(rawDifficulty || "").trim().toLowerCase();
  if (value === "medium") return "Medium";
  if (value === "difficult" || value === "hard") return "Difficult";
  return "Easy";
}

function getDifficultyInstruction(rawDifficulty = "") {
  const value = getDifficultyLabel(rawDifficulty);
  if (value === "Medium") {
    return "Ask moderately challenging chapter questions with mixed direct concepts and short applications.";
  }
  if (value === "Difficult") {
    return "Ask harder chapter questions that still stay inside syllabus but need deeper thinking.";
  }
  return "Ask straightforward syllabus questions with direct concepts, definitions, properties, and simple applications.";
}

function getMathChapterHints(chapterName = "") {
  const normalized = String(chapterName || "").toLowerCase();

  if (normalized.includes("trigon")) {
    return [
      "Use self-contained questions about trigonometric ratios, standard angles, complementary angles, and basic identities.",
      "If using theta, define the angle inside the question.",
      "Use plain text or Unicode like theta, pi, sin theta, cos theta, tan theta. Do not use LaTeX commands with backslashes.",
    ].join(" ");
  }

  if (normalized.includes("linear equation")) {
    return [
      "Use self-contained questions about the form of a linear equation in two variables, solutions, ordered pairs, and graph meaning.",
      "If using x and y, include the full equation in the question.",
      "Avoid vague references like 'the above equation' or 'the pair shown'.",
    ].join(" ");
  }

  if (normalized.includes("polynomial")) {
    return [
      "Use self-contained questions about terms, coefficients, degree, zeroes, and basic identification of polynomials.",
      "If using p(x), write the full polynomial in the question.",
    ].join(" ");
  }

  return [
    "Use self-contained mathematics questions based on the actual concepts of the chapter.",
    "If symbols such as x, y, theta, or pi are used, define them fully inside the same question.",
    "Do not rely on a missing figure, previous statement, or external context.",
  ].join(" ");
}

function extractMathConceptsFromContext(contextText = "", chapterName = "") {
  const concepts = [];
  const seen = new Set();
  const sentences = getCleanContextSentences(contextText);
  const chapterLower = String(chapterName || "").toLowerCase();

  const seededConcepts = [];
  if (chapterLower.includes("trigon")) {
    seededConcepts.push(
      {
        term: "trigonometric ratio",
        definition:
          "a ratio between two sides of a right triangle for a given acute angle",
      },
      {
        term: "sine of an angle",
        definition: "the ratio of the opposite side to the hypotenuse",
      },
      {
        term: "cosine of an angle",
        definition: "the ratio of the adjacent side to the hypotenuse",
      },
      {
        term: "tangent of an angle",
        definition: "the ratio of the opposite side to the adjacent side",
      },
      {
        term: "complementary angles",
        definition: "two angles whose sum is 90 degrees",
      },
    );
  }

  if (chapterLower.includes("linear equation")) {
    seededConcepts.push(
      {
        term: "linear equation in two variables",
        definition: "an equation that can be written in the form ax + by + c = 0",
      },
      {
        term: "solution of a linear equation in two variables",
        definition: "an ordered pair that satisfies the equation",
      },
    );
  }

  for (const concept of seededConcepts) {
    const key = `${concept.term}::${concept.definition}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    concepts.push(concept);
  }

  const patterns = [
    /^(.{3,90}?)\s+(?:is|are|means|denotes|refers to|can be defined as|is defined as)\s+(.{12,170})$/i,
    /^(.{12,170}?)\s+is called\s+(.{3,90})$/i,
    /^(.{12,170}?)\s+are called\s+(.{3,90})$/i,
  ];

  for (const sentence of sentences) {
    for (const pattern of patterns) {
      const match = sentence.match(pattern);
      if (!match) continue;

      let term = "";
      let definition = "";

      if (/is called|are called/i.test(sentence)) {
        definition = normalizeMathText(match[1]).replace(/[.]+$/, "");
        term = normalizeMathText(match[2]).replace(/[.]+$/, "");
      } else {
        term = normalizeMathText(match[1]).replace(/[.]+$/, "");
        definition = normalizeMathText(match[2]).replace(/[.]+$/, "");
      }

      term = cleanText(term);
      definition = cleanText(definition);

      if (
        !term ||
        !definition ||
        term.length < 3 ||
        term.length > 90 ||
        definition.length < 12 ||
        definition.length > 170
      ) {
        continue;
      }

      if (
        /\bchapter\b|\bfigure\b|\btable\b|\bexample\b|\bexercise\b|\breprint\b/i.test(term) ||
        /\bchapter\b|\bfigure\b|\btable\b|\bexample\b|\bexercise\b|\breprint\b/i.test(definition)
      ) {
        continue;
      }

      const key = `${term}::${definition}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      concepts.push({ term, definition });
      break;
    }
  }

  return concepts;
}

function buildMathQuestionStem(term = "", chapterName = "") {
  const chapterLower = String(chapterName || "").toLowerCase();
  const normalizedTerm = term.toLowerCase();

  if (chapterLower.includes("trigon")) {
    if (normalizedTerm.includes("sine")) {
      return "What is the correct definition of sin theta in a right triangle?";
    }
    if (normalizedTerm.includes("cosine")) {
      return "What is the correct definition of cos theta in a right triangle?";
    }
    if (normalizedTerm.includes("tangent")) {
      return "What is the correct definition of tan theta in a right triangle?";
    }
    if (normalizedTerm.includes("complementary")) {
      return "Which statement about complementary angles is correct?";
    }
  }

  if (chapterLower.includes("linear equation")) {
    if (normalizedTerm.includes("solution")) {
      return "What is meant by a solution of a linear equation in two variables?";
    }
    if (normalizedTerm.includes("linear equation in two variables")) {
      return "Which statement correctly describes a linear equation in two variables?";
    }
  }

  return `Which of the following best describes ${term}?`;
}

function buildFallbackMathPaper({ contextText, chapterName, existingQuestions = [] }) {
  const concepts = extractMathConceptsFromContext(contextText, chapterName);
  const questions = [];
  const existingKeys = new Set(existingQuestions.map((item) => item.question.toLowerCase()));

  for (const concept of concepts) {
    if (questions.length + existingQuestions.length >= QUESTION_COUNT) break;

    const distractors = concepts
      .filter((candidate) => candidate.term.toLowerCase() !== concept.term.toLowerCase())
      .map((candidate) => candidate.definition)
      .filter((value, index, list) => list.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index)
      .slice(0, 3);

    if (distractors.length < 3) continue;

    const prompt = buildMathQuestionStem(concept.term, chapterName);
    const key = prompt.toLowerCase();
    if (existingKeys.has(key)) continue;

    const correctOption = concept.definition;
    const baseOptions = [correctOption, ...distractors];
    const rotatedOptions = baseOptions.map(
      (_, index) => baseOptions[(index + questions.length) % baseOptions.length],
    );

    questions.push({
      question: prompt,
      options: rotatedOptions,
      correctIndex: rotatedOptions.findIndex((option) => option === correctOption),
      explanation: `${concept.term} means ${concept.definition}.`,
    });

    existingKeys.add(key);
  }

  return questions;
}

function getSubjectInstructions({ subjectName, chapterName, difficultyLabel }) {
  const normalizedSubject = String(subjectName || "").toLowerCase();

  if (normalizedSubject.includes("math")) {
    return [
      `Difficulty target: ${difficultyLabel}.`,
      "Create a proper chapter-wise mathematics paper.",
      "Use RAG context to understand the chapter concepts first, then write original exam-style MCQs.",
      "Math notation must be JSON-safe: use plain text or Unicode symbols like theta, pi, x^2, sqrt(3), 2x + 3y = 5.",
      "Never use raw LaTeX commands with backslashes such as \\theta, \\pi, \\frac, or \\sqrt in the final JSON.",
      "Every maths question must be self-contained.",
      getMathChapterHints(chapterName),
    ].join(" ");
  }

  return [
    `Difficulty target: ${difficultyLabel}.`,
    "Create a proper chapter-wise science paper.",
    "Use the context to understand the chapter concepts first, then write original exam-style MCQs.",
    "Each question must be self-contained and syllabus-aligned.",
  ].join(" ");
}

async function repairQuestionsJson(rawContent, questionCount, subjectName) {
  const messages = [
    {
      role: "system",
      content: `Convert the user's content into valid JSON.
Return only valid JSON in this exact shape:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": 0,
      "explanation": "string"
    }
  ]
}

Rules:
- Keep exactly ${questionCount} questions if possible.
- If the source contains more, keep the best ${questionCount}.
- If the source contains fewer, preserve what exists.
- Use JSON-safe maths notation. Never use raw LaTeX backslash commands in final JSON.
- Do not add markdown fences or extra text.`,
    },
    {
      role: "user",
      content: `Subject: ${subjectName}\n\n${rawContent}`,
    },
  ];

  const result = await getTestModelContent({
    messages,
    maxCompletionTokens: 2500,
  });

  console.log(`Test JSON repair generated with model: ${result.modelUsed}`);
  return result.rawContent;
}

async function verifyQuestionsJson({
  rawQuestions,
  className,
  subjectName,
  chapterName,
  difficultyLabel,
  contextText,
}) {
  const messages = [
    {
      role: "system",
      content: `You are validating a chapter-wise MCQ paper before it is shown to a student.

Return only valid JSON in this exact shape:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": 0,
      "explanation": "string"
    }
  ]
}

Validation rules:
- Keep the same number of questions.
- Keep each question self-contained.
- Keep exactly 4 options per question.
- Verify the academically correct option for each question.
- correctIndex must point to the actually correct option.
- The explanation must support the same option as correctIndex.
- If the current explanation is right but correctIndex is wrong, fix correctIndex.
- If the current correctIndex is right but the explanation is wrong, fix the explanation.
- If both are wrong, fix both.
- Use JSON-safe maths notation. Never use raw LaTeX backslash commands.
- Return only valid JSON with no markdown fences and no extra text.`,
    },
    {
      role: "user",
      content: `Syllabus: NCERT
Class: ${className}
Subject: ${subjectName}
Chapter: ${chapterName}
Difficulty: ${difficultyLabel}

${cleanText(contextText) ? `Chapter context:
${contextText}
` : ""}Questions to validate:
${JSON.stringify({ questions: rawQuestions })}`,
    },
  ];

  const result = await getTestModelContent({
    messages,
    maxCompletionTokens: 3200,
  });

  console.log(`Test answer verification generated with model: ${result.modelUsed}`);
  return result.rawContent;
}

async function generateQuestionPaperWithModel({
  className,
  subjectName,
  chapterName,
  questionCount,
  difficultyLabel,
  contextText,
  feedback = "",
}) {
  const hasContext = Boolean(cleanText(contextText));
  const messages = [
    {
      role: "system",
      content: `You are an expert NCERT tutor who creates accurate MCQ papers from chapter context.

Return only valid JSON in this exact shape:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": 0,
      "explanation": "string"
    }
  ]
}

Global rules:
- Generate exactly ${questionCount} questions.
- Use the chapter context to understand concepts first, then write fresh, meaningful questions.
- Every question must be self-contained.
- Each question must have exactly 4 options.
- correctIndex must be 0, 1, 2, or 3.
- Keep explanations short and clear.
- Return only valid JSON.
- Do not use markdown fences.
- Do not use raw LaTeX backslash commands in final JSON.`,
    },
    {
      role: "user",
      content: `Syllabus: NCERT
Class: ${className}
Subject: ${subjectName}
Chapter: ${chapterName}
Difficulty: ${difficultyLabel}
Required Question Count: ${questionCount}

Subject-specific instructions:
${getSubjectInstructions({ subjectName, chapterName, difficultyLabel })}

Difficulty guidance:
${getDifficultyInstruction(difficultyLabel)}

${hasContext ? `Chapter context:
${contextText}` : `Use your NCERT knowledge of this exact class, subject, and chapter to generate a balanced test.
Do not invent content from a different class or different chapter.`}

${feedback}`.trim(),
    },
  ];

  const result = await getTestModelContent({
    messages,
    maxCompletionTokens: 3200,
  });
  const rawContent = result.rawContent;

  console.log(`Test paper generated with model: ${result.modelUsed}`);

  if (!rawContent) {
    throw new Error("The model returned an empty response.");
  }

  try {
    const parsedQuestions = parseQuestionsPayload(rawContent);
    if (!VERIFY_TEST_ANSWERS_WITH_AI) {
      return parsedQuestions;
    }

    const verifiedContent = await verifyQuestionsJson({
      rawQuestions: parsedQuestions,
      className,
      subjectName,
      chapterName,
      difficultyLabel,
      contextText,
    });
    return parseQuestionsPayload(verifiedContent);
  } catch (parseError) {
    const repairedContent = await repairQuestionsJson(rawContent, questionCount, subjectName);
    if (!repairedContent) {
      throw parseError;
    }
    const repairedQuestions = parseQuestionsPayload(repairedContent);
    if (!VERIFY_TEST_ANSWERS_WITH_AI) {
      return repairedQuestions;
    }

    const verifiedContent = await verifyQuestionsJson({
      rawQuestions: repairedQuestions,
      className,
      subjectName,
      chapterName,
      difficultyLabel,
      contextText,
    });
    return parseQuestionsPayload(verifiedContent);
  }
}

function isLikelyMathSubject(subjectName = "") {
  return String(subjectName || "").toLowerCase().includes("math");
}

function normalizeForComparison(text = "") {
  return normalizeMathText(text)
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/\s+/g, "")
    .replace(/√/g, "sqrt")
    .replace(/âˆš/g, "sqrt")
    .replace(/Â°/g, "°")
    .replace(/ï€/g, "pi")
    .replace(/π/g, "pi");
}

function canonicalTrigValue(value = "") {
  return normalizeForComparison(value)
    .replace(/sqrt3\/3/g, "1/sqrt3")
    .replace(/sqrt2\/2/g, "1/sqrt2");
}

function expectedTrigFunctionValue(func = "", angle = 0) {
  const values = {
    sin: {
      0: ["0"],
      30: ["1/2"],
      45: ["sqrt2/2", "1/sqrt2"],
      60: ["sqrt3/2"],
      90: ["1"],
    },
    cos: {
      0: ["1"],
      30: ["sqrt3/2"],
      45: ["sqrt2/2", "1/sqrt2"],
      60: ["1/2"],
      90: ["0"],
    },
    tan: {
      0: ["0"],
      30: ["1/sqrt3", "sqrt3/3"],
      45: ["1"],
      60: ["sqrt3"],
      90: ["undefined", "notdefined", "not defined"],
    },
  };

  return values[func]?.[angle] || null;
}

function inferTrigQuestionTruth(questionText = "", options = []) {
  const q = normalizeForComparison(questionText);
  const normalizedOptions = options.map((option) => normalizeForComparison(option));

  const directValueMatch = q.match(/\b(sin|cos|tan)(?:theta)?=?(?:of)?(\d{1,3})°/);
  if (directValueMatch) {
    const func = directValueMatch[1];
    const angle = Number(directValueMatch[2]);
    const expectedValues = expectedTrigFunctionValue(func, angle);

    if (expectedValues) {
      const index = normalizedOptions.findIndex((option) =>
        expectedValues.some((expected) => canonicalTrigValue(option) === canonicalTrigValue(expected)),
      );

      if (index !== -1) {
        return {
          correctIndex: index,
          explanation: `${func} ${angle}° = ${expectedValues[0]}.`,
        };
      }
    }
  }

  const ratioMatch = q.match(/\btantheta=([0-9.]+)\/([0-9.]+)/);
  if (ratioMatch && q.includes("whichistrue")) {
    const numerator = Number(ratioMatch[1]);
    const denominator = Number(ratioMatch[2]);

    if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) {
      let expectedRelation = "";
      if (numerator > denominator) expectedRelation = "sinθ>cosθ";
      if (numerator < denominator) expectedRelation = "sinθ<cosθ";
      if (numerator === denominator) expectedRelation = "sinθ=cosθ";

      if (expectedRelation) {
        const index = normalizedOptions.findIndex((option) => {
          const cleaned = option
            .replace(/theta/g, "θ")
            .replace(/sinθ/g, "sinθ")
            .replace(/cosθ/g, "cosθ");
          return cleaned === expectedRelation;
        });

        if (index !== -1) {
          return {
            correctIndex: index,
            explanation:
              numerator > denominator
                ? "Since tan theta = opposite/adjacent and it is greater than 1, opposite > adjacent, so sin theta > cos theta."
                : numerator < denominator
                  ? "Since tan theta = opposite/adjacent and it is less than 1, opposite < adjacent, so sin theta < cos theta."
                  : "Since tan theta = 1, opposite = adjacent, so sin theta = cos theta.",
          };
        }
      }
    }
  }

  if (q.includes("definitionof") || q.includes("correctdefinitionof")) {
    const lookup = [
      {
        tokens: ["sintheta", "sinθ"],
        expected: ["opposite/hypotenuse", "oppositeside/hypotenuse"],
        explanation: "sin theta is the ratio of the opposite side to the hypotenuse.",
      },
      {
        tokens: ["costheta", "cosθ"],
        expected: ["adjacent/hypotenuse", "adjacentside/hypotenuse"],
        explanation: "cos theta is the ratio of the adjacent side to the hypotenuse.",
      },
      {
        tokens: ["tantheta", "tanθ"],
        expected: ["opposite/adjacent", "oppositeside/adjacentside"],
        explanation: "tan theta is the ratio of the opposite side to the adjacent side.",
      },
    ];

    for (const item of lookup) {
      if (!item.tokens.some((token) => q.includes(token))) continue;

      const index = normalizedOptions.findIndex((option) =>
        item.expected.some((expected) => option.includes(expected)),
      );

      if (index !== -1) {
        return {
          correctIndex: index,
          explanation: item.explanation,
        };
      }
    }
  }

  return null;
}

function inferDeterministicMathTruth(questionText = "", options = [], chapterName = "") {
  const chapterLower = String(chapterName || "").toLowerCase();

  if (chapterLower.includes("trigon")) {
    return inferTrigQuestionTruth(questionText, options);
  }

  return null;
}

function isValidQuestionText(text = "", subjectName = "") {
  const value = normalizeMathText(text);
  if (!value || value.length < 12 || value.length > 220) return false;
  if (/\baccording to this chapter\b|\bfrom this chapter\b/i.test(value)) return false;
  if (/\bshown above\b|\bgiven above\b|\bfigure\b|\btable\b/i.test(value)) return false;
  if (!/[?]$/.test(value)) return false;

  if (isLikelyMathSubject(subjectName)) {
    if (/\bwhat is pq\b|\bwhat is ab\b/i.test(value)) return false;
  }

  return true;
}

function isValidOptionText(text = "", subjectName = "") {
  const value = normalizeLabel(text);
  if (!value || value.length < 1 || value.length > 160) return false;
  if (/\baccording to this chapter\b|\bfrom this chapter\b/i.test(value)) return false;
  if (/\bshown above\b|\bgiven above\b/i.test(value)) return false;

  if (isLikelyMathSubject(subjectName)) {
    if (/^\\[a-z]+/i.test(String(text || ""))) return false;
  }

  return true;
}

function inferCorrectIndexFromExplanation(question = {}) {
  const options = Array.isArray(question?.options) ? question.options : [];
  const explanation = normalizeMathText(question?.explanation || "").toLowerCase();

  if (!options.length || !explanation) {
    return null;
  }

  const numericOptionMatch = explanation.match(/\boption\s+([1-4])\b/i);
  if (numericOptionMatch) {
    return Number(numericOptionMatch[1]) - 1;
  }

  const letterOptionMatch = explanation.match(/\boption\s+([a-d])\b/i);
  if (letterOptionMatch) {
    return letterOptionMatch[1].toUpperCase().charCodeAt(0) - 65;
  }

  const matchingOptions = options
    .map((option, index) => ({
      index,
      value: normalizeLabel(option).toLowerCase(),
    }))
    .filter((item) => item.value && explanation.includes(item.value));

  if (matchingOptions.length === 1) {
    return matchingOptions[0].index;
  }

  return null;
}

function normalizeQuestion(question, index, subjectName, chapterName = "") {
  const questionText = normalizeMathText(question?.question);
  const options = Array.isArray(question?.options)
    ? question.options.map((opt) => normalizeLabel(opt)).filter(Boolean)
    : [];
  let correctIndex = Number(question?.correctIndex);

  if (
    !isValidQuestionText(questionText, subjectName) ||
    options.length < 4 ||
    !Number.isInteger(correctIndex) ||
    correctIndex < 0 ||
    correctIndex > 3
  ) {
    return null;
  }

  const normalizedOptions = options.slice(0, 4);
  if (!normalizedOptions.every((option) => isValidOptionText(option, subjectName))) {
    return null;
  }

  const uniqueOptions = new Set(normalizedOptions.map((option) => option.toLowerCase()));
  if (uniqueOptions.size !== normalizedOptions.length) {
    return null;
  }

  const inferredCorrectIndex = inferCorrectIndexFromExplanation({
    options: normalizedOptions,
    explanation: question?.explanation || "",
  });

  if (Number.isInteger(inferredCorrectIndex) && inferredCorrectIndex >= 0 && inferredCorrectIndex <= 3) {
    correctIndex = inferredCorrectIndex;
  }

  const deterministicTruth = inferDeterministicMathTruth(
    questionText,
    normalizedOptions,
    chapterName,
  );

  let explanation = normalizeMathText(question?.explanation || "");
  if (deterministicTruth && Number.isInteger(deterministicTruth.correctIndex)) {
    correctIndex = deterministicTruth.correctIndex;
    if (deterministicTruth.explanation) {
      explanation = deterministicTruth.explanation;
    }
  }

  return {
    id: index + 1,
    question: questionText,
    options: normalizedOptions,
    correct: correctIndex,
    explanation,
  };
}

function collectValidQuestions(rawQuestions = [], subjectName = "", chapterName = "") {
  if (!Array.isArray(rawQuestions)) return [];

  return rawQuestions
    .map((question, index) => normalizeQuestion(question, index, subjectName, chapterName))
    .filter(Boolean);
}

export async function generateTestPrepQuestions(req, res) {
  try {
    const chapterId = cleanText(req.body?.chapterId);
    const requestedDifficulty = cleanText(req.body?.difficulty || "easy");

    if (!chapterId) {
      return res.status(400).json({ success: false, message: "chapterId is required" });
    }

    const { className, subjectName, chapterName } = parseChapterMeta(chapterId);

    if (!className || !subjectName || !chapterName) {
      return res.status(400).json({
        success: false,
        message: "Invalid chapterId format. Expected 'className/subjectName/chapterName'.",
      });
    }

    let questions = [];
    let feedback = "";
    const difficultyLabel = getDifficultyLabel(requestedDifficulty);
    let contextText = "";
    let ragLoaded = false;
    // TODO: Use ExerciseQuestionIndex and chapter RAG as first step for chapter-specific MCQ generation instead of fallback-only RAG.

    for (let attempt = 1; attempt <= 3; attempt++) {
      const remainingCount = QUESTION_COUNT - questions.length;
      if (remainingCount <= 0) break;

      try {
        const generatedQuestions = await generateQuestionPaperWithModel({
          className,
          subjectName,
          chapterName,
          questionCount: remainingCount,
          difficultyLabel,
          contextText,
          feedback,
        });

        const validQuestions = collectValidQuestions(generatedQuestions, subjectName, chapterName);
        const existingQuestionKeys = new Set(questions.map((item) => item.question.toLowerCase()));

        for (const question of validQuestions) {
          const key = question.question.toLowerCase();
          if (existingQuestionKeys.has(key)) continue;
          existingQuestionKeys.add(key);
          questions.push({
            ...question,
            id: questions.length + 1,
          });
          if (questions.length === QUESTION_COUNT) break;
        }

        if (questions.length === QUESTION_COUNT) {
          return res.json({
            success: true,
            chapterId,
            chapterName,
            difficulty: difficultyLabel,
            questionCount: questions.length,
            questions,
          });
        }

        feedback = [
          `You returned only ${questions.length} usable questions so far.`,
          `Generate ${QUESTION_COUNT - questions.length} more questions.`,
          "Keep the new questions self-contained and non-duplicate.",
          isLikelyMathSubject(subjectName)
            ? "For maths, keep notation JSON-safe and avoid raw LaTeX backslashes."
            : "",
        ]
          .filter(Boolean)
          .join(" ");
      } catch (error) {
        if (!ragLoaded) {
          try {
            const ragContext = await getChapterRagContext(
              `Understand the core NCERT concepts, definitions, formulas, and direct applications for the chapter ${chapterName}.`,
              chapterId,
              {
                topK: isLikelyMathSubject(subjectName) ? 10 : 8,
                minSimilarity: 0.12,
                maxContextChars: MAX_CONTEXT_CHARS,
              },
            );

            contextText = buildCleanContext(ragContext);
            ragLoaded = true;
          } catch (ragError) {
            console.warn(`RAG context load failed for ${chapterId}: ${ragError.message}`);
            ragLoaded = true;
          }
        }

        console.warn(`Attempt ${attempt} failed for ${chapterId}: ${error.message}`);
        feedback = [
          `The previous response failed because: ${error.message}.`,
          `Return exactly ${remainingCount} valid questions.`,
          "Do not use markdown.",
          "Return only valid JSON.",
          contextText
            ? "Use the supplied chapter context carefully and stay within that chapter only."
            : "Stay strictly within the named NCERT chapter only.",
          isLikelyMathSubject(subjectName)
            ? "Use plain text or Unicode for symbols like theta, pi, and equations."
            : "",
        ]
          .filter(Boolean)
          .join(" ");
      }
    }

    if (
      isLikelyMathSubject(subjectName) &&
      questions.length < QUESTION_COUNT &&
      !contextText &&
      !ragLoaded
    ) {
      try {
        const ragContext = await getChapterRagContext(
          `Understand the core NCERT concepts, definitions, formulas, and direct applications for the chapter ${chapterName}.`,
          chapterId,
          {
            topK: 10,
            minSimilarity: 0.12,
            maxContextChars: MAX_CONTEXT_CHARS,
          },
        );

        contextText = buildCleanContext(ragContext);
      } catch (ragError) {
        console.warn(`Fallback RAG context load failed for ${chapterId}: ${ragError.message}`);
      } finally {
        ragLoaded = true;
      }
    }

    if (
      isLikelyMathSubject(subjectName) &&
      questions.length < QUESTION_COUNT &&
      getCleanContextSentences(contextText).length >= MIN_FALLBACK_CONTEXT_SENTENCES
    ) {
      const fallbackQuestions = buildFallbackMathPaper({
        contextText,
        chapterName,
        existingQuestions: questions,
      });

      const seenKeys = new Set(questions.map((item) => item.question.toLowerCase()));
      for (const question of fallbackQuestions) {
        const key = question.question.toLowerCase();
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);

        const normalized = normalizeQuestion(question, questions.length, subjectName, chapterName);
        if (!normalized) continue;

        questions.push({
          ...normalized,
          id: questions.length + 1,
        });

        if (questions.length === QUESTION_COUNT) {
          return res.json({
            success: true,
            chapterId,
            chapterName,
            difficulty: difficultyLabel,
            questionCount: questions.length,
            questions,
          });
        }
      }
    }

    throw new Error(
      `Unable to generate ${QUESTION_COUNT} valid questions right now for ${chapterName}.`,
    );
  } catch (error) {
    console.error(`Failed to generate test prep questions for chapter ${req.body?.chapterId}:`, error);
    res.status(500).json({
      success: false,
      error: "GENERATION_FAILED",
      message: error.message || "An unexpected error occurred while generating the test.",
    });
  }
}
