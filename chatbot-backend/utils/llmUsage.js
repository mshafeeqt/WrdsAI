import { sequelize } from "../postgres/connect.js";

function cleanText(value = "") {
  return String(value || "").trim();
}

export function parseStudyMeta({ selectedChapter = "", selectedClassName = "", selectedSubjectName = "" } = {}) {
  const parts = cleanText(selectedChapter).split("/").filter(Boolean);
  return {
    userClass: cleanText(selectedClassName) || parts[0] || "",
    subject: cleanText(selectedSubjectName) || parts[1] || "",
  };
}

export async function upsertLlmUsage({
  userEmail,
  userName = "",
  userRole = "Student",
  platformContext = "student",
  activityType = "chat",
  userClass = "",
  subject = "",
  tokensUsed = 0,
  isRag = false,
} = {}) {
  const email = cleanText(userEmail).toLowerCase();
  const normalizedRole =
    cleanText(userRole).toLowerCase() === "teacher" ? "Teacher" : "Student";
  const normalizedContext =
    cleanText(platformContext).toLowerCase() === "teacher" ? "teacher" : "student";
  const normalizedActivity = cleanText(activityType) || "chat";
  const normalizedClass = cleanText(userClass) || "Unselected";
  const normalizedSubject = cleanText(subject) || "General";
  const safeTokens = Math.max(0, Math.round(Number(tokensUsed) || 0));

  if (!email) {
    return null;
  }

  const questionIncrement = isRag ? 0 : 1;
  const ragQuestionIncrement = isRag ? 1 : 0;

  const [rows] = await sequelize.query(
    `
      INSERT INTO llm_data (
        user_email,
        user_name,
        user_role,
        platform_context,
        activity_type,
        user_class,
        subject,
        questions_asked,
        questions_asked_rag,
        tokens_used
      )
      VALUES (
        :userEmail,
        :userName,
        :userRole,
        :platformContext,
        :activityType,
        :userClass,
        :subject,
        :questionsAsked,
        :questionsAskedRag,
        :tokensUsed
      )
      ON CONFLICT (
        user_email,
        user_role,
        platform_context,
        activity_type,
        user_class,
        subject
      )
      DO UPDATE SET
        questions_asked = llm_data.questions_asked + EXCLUDED.questions_asked,
        questions_asked_rag = llm_data.questions_asked_rag + EXCLUDED.questions_asked_rag,
        tokens_used = llm_data.tokens_used + EXCLUDED.tokens_used,
        user_name = COALESCE(NULLIF(EXCLUDED.user_name, ''), llm_data.user_name)
      RETURNING *;
    `,
    {
      replacements: {
        userEmail: email,
        userName: cleanText(userName),
        userRole: normalizedRole,
        platformContext: normalizedContext,
        activityType: normalizedActivity,
        userClass: normalizedClass,
        subject: normalizedSubject,
        questionsAsked: questionIncrement,
        questionsAskedRag: ragQuestionIncrement,
        tokensUsed: safeTokens,
      },
    },
  );

  return rows?.[0] || null;
}
