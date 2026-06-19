import { Op } from "sequelize";
import { PgSearchHistory, PgUser } from "../postgres/models.js";
import {
  countChatSessionsForUser,
  sumChatTokensForUserSince,
} from "../services/chat/chatSessionStore.js";
import { getTokenLimit } from "./planTokens.js";

// ✅ Single source of truth: Calculate global token stats (same logic as getUserTokenStats)
export const getGlobalTokenStats = async (email) => {
  const user = await PgUser.findOne({ where: { email } });
  if (!user) throw new Error("User not found");

  // ✅ Get dynamic token limit based on user's subscription plan
  const limit = getTokenLimit({
    subscriptionPlan: user.subscriptionPlan,
    childPlan: user.childPlan,
  });


  const planStartDate = user.planStartDate || new Date(0);

  // Chat tokens: sum of tokensUsed across all session messages (only since planStartDate)
  const chatTokensUsed = await sumChatTokensForUserSince(user, planStartDate);

  // Search tokens: sum of summaryTokenCount across user search history (only since planStartDate)
  const searches = await PgSearchHistory.findAll({
    where: {
      userId: user.id,
      createdAt: { [Op.gte]: planStartDate },
    },
  });
  const searchTokensUsed = searches.reduce(
    (sum, s) => sum + (s.summaryTokenCount || 0),
    0
  );

  const totalTokensUsed = chatTokensUsed + searchTokensUsed;
  const remainingTokens = Math.max(0, limit - totalTokensUsed);
  const chatSessions = await countChatSessionsForUser(user);

  return {
    limit,
    chatTokensUsed,
    searchTokensUsed,
    totalTokensUsed,
    remainingTokens,
    totalSearches: searches.length,
    chatSessions,
  };
};

export const checkGlobalTokenLimit = async (
  email,
  newTokens = 0,
) => {
  const stats = await getGlobalTokenStats(email);
  const remaining = Math.max(0, stats.remainingTokens - newTokens);

  if (remaining <= 0) {
    const error = new Error("Not enough tokens");
    error.remainingTokens = 0;
    throw error;
  }

  return remaining;
};
