import { Op } from "sequelize";
import {
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

function getCurrentMonthRange() {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { startDate, endDate };
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

function countMonthlyLessonPlans(events = []) {
  return events.filter(
    (event) =>
      cleanText(event.activityType).toLowerCase() === "lesson_plan" &&
      cleanText(event.eventType).toLowerCase() === "question_asked",
  ).length;
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

function normalizeUserRole(value = "") {
  return String(value || "").trim().toLowerCase() === "teacher"
    ? "Teacher"
    : "Student";
}

function normalizePlatformContext(value = "") {
  return String(value || "").trim().toLowerCase() === "teacher"
    ? "teacher"
    : "student";
}

async function findUserByEmail(email = "") {
  const normalizedEmail = cleanText(email).toLowerCase();
  if (!normalizedEmail) return null;
  return PgUser.findOne({ where: { email: normalizedEmail } });
}

export function getStudentProgress(email = "") {
  return buildRoleProgress(email, {
    userRole: "Student",
    platformContext: "student",
    includeTests: true,
  });
}

export function getTeacherProgress(email = "") {
  return buildRoleProgress(email, {
    userRole: "Teacher",
    platformContext: "teacher",
    includeTests: false,
  });
}

async function buildRoleProgress(email = "", options = {}) {
  const normalizedEmail = cleanText(email).toLowerCase();
  const progressRole = normalizeUserRole(options.userRole);
  const platformContext = normalizePlatformContext(options.platformContext);
  const includeTests = options.includeTests !== false;

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

  if (normalizeUserRole(user.userRole) !== progressRole) {
    const error = new Error(
      progressRole === "Teacher"
        ? "Teacher progress is available only for teacher accounts"
        : "Student progress is available only for student accounts",
    );
    error.statusCode = 403;
    throw error;
  }

  const month = getCurrentMonthRange();
  const monthlyTests =
    !includeTests
      ? []
      : await PgTestData.findAll({
          where: {
            userEmail: normalizedEmail,
            [Op.or]: [
              {
                submittedAt: {
                  [Op.gte]: month.startDate,
                  [Op.lt]: month.endDate,
                },
              },
              {
                submittedAt: null,
                createdAt: {
                  [Op.gte]: month.startDate,
                  [Op.lt]: month.endDate,
                },
              },
            ],
          },
          order: [
            ["submittedAt", "DESC"],
            ["createdAt", "DESC"],
          ],
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

  const questionEvents = await getMonthlyQuestionEvents(user.id, {
    userRole: progressRole,
    platformContext,
    month,
  });
  const questionStats = buildQuestionStats(questionEvents);
  const lessonPlansThisMonth =
    platformContext === "teacher" ? countMonthlyLessonPlans(questionEvents) : 0;

  return {
    success: true,
    user: {
      email: user.email,
      name: cleanText(`${user.firstName || ""} ${user.lastName || ""}`) || user.username || "",
    },
    month: {
      startDate: month.startDate,
      endDate: month.endDate,
      label: month.startDate.toLocaleString("en-US", {
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
      lessonPlansThisMonth,
    },
    testStats: {
      maths: buildSubjectTestStats(mathsTests),
      science: buildSubjectTestStats(scienceTests),
    },
    questions: questionStats,
    recentTests: monthlyTests.slice(0, 5).map(formatTestScore),
  };
}

async function getMonthlyQuestionEvents(userId, options = {}) {
  const userRole = normalizeUserRole(options.userRole);
  const platformContext = normalizePlatformContext(options.platformContext);
  const month = options.month || getCurrentMonthRange();

  return PgUserQuestionEvent.findAll({
    where: {
      userId,
      eventType: "question_asked",
      userRole,
      platformContext,
      createdAt: {
        [Op.gte]: month.startDate,
        [Op.lt]: month.endDate,
      },
    },
    raw: true,
  });
}

function buildQuestionStats(allQuestionEvents = []) {
  const questionStats = allQuestionEvents.reduce(
    (acc, row) => {
      const key = normalizeSubjectKey(row.subject);
      const rowQuestionCount = Math.max(0, Number(row.questionCount || 0));
      const isRag = Boolean(row.payload?.isRag);

      acc.all.questionsAsked += isRag ? 0 : rowQuestionCount;
      acc.all.ragQuestionsAsked += isRag ? rowQuestionCount : 0;
      acc.all.totalQuestionsAsked += rowQuestionCount;

      if (!["maths", "science"].includes(key)) return acc;

      acc[key].questionsAsked += isRag ? 0 : rowQuestionCount;
      acc[key].ragQuestionsAsked += isRag ? rowQuestionCount : 0;
      acc[key].totalQuestionsAsked += rowQuestionCount;
      return acc;
    },
    {
      all: emptyQuestionStats(),
      maths: emptyQuestionStats(),
      science: emptyQuestionStats(),
    },
  );

  questionStats.maths.mostAskedChapter = getMostAskedChapter(allQuestionEvents, "maths");
  questionStats.science.mostAskedChapter = getMostAskedChapter(allQuestionEvents, "science");

  return questionStats;
}
