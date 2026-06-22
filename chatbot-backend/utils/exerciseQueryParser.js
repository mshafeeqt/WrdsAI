const EXERCISE_PATTERNS = [
  /\b(?:exercise|ex|ex\.)\s*(?:set\s*)?([A-Z]?\d+(?:\.\d+)+)\b/i,
  /\b([A-Z]?\d+(?:\.\d+)+)\s*(?:exercise|ex|ex\.)\b/i,
  /\bfrom\s+([A-Z]?\d+(?:\.\d+)+)\b/i,
];

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
  const exercise = findFirstMatch(text, EXERCISE_PATTERNS);
  const questionNo = findFirstMatch(text, QUESTION_PATTERNS);
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
