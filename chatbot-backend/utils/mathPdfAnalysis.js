const MATH_PATTERNS = [
  /\blim\b/i,
  /∫|\\int/i,
  /\bderivative\b/i,
  /\bd\s*\/\s*dx\b/i,
  /\bdy\s*\/\s*dx\b/i,
  /\b(?:sin|cos|tan|cot|sec|cosec)\b/i,
  /\blog\b/i,
  /\b(?:sqrt|root)\b|√/i,
  /\^[\w({]/,
  /[≤≥<>]=?|≠|≈/,
  /\b(?:theorem|proof|prove|equation|identity|formula)\b/i,
  /\d+\s*\/\s*\d+/,
  /[a-z]\s*\/\s*[a-z]/i,
];

const SCIENCE_DIAGRAM_PATTERNS = [
  /\bdiagram\b/i,
  /\bfig\.?(?:ure)?\b/i,
  /\bray\s+diagram\b/i,
  /\bcircuit\b/i,
  /\blabelled\s+diagram\b/i,
  /\bgraph\b/i,
  /\btable\b/i,
  /\bchemical\s+equation\b/i,
  /\b(?:reaction|reactant|product|balanced equation)\b/i,
];

const FIGURE_REF_PATTERN = /\b(?:Fig\.?|Figure)\s*([A-Z]?\d+(?:\.\d+)+)\b/gi;

export function detectMathContent(text = "") {
  return MATH_PATTERNS.some((pattern) => pattern.test(String(text || "")));
}

export function detectScienceDiagramContent(text = "") {
  return SCIENCE_DIAGRAM_PATTERNS.some((pattern) => pattern.test(String(text || "")));
}

export function collectFigureRefsFromText(text = "") {
  const refs = new Set();
  FIGURE_REF_PATTERN.lastIndex = 0;
  let match = FIGURE_REF_PATTERN.exec(String(text || ""));

  while (match) {
    if (match[1]) refs.add(match[1]);
    match = FIGURE_REF_PATTERN.exec(String(text || ""));
  }

  return Array.from(refs);
}

export function isTextLikelyCorrupted(text = "") {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (!value) return true;

  const tokens = value.split(/\s+/).filter(Boolean);
  if (tokens.length < 4) return true;

  const singleCharTokens = tokens.filter((token) => /^[A-Za-z0-9+\-*/=()^]$/.test(token));
  const symbolTokens = tokens.filter((token) => /^[^A-Za-z0-9]+$/.test(token));
  const singleCharRatio = singleCharTokens.length / tokens.length;
  const symbolRatio = symbolTokens.length / tokens.length;
  const repeatedVariableRuns = /\b([a-z])\s+\1\s+\1\b/i.test(value);
  const separatedExpressionNoise = /(?:\b[a-z]\b\s*){5,}/i.test(value);
  const suspiciousLimit =
    /\blim\b/i.test(value) &&
    !/(?:x|n|h|t)\s*(?:→|->|to)\s*[-+]?\d|(?:x|n|h|t)\s*→/i.test(value);
  const suspiciousCalculus =
    /∫|\\int|\bderivative\b|\bd\s*\/\s*dx\b|\bdy\s*\/\s*dx\b/i.test(value) &&
    singleCharRatio > 0.35;
  const fractionLooksFlattened =
    /\b(?:lim|sin|cos|tan|log)\b/i.test(value) &&
    /\d+\s+\d+\s+\d+/.test(value) &&
    !/[()/]/.test(value);

  return (
    singleCharRatio > 0.45 ||
    symbolRatio > 0.35 ||
    repeatedVariableRuns ||
    separatedExpressionNoise ||
    suspiciousLimit ||
    suspiciousCalculus ||
    fractionLooksFlattened
  );
}

export function analyzePageText(rawText = "", ocrText = "") {
  const combinedText = [rawText, ocrText].filter(Boolean).join(" ");
  const mathDetected = detectMathContent(combinedText);
  const diagramDetected = detectScienceDiagramContent(combinedText);
  const textCorrupted = isTextLikelyCorrupted(rawText);

  return {
    mathDetected,
    diagramDetected,
    figureRefs: collectFigureRefsFromText(combinedText),
    textCorrupted,
  };
}
