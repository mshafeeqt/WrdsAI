import axios from "axios";
import trustedSources from "../trusted_sources.json" with { type: "json" };
import SearchHistory from "../model/SearchHistory.js";
import * as cheerio from "cheerio";
import { countTokens, countWords } from "../utils/tokenCounter.js";
import { checkGlobalTokenLimit, getGlobalTokenStats } from "../utils/tokenLimit.js";
import User from "../model/User.js";
import ChatSession from "../model/ChatSession.js";
// import SearchHistory from "../model/SearchHistory.js";

const SERPER_URL = "https://google.serper.dev/search";
// const SERPER_API_KEY = "49d09f756085ba3e5cc2d434cdea914b271ceb05";



// mohmmedbhai gives key
const SERPER_API_KEY = "030caba1631ac33e868536cda190dd632ea99d82";

// meeral last uses key
// const SERPER_API_KEY = "4065c8aa208d00278c9dfedbc5bbeaae7aaed872";

/**
 * Call Serper API
 * @param {string} query
 * @param {object} opts - { returnRaw: boolean }
 * @returns {Array|Object}
 */
async function searchAPI(query, opts = { returnRaw: false }) {
  try {
    const response = await axios.post(
      SERPER_URL,
      { q: query },
      {
        headers: {
          "X-API-KEY": SERPER_API_KEY,
          "Content-Type": "application/json",
        },
        maxBodyLength: Infinity,
      }
    );

    const data = response.data;

    console.log("searchAPI response::::::::::", data);
    if (opts.returnRaw) return data;
    return data;
  } catch (err) {
    console.error("searchAPI network/error:", err.message);
    return { error: true, message: err.message };
  }
}



async function searchTrusted(query, category) {
  const trusted = trustedSources[category] || [];
  //   console.log("trusted::::::::::", trusted);
  if (!trusted.length) return await searchAPI(query);

  const allResults = [];
  for (const site of trusted) {
    const siteQuery = `${query} site:${site}`;
    // console.log("siteQuery::::::::::", siteQuery);
    const res = await searchAPI(siteQuery);
    // console.log("res::::::::::", res);
    if (res) allResults.push(res);
  }
  //   console.log("allResults::::::::::", allResults);
  return allResults;
}

/**
 * Smart search: filter trusted sources, fallback if empty
 * @param {string} query
 * @param {string} category
 */
async function smartSearch(query, category) {

  let results = await searchTrusted(query, category);

  if (
    !results ||
    (Array.isArray(results) && results.length === 0) ||
    results.error
  ) {
    console.log(
      "No verified results (or API error). Falling back to general search."
    );
    results = await searchAPI(query);
    // console.log("results::::::::::", results);
  }

  const arr = Array.isArray(results) ? results : results.results || [];
  const trusted = trustedSources[category] || [];

  // Add trust_level field
  return arr.map((r) => {
    const link = r.link || r.url || "";
    const isTrusted = trusted.some((domain) => link.includes(domain));
    return { ...r, trust_level: isTrusted ? "verified" : "general" };
  });
}

// working 50 words
// async function summarizeAsk(query, results) {
//   if (!results || results.length === 0) return query;

//   // Use search snippets directly for faster, more reliable summaries
//   const snippets = results
//     .slice(0, 5)
//     .map(r => r.snippet)
//     .filter(Boolean)
//     .join(" ");

//   if (!snippets.trim()) return query;

//   // Create coherent summary from snippets
//   return createCoherentSummary(snippets, query, 50);
// }
async function summarizeAsk(query, results) {
  if (!results || results.length === 0) return query;

  // Extract URLs from organic results
  const urls = results
    .map((r) => r.link || r.url)
    .filter(Boolean);

  if (urls.length === 0) return query;

  const keywords = query.toLowerCase().split(/\s+/);
  let combinedText = "";

  // Scrape content from top 3 URLs
  for (const url of urls.slice(0, 3)) {
    try {
      const { data: html } = await axios.get(url, {
        timeout: 8000,
        headers: { "User-Agent": "Mozilla/5.0 (Node.js)" },
      });

      const $ = cheerio.load(html);

      // Extract paragraphs only
      const paragraphs = $("p").map((_, el) => $(el).text().trim()).get();

      // Keep paragraphs containing at least one keyword
      const relevantParagraphs = paragraphs.filter((p) =>
        keywords.some((k) => p.toLowerCase().includes(k))
      );

      combinedText += " " + relevantParagraphs.join(" ");

      // Limit content to avoid too much text
      if (combinedText.split(/\s+/).length > 800) {
        break;
      }
    } catch (err) {
      console.warn(`⚠️ Could not fetch ${url}: ${err.message}`);
    }
  }

  if (!combinedText.trim()) return query;

  // Create proper summary between 50-100 words
  return createFlexibleSummary(combinedText, query, 50, 100);
}

// Helper function to create flexible summaries between min and max word count
function createFlexibleSummary(text, query, minWords = 50, maxWords = 100) {
  // Split into sentences (basic sentence boundary detection)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);

  const keywords = query.toLowerCase().split(/\s+/);

  // Rank sentences by relevance to query
  const rankedSentences = sentences.map(sentence => {
    const lowerSentence = sentence.toLowerCase();
    const relevanceScore = keywords.filter(kw => lowerSentence.includes(kw)).length;
    const wordCount = sentence.split(/\s+/).length;
    return {
      sentence: sentence.trim() + ".",
      score: relevanceScore,
      wordCount
    };
  }).filter(item => item.wordCount > 5); // Filter out very short sentences

  // Sort by relevance score (highest first)
  rankedSentences.sort((a, b) => b.score - a.score);

  let summary = "";
  let wordCount = 0;
  let usedSentences = 0;

  // Add sentences until we reach at least minWords
  for (const item of rankedSentences) {
    if (wordCount + item.wordCount <= maxWords) {
      summary += (summary ? " " : "") + item.sentence;
      wordCount += item.wordCount;
      usedSentences++;

      // Stop if we have enough content and reached a good breaking point
      if (wordCount >= minWords && usedSentences >= 2) {
        break;
      }
    }
  }

  // If we don't have enough words, add more less relevant sentences
  if (wordCount < minWords) {
    // Reset and use all sentences sorted by length and relevance
    const allSentences = sentences.map(s => s.trim() + ".")
      .filter(s => s.length > 20)
      .sort((a, b) => {
        const aWords = a.split(/\s+/).length;
        const bWords = b.split(/\s+/).length;
        return bWords - aWords; // Prefer longer sentences
      });

    summary = "";
    wordCount = 0;

    for (const sentence of allSentences) {
      const sentenceWordCount = sentence.split(/\s+/).length;
      if (wordCount + sentenceWordCount <= maxWords) {
        summary += (summary ? " " : "") + sentence;
        wordCount += sentenceWordCount;
        if (wordCount >= minWords) break;
      }
    }
  }

  // Final cleanup and word count adjustment
  const words = summary.split(/\s+/);

  // If over max words, trim gracefully
  if (words.length > maxWords) {
    // Find the last sentence boundary before maxWords
    let lastGoodIndex = maxWords;
    for (let i = Math.min(maxWords, words.length - 1); i >= minWords; i--) {
      if (words[i].endsWith('.') || i === words.length - 1) {
        lastGoodIndex = i + 1;
        break;
      }
    }
    summary = words.slice(0, lastGoodIndex).join(" ");
  }

  // If still under min words, add contextual padding
  const finalWords = summary.split(/\s+/);
  if (finalWords.length < minWords) {
    const needed = minWords - finalWords.length;
    const padding = `This comprehensive overview covers essential aspects and provides valuable insights into the topic based on current information and reliable sources available.`;
    const paddingWords = padding.split(/\s+/).slice(0, needed);
    summary += " " + paddingWords.join(" ");
  }

  console.log(`🔹 Summary word count: ${summary.split(/\s+/).length} words`);
  return summary.trim();
}
function createCoherentSummary(content, query, targetWordCount) {
  // Clean and prepare the content
  const cleanContent = content
    .replace(/\[\d+\]/g, '') // Remove citation numbers
    .replace(/\s+/g, ' ')
    .trim();

  // Split into meaningful chunks (sentences or phrases)
  const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 10);

  // Prioritize sentences that contain query keywords
  const keywords = query.toLowerCase().split(/\s+/);
  const rankedSentences = sentences.map(sentence => {
    const lowerSentence = sentence.toLowerCase();
    const relevanceScore = keywords.filter(kw => lowerSentence.includes(kw)).length;
    return { sentence, score: relevanceScore, wordCount: sentence.split(/\s+/).length };
  }).filter(item => item.score > 0 || item.wordCount > 5);

  // Sort by relevance
  rankedSentences.sort((a, b) => b.score - a.score);

  let summary = "";
  let wordCount = 0;

  // Build summary with most relevant sentences
  for (const item of rankedSentences) {
    if (wordCount + item.wordCount <= targetWordCount) {
      summary += (summary ? " " : "") + item.sentence.trim() + ".";
      wordCount += item.wordCount;
    } else {
      // Try to add partial sentence if it makes sense
      const remaining = targetWordCount - wordCount;
      if (remaining >= 4) {
        const words = item.sentence.split(/\s+/).slice(0, remaining);
        summary += (summary ? " " : "") + words.join(" ") + ".";
        wordCount += remaining;
      }
      break;
    }

    if (wordCount >= targetWordCount) break;
  }

  // Fallback if no relevant sentences found
  if (!summary) {
    const allWords = cleanContent.split(/\s+/).slice(0, targetWordCount);
    summary = allWords.join(" ");

    // Ensure it ends properly
    if (!summary.endsWith('.') && summary.length > 20) {
      summary += ".";
    }
  }

  // Final word count check
  const finalWords = summary.split(/\s+/);
  if (finalWords.length !== targetWordCount) {
    console.log(`🔹 Summary adjusted from ${finalWords.length} to ${targetWordCount} words`);
  }

  return finalWords.slice(0, targetWordCount).join(" ").trim();
}
function calculateAge(dob) {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

const restrictions = {
  under13: [
    "violence",
    "drugs",
    "sex",
    "dating",
    "murder",
    "weapon",
    "kill",
    "adult",
    "nsfw",
    "explicit",
    "porn",
    "alcohol",
    "gambling",
    "suicide",
    "crime",
    "terrorism",
    "blood",
    "rape",
    "abuse",

    "weed",
    "marijuana",
    "cocaine",
    "meth",
    "heroin",
    "fentanyl",
    "opioid",
    "xanax",
    "oxy",
    "perc",
    "lean",
    "codeine",
    "molly",
    "ecstasy",
    "MDMA",
    "LSD",
    "shrooms",

    "ketamine",
    "ket",
    "special-k",
    "vape",
    "juul",
    "nicotine",
    "dab",
    "dabbing",
    "cartel",

    "OD",
    "overdose",

    "snort",
    "sniff",
    "bong",
    
    "paraphernalia",

    "sexual",
    "intercourse",
    "fuck",
    "fucking",
    "fucked",
    "pussy",
    "dick",
    "cock",
    "tits",
    "boobs",
    "ass",
    "hole",
    "cum",
    "jizz",
    "orgasm",
    "masturbate",
    "jerk",
    "wank",
    "porno",
    "xxx",
    "hentai",
    "nude",
    "naked",
    "hooker",
    "prostitute",

    "camgirl",
    "thot",
    "slut",
    "whore",
    "raping",
    "raped",
    "molest",
    "grope",
    "touch",
    "fondle",
    "sext",
    "sexting",
    "nudes",
    "dickpic",
    "titpic",
    "erotic",
    "kink",
    "BDSM",
    "bondage",
    "dom",
    "sub",
    "fetish",
    "anal",

    "blowjob",
    "handjob",
    "rimming",
    "creampie",
    "gangbang",
    "threesome",
    "orgy",
    "incest",
    "pedo",
    "lolita",
    "underage",

    "jailbait",

    "boyfriend",
    "girlfriend",
    "hookup",
    "tinder",
    "grindr",
    "bumble",
    "snapchat sext",

    "thirst trap",
    "predator",
    "meetup",
    "nudes for",
    "body count",
    "virgin",
    "smash",

    "killing",
    "killed",

    "dying",
    "stab",

    "shot",
    "gun",
    "knife",
    "bomb",
    "explode",
    "explosion",
    "assault",

    "choke",
    "strangle",
    "hang",
    "self-harm",
    "poison",
    "drown",
    "torture",
    "massacre",
    "genocide",
    "terror",
    "terrorist",
    "ISIS",
    "Al-Qaeda",
    "hitman",
    "assassin",
    "sniper",
    "decapitate",
    "behead",
    "mutilate",
    "disembowel",
    "slaughter",
    "carnage",

    "shoplift",
    "burglar",

    "DDoS",
    "phishing",
    "carding",

    "blackmail",
    "extort",
    "kidnap",
    "ransom",
    "trafficking",
    "mafia",
    "arson",
    "vandalism",
    "graffiti",

    "fugitive",
    "warrant",
    "jail",
    "prison",
    "felony",

    "riot",
    "loot",
    "depression",
    "depressed",
    "meds",
    "suicidal",
    "KMS",

    "noose",
    "gun to head",
    "swallow pills",
    "hate myself",
    "kill myself",
    "fag",
    "dyke",
    "tranny",
    "retard",
    "nigger",
    "chink",
    "spic",
    "kike",
    "raghead",
    "towelhead",
    "beaner",
    "cripple",
    "autistic",
    "incel",

    "DAN",
    "jailbreak",

    "betting",
    "gamble",
    "poker",
    "casino",
    "blackjack",
    "roulette",

    "draftkings",
    "fanduel",

    "parlay",
    "crypto gambling",
    "NFT flip",
    "loot box",

    "beer",
    "liquor",
    "vodka",
    "whiskey",
    "drunk",
    "binge",
    "shot",
    "chug",
    "keg",
    "party",
    "alc",
    "booze",
    "underage drinking",
    "DUI",
    "breathalyzer",
  ],
  under18: [
    "gambling",
    "adult",
    "nsfw",
    "explicit",
    "porn",
    "alcohol",

    "betting",
    "gamble",
    "poker",
    "casino",

    "blackjack",
    "roulette",

    "draftkings",
    "fanduel",

    "parlay",

    "NFT flip",
    "loot box",
    "skin betting",
    "beer",
    "liquor",
    "vodka",
    "whiskey",
    "drunk",
    "binge",
    "shot",
    "chug",
    "keg",
    "party",
    "alc",
    "booze",
    "fake ID",
    "DUI",
    "breathalyzer",
  ],
};

export const getAISearchResults = async (req, res) => {
  try {
    const { query, category = "general", raw, email, linkCount = 5 } = req.body;
    if (!query) return res.status(400).json({ error: "Missing 'query' field" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    // ✅ Limit check — max 50 searches per user
    const searchCount = await SearchHistory.countDocuments({ email });
    if (searchCount >= 50) {
      return res.status(403).json({
        allowed: false,
        message:
          "Search limit reached. You have already performed 50 searches. Please upgrade or wait for reset.",
        limitReached: true,
      });
    }

    const age = calculateAge(user.dateOfBirth);
    const lowerQuery = query.toLowerCase();

    if (age < 13) {
      const restricted = restrictions.under13.some((word) => lowerQuery.includes(word));
      if (restricted) {
        return res.status(403).json({
          // message: "Search blocked ❌: Content not suitable for users below 18.",
          message: "Oops! The requested info isn’t available for users under 18.",
          allowed: false,
          age,
          restrictedCategory: "under13",
        });
      }
    } else if (age >= 13 && age < 18) {
      const restricted = restrictions.under18.some((word) => lowerQuery.includes(word));
      if (restricted) {
        return res.status(403).json({
          // message: "Search restricted ⚠️: Content not suitable for users below 18.",
          message: "Oops! The requested info isn’t available for users under 18.",
          allowed: false,
          age,
          restrictedCategory: "under18",
        });
      }
    }

    const searchResults = await searchAPI(query);
    const requestedCount = parseInt(linkCount) || 5;
    const topResults = searchResults.organic
      ? searchResults.organic.slice(0, requestedCount)
      : [];

    const formattedResults = {
      searchParameters: searchResults.searchParameters || { q: query },
      organic: topResults.map((item) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        site: getSourceName(item.link),
        publishedDate: item.date || item.publishedDate,
      })),
    };

    const summary = await summarizeAsk(query, formattedResults.organic);
    // const tokenCount = await countTokens(summary, "grok-1");
    // Token count with safe fallback
    let tokenCount;
    try {
      tokenCount = await countTokens(summary, "grok-1");   // primary
    } catch (err) {
      console.warn("⚠ Grok token count failed → using mistral fallback");
      tokenCount = await countTokens(summary, "mistral-small-2506");
    }
    const wordCount = countWords(summary);

    // ✅ Global shared token limit check (AI + Search combined)
    try {
      // returns remaining after applying this usage
      await checkGlobalTokenLimit(email, tokenCount);
    } catch (err) {
      return res.status(400).json({
        message: "Not enough tokens",
        remainingTokens: 0,
      });
    }

    const record = new SearchHistory({
      email,
      query,
      category,
      summary,
      resultsCount: topResults.length,
      raw: raw || false,
      summaryWordCount: wordCount,
      summaryTokenCount: tokenCount,
    });
    await record.save();

    // ✅ Get remaining tokens from global stats (single source of truth)
    const globalStats = await getGlobalTokenStats(email);
    const remainingTokens = globalStats.remainingTokens;

    // 💾 Persist remaining tokens to User model
    await User.updateOne(
      { email },
      { $set: { remainingTokens: remainingTokens } }
    );

    return res.json({
      allowed: true,
      summary,
      verifiedLinks: formattedResults.organic,
      email,
      linkCount: topResults.length,
      summaryStats: { words: wordCount, tokens: tokenCount },
      totalSearches: searchCount + 1, // send updated count
      remainingTokens,
    });
  } catch (err) {
    console.error("Search Error:", err);
    return res
      .status(500)
      .json({ error: "Internal server error", message: err.message });
  }
};
// export const getAISearchResults = async (req, res) => {
//   console.log("11111111111", req.body);
//   try {
//     const { query, category = "general", raw, email, linkCount = 10 } = req.body;

//     if (!query) return res.status(400).json({ error: "Missing 'query' field" });

//     if (email) console.log(`🔹 Search request from: ${email}`);
//     console.log(`🔹 Requested link count: ${linkCount}`);

//     // ✅ 1. Use direct search API
//     const searchResults = await searchAPI(query);

//     console.log("Search Results ::::::::::", searchResults);

//     // ✅ 2. Take only the requested number of organic results
//     const requestedCount = parseInt(linkCount) || 10;
//     const topResults = searchResults.organic ? searchResults.organic.slice(0, requestedCount) : [];
//     console.log("topResults:::====", topResults);

//     // ✅ 3. Format the results properly for frontend
//     const formattedResults = {
//       searchParameters: searchResults.searchParameters || { q: query },
//       organic: topResults.map(item => ({
//         title: item.title,
//         link: item.link,
//         snippet: item.snippet,
//         site: getSourceName(item.link),
//         publishedDate: item.date || item.publishedDate
//       }))
//     };

//     console.log("Formatted Results ::::::::::", formattedResults);

//     // ✅ 4. Create summary using Grok
//     const summary = await summarizeAsk(query, formattedResults.organic);

//     // ✅ 5. COUNT TOKENS AND WORDS FOR THE SUMMARY
//     const tokenCount = await countTokens(summary, "grok-1"); // Use "gpt-4o-mini" if using OpenAI
//     const wordCount = countWords(summary);

//     console.log(`🔹 Summary Stats - Words: ${wordCount}, Tokens: ${tokenCount}`);

//     // ✅ 6. Verify summary length (optional - for quality control)
//     if (wordCount < 40) {
//       console.warn(`⚠️ Summary might be too short: ${wordCount} words`);
//     }

//     // ✅ 7. Save to MongoDB with token count
//     const record = new SearchHistory({
//       email,
//       query,
//       category,
//       summary,  
//       resultsCount: topResults.length,
//       raw: raw || false,
//       summaryWordCount: wordCount, // ✅ Store word count
//       summaryTokenCount: tokenCount, // ✅ Store token count
//     });
//     await record.save();

//     // ✅ 8. If raw requested
//     if (raw === true) {
//       const rawData = await searchAPI(query, { returnRaw: true });
//       return res.json({
//         summary,
//         verifiedLinks: formattedResults.organic,
//         raw: rawData,
//         email,
//         linkCount: topResults.length,
//         summaryStats: { // ✅ Include stats in response
//           words: wordCount,
//           tokens: tokenCount
//         }
//       });
//     }

//     // ✅ 9. Final response with summary stats
//     return res.json({
//       summary,
//       verifiedLinks: formattedResults.organic,
//       email,
//       linkCount: topResults.length,
//       summaryStats: { // ✅ Include stats in response
//         words: wordCount,
//         tokens: tokenCount
//       }
//     });
//   } catch (err) {
//     console.error("Search Error:", err);
//     return res
//       .status(500)
//       .json({ error: "Internal server error", message: err.message });
//   }
// };


// summery get
// export const getAISearchResults = async (req, res) => {
//   console.log("11111111111", req.body);
//   try {
//     const { query, category = "general", raw, email, linkCount = 10 } = req.body;

//     if (!query) return res.status(400).json({ error: "Missing 'query' field" });

//     if (email) console.log(`🔹 Search request from: ${email}`);
//     console.log(`🔹 Requested link count: ${linkCount}`);

//     // ✅ 1. Use direct search API
//     const searchResults = await searchAPI(query);

//     console.log("Search Results ::::::::::", searchResults);

//     // ✅ 2. Take only the requested number of organic results
//     const requestedCount = parseInt(linkCount) || 10;
//     const topResults = searchResults.organic ? searchResults.organic.slice(0, requestedCount) : [];
//     console.log("topResults:::====", topResults);

//     // ✅ 3. Format the results properly for frontend
//     const formattedResults = {
//       searchParameters: searchResults.searchParameters || { q: query },
//       organic: topResults.map(item => ({
//         title: item.title,
//         link: item.link,
//         snippet: item.snippet,
//         site: getSourceName(item.link),
//         publishedDate: item.date || item.publishedDate
//       }))
//     };

//     console.log("Formatted Results ::::::::::", formattedResults);

//     // ✅ 4. Create 50-word summary using Grok
//     const summary = await summarizeAsk(query, formattedResults.organic);

//     // ✅ 5. Verify word count
//     const wordCount = summary.split(/\s+/).length;
//     console.log(`🔹 Summary word count: ${wordCount} words`);

//     // ✅ 6. Save to MongoDB
//     const record = new SearchHistory({
//       email,
//       query,
//       category,
//       summary,  
//       resultsCount: topResults.length,
//       raw: raw || false,
//     });
//     await record.save();

//     // ✅ 7. If raw requested
//     if (raw === true) {
//       const rawData = await searchAPI(query, { returnRaw: true });
//       return res.json({
//         summary,
//         verifiedLinks: formattedResults.organic,
//         raw: rawData,
//         email,
//         linkCount: topResults.length
//       });
//     }

//     // ✅ 8. Final response
//     return res.json({
//       summary,
//       verifiedLinks: formattedResults.organic,
//       email,
//       linkCount: topResults.length
//     });
//   } catch (err) {
//     console.error("Search Error:", err);
//     return res
//       .status(500)
//       .json({ error: "Internal server error", message: err.message });
//   }
// };

// export const getAISearchResults = async (req, res) => {
//   console.log("11111111111", req.body);
//   try {
//     const { query, category = "general", raw, email, linkCount = 10 } = req.body;

//     if (!query) return res.status(400).json({ error: "Missing 'query' field" });

//     if (email) console.log(`🔹 Search request from: ${email}`);
//     console.log(`🔹 Requested link count: ${linkCount}`);

//     // ✅ 1. Use direct search API
//     const searchResults = await searchAPI(query);

//     console.log("Search Results ::::::::::", searchResults);

//     // ✅ 2. Take only the requested number of organic results
//     const requestedCount = parseInt(linkCount) || 10;
//     const topResults = searchResults.organic ? searchResults.organic.slice(0, requestedCount) : [];
//     console.log("topResults:::====", topResults);

//     // ✅ 3. Format the results properly for frontend
//     const formattedResults = {
//       searchParameters: searchResults.searchParameters || { q: query },
//       organic: topResults.map(item => ({
//         title: item.title,
//         link: item.link,
//         snippet: item.snippet,
//         site: getSourceName(item.link), // Add source name
//         publishedDate: item.date || item.publishedDate
//       }))
//     };

//     console.log("Formatted Results ::::::::::", formattedResults);

//     // ✅ 4. Create summary using only the limited results
//     const summary = await summarizeAsk(query, formattedResults.organic);

//     // ✅ 5. Save to MongoDB
//     const record = new SearchHistory({
//       email,
//       query,
//       category,
//       summary,  
//       resultsCount: topResults.length,
//       raw: raw || false,
//     });
//     await record.save();

//     // ✅ 6. If raw requested
//     if (raw === true) {
//       const rawData = await searchAPI(query, { returnRaw: true });
//       return res.json({
//         summary,
//         verifiedLinks: formattedResults,
//         raw: rawData,
//         email,
//       });
//     }

//     // ✅ 7. Final response - return organic array directly
//     return res.json({
//       summary,
//       verifiedLinks: formattedResults.organic, // ✅ Direct array of results
//       email,
//       linkCount: topResults.length // ✅ Actual count sent back
//     });
//   } catch (err) {
//     console.error("Search Error:", err);
//     return res
//       .status(500)
//       .json({ error: "Internal server error", message: err.message });
//   }
// };

// ✅ Add this helper function to extract source name from URL
function getSourceName(url) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    const domainParts = domain.split('.');
    if (domainParts.length >= 2) {
      const mainDomain = domainParts[domainParts.length - 2];
      return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
    }
    return domain;
  } catch (error) {
    return "Website";
  }
}

export const getUserSearchHistory = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Missing 'email' field in request body" });
    }

    const history = await SearchHistory.find({ email }).sort({ createdAt: -1 });

    return res.json({
      email,
      history,
      // Optional: Include total stats
      totalStats: {
        totalSearches: history.length,
        averageWords: history.reduce((acc, curr) => acc + (curr.summaryWordCount || 0), 0) / history.length,
        averageTokens: history.reduce((acc, curr) => acc + (curr.summaryTokenCount || 0), 0) / history.length
      }
    });
  } catch (err) {
    console.error("History Fetch Error:", err);
    return res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
};

// Combined token stats for profile (chat + search) - Single source of truth
export const getUserTokenStats = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Missing 'email' field in request body" });
    }

    // ✅ Use unified token stats function (single source of truth)
    const stats = await getGlobalTokenStats(email);

    return res.json({
      email,
      ...stats,
    });
  } catch (err) {
    console.error("Token Stats Error:", err);
    return res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
};
// export const getUserSearchHistory = async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({ error: "Missing 'email' field in request body" });
//     }

//     const history = await SearchHistory.find({ email }).sort({ createdAt: -1 });

//     return res.json({ email, history });
//   } catch (err) {
//     console.error("History Fetch Error:", err);
//     return res.status(500).json({
//       error: "Internal server error",
//       message: err.message,
//     });
//   }
// };
async function summarizeAskWithGrok(query, results) {
  if (!results || results.length === 0) return query;

  // Extract snippets from results for context
  const snippets = results
    .map(r => r.snippet)
    .filter(Boolean)
    .join(" ");

  const context = snippets || query;

  try {
    // Call Grok API for summarization (adjust endpoint and headers as needed)
    const grokResponse = await axios.post(
      'https://api.grok.ai/summarize', // Adjust endpoint
      {
        text: context,
        max_words: 50,
        query: query
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return grokResponse.data.summary || query;
  } catch (error) {
    console.warn('Grok API failed, falling back to basic summary:', error.message);
    // Fallback to basic 50-word summary
    const words = context.split(/\s+/).slice(0, 50);
    return words.join(" ");
  }
}