const EXERCISE_PATTERNS = [
  /\b(?:exercise|ex|ex\.)\s*(?:set\s*)?([A-Z]?\d+(?:\.\d+)+)\b/i,
  /\b([A-Z]?\d+(?:\.\d+)+)\s*(?:exercise|ex|ex\.)\b/i,
  /\bfrom\s+([A-Z]?\d+(?:\.\d+)+)\b/i,
];

const NCERT_NUMBERED_QUESTION_PATTERN =
  /\b(?:q(?:uestion)?|que|ques|problem|prob)\s*(?:no\.?|number)?\s*([A-Z]?\d{1,2})\.(\d+[a-z]?)\b/i;
const BARE_NCERT_NUMBERED_QUESTION_PATTERN =
  /(?:\b(?:solve|answer|do|find|explain|show)\s+(?:the\s+)?)([A-Z]?\d{1,2})\.(\d+[a-z]?)\b|\b([A-Z]?\d{1,2})\.(\d+[a-z]?)\s+from\s+exercises?\b/i;

const QUESTION_PATTERNS = [
  /\bq(?:uestion|ue)?\.?\s*(?:no\.?|number)?\s*(\d+[a-z]?)\b/i,
  /\b(?:question|que|ques)\s*(?:no\.?|number)?\s*(\d+[a-z]?)\b/i,
  /\b(?:problem|prob)\s*(?:no\.?|number)?\s*(\d+[a-z]?)\b/i,
  /\b(?:number|no\.?)\s*(\d+[a-z]?)\b/i,
  /\b(\d+)(?:st|nd|rd|th)\s*(?:question|que|ques|problem|prob|number|no\.?)\b/i,
  /\b(?:question|que|ques|problem|prob|number|no\.?)\s*(\d+)(?:st|nd|rd|th)\b/i,
];

const FIGURE_PATTERNS = [
  /\b(?:figure|fig\.?)\s*([A-Z]?\d+(?:\.\d+)+)\b/gi,
  /\bdiagram\b/gi,
];

export function parseExerciseQuery(prompt = "") {
  const text = String(prompt || "").replace(/\s+/g, " ").trim();
  const explicitExercise = findFirstMatch(text, EXERCISE_PATTERNS);
  const numberedQuestion = parseNcertNumberedQuestion(text);
  const exercise = explicitExercise || numberedQuestion?.exercise || null;
  const questionNo = explicitExercise
    ? findFirstMatch(text, QUESTION_PATTERNS)
    : numberedQuestion?.questionNo || findFirstMatch(text, QUESTION_PATTERNS);
  const figureRefs = findFigureRefs(text);
  const hasFigureReference =
    figureRefs.length > 0 || /\bdiagram\b|\bshown\s+(?:below|in)\b/i.test(text);

  return {
    isExerciseQuery: Boolean(exercise || questionNo || hasFigureReference),
    exercise,
    questionNo,
    hasFigureReference,
    figureRefs,
  };
}

function parseNcertNumberedQuestion(text) {
  const value = String(text || "");
  const match = value.match(NCERT_NUMBERED_QUESTION_PATTERN);
  if (match?.[1] && match?.[2]) {
    return {
      exercise: normalizeValue(match[1]),
      questionNo: normalizeValue(match[2]),
    };
  }

  const bareMatch = value.match(BARE_NCERT_NUMBERED_QUESTION_PATTERN);
  const exercise = bareMatch?.[1] || bareMatch?.[3];
  const questionNo = bareMatch?.[2] || bareMatch?.[4];
  if (!exercise || !questionNo) return null;

  return {
    exercise: normalizeValue(exercise),
    questionNo: normalizeValue(questionNo),
  };
}

function findFirstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return normalizeValue(match[1]);
    }
  }

  return null;
}

function findFigureRefs(text) {
  const refs = new Set();

  for (const pattern of FIGURE_PATTERNS) {
    pattern.lastIndex = 0;
    let match = pattern.exec(text);
    while (match) {
      if (match[1]) refs.add(normalizeValue(match[1]));
      match = pattern.exec(text);
    }
  }

  return Array.from(refs);
}

function normalizeValue(value = "") {
  return String(value || "").trim().replace(/\.$/, "");
}
