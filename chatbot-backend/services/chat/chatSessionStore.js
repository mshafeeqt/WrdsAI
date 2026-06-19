import { Op, QueryTypes } from "sequelize";
import {
  PgChatFile,
  PgChatMessage,
  PgChatSession,
  PgUser,
} from "../../postgres/models.js";
import { sequelize } from "../../postgres/connect.js";

const DEFAULT_TYPE = "WrdsAi Nxt";
const LEGACY_CHAT_SESSIONS_TABLE = "ChatSessions";

function normalizeWhere(where = {}) {
  return {
    email: where.email || where.legacyEmail,
    sessionId: where.sessionId,
    type: where.type,
    userId: where.userId,
  };
}

function buildSessionWhere(where = {}) {
  const normalized = normalizeWhere(where);
  const pgWhere = {};

  if (normalized.sessionId) pgWhere.sessionId = normalized.sessionId;
  if (normalized.email) pgWhere.legacyEmail = normalized.email;
  if (normalized.userId) pgWhere.userId = normalized.userId;
  if (normalized.type) pgWhere.type = normalized.type;

  return pgWhere;
}

function toPlainMessage(message) {
  const payload = message.legacyPayload || {};
  const files = (message.PgChatFiles || message.pgChatFiles || []).map((file) => ({
    filename: file.filename,
    cloudinaryUrl: file.cloudinaryUrl,
    publicId: file.publicId,
    content: file.content,
    wordCount: file.wordCount,
    ...(file.legacyPayload || {}),
  }));

  return {
    ...payload,
    prompt: message.prompt ?? payload.prompt,
    response: message.response ?? payload.response,
    wordCount: message.wordCount ?? payload.wordCount,
    tokensUsed: message.tokensUsed ?? payload.tokensUsed,
    totalTokensUsed: message.totalTokensUsed ?? payload.totalTokensUsed,
    botName: message.botName ?? payload.botName,
    create_time: message.createTime ?? payload.create_time,
    createdAt: message.createTime ?? message.createdAt ?? payload.createdAt,
    hasFiles: message.hasFiles ?? payload.hasFiles,
    fileWordCount: message.fileWordCount ?? payload.fileWordCount,
    type: message.type ?? payload.type,
    isComplete: message.isComplete ?? payload.isComplete,
    isPartial: message.isPartial ?? payload.isPartial,
    promptTokens: message.promptTokens ?? payload.promptTokens,
    responseTokens: message.responseTokens ?? payload.responseTokens,
    fileTokenCount: message.fileTokenCount ?? payload.fileTokenCount,
    promptWords: message.promptWords ?? payload.promptWords,
    responseWords: message.responseWords ?? payload.responseWords,
    totalWords: message.totalWords ?? payload.totalWords,
    files: files.length ? files : payload.files || [],
  };
}

async function getUserByEmail(email) {
  if (!email) return null;
  return PgUser.findOne({ where: { email } });
}

async function getUserEmailById(userId) {
  if (!userId) return "";
  const user = await PgUser.findByPk(userId);
  return user?.email || "";
}

async function loadMessages(pgSession) {
  if (!pgSession) return [];

  const messages = await PgChatMessage.findAll({
    where: { chatSessionId: pgSession.id },
    include: [{ model: PgChatFile, required: false }],
    order: [["legacyMessageIndex", "ASC"]],
  });

  return messages.map(toPlainMessage);
}

async function saveFiles(message, files = []) {
  if (!Array.isArray(files)) return;

  await PgChatFile.destroy({ where: { chatMessageId: message.id } });

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index] || {};
    await PgChatFile.create({
      chatMessageId: message.id,
      fileIndex: index,
      filename: file.filename || file.originalname || "",
      cloudinaryUrl: file.cloudinaryUrl || file.path || "",
      publicId: file.publicId || "",
      content: file.content || "",
      wordCount: file.wordCount || 0,
      legacyPayload: file,
    });
  }
}

function createAdapter(pgSession, history = [], draft = {}) {
  const adapter = {
    _pgSession: pgSession || null,
    id: pgSession?.id || draft.id,
    userId: pgSession?.userId || draft.userId,
    email: pgSession?.legacyEmail || draft.email || draft.legacyEmail,
    sessionId: pgSession?.sessionId || draft.sessionId,
    type: pgSession?.type || draft.type || DEFAULT_TYPE,
    create_time: pgSession?.createTime || draft.create_time || draft.createTime,
    createdAt: pgSession?.createdAt || draft.createdAt,
    grandTotalTokens: pgSession?.grandTotalTokens || draft.grandTotalTokens || 0,
    history: Array.isArray(history) ? history : [],
    meta: pgSession?.legacyPayload?.meta || draft.meta || {},
    changed() {},
    async save() {
      const user = await getUserByEmail(this.email);
      const createTime = this.create_time || this.createdAt || new Date();

      if (!this._pgSession) {
        this._pgSession = await PgChatSession.create({
          userId: user?.id || this.userId || null,
          legacyEmail: this.email,
          sessionId: this.sessionId,
          type: this.type || DEFAULT_TYPE,
          createTime,
          grandTotalTokens: this.grandTotalTokens || 0,
          legacyPayload: { meta: this.meta || {} },
        });
        this.id = this._pgSession.id;
      } else {
        await this._pgSession.update({
          userId: user?.id || this._pgSession.userId || this.userId || null,
          legacyEmail: this.email,
          sessionId: this.sessionId,
          type: this.type || DEFAULT_TYPE,
          createTime,
          grandTotalTokens: this.grandTotalTokens || 0,
          legacyPayload: {
            ...(this._pgSession.legacyPayload || {}),
            meta: this.meta || {},
          },
        });
      }

      await PgChatMessage.destroy({
        where: {
          chatSessionId: this._pgSession.id,
          legacyMessageIndex: { [Op.gte]: this.history.length },
        },
      });

      for (let index = 0; index < this.history.length; index += 1) {
        const entry = this.history[index] || {};
        const [message] = await PgChatMessage.findOrCreate({
          where: {
            chatSessionId: this._pgSession.id,
            legacyMessageIndex: index,
          },
          defaults: {
            userId: user?.id || this._pgSession.userId || null,
            prompt: entry.prompt || "",
            response: entry.response || "",
            legacyPayload: entry,
          },
        });

        await message.update({
          userId: user?.id || this._pgSession.userId || null,
          prompt: entry.prompt || "",
          response: entry.response || "",
          wordCount: entry.wordCount || 0,
          tokensUsed: entry.tokensUsed || 0,
          totalTokensUsed: entry.totalTokensUsed || 0,
          botName: entry.botName || "",
          createTime: entry.create_time || entry.createdAt || new Date(),
          hasFiles: Boolean(entry.files?.length),
          fileWordCount: entry.fileWordCount || 0,
          type: entry.type || this.type || DEFAULT_TYPE,
          isComplete: entry.isComplete,
          isPartial: entry.isPartial,
          promptTokens: entry.promptTokens || 0,
          responseTokens: entry.responseTokens || 0,
          fileTokenCount: entry.fileTokenCount || 0,
          promptWords: entry.promptWords || 0,
          responseWords: entry.responseWords || 0,
          totalWords: entry.totalWords || 0,
          legacyPayload: entry,
        });

        await saveFiles(message, entry.files || []);
      }

      return this;
    },
  };

  return adapter;
}

async function migrateLegacySession(legacySession) {
  if (!legacySession) return null;

  const user = await getUserByEmail(legacySession.email);
  const [pgSession] = await PgChatSession.findOrCreate({
    where: {
      legacyEmail: legacySession.email,
      sessionId: legacySession.sessionId,
      type: legacySession.type || DEFAULT_TYPE,
    },
    defaults: {
      userId: user?.id || null,
      legacyEmail: legacySession.email,
      sessionId: legacySession.sessionId,
      type: legacySession.type || DEFAULT_TYPE,
      createTime: legacySession.create_time || legacySession.createdAt || new Date(),
      grandTotalTokens: legacySession.grandTotalTokens || 0,
      legacyPayload: { migratedFrom: "ChatSession" },
    },
  });

  const adapter = createAdapter(pgSession, legacySession.history || []);
  await adapter.save();
  return adapter;
}

async function legacyChatSessionsTableExists() {
  const [result] = await sequelize.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = :tableName
      ) AS "exists";
    `,
    {
      replacements: { tableName: LEGACY_CHAT_SESSIONS_TABLE },
      type: QueryTypes.SELECT,
    },
  );

  return Boolean(result?.exists);
}

function buildLegacyWhereClause(where = {}) {
  const normalized = normalizeWhere(where);
  const clauses = [];
  const replacements = {};

  if (normalized.email) {
    clauses.push('"email" = :email');
    replacements.email = normalized.email;
  }
  if (normalized.sessionId) {
    clauses.push('"sessionId" = :sessionId');
    replacements.sessionId = normalized.sessionId;
  }
  if (normalized.type) {
    clauses.push('"type" = :type');
    replacements.type = normalized.type;
  }

  return {
    sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    replacements,
  };
}

async function findLegacyOne(where = {}) {
  const sessions = await findLegacyAll(where, { limit: 1 });
  return sessions[0] || null;
}

async function findLegacyAll(where = {}, { limit } = {}) {
  if (!(await legacyChatSessionsTableExists())) return [];

  const filter = buildLegacyWhereClause(where);
  const limitClause = Number.isInteger(limit) && limit > 0 ? `LIMIT ${limit}` : "";

  return sequelize.query(
    `
      SELECT
        "id",
        "sessionId",
        "email",
        "history",
        "grandTotalTokens",
        "type",
        "createdAt",
        "updatedAt"
      FROM "${LEGACY_CHAT_SESSIONS_TABLE}"
      ${filter.sql}
      ORDER BY "createdAt" ASC
      ${limitClause};
    `,
    {
      replacements: filter.replacements,
      type: QueryTypes.SELECT,
    },
  );
}

const ChatSessionStore = {
  build(data = {}) {
    return createAdapter(null, data.history || [], data);
  },

  async findOne({ where = {} } = {}) {
    const pgSession = await PgChatSession.findOne({ where: buildSessionWhere(where) });
    if (pgSession) {
      return createAdapter(pgSession, await loadMessages(pgSession));
    }

    const normalized = normalizeWhere(where);
    const legacyEmail = normalized.email || (await getUserEmailById(normalized.userId));
    if (!legacyEmail) return null;

    const legacySession = await findLegacyOne({ ...where, email: legacyEmail });
    return migrateLegacySession(legacySession);
  },

  async findAll({ where = {} } = {}) {
    const pgSessions = await PgChatSession.findAll({
      where: buildSessionWhere(where),
      order: [["createdAt", "ASC"]],
    });

    const adapters = [];
    const seenSessionIds = new Set();
    for (const pgSession of pgSessions) {
      seenSessionIds.add(`${pgSession.legacyEmail}:${pgSession.sessionId}:${pgSession.type}`);
      adapters.push(createAdapter(pgSession, await loadMessages(pgSession)));
    }

    const normalized = normalizeWhere(where);
    const legacyEmail = normalized.email || (await getUserEmailById(normalized.userId));
    if (!legacyEmail && !normalized.sessionId) return adapters;

    const legacySessions = await findLegacyAll({
      ...where,
      email: legacyEmail || normalized.email,
    });
    for (const legacySession of legacySessions) {
      const key = `${legacySession.email}:${legacySession.sessionId}:${legacySession.type}`;
      if (seenSessionIds.has(key)) continue;
      const migrated = await migrateLegacySession(legacySession);
      if (migrated) adapters.push(migrated);
    }

    return adapters;
  },

  async update(values = {}, { where = {} } = {}) {
    const updateValues = {};
    if ("grandTotalTokens" in values) updateValues.grandTotalTokens = values.grandTotalTokens;
    if ("type" in values) updateValues.type = values.type;
    if ("create_time" in values) updateValues.createTime = values.create_time;

    return PgChatSession.update(updateValues, { where: buildSessionWhere(where) });
  },
};

export async function sumChatTokensForUserSince(user, sinceDate = new Date(0)) {
  if (!user) return 0;

  const sessions = await ChatSessionStore.findAll({
    where: { userId: user.id },
  });

  return sessions.reduce((total, session) => {
    const sessionTotal = (session.history || []).reduce((inner, message) => {
      const messageDate = message.create_time
        ? new Date(message.create_time)
        : message.createdAt
          ? new Date(message.createdAt)
          : new Date(0);

      return messageDate >= sinceDate ? inner + (message.tokensUsed || 0) : inner;
    }, 0);

    return total + sessionTotal;
  }, 0);
}

export async function countChatSessionsForUser(user) {
  if (!user) return 0;
  const sessions = await ChatSessionStore.findAll({ where: { userId: user.id } });
  return sessions.length;
}

export default ChatSessionStore;
