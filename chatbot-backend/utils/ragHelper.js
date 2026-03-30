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

/**
 * Extract text and generate embeddings for all PDFs.
 */
export const indexMathData = async () => {
    console.log("🚀 Starting NCERT Semantic Indexing...");
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".pdf"));
    const index = [];

    for (const file of files) {
        const filePath = path.join(DATA_DIR, file);
        const buffer = fs.readFileSync(filePath);
        
        try {
            const data = await pdfParse(buffer);
            const text = data.text.replace(/\s+/g, " ").trim();
            const chapterName = file.replace(".pdf", "");

            // Chunking into 1000 chars (~250-300 tokens)
            const chunkSize = 1000;
            const overlap = 200;
            const chunks = [];
            
            for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
                chunks.push(text.substring(i, i + chunkSize));
            }

            console.log(`📡 Generating embeddings for ${chunks.length} chunks in ${file}...`);
            
            // Process embeddings in batches of 20 to avoid rate limits
            for (let i = 0; i < chunks.length; i += 20) {
                const batch = chunks.slice(i, i + 20);
                const response = await openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: batch,
                });

                response.data.forEach((item, indexInBatch) => {
                    index.push({
                        chapter: chapterName,
                        content: batch[indexInBatch],
                        embedding: item.embedding
                    });
                });
            }
            console.log(`✅ Indexed: ${file}`);
        } catch (error) {
            console.error(`❌ Failed to process ${file}:`, error.message);
        }
    }

    fs.writeFileSync(INDEX_FILE, JSON.stringify(index));
    console.log(`✨ Semantic index saved with ${index.length} chunks.`);
};

/**
 * Cosine Similarity
 */
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magA * magB);
}

/**
 * Search relevant chunks using Semantic Search.
 */
export const searchNCERT = async (query, chapterName = null, topK = 6) => {
    if (!fs.existsSync(INDEX_FILE)) {
        await indexMathData();
    }

    let index = JSON.parse(fs.readFileSync(INDEX_FILE));
    
    // 1. Filter by chapter if provided
    if (chapterName) {
        // Remove .pdf extension if present in chapterName
        const targetChapter = chapterName.replace(".pdf", "");
        index = index.filter(chunk => chunk.chapter === targetChapter);
    }

    if (index.length === 0) {
        return null;
    }

    // 2. Embed user query
    const queryResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
    });
    const queryEmbedding = queryResponse.data[0].embedding;

    // 3. Score chunks
    const scoredChunks = index.map(chunk => ({
        ...chunk,
        similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    // 4. Return Top K
    const results = scoredChunks
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);

    // Raised to 0.45: only return chunks with strong relevance to avoid AI hallucination
    if (results.length === 0 || results[0].similarity < 0.45) {
        return null; // No relevant answer found
    }

    // Only keep chunks with similarity >= 0.40 to avoid noisy context
    const highQualityResults = results.filter(r => r.similarity >= 0.40);
    if (highQualityResults.length === 0) return null;

    return highQualityResults.map(r => `[NCERT File: ${r.chapter}] (Relevance: ${(r.similarity * 100).toFixed(1)}%)\n${r.content}`).join("\n\n");
};
