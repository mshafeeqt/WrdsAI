import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import OpenAI from "openai";
import dotenv from "dotenv";

let basePath = path.join(process.cwd(), "chatbot-backend");
if (!fs.existsSync(basePath)) {
  basePath = process.cwd();
}

dotenv.config({ path: path.join(basePath, ".env") });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DATA_DIR = path.join(basePath, "Math_Data");
const INDEX_FILE = path.join(basePath, "MathDataEmbeddings.json");
const LEGACY_INDEX_FILE = path.join(basePath, "MathDataIndex.json");
const EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_TOP_K = 5;
const DEFAULT_MIN_SIMILARITY = 0.35;
const DEFAULT_MAX_CONTEXT_CHARS = 4500;
const DEFAULT_LEXICAL_MIN_SCORE = 2;

let cachedIndex = null;
let cachedIndexMtime = 0;
const pdfTextCache = new Map();

export function normalizeChapterName(chapterName = "") {
  const normalized = String(chapterName)
    .replace(/\\/g, "/")
    .replace(/\.pdf$/i, "")
    .trim();
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] || normalized;
}

function normalizeChapterId(chapterName = "") {
  return String(chapterName).replace(/\\/g, "/").replace(/\.pdf$/i, "").trim();
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

function buildChapterId(filePath) {
  const relativePath = path.relative(DATA_DIR, filePath);
  return normalizeChapterId(relativePath);
}

function matchesChapterId(candidate = "", target = "") {
  const normalizedCandidate = normalizeChapterId(candidate);
  const normalizedTarget = normalizeChapterId(target);
  return (
    normalizedCandidate === normalizedTarget ||
    normalizeChapterName(normalizedCandidate) === normalizeChapterName(normalizedTarget)
  );
}

function chunkText(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  for (let startIdx = 0; startIdx < text.length; startIdx += chunkSize - overlap) {
    chunks.push({
      content: text.substring(startIdx, startIdx + chunkSize),
      startIdx,
    });
  }
  return chunks;
}

function buildQueryKeywords(query = "") {
  return Array.from(
    new Set(
      String(query)
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 3),
    ),
  );
}

function lexicalScore(content = "", keywords = []) {
  const lowerContent = content.toLowerCase();
  let score = 0;
  for (const keyword of keywords) {
    if (lowerContent.includes(keyword)) score += 1;
  }
  return score;
}

function getPdfPathForChapter(chapterName) {
  const targetId = normalizeChapterId(chapterName);
  return listPdfFilesRecursively(DATA_DIR).find((filePath) =>
    matchesChapterId(buildChapterId(filePath), targetId),
  );
}

async function loadPdfChunksForChapter(chapterName) {
  const filePath = getPdfPathForChapter(chapterName);
  if (!filePath) return [];

  const stat = fs.statSync(filePath);
  const cacheKey = `${filePath}:${stat.mtimeMs}`;
  if (pdfTextCache.has(cacheKey)) {
    return pdfTextCache.get(cacheKey);
  }

  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  const text = data.text.replace(/\s+/g, " ").trim();
  const chunks = chunkText(text).map((chunk, index) => ({
    chapter: buildChapterId(filePath),
    content: chunk.content,
    metadata: {
      source: path.relative(DATA_DIR, filePath).replace(/\\/g, "/"),
      chunkIndex: index,
      startIdx: chunk.startIdx,
    },
  }));

  pdfTextCache.clear();
  pdfTextCache.set(cacheKey, chunks);
  return chunks;
}

async function getLexicalChapterContext(query, chapterName, options = {}) {
  const normalizedChapter = normalizeChapterId(chapterName);
  const keywords = buildQueryKeywords(query);
  const {
    topK = DEFAULT_TOP_K,
    maxContextChars = DEFAULT_MAX_CONTEXT_CHARS,
  } = options;

  const chunks = await loadPdfChunksForChapter(normalizedChapter);
  if (!chunks.length) {
    return { chapter: normalizedChapter, matches: [], contextText: "" };
  }

  const matches = chunks
    .map((chunk) => ({
      ...chunk,
      similarity: lexicalScore(chunk.content, keywords),
    }))
    .filter((chunk) => chunk.similarity >= DEFAULT_LEXICAL_MIN_SCORE)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  let consumedChars = 0;
  const contextBlocks = [];

  for (const match of matches) {
    const block = [
      `Chapter: ${normalizeChapterName(normalizedChapter)}`,
      `Source: ${match.metadata?.source || `${normalizeChapterName(normalizedChapter)}.pdf`}`,
      `Lexical Score: ${match.similarity}`,
      `Excerpt: ${match.content}`,
    ].join("\n");

    if (consumedChars + block.length > maxContextChars && contextBlocks.length) {
      break;
    }

    contextBlocks.push(block);
    consumedChars += block.length;
  }

  return {
    chapter: normalizedChapter,
    matches,
    contextText: contextBlocks.join("\n\n---\n\n"),
  };
}

function getAvailableIndexFile() {
  if (fs.existsSync(INDEX_FILE)) return INDEX_FILE;
  if (fs.existsSync(LEGACY_INDEX_FILE)) return LEGACY_INDEX_FILE;
  return null;
}

function loadIndexFromDisk() {
  const filePath = getAvailableIndexFile();
  if (!filePath) return [];

  const fileMtime = fs.statSync(filePath).mtimeMs;
  if (cachedIndex && cachedIndexMtime === fileMtime) {
    return cachedIndex;
  }

  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  cachedIndex = Array.isArray(parsed) ? parsed : [];
  cachedIndexMtime = fileMtime;
  return cachedIndex;
}

async function ensureIndexLoaded() {
  if (!getAvailableIndexFile()) {
    await indexMathData();
  }

  return loadIndexFromDisk();
}

/**
 * Extract text and generate embeddings for all PDFs.
 */
export const indexMathData = async () => {
  console.log("Starting NCERT Semantic Indexing...");
  const files = listPdfFilesRecursively(DATA_DIR);
  const index = [];

  for (const filePath of files) {
    const buffer = fs.readFileSync(filePath);

    try {
      const data = await pdfParse(buffer);
      const text = data.text.replace(/\s+/g, " ").trim();
      const chapterName = buildChapterId(filePath);
      const sourceName = path.relative(DATA_DIR, filePath).replace(/\\/g, "/");

      const chunkSize = 1000;
      const overlap = 200;
      const chunks = [];

      for (let startIdx = 0; startIdx < text.length; startIdx += chunkSize - overlap) {
        chunks.push({
          content: text.substring(startIdx, startIdx + chunkSize),
          startIdx,
        });
      }

      console.log(`Generating embeddings for ${chunks.length} chunks in ${sourceName}...`);

      for (let i = 0; i < chunks.length; i += 20) {
        const batch = chunks.slice(i, i + 20);
        const response = await openai.embeddings.create({
          model: EMBEDDING_MODEL,
          input: batch.map((chunk) => chunk.content),
        });

        response.data.forEach((item, indexInBatch) => {
          const chunk = batch[indexInBatch];
          index.push({
            chapter: chapterName,
            content: chunk.content,
            embedding: item.embedding,
            metadata: {
              source: sourceName,
              chunkIndex: i + indexInBatch,
              startIdx: chunk.startIdx,
            },
          });
        });
      }

      console.log(`Indexed: ${sourceName}`);
    } catch (error) {
      console.error(`Failed to process ${filePath}:`, error.message);
    }
  }

  fs.writeFileSync(INDEX_FILE, JSON.stringify(index));
  cachedIndex = index;
  cachedIndexMtime = fs.statSync(INDEX_FILE).mtimeMs;
  console.log(`Semantic index saved with ${index.length} chunks.`);
};

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magA * magB);
}

export const searchNCERT = async (query, chapterName = null, topK = 6) => {
  let index = await ensureIndexLoaded();

  if (chapterName) {
    const targetChapter = normalizeChapterId(chapterName);
    index = index.filter(
      (chunk) => matchesChapterId(chunk.chapter, targetChapter),
    );
  }

  if (index.length === 0) {
    return null;
  }

  const queryResponse = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: query,
  });
  const queryEmbedding = queryResponse.data[0].embedding;

  const scoredChunks = index.map((chunk) => ({
    ...chunk,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  const results = scoredChunks
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  if (results.length === 0 || results[0].similarity < 0.45) {
    return null;
  }

  const highQualityResults = results.filter((r) => r.similarity >= 0.4);
  if (highQualityResults.length === 0) return null;

  return highQualityResults
    .map(
      (r) =>
        `[NCERT File: ${r.chapter}] (Relevance: ${(r.similarity * 100).toFixed(1)}%)\n${r.content}`,
    )
    .join("\n\n");
};

export const getChapterRagContext = async (
  query,
  chapterName,
  options = {},
) => {
  const normalizedChapter = normalizeChapterName(chapterName);
  const normalizedChapterId = normalizeChapterId(chapterName);
  if (!normalizedChapter || !query?.trim()) {
    return { chapter: normalizedChapterId, matches: [], contextText: "" };
  }

  const {
    topK = DEFAULT_TOP_K,
    minSimilarity = DEFAULT_MIN_SIMILARITY,
    maxContextChars = DEFAULT_MAX_CONTEXT_CHARS,
  } = options;

  const index = (await ensureIndexLoaded()).filter(
    (chunk) => matchesChapterId(chunk.chapter, normalizedChapterId),
  );

  if (index.length === 0) {
    return getLexicalChapterContext(query, normalizedChapterId, options);
  }

  let queryEmbedding;
  try {
    const queryResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: query,
    });
    queryEmbedding = queryResponse.data[0].embedding;
  } catch (error) {
    console.warn("Embedding lookup failed, using lexical chapter fallback:", error.message);
    return getLexicalChapterContext(query, normalizedChapterId, options);
  }

  const matches = index
    .map((chunk) => ({
      ...chunk,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .filter((chunk) => Number.isFinite(chunk.similarity))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .filter((chunk) => chunk.similarity >= minSimilarity);

  let consumedChars = 0;
  const contextBlocks = [];

  for (const match of matches) {
    const block = [
      `Chapter: ${normalizeChapterName(normalizedChapterId)}`,
      `Source: ${match.metadata?.source || `${normalizeChapterName(normalizedChapterId)}.pdf`}`,
      `Similarity: ${(match.similarity * 100).toFixed(1)}%`,
      `Excerpt: ${match.content}`,
    ].join("\n");

    if (consumedChars + block.length > maxContextChars && contextBlocks.length) {
      break;
    }

    contextBlocks.push(block);
    consumedChars += block.length;
  }

  return {
    chapter: normalizedChapterId,
    matches,
    contextText: contextBlocks.join("\n\n---\n\n"),
  };
};
