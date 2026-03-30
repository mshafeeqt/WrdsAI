import axios from "axios";
// import SearchHistory from "../model/SearchHistory.js";
import grokSearchHistory from "../model/grokSearchHistory.js";
import trustedSources from "../trusted_sources.json" with { type: "json" };
import { v4 as uuidv4 } from "uuid"; // npm install uuid
import ChatSession from "../model/ChatSession.js";
import { checkGlobalTokenLimit, getGlobalTokenStats } from "../utils/tokenLimit.js";
import dotenv from "dotenv";
dotenv.config();

const GROK_MODEL = "gpt-4o-mini";
const GROK_API_URL = "https://api.openai.com/v1/chat/completions";
const GROK_API_KEY = process.env.OPENAI_API_KEY;

// Delay helper
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Preferred sources
const preferredSources = [
  "gov",
  "edu",
  "org",
  "int",
  "nytimes.com",
  "bbc.com",
  "theguardian.com",
  "reuters.com",
  "cnn.com",
];


// Simple token estimator (≈ 1 token ≈ 4 characters heuristic)
function countTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.trim().split(/\s+/).length * 1.3); // 1.3× safety margin
}

// Centralized validation handler
function handleTokenValidation(totalTokens, maxAllowed = 6000) {
  if (totalTokens > maxAllowed) {
    throw new Error(
      `Token limit exceeded (${totalTokens}/${maxAllowed}). Please shorten the query or summary.`
    );
  }
}

export const grokSearchResults = async (req, res) => {
  try {
    let { id, query, email, linkCount, category } = req.body;
    if (!query) return res.status(400).json({ error: "Missing 'query'" });

    id = id || uuidv4();

    const cat = category || "general";
    const preferredSources = trustedSources[cat] || trustedSources.general;
    const requestedLinks = [3, 5, 10].includes(linkCount) ? linkCount : 5;

    // 🧠 Step 1: Detect general (creative/social) prompts
    // const generalKeywords = [
    //   "quote",
    //   "quotes",
    //   "wish",
    //   "wishes",
    //   "greeting",
    //   "greetings",
    //   "caption",
    //   "message",
    //   "messages",
    //   "status",
    //   "shayari",
    //   "lines",
    //   "poem",
    //   "joke",
    //   "motivation",
    //   "motivational",
    //   "festival",
    //   "diwali",
    //   "holi",
    //   "new year",
    //   "birthday",
    //   "love",
    //   "funny",
    //   "good morning",
    // ];
    const generalKeywords = [
      // Greetings & Wishes
      "greeting", "greetings", "wish", "wishes", "hello", "hi", "hey", "quote",
      "good morning", "good afternoon", "good evening", "good night", "welcome", "congratulations", "congrats",

      // Festivals & Events
      "festival", "diwali", "holi", "new year", "christmas", "eid", "ramadan", "pongal", "thanksgiving", "birthday", "anniversary", "halloween", "valentine", "raksha bandhan", "bhai dooj",

      // Quotes & Messages
      "quote", "quotes", "shayari", "lines", "message", "messages", "status", "captions", "caption", "poem", "poetry", "joke", "funny", "motivation", "motivational", "inspiration", "inspirational", "life", "love", "friendship", "friend", "relationship",

      // Emotions & Compliments
      "smile", "happiness", "joy", "success", "achievement", "hard work", "positivity", "attitude", "mindset", "dream", "goals", "determination", "fun", "funny", "humor", "laugh", "romantic", "sweet",

      // Misc Common Phrases
      "good luck", "best wishes", "gud morning", "gud night", "happy birthday", "happy anniversary", "happy new year", "happy diwali", "happy holi", "fun facts", "tips", "trivia", "short story", "status update", "life lesson", "daily motivation"
    ];


    // normalize user input
    const normalizedQuery = query.toLowerCase().replace(/[^\w\s]/g, "");

    const isGeneralPrompt = generalKeywords.some((word) =>
      normalizedQuery.includes(word)
    );

    if (isGeneralPrompt) {
      console.log("🟡 Generalized prompt detected — performing open search (non-trusted sources)");

      const generalPrompt = `
You are a smart web discovery assistant.
Your task: find the most popular, useful, or trending online pages directly related to "${query}".

Rules:
- You can search freely (NOT limited to trusted sources).
- Prefer fresh, relevant results like blogs, greeting sites, quote collections, or listicles.
- Do NOT include unsafe or adult sites.
- Provide ${requestedLinks} to 10 links MAX.
- Skip summary, only return links.

Return ONLY valid JSON like this:
{
  "verifiedLinks": [
    {
      "site": "example.com",
      "title": "Example Page",
      "link": "https://example.com/article",
      "snippet": "Why this page is relevant to ${query}",
      "publishedDate": "2025-10-10"
    }
  ]
}
`;

      // 🧮 Token count
      const promptTokens = countTokens(query);
      await checkGlobalTokenLimit(email, promptTokens);

      // 🚀 Call Grok for general search (no domain restriction)
      const generalRes = await axios.post(
        GROK_API_URL,
        {
          model: GROK_MODEL,
          messages: [{ role: "user", content: generalPrompt }],
          temperature: 0.5,
        },
        {
          headers: {
            Authorization: `Bearer ${GROK_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      // 🧩 Parse response
      let verifiedLinks = [];
      try {
        const parsed = JSON.parse(
          generalRes.data.choices[0].message.content
        );
        verifiedLinks = Array.isArray(parsed.verifiedLinks)
          ? parsed.verifiedLinks.slice(0, requestedLinks)
          : [];
      } catch (err) {
        console.warn("⚠️ Failed to parse generalized JSON:", err.message);
      }

      // 🧮 Token usage
      const linkTokens = verifiedLinks.reduce((acc, link) => {
        return (
          acc +
          countTokens(link.site) +
          countTokens(link.title) +
          countTokens(link.link) +
          countTokens(link.snippet)
        );
      }, 0);

      const totalTokens = promptTokens + linkTokens;
      await checkGlobalTokenLimit(email, totalTokens);

      // 💾 Save History
      if (email) {
        const record = new grokSearchHistory({
          id,
          email,
          query,
          summary: "",
          resultsCount: verifiedLinks.length,
          tokenUsage: { promptTokens, linkTokens, totalTokens },
        });
        await record.save();
      }

      // ✅ Get remaining tokens from global stats (single source of truth)
      const globalStats = await getGlobalTokenStats(email);

      // 💾 Persist remaining tokens to User model
      await User.updateOne(
        { email },
        { $set: { remainingTokens: globalStats.remainingTokens } }
      );

      // ✅ Send response immediately (skip trusted source flow)
      return res.json({
        id,
        summary: "",
        verifiedLinks,
        email,
        linkCount: verifiedLinks.length,
        tokenUsage: { promptTokens, linkTokens, totalTokens },
        remainingTokens: 10000 - totalTokens,
      });
    }


    const combinedPrompt = `
You are a factual and time-aware research assistant.
Your goal is to find the most recent and relevant information for the topic: "${query}".

Follow these steps carefully:

1️⃣ Search ONLY within the following trusted domains:
${preferredSources.join(", ")}

2️⃣ Collect up to ${requestedLinks * 3} candidate pages that mention or discuss the topic directly.

3️⃣ From those, select exactly ${requestedLinks} pages that meet ALL of these criteria:
   - ✅ The content is **directly relevant** to "${query}" (not generic).
   - 🕒 The article or page is **recent** (preferably from the last 12 months, or the latest available update).
   - 🌐 The page has **credible, factual information** (avoid opinion or forum posts).
   - 📎 The page link must be valid and accessible.

4️⃣ For each selected page, extract:
   - site: domain name
   - title: page or article title
   - link: canonical URL
   - snippet: a short factual reason why this page is relevant to "${query}"
   - publishedDate: publication or update date (ISO format if available, otherwise null)

5️⃣ Generate a short summary (under 100 words) strictly based on the selected pages.

Return output ONLY in this exact JSON structure:
{
  "summary": "Concise factual summary under 100 words based on chosen articles.",
  "verifiedLinks": [
    {
      "site": "example.com",
      "title": "Page title",
      "link": "https://example.com/article",
      "snippet": "Short factual reason why this page is relevant.",
      "publishedDate": "2024-12-10"
    }
  ]
}

⚠️ Strict Rules:
- Do NOT include outdated pages (older than 2022 unless no newer data exists).
- Do NOT use irrelevant or off-topic links.
- Ensure all links are from the trusted sources listed.
- The summary must rely only on the verified links.
- Output must be **valid JSON** with no extra text.
`;

    // === 🧩 Initial token count for prompt ===
    const promptTokens = countTokens(query);
    // handleTokenValidation(promptTokens, 3500);

    // ✅ 1️⃣ Global shared token check (AI + Grok combined)
    try {
      await checkGlobalTokenLimit(email, 0);
    } catch (err) {
      return res.status(400).json({
        message: "Not enough tokens",
        remainingTokens: 0,
      });
    }

    // === 🚀 Call Grok ===
    const grokResponse = await axios.post(
      GROK_API_URL,
      {
        model: GROK_MODEL,
        messages: [{ role: "user", content: combinedPrompt }],
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${GROK_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let summary = "";
    let verifiedLinks = [];

    // try {
    //   const parsed = JSON.parse(grokResponse.data.choices[0].message.content);
    //   summary = parsed.summary?.trim() || "";
    //   verifiedLinks = Array.isArray(parsed.verifiedLinks)
    //     ? parsed.verifiedLinks.slice(0, requestedLinks)
    //     : [];
    // } catch (err) {
    //   console.warn("⚠️ Failed to parse Grok JSON:", err.message);
    // }
    const grokContent = grokResponse?.data?.choices?.[0]?.message?.content;
    if (grokContent) {
      try {
        const parsed = JSON.parse(grokContent);
        summary = parsed.summary?.trim() || "";
        verifiedLinks = Array.isArray(parsed.verifiedLinks)
          ? parsed.verifiedLinks.slice(0, requestedLinks)
          : [];


        // ✅ Filter out old or irrelevant links (only 2022+)
        verifiedLinks = verifiedLinks.filter((link) => {
          const year = link.publishedDate
            ? new Date(link.publishedDate).getFullYear()
            : null;
          return !year || year >= 2022; // keep recent or undated
        });

      } catch (err) {
        console.warn("⚠️ Failed to parse Grok JSON:", err.message);
      }
    } else {
      console.warn("⚠️ Grok API returned no content");
    }

    // === 🧮 Count tokens for response ===
    const summaryTokens = countTokens(summary);
    const linkTokens = verifiedLinks.reduce((acc, link) => {
      return (
        acc +
        countTokens(link.site) +
        countTokens(link.title) +
        countTokens(link.link) +
        countTokens(link.snippet)
      );
    }, 0);

    const totalTokens = promptTokens + summaryTokens + linkTokens;
    // handleTokenValidation(totalTokens, 6000); // enforce combined cap

    // ✅ 2️⃣ Global token re-check after total usage known
    try {
      await checkGlobalTokenLimit(email, totalTokens);
    } catch (err) {
      return res.status(400).json({
        message: "Not enough tokens",
        remainingTokens: 0,
      });
    }

    // === 🩹 Fallback if not enough links ===
    if (verifiedLinks.length < requestedLinks) {
      console.warn(
        `⚠️ Only ${verifiedLinks.length} links found. Triggering fallback...`
      );
      await new Promise((r) => setTimeout(r, 1500));

      const fallbackPrompt = `
Find more directly relevant pages for: "${query}"
from these sources: ${preferredSources.join(", ")}.
Return ONLY JSON array of ${requestedLinks} total unique valid links (no summary).
`;

      const fallbackRes = await axios.post(
        GROK_API_URL,
        {
          model: GROK_MODEL,
          messages: [{ role: "user", content: fallbackPrompt }],
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${GROK_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      try {
        const fallbackLinks = JSON.parse(
          fallbackRes.data.choices[0].message.content
        );
        const merged = [
          ...verifiedLinks,
          ...fallbackLinks.filter(
            (f) => !verifiedLinks.some((v) => v.link === f.link)
          ),
        ];
        verifiedLinks = merged.slice(0, requestedLinks);
      } catch (err) {
        console.warn("⚠️ Fallback JSON parse failed:", err.message);
      }
    }

    // === 💾 Save Search History ===
    if (email) {
      const record = new grokSearchHistory({
        id,
        email,
        query,
        summary,
        resultsCount: verifiedLinks.length,
        // tokenUsage: totalTokens,
        tokenUsage: {
          promptTokens,
          summaryTokens,
          linkTokens,
          totalTokens,
        },
      });
      await record.save();
    }


    // === 🔗 Deduct tokens from global 10,000 pool ===
    let remainingTokensAfter = 10000;
    if (email) {
      let session = await ChatSession.findOne({ email });
      if (!session) {
        session = new ChatSession({
          email,
          sessionId: `grok-${uuidv4()}`,
          history: [],
          create_time: new Date(),
        });
      }

      // Get all sessions for this email (only since planStartDate)
      const user = await User.findOne({ email });
      const planStartDate = user?.planStartDate || new Date(0);
      const allSessions = await ChatSession.find({ email });

      const grandTotalTokens = allSessions.reduce((sum, s) => {
        return (
          sum +
          s.history.reduce((entrySum, e) => {
            const msgDate = e.create_time ? new Date(e.create_time) : new Date(0);
            if (msgDate >= planStartDate) {
              return entrySum + (e.tokensUsed || 0);
            }
            return entrySum;
          }, 0)
        );
      }, 0);

      const remainingTokensBefore = Math.max(0, 10000 - grandTotalTokens);
      remainingTokensAfter = Math.max(0, remainingTokensBefore - totalTokens);

      // Add Grok usage to ChatSession
      session.history.push({
        prompt: query,
        response: summary,
        botName: "grok",
        tokensUsed: totalTokens,
        promptTokens,
        responseTokens: summaryTokens,
        fileTokenCount: linkTokens,
        totalTokensUsed: totalTokens,
        create_time: new Date(),
      });

      await session.save();
    }

    // ✅ Get remaining tokens from global stats (single source of truth)
    const globalStats = await getGlobalTokenStats(email);

    // 💾 Persist remaining tokens to User model
    await User.updateOne(
      { email },
      { $set: { remainingTokens: globalStats.remainingTokens } }
    );

    // === ✅ Send Final Response ===
    return res.json({
      id,
      summary,
      verifiedLinks,
      email,
      linkCount: requestedLinks,
      tokenUsage: {
        promptTokens,
        summaryTokens,
        linkTokens,
        totalTokens,
      },
      remainingTokens: remainingTokensAfter,
    });
  } catch (err) {
    console.error("❌ grokSearchResults Error:", err);
    return res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
};

// ✅ Get search history for a specific user (POST method)
export const grokUserSearchHistory = async (req, res) => {
  try {
    const { email } = req.body; // now using body instead of query

    if (!email) {
      return res
        .status(400)
        .json({ error: "Missing 'email' field in request body" });
    }

    const history = await grokSearchHistory
      .find({ email })
      .sort({ createdAt: -1 });

    // ✅ Calculate total tokens across all records
    const totalTokensUsed = history.reduce((acc, record) => {
      return acc + (record.tokenUsage?.totalTokens || 0);
    }, 0);

    return res.json({ email, history, totalTokensUsed });
  } catch (err) {
    console.error("History Fetch Error:", err);
    return res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
};

// serper key+ grok model use

// import axios from "axios";
// import trustedSources from "../trusted_sources.json" assert { type: "json" };
// import SearchHistory from "../model/SearchHistory.js";

// const SERPER_URL = "https://api.serper.dev/search";
// const SERPER_API_KEY = process.env.SERPER_KEY;
// const GROK_API_URL = "https://api.x.ai/v1/chat/completions";
// const GROK_API_KEY = process.env.GROK_API_KEY;
// const GROK_MODEL = "grok-3-mini";

// /**
//  * Call Serper API (full response, like searchAPI)
//  */
// async function searchSerper(query) {
//   try {
//     const response = await axios.post(
//       SERPER_URL,
//       { q: query },
//       {
//         headers: {
//           "X-API-KEY": SERPER_API_KEY,
//           "Content-Type": "application/json",
//         },
//         maxBodyLength: Infinity,
//       }
//     );

//     const data = response.data;
//     console.log("searchSerper response::::::::::", data);

//     return data; // full Serper response
//   } catch (err) {
//     console.error(
//       "searchSerper network/error:",
//       err.response?.data || err.message
//     );
//     return { error: true, message: err.message };
//   }
// }

// /**
//  * Call Grok API to generate a factual summary (under 100 words)
//  */
// async function summarizeWithGrok(query, links) {
//   if (!links || links.length === 0) return query;

//   const grokPrompt = `
// You are a factual research assistant.
// Perform these tasks for the topic: "${query}".

// 1️⃣ Consider these links:
// ${links
//   .map((l) => l.organic?.[0]?.link)
//   .filter(Boolean)
//   .join("\n")}

// 2️⃣ Return a concise factual summary (under 100 words) covering key insights from these pages.

// Return output ONLY in strict JSON format:
// {
//   "summary": "Concise summary under 100 words based on the links."
// }
// `;

//   try {
//     const grokRes = await axios.post(
//       GROK_API_URL,
//       {
//         model: GROK_MODEL,
//         messages: [{ role: "user", content: grokPrompt }],
//         temperature: 0.3,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${GROK_API_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const content = grokRes.data.choices?.[0]?.message?.content || "";
//     const parsed = JSON.parse(content);
//     return parsed.summary || query;
//   } catch (err) {
//     console.warn("Grok summary error:", err.message);
//     return query;
//   }
// }

// /**
//  * Hybrid search endpoint
//  */
// export const grokSearchResults = async (req, res) => {
//   try {
//     const { query, category = "general", email } = req.body;
//     if (!query) return res.status(400).json({ error: "Missing 'query'" });

//     // --- 1. Get all trusted site results ---
//     const allResults = [];

//     for (const categoryKey of Object.keys(trustedSources)) {
//       const resData = await searchSerper(
//         `${query} site:${trustedSources[categoryKey].join(" OR ")}`
//       );
//       console.log(`resData for category ${categoryKey}:`, resData);

//       if (resData && Array.isArray(resData.organic)) {
//         allResults.push({ ...resData, category: categoryKey });
//       }
//     }

//     console.log("All trusted source results count:", allResults.length);

//     // --- 2. Take top 5 results across categories ---
//     const topFiveResults = allResults.slice(0, 5);

//     // --- 3. From each category, pick only first organic link ---
//     const verifiedLinks = topFiveResults.map((result) => ({
//       searchParameters: result.searchParameters || { q: query },
//       organic:
//         result.organic && result.organic.length > 0 ? [result.organic[0]] : [],
//       category: result.category,
//       trust_level: trustedSources[result.category]?.some((d) =>
//         result.organic?.[0]?.link.includes(d)
//       )
//         ? "verified"
//         : "general",
//     }));

//     console.log("VerifiedLinks (Top 5, One Per Category):", verifiedLinks);

//     // --- 4. Generate summary using Grok ---
//     const summary = await summarizeWithGrok(query, verifiedLinks);

//     // --- 5. Save search history ---
//     if (email) {
//       const record = new SearchHistory({
//         email,
//         query,
//         category,
//         summary,
//         resultsCount: verifiedLinks.length,
//       });
//       await record.save();
//     }

//     // --- 6. Return final response ---
//     return res.json({
//       summary,
//       verifiedLinks,
//       email,
//     });
//   } catch (err) {
//     console.error("Hybrid Search Error:", err);
//     return res.status(500).json({
//       error: "Internal server error",
//       message: err.message,
//     });
//   }
// };
