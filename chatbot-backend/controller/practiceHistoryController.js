import { PgPracticeMessage } from "../postgres/models.js";

const MAX_HISTORY_MESSAGES = 200;
const MAX_TEXT_LENGTH = 20000;

function asCleanString(value, maxLength = MAX_TEXT_LENGTH) {
  if (value === null || value === undefined) return "";
  return String(value).slice(0, maxLength);
}

function normalizeRole(value) {
  return value === "assistant" ? "assistant" : "user";
}

function serializePracticeMessage(record) {
  return {
    id: record.clientMessageId,
    role: record.role,
    text: record.messageText || "",
    html: record.messageHtml || "",
    kind: record.messageKind || "",
    problemText: record.problemText || "",
    createdAt: record.createdAt?.toISOString?.() || record.createdAt,
  };
}

function getChapterPayload(req) {
  const chapterId = asCleanString(req.body?.chapterId, 500).trim();
  if (!chapterId) {
    const error = new Error("chapterId is required");
    error.statusCode = 400;
    throw error;
  }

  return {
    chapterId,
    chapterName: asCleanString(req.body?.chapterName, 1000).trim(),
    className: asCleanString(req.body?.className, 500).trim(),
    subjectName: asCleanString(req.body?.subjectName, 500).trim(),
  };
}

export async function getPracticeHistory(req, res) {
  try {
    const { chapterId } = getChapterPayload(req);

    const records = await PgPracticeMessage.findAll({
      where: {
        userId: req.user.id,
        chapterId,
      },
      order: [["createdAt", "DESC"], ["id", "DESC"]],
      limit: MAX_HISTORY_MESSAGES,
    });

    return res.json({
      success: true,
      messages: records.reverse().map(serializePracticeMessage),
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    console.error("Practice history load failed:", error);
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Unable to load practice history",
    });
  }
}

export async function savePracticeMessage(req, res) {
  try {
    const chapter = getChapterPayload(req);
    const message = req.body?.message || {};
    const clientMessageId = asCleanString(message.id || message.clientMessageId, 500).trim();

    if (!clientMessageId) {
      return res.status(400).json({
        success: false,
        message: "message.id is required",
      });
    }

    const payload = {
      userId: req.user.id,
      userEmail: req.user.email,
      className: chapter.className,
      subjectName: chapter.subjectName,
      chapterId: chapter.chapterId,
      chapterName: chapter.chapterName,
      role: normalizeRole(message.role),
      messageKind: asCleanString(message.kind, 100).trim(),
      messageText: asCleanString(message.text),
      messageHtml: asCleanString(message.html),
      problemText: asCleanString(message.problemText),
      clientMessageId,
      createdAt: message.createdAt ? new Date(message.createdAt) : new Date(),
    };

    if (Number.isNaN(payload.createdAt.getTime())) {
      payload.createdAt = new Date();
    }

    const [record, created] = await PgPracticeMessage.findOrCreate({
      where: {
        userId: req.user.id,
        chapterId: chapter.chapterId,
        clientMessageId,
      },
      defaults: payload,
    });

    if (!created) {
      await record.update(payload);
    }

    return res.json({
      success: true,
      message: serializePracticeMessage(record),
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    console.error("Practice history save failed:", error);
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Unable to save practice history",
    });
  }
}
