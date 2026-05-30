import { Op, fn, col, literal } from "sequelize";
import {
  PgTestData,
  PgTestAttempt,
  PgTestQuestionResult,
  PgUser,
  PgUserQuestionEvent,
} from "../postgres/models.js";

function cleanText(value = "") {
  return String(value || "").trim();
}

function parseChapterMeta(chapterId = "") {
  const parts = String(chapterId || "").split("/").filter(Boolean);
  return {
    className: parts[0] || "",
    subjectName: parts[1] || "",
    chapterName: parts[2] || parts[parts.length - 1] || "",
  };
}

async function findUserByEmail(email = "") {
  const normalizedEmail = cleanText(email).toLowerCase();
  if (!normalizedEmail) return null;
  return PgUser.findOne({ where: { email: normalizedEmail } });
}

function getRangeStart(range = "week") {
  const now = new Date();
  const start = new Date(now);

  if (String(range).toLowerCase() === "month") {
    start.setDate(now.getDate() - 30);
    return start;
  }

  start.setDate(now.getDate() - 7);
  return start;
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

async function getLatestTestScoresForEmail(email, { chapterName = "", subject = "", limit = 4 } = {}) {
  const where = { userEmail: email };

  if (chapterName) {
    where.chapterName = chapterName;
  }

  if (subject) {
    where.subject = subject;
  }

  return PgTestData.findAll({
    where,
    order: [
      ["submittedAt", "DESC"],
      ["createdAt", "DESC"],
    ],
    limit,
  });
}

export async function logUserQuestionEvent(req, res) {
  try {
    const email = cleanText(req.body?.email).toLowerCase();
    const chapterId = cleanText(req.body?.chapterId);
    const source = cleanText(req.body?.source) || "chat";
    const eventType = cleanText(req.body?.eventType) || "question_asked";
    const explicitSubject = cleanText(req.body?.subject);
    const explicitChapter = cleanText(req.body?.chapter);
    const questionCount = Number(req.body?.questionCount) || 1;

    if (!email) {
      return res.status(400).json({ success: false, message: "email is required" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const parsed = parseChapterMeta(chapterId);

    const event = await PgUserQuestionEvent.create({
      userId: user.id,
      source,
      subject: explicitSubject || parsed.subjectName || "general",
      chapter: explicitChapter || parsed.chapterName || "general",
      chapterId: chapterId || null,
      eventType,
      questionCount: Math.max(1, questionCount),
      payload: req.body || {},
    });

    res.status(201).json({
      success: true,
      message: "Question event logged",
      eventId: event.id,
    });
  } catch (error) {
    console.error("logUserQuestionEvent error:", error);
    res.status(500).json({ success: false, message: "Failed to log question event" });
  }
}

export async function submitTestAttempt(req, res) {
  try {
    const email = cleanText(req.body?.email).toLowerCase();
    const chapterId = cleanText(req.body?.chapterId);
    const difficulty = cleanText(req.body?.difficulty || "Easy");
    const testType = cleanText(req.body?.testType || "chapter-mcq");
    const startedAt = req.body?.startedAt ? new Date(req.body.startedAt) : null;
    const submittedAt = req.body?.submittedAt ? new Date(req.body.submittedAt) : new Date();
    const userName = cleanText(req.body?.userName);
    const explicitClassName = cleanText(req.body?.className);
    const timeTakenSeconds = Number(req.body?.timeTakenSeconds ?? req.body?.timeTaken);
    const questions = Array.isArray(req.body?.questions) ? req.body.questions : [];
    const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];

    if (!email || !chapterId) {
      return res.status(400).json({
        success: false,
        message: "email and chapterId are required",
      });
    }

    if (!questions.length) {
      return res.status(400).json({
        success: false,
        message: "questions are required to save a test attempt",
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const parsed = parseChapterMeta(chapterId);
    let correctAnswers = 0;

    const attempt = await PgTestAttempt.create({
      userId: user.id,
      chapterId,
      className: parsed.className || explicitClassName || null,
      subject: parsed.subjectName || cleanText(req.body?.subject) || "general",
      chapter: parsed.chapterName || cleanText(req.body?.chapter) || "general",
      testType,
      difficulty,
      totalQuestions: questions.length,
      startedAt:
        startedAt instanceof Date && !Number.isNaN(startedAt.getTime())
          ? startedAt
          : null,
      completedAt: submittedAt,
      submissionPayload: req.body || {},
    });

    const questionRows = questions.map((question, index) => {
      const selectedIndexRaw =
        answers[index]?.selectedIndex ??
        answers[index]?.answerIndex ??
        question?.selectedIndex ??
        null;
      const selectedIndex =
        selectedIndexRaw === null || selectedIndexRaw === undefined || selectedIndexRaw === ""
          ? null
          : Number.isInteger(selectedIndexRaw)
            ? selectedIndexRaw
            : Number(selectedIndexRaw);
      const correctIndex = Number(question?.correct ?? question?.correctIndex);
      const isCorrect =
        Number.isInteger(correctIndex) &&
        Number.isInteger(selectedIndex) &&
        selectedIndex === correctIndex;

      if (isCorrect) {
        correctAnswers += 1;
      }

      return {
        testAttemptId: attempt.id,
        questionIndex: index,
        questionText: cleanText(question?.question),
        selectedIndex: Number.isInteger(selectedIndex) ? selectedIndex : null,
        correctIndex: Number.isInteger(correctIndex) ? correctIndex : null,
        isCorrect,
        subject: attempt.subject,
        chapter: attempt.chapter,
        explanation: cleanText(question?.explanation),
        payload: {
          question,
          answer: answers[index] || null,
        },
      };
    });

    if (questionRows.length) {
      await PgTestQuestionResult.bulkCreate(questionRows);
    }

    const score = questions.length
      ? Math.round((correctAnswers / questions.length) * 10000) / 100
      : 0;

    await attempt.update({
      correctAnswers,
      score,
    });

    const priorAttempts = await PgTestData.count({
      where: {
        userEmail: email,
        subject: attempt.subject,
        chapterName: attempt.chapter,
      },
    });

    await PgTestData.create({
      userEmail: email,
      userName:
        userName ||
        cleanText(`${user.firstName || ""} ${user.lastName || ""}`) ||
        user.username ||
        null,
      className: parsed.className || explicitClassName || null,
      subject: attempt.subject,
      chapterName: attempt.chapter,
      attempts: priorAttempts + 1,
      score,
      timeTaken:
        Number.isFinite(timeTakenSeconds) && timeTakenSeconds >= 0
          ? `${Math.round(timeTakenSeconds)} seconds`
          : null,
      startedAt:
        startedAt instanceof Date && !Number.isNaN(startedAt.getTime())
          ? startedAt
          : null,
      submittedAt,
    });

    await PgUserQuestionEvent.create({
      userId: user.id,
      source: "test-prep",
      subject: attempt.subject,
      chapter: attempt.chapter,
      chapterId,
      eventType: "test_completed",
      questionCount: questions.length,
      payload: {
        testAttemptId: attempt.id,
        score,
        correctAnswers,
        totalQuestions: questions.length,
      },
    });

    const latestScores = await getLatestTestScoresForEmail(email, {
      chapterName: attempt.chapter,
      subject: attempt.subject,
      limit: 4,
    });

    res.status(201).json({
      success: true,
      message: "Test attempt saved",
      attemptId: attempt.id,
      score,
      correctAnswers,
      totalQuestions: questions.length,
      latestScores: latestScores.map(formatTestScore),
    });
  } catch (error) {
    console.error("submitTestAttempt error:", error);
    res.status(500).json({ success: false, message: "Failed to save test attempt" });
  }
}

export async function getRecentTestScores(req, res) {
  try {
    const email = cleanText(req.body?.email || req.query?.email).toLowerCase();
    const chapterName = cleanText(req.body?.chapterName || req.body?.chapter || req.query?.chapterName);
    const subject = cleanText(req.body?.subject || req.query?.subject);

    if (!email) {
      return res.status(400).json({ success: false, message: "email is required" });
    }

    if (!chapterName) {
      return res.status(400).json({ success: false, message: "chapterName is required" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const latestScores = await getLatestTestScoresForEmail(email, {
      chapterName,
      subject,
      limit: 4,
    });

    res.json({
      success: true,
      scores: latestScores.map(formatTestScore),
    });
  } catch (error) {
    console.error("getRecentTestScores error:", error);
    res.status(500).json({ success: false, message: "Failed to load recent scores" });
  }
}

export async function getUserAnalyticsSummary(req, res) {
  try {
    const email = cleanText(req.body?.email || req.query?.email).toLowerCase();
    const range = cleanText(req.body?.range || req.query?.range || "week").toLowerCase();

    if (!email) {
      return res.status(400).json({ success: false, message: "email is required" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const startDate = getRangeStart(range);

    const attempts = await PgTestAttempt.findAll({
      where: {
        userId: user.id,
        completedAt: { [Op.gte]: startDate },
      },
      order: [["completedAt", "DESC"]],
    });

    const questionEvents = await PgUserQuestionEvent.findAll({
      where: {
        userId: user.id,
        createdAt: { [Op.gte]: startDate },
      },
      order: [["createdAt", "DESC"]],
    });

    const chapterTestCountsRaw = await PgTestAttempt.findAll({
      attributes: [
        "chapter",
        [fn("COUNT", col("id")), "testsTaken"],
        [fn("AVG", col("score")), "averageScore"],
      ],
      where: {
        userId: user.id,
        completedAt: { [Op.gte]: startDate },
      },
      group: ["chapter"],
      order: [[literal("\"testsTaken\""), "DESC"]],
      raw: true,
    });

    const chapterQuestionCountsRaw = await PgUserQuestionEvent.findAll({
      attributes: [
        "chapter",
        [fn("SUM", col("questionCount")), "questionsAsked"],
      ],
      where: {
        userId: user.id,
        createdAt: { [Op.gte]: startDate },
        eventType: "question_asked",
      },
      group: ["chapter"],
      order: [[literal("\"questionsAsked\""), "DESC"]],
      raw: true,
    });

    const subjectQuestionCountsRaw = await PgUserQuestionEvent.findAll({
      attributes: [
        "subject",
        [fn("SUM", col("questionCount")), "questionsAsked"],
      ],
      where: {
        userId: user.id,
        createdAt: { [Op.gte]: startDate },
        eventType: "question_asked",
      },
      group: ["subject"],
      order: [[literal("\"questionsAsked\""), "DESC"]],
      raw: true,
    });

    const totalQuestionsAsked = questionEvents
      .filter((event) => event.eventType === "question_asked")
      .reduce((sum, event) => sum + (event.questionCount || 0), 0);

    const testsTaken = attempts.length;
    const averageScore = testsTaken
      ? Math.round(
          (attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / testsTaken) *
            100,
        ) / 100
      : 0;

    res.json({
      success: true,
      range,
      startDate,
      summary: {
        userId: user.id,
        email: user.email,
        testsTaken,
        averageScore,
        totalQuestionsAsked,
      },
      testsByChapter: chapterTestCountsRaw.map((row) => ({
        chapter: row.chapter,
        testsTaken: Number(row.testsTaken || 0),
        averageScore: Math.round(Number(row.averageScore || 0) * 100) / 100,
      })),
      questionsByChapter: chapterQuestionCountsRaw.map((row) => ({
        chapter: row.chapter,
        questionsAsked: Number(row.questionsAsked || 0),
      })),
      questionsBySubject: subjectQuestionCountsRaw.map((row) => ({
        subject: row.subject,
        questionsAsked: Number(row.questionsAsked || 0),
      })),
      recentAttempts: attempts.slice(0, 10).map((attempt) => ({
        id: attempt.id,
        subject: attempt.subject,
        chapter: attempt.chapter,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        correctAnswers: attempt.correctAnswers,
        completedAt: attempt.completedAt,
      })),
    });
  } catch (error) {
    console.error("getUserAnalyticsSummary error:", error);
    res.status(500).json({ success: false, message: "Failed to load analytics" });
  }
}
