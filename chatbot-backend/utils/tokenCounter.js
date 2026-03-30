// import { encoding_for_model } from "tiktoken";

// // Count tokens for any OpenAI model
// export function countTokens(text, modelName = "gpt-4o-mini") {
//   try {
//     const enc = encoding_for_model(modelName);
//     const tokens = enc.encode(text).length;
//     enc.free(); // free memory
//     return tokens;
//   } catch (error) {
//     console.warn(
//       `tiktoken failed for model ${modelName}, falling back to word count`,
//       error
//     );
//     // return text.split(/\s+/).length;
//     return (text || "").trim().split(/\s+/).length;
//   }
// }

// tokenCounter.js
import { encoding_for_model, get_encoding } from "tiktoken";
import { AutoTokenizer } from "@xenova/transformers";
// import { GoogleGenerativeAI } from "@google/genai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// import { MistralTokenizer } from "@mistralai/tokenizers";

let grokTokenizer = null;
let mistralTokenizer = null;
const tokenizerCache = new Map();

// Lazy-load Grok tokenizer
async function getGrokTokenizer() {
  if (!grokTokenizer) {
    grokTokenizer = await AutoTokenizer.from_pretrained(
      "Xenova/grok-1-tokenizer"
    );
  }
  return grokTokenizer;
}

// const geminiAI = new GoogleGenerativeAI({
//   apiKey: process.env.GEMINI_API_KEY,
// });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function countGeminiTokens(text, modelName = "gemini-3-flash-preview") {
  const model = genAI.getGenerativeModel({ model: modelName });

  const result = await model.countTokens(text);
  return result.totalTokens;
}

// async function getMistralTokenizer() {
//   if (tokenizerCache.has('mistral')) {
//     return tokenizerCache.get('mistral');
//   }

//   const tokenizer = await AutoTokenizer.from_pretrained('Xenova/mistral-small-2506');
//   tokenizerCache.set('mistral', tokenizer);
//   return tokenizer;
// }

// Lazy-load Mistral tokenizer
// async function getMistralTokenizer() {
//   if (!mistralTokenizer) {
//     mistralTokenizer = await AutoTokenizer.from_pretrained(
//       "Xenova/mistral-small-2506"
//     );
//   }
//   return mistralTokenizer;
// }

export async function countTokens(text, modelName = "gpt-4o-mini") {
  try {
    if (!text) return 0;

    let validModel = modelName.toLowerCase();

    // ✅ 🔥 ADDITION: Gemini Models (SAFE ESTIMATE)
    // if (validModel.includes("gemini")) {
    //   const words = text.trim().split(/\s+/).length;
    //   return Math.ceil(words * 1.3); // Google-safe estimate
    // }
    // 🔥 Gemini OFFICIAL
    if (validModel.includes("gemini")) {
      try {
        return await countGeminiTokens(text, modelName);
      } catch (err) {
        console.warn("Gemini token count failed, fallback:", err);
        return Math.ceil(text.trim().split(/\s+/).length * 1.3);
      }
    }

    // if (validModel.includes("gemini")) {
    //   try {
    //     const result = await geminiAI.models.countTokens({
    //       model: modelName, // e.g. "gemini-3-flash-preview"
    //       contents: [
    //         {
    //           role: "user",
    //           parts: [{ text }],
    //         },
    //       ],
    //     });

    //     return result?.totalTokens ?? 0;
    //   } catch (err) {
    //     console.warn("Gemini token API failed, fallback estimate:", err);
    //     const words = text.trim().split(/\s+/).length;
    //     return Math.ceil(words * 1.3);
    //   }
    // }

    // ✅ Case 1: Claude models → call Anthropic token-count API
    if (validModel.includes("claude")) {
      try {
        const response = await fetch(
          "https://api.anthropic.com/v1/messages/count_tokens",
          {
            method: "POST",
            headers: {
              "x-api-key": process.env.CLAUDE_API_KEY,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
            },
            body: JSON.stringify({
              model: modelName,
              messages: [{ role: "user", content: text }],
            }),
          }
        );

        if (!response.ok) {
          console.warn("Claude token API error:", await response.text());
          throw new Error("Claude token API error");
        }

        const data = await response.json();
        return (
          data?.input_tokens ||
          Math.round(text.trim().split(/\s+/).length * 1.3)
        );
      } catch (apiErr) {
        console.warn(
          "Claude token count failed, fallback to estimate:",
          apiErr
        );
        const words = text.trim().split(/\s+/).length;
        return Math.round(words * 1.3);
      }
    }

    // ✅ Case 2: Grok models → use Xenova tokenizer
    if (validModel.startsWith("grok")) {
      const tokenizer = await getGrokTokenizer();
      const tokens = await tokenizer.encode(text);
      return tokens.length;
    }

    // ✅ Case 3: Mistral Models → official tokenizer
    // if (validModel.includes("mistral")) {
    //   const tokenizer = await getMistralTokenizer();
    //   const tokens = await tokenizer.encode(text);
    //   return tokens.length;
    // }

    // ✅ Case 3: Mistral Models → official tokenizer
    // if (validModel.includes("mistral")) {
    //   const tokenizer = await getMistralTokenizer();
    //   const tokens = await tokenizer.encode(text);
    //   return tokens.length;
    // }

    // ✅ Case 3: Mistral Models → official tokenizer
    if (validModel.includes("mistral") || modelName === "mistral") {
      // 🔥 Tamari requirement pramane direct mapping
      validModel = "mistral-small-2506";

      // ⚠ tiktoken does NOT support mistral officially
      // एतले apde generic encoder use करीये
      const enc = get_encoding("cl100k_base"); // safest fallback

      const tokenCount = enc.encode(text).length;
      enc.free();

      return tokenCount;
    }

    // ✅ Case 4: OpenAI models → use tiktoken
    if (modelName === "chatgpt-5-mini") {
      validModel = "gpt-4o-mini";
    }
    const enc = encoding_for_model(validModel);
    const tokenCount = enc.encode(text).length;
    enc.free();
    return tokenCount;
  } catch (err) {
    console.warn(
      `Tokenizer failed for model ${modelName}, fallback to word count`,
      err
    );
    return text.trim().split(/\s+/).length;
  }
}

export function countWords(text) {
  if (!text || typeof text !== "string") return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}
