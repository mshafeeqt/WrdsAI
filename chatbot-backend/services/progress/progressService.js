import { Op } from "sequelize";
import {
  PgLlmData,
  PgTestData,
  PgUser,
  PgUserQuestionEvent,
} from "../../postgres/models.js";

function cleanText(value = "") {
  return String(value || "").trim();
}

function normalizeSubjectKey(subject = "") {
  const normalized = String(subject || "").trim().toLowerCase();
  if (normalized.includes("math")) return "maths";
  if (normalized.includes("science")) return "science";
  return normalized;
}

function getCurrentMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function averageScore(rows = []) {
  const validScores = rows
    .map((row) => Number(row.score))
    .filter((score) => Number.isFinite(score));

  if (!validScores.length) return 0;

  return Math.round(
    (validScores.reduce((sum, score) => sum + score, 0) / validScores.length) * 100,
  ) / 100;
}

function emptyQuestionStats() {
  return {
    questionsAsked: 0,
    ragQuestionsAsked: 0,
    totalQuestionsAsked: 0,
    tokensUsed: 0,
    mostAskedChapter: null,
  };
}

function formatChapterTestStat(chapter) {
  if (!chapter) return null;

  return {
    chapterName: chapter.chapterName,
    testsTaken: chapter.testsTaken,
    averageScore: chapter.averageScore,
  };
}

function buildSubjectTestStats(rows = []) {
  const chapterMap = new Map();

  rows.forEach((row) => {
    const chapterName = cleanText(row.chapterName) || "Unknown chapter";
    const score = Number(row.score);
    const current = chapterMap.get(chapterName) || {
      chapterName,
      testsTaken: 0,
      scoreSum: 0,
      scoredTests: 0,
      averageScore: 0,
    };

    current.testsTaken += 1;

    if (Number.isFinite(score)) {
      current.scoreSum += score;
      current.scoredTests += 1;
    }

    chapterMap.set(chapterName, current);
  });

  const chapters = [...chapterMap.values()].map((chapter) => ({
    ...chapter,
    averageScore: chapter.scoredTests
      ? Math.round((chapter.scoreSum / chapter.scoredTests) * 100) / 100
      : 0,
  }));
  const scoredChapters = chapters.filter((chapter) => chapter.scoredTests > 0);
  const mostTestedChapter = [...chapters].sort(
    (a, b) => b.testsTaken - a.testsTaken || b.averageScore - a.averageScore,
  )[0];
  const strongestChapter = [...scoredChapters].sort(
    (a, b) => b.averageScore - a.averageScore || b.testsTaken - a.testsTaken,
  )[0];
  const weakestChapter = [...scoredChapters].sort(
    (a, b) => a.averageScore - b.averageScore || b.testsTaken - a.testsTaken,
  )[0];

  return {
    testsTaken: rows.length,
    averageScore: averageScore(rows),
    mostTestedChapter: formatChapterTestStat(mostTestedChapter),
    strongestChapter: formatChapterTestStat(strongestChapter),
    weakestChapter: formatChapterTestStat(weakestChapter),
  };
}

function getMostAskedChapter(events = [], subjectKey = "") {
  const chapterCounts = new Map();

  events.forEach((event) => {
    if (normalizeSubjectKey(event.subject) !== subjectKey) return;

    const chapter = cleanText(event.chapter);
    if (!chapter || chapter.toLowerCase() === "general") return;

    const currentCount = chapterCounts.get(chapter) || 0;
    chapterCounts.set(chapter, currentCount + Number(event.questionCount || 0));
  });

  const [chapterName = "", questionsAsked = 0] =
    [...chapterCounts.entries()].sort((a, b) => b[1] - a[1])[0] || [];

  return { chapterName, questionsAsked };
}

function formatTestScore(row) {
  return {
    id: row.id,
    className: row.className,
    subject: row.subject,
    chapterName: row.chapterName,
    score: row.score === null || row.score === undefined ? null : Number(row.score),
    attempts: row.attempts,
    submittedAt: row.submittedAt,
    createdAt: row.createdAt,
  };
}

async function findUserByEmail(email = "") {
  const normalizedEmail = cleanText(email).toLowerCase();
  if (!normalizedEmail) return null;
  return PgUser.findOne({ where: { email: normalizedEmail } });
}

export async function getUserProgress(email = "") {
  const normalizedEmail = cleanText(email).toLowerCase();

  if (!normalizedEmail) {
    const error = new Error("email is required");
    error.statusCode = 400;
    throw error;
  }

  const user = await findUserByEmail(normalizedEmail);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const monthStart = getCurrentMonthStart();
  const monthlyTests = await PgTestData.findAll({
    where: {
      userEmail: normalizedEmail,
      createdAt: { [Op.gte]: monthStart },
    },
    order: [["createdAt", "DESC"]],
  });

  const mathsTests = monthlyTests.filter(
    (test) => normalizeSubjectKey(test.subject) === "maths",
  );
  const scienceTests = monthlyTests.filter(
    (test) => normalizeSubjectKey(test.subject) === "science",
  );
  const mathsScienceTests = monthlyTests.filter((test) =>
    ["maths", "science"].includes(normalizeSubjectKey(test.subject)),
  );

  const questionStats = await buildQuestionStats(user.id, normalizedEmail);

  return {
    success: true,
    user: {
      email: user.email,
      name: cleanText(`${user.firstName || ""} ${user.lastName || ""}`) || user.username || "",
    },
    month: {
      startDate: monthStart,
      label: monthStart.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      }),
    },
    summary: {
      totalTestsTakenThisMonth: monthlyTests.length,
      mathsScienceAverageScore: averageScore(mathsScienceTests),
      mathsAverageScore: averageScore(mathsTests),
      scienceAverageScore: averageScore(scienceTests),
      totalQuestionsAsked: questionStats.all.totalQuestionsAsked,
      mathsScienceQuestionsAsked:
        questionStats.maths.totalQuestionsAsked + questionStats.science.totalQuestionsAsked,
    },
    testStats: {
      maths: buildSubjectTestStats(mathsTests),
      science: buildSubjectTestStats(scienceTests),
    },
    questions: questionStats,
    recentTests: monthlyTests.slice(0, 5).map(formatTestScore),
  };
}

async function buildQuestionStats(userId, email) {
  const llmRows = await PgLlmData.findAll({
    where: { userEmail: email },
  });

  const questionStats = llmRows.reduce(
    (acc, row) => {
      const key = normalizeSubjectKey(row.subject);
      const rowQuestionCount =
        Number(row.questionsAsked || 0) + Number(row.questionsAskedRag || 0);

      acc.all.questionsAsked += Number(row.questionsAsked || 0);
      acc.all.ragQuestionsAsked += Number(row.questionsAskedRag || 0);
      acc.all.totalQuestionsAsked += rowQuestionCount;
      acc.all.tokensUsed += Number(row.tokensUsed || 0);

      if (!["maths", "science"].includes(key)) return acc;

      acc[key].questionsAsked += Number(row.questionsAsked || 0);
      acc[key].ragQuestionsAsked += Number(row.questionsAskedRag || 0);
      acc[key].totalQuestionsAsked += rowQuestionCount;
      acc[key].tokensUsed += Number(row.tokensUsed || 0);
      return acc;
    },
    {
      all: emptyQuestionStats(),
      maths: emptyQuestionStats(),
      science: emptyQuestionStats(),
    },
  );

  const allQuestionEvents = await PgUserQuestionEvent.findAll({
    where: {
      userId,
      eventType: "question_asked",
    },
    raw: true,
  });

  questionStats.maths.mostAskedChapter = getMostAskedChapter(allQuestionEvents, "maths");
  questionStats.science.mostAskedChapter = getMostAskedChapter(allQuestionEvents, "science");

  return questionStats;
}
