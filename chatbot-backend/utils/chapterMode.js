const SUMMARY_PATTERNS = [
  /\bsummar(y|ize|ise)\b/i,
  /\boverview\b/i,
  /\brevision\b/i,
  /\brev(i|ie)se\b/i,
  /\bnotes?\b/i,
  /\bkey points?\b/i,
  /\bimportant points?\b/i,
  /\bchapter summary\b/i,
];

const FOLLOW_UP_PATTERNS = [
  /\bmore\b/i,
  /\banother\b/i,
  /\bsuch\b/i,
  /\blike this\b/i,
  /\bthese\b/i,
  /\bthose\b/i,
  /\bit\b/i,
  /\bthem\b/i,
  /\bexamples?\b/i,
  /\bexplain\b/i,
  /\belaborate\b/i,
  /\bsimple\b/i,
];

const BROAD_DOCUMENT_PATTERNS = [
  /\bclass\s*\d+\b/i,
  /_class\s*\d+/i,
  /\bbook\b/i,
];

function trimEntry(value = "", maxLength = 280) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export function buildChapterConversationBlock(history = [], limit = 3) {
  const recentEntries = history
    .filter((entry) => entry?.prompt || entry?.response)
    .slice(-limit);

  if (!recentEntries.length) {
    return "";
  }

  return recentEntries
    .map((entry, index) => {
      const prompt = trimEntry(entry.prompt);
      const response = trimEntry(entry.response, 360);
      return [
        `Exchange ${index + 1} User: ${prompt || "(empty)"}`,
        `Exchange ${index + 1} Assistant: ${response || "(empty)"}`,
      ].join("\n");
    })
    .join("\n\n");
}

function isFollowUpPrompt(prompt = "") {
  const text = String(prompt || "");
  return FOLLOW_UP_PATTERNS.some((pattern) => pattern.test(text));
}

function isBroadDocumentSelection(selectedChapter = "") {
  const text = String(selectedChapter || "");
  return BROAD_DOCUMENT_PATTERNS.some((pattern) => pattern.test(text));
}

export function buildChapterRagQuery({
  prompt,
  selectedChapter,
  history = [],
}) {
  const shouldUseMemory = isFollowUpPrompt(prompt);
  const chapterMemory = shouldUseMemory
    ? buildChapterConversationBlock(history)
    : "";
  const currentPrompt = String(prompt || "").trim();

  if (!chapterMemory) {
    return currentPrompt;
  }

  // Chapter-mode retrieval uses a short window of prior Q/A so follow-ups like
  // "give two more such examples" can still retrieve the right textbook chunks.
  return `
Selected chapter: ${selectedChapter}

Recent chapter conversation:
${chapterMemory}

Current user request:
${currentPrompt}
`.trim();
}

export function getChapterRagOptions({
  prompt,
  history = [],
  selectedChapter = "",
}) {
  const text = String(prompt || "");
  const hasHistory = Array.isArray(history) && history.length > 0;
  const isSummaryRequest = SUMMARY_PATTERNS.some((pattern) => pattern.test(text));
  const isFollowUpRequest = FOLLOW_UP_PATTERNS.some((pattern) => pattern.test(text));
  const isBroadDocument = isBroadDocumentSelection(selectedChapter);

  if (isSummaryRequest && isBroadDocument) {
    return {
      topK: 12,
      minSimilarity: 0.12,
      maxContextChars: 10000,
    };
  }

  if (isSummaryRequest) {
    return {
      topK: 9,
      minSimilarity: 0.16,
      maxContextChars: 9000,
    };
  }

  if (isBroadDocument && (isFollowUpRequest || hasHistory)) {
    return {
      topK: 8,
      minSimilarity: 0.16,
      maxContextChars: 7000,
    };
  }

  if (isBroadDocument) {
    return {
      topK: 8,
      minSimilarity: 0.18,
      maxContextChars: 7000,
    };
  }

  if (isFollowUpRequest || hasHistory) {
    return {
      topK: 6,
      minSimilarity: 0.2,
      maxContextChars: 5000,
    };
  }

  return {
    topK: 5,
    minSimilarity: 0.25,
    maxContextChars: 4000,
  };
}
