import { DataTypes } from "sequelize";
import { sequelize } from "./connect.js";

function deriveAgeGroup(dateOfBirth) {
  if (!dateOfBirth) return "";

  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  if (age < 13) return "<13";
  if (age <= 14) return "13-14";
  if (age <= 17) return "15-17";
  return "18+";
}

function getDefaultChildPlan(subscriptionPlan) {
  if (subscriptionPlan === "WrdsAI") return "Glow Up";
  if (subscriptionPlan === "WrdsAIPro") return "Step Up";
  if (subscriptionPlan === "WrdsAI Nxt" || subscriptionPlan === "WrdsAi Nxt") return "Boost Up";
  return null;
}

function getDefaultSubscriptionType(subscriptionPlan) {
  if (subscriptionPlan === "Free Trial") return "One Time";
  return "1 Month";
}

export const PgUser = sequelize.define(
  "PgUser",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userRole: {
      type: DataTypes.STRING,
      defaultValue: "Student",
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    mobile: DataTypes.STRING,
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    ageGroup: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue("ageGroup") || deriveAgeGroup(this.getDataValue("dateOfBirth"));
      },
      set(value) {
        this.setDataValue("ageGroup", value);
      },
    },
    className: DataTypes.STRING,
    schoolName: DataTypes.STRING,
    parentName: DataTypes.STRING,
    parentEmail: DataTypes.STRING,
    parentMobile: DataTypes.STRING,
    subscriptionPlan: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    childPlan: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue("childPlan") || getDefaultChildPlan(this.getDataValue("subscriptionPlan"));
      },
      set(value) {
        this.setDataValue("childPlan", value);
      },
    },
    subscriptionType: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue("subscriptionType") || getDefaultSubscriptionType(this.getDataValue("subscriptionPlan"));
      },
      set(value) {
        this.setDataValue("subscriptionType", value);
      },
    },
    basePriceINR: DataTypes.FLOAT,
    discountINR: DataTypes.FLOAT,
    gstAmount: DataTypes.FLOAT,
    totalPriceINR: DataTypes.FLOAT,
    password: DataTypes.STRING,
    remainingTokens: DataTypes.FLOAT,
    country: DataTypes.STRING,
    currency: DataTypes.STRING,
    subscriptionStatus: DataTypes.STRING,
    isActive: DataTypes.BOOLEAN,
    planStartDate: DataTypes.DATE,
    planExpiryDate: DataTypes.DATE,
    planExpiryEmailSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    resetPasswordToken: DataTypes.STRING,
    resetPasswordExpire: DataTypes.DATE,
    legacyPayload: DataTypes.JSONB,
  },
  {
    tableName: "users",
    indexes: [{ fields: ["email"] }],
  },
);

export const PgChatSession = sequelize.define(
  "PgChatSession",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    legacyMongoId: {
      type: DataTypes.STRING,
      unique: true,
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    legacyEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    grandTotalTokens: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: "chat",
    },
    createTime: DataTypes.DATE,
    legacyPayload: DataTypes.JSONB,
  },
  {
    tableName: "chat_sessions",
    indexes: [
      { fields: ["sessionId"] },
      { fields: ["legacyEmail"] },
      { fields: ["userId"] },
    ],
  },
);

export const PgChatMessage = sequelize.define(
  "PgChatMessage",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    legacyMessageIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    prompt: DataTypes.TEXT,
    response: DataTypes.TEXT,
    wordCount: DataTypes.FLOAT,
    tokensUsed: DataTypes.FLOAT,
    totalTokensUsed: DataTypes.FLOAT,
    botName: DataTypes.STRING,
    createTime: DataTypes.DATE,
    hasFiles: DataTypes.BOOLEAN,
    fileWordCount: DataTypes.FLOAT,
    type: DataTypes.STRING,
    isComplete: DataTypes.BOOLEAN,
    isPartial: DataTypes.BOOLEAN,
    promptTokens: DataTypes.FLOAT,
    responseTokens: DataTypes.FLOAT,
    fileTokenCount: DataTypes.FLOAT,
    promptWords: DataTypes.FLOAT,
    responseWords: DataTypes.FLOAT,
    totalWords: DataTypes.FLOAT,
    legacyPayload: DataTypes.JSONB,
  },
  {
    tableName: "chat_messages",
    indexes: [
      { unique: true, fields: ["chatSessionId", "legacyMessageIndex"] },
      { fields: ["userId"] },
    ],
  },
);

export const PgChatFile = sequelize.define(
  "PgChatFile",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fileIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    filename: DataTypes.STRING,
    cloudinaryUrl: DataTypes.TEXT,
    publicId: DataTypes.STRING,
    content: DataTypes.TEXT,
    wordCount: DataTypes.FLOAT,
    legacyPayload: DataTypes.JSONB,
  },
  {
    tableName: "chat_files",
    indexes: [{ unique: true, fields: ["chatMessageId", "fileIndex"] }],
  },
);

export const PgSearchHistory = sequelize.define(
  "PgSearchHistory",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    legacyMongoId: {
      type: DataTypes.STRING,
      unique: true,
    },
    legacyEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    query: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      defaultValue: "general",
    },
    resultsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    raw: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    summaryWordCount: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    summaryTokenCount: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    summary: DataTypes.TEXT,
    timestamp: DataTypes.DATE,
    legacyPayload: DataTypes.JSONB,
  },
  {
    tableName: "search_history",
    indexes: [{ fields: ["legacyEmail"] }, { fields: ["userId"] }],
  },
);

export const PgGrokSearchHistory = sequelize.define(
  "PgGrokSearchHistory",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    legacyMongoId: {
      type: DataTypes.STRING,
      unique: true,
    },
    legacyExternalId: DataTypes.STRING,
    legacyEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    query: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    summary: DataTypes.TEXT,
    tokenUsage: DataTypes.JSONB,
    category: {
      type: DataTypes.STRING,
      defaultValue: "general",
    },
    resultsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    raw: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    timestamp: DataTypes.DATE,
    legacyPayload: DataTypes.JSONB,
  },
  {
    tableName: "grok_search_history",
    indexes: [{ fields: ["legacyEmail"] }, { fields: ["userId"] }],
  },
);

export const PgTestAttempt = sequelize.define(
  "PgTestAttempt",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    chapterId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    className: DataTypes.STRING,
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    chapter: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    testType: {
      type: DataTypes.STRING,
      defaultValue: "chapter-mcq",
    },
    difficulty: DataTypes.STRING,
    score: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    correctAnswers: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    startedAt: DataTypes.DATE,
    completedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    submissionPayload: DataTypes.JSONB,
  },
  {
    tableName: "test_attempts",
    indexes: [
      { fields: ["userId"] },
      { fields: ["subject"] },
      { fields: ["chapter"] },
      { fields: ["completedAt"] },
    ],
  },
);

export const PgTestQuestionResult = sequelize.define(
  "PgTestQuestionResult",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    questionIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    questionText: DataTypes.TEXT,
    selectedIndex: DataTypes.INTEGER,
    correctIndex: DataTypes.INTEGER,
    isCorrect: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    subject: DataTypes.STRING,
    chapter: DataTypes.STRING,
    explanation: DataTypes.TEXT,
    payload: DataTypes.JSONB,
  },
  {
    tableName: "test_question_results",
    indexes: [
      { fields: ["testAttemptId"] },
      { unique: true, fields: ["testAttemptId", "questionIndex"] },
    ],
  },
);

export const PgTestData = sequelize.define(
  "PgTestData",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    userEmail: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "user_email",
    },
    userName: {
      type: DataTypes.TEXT,
      field: "user_name",
    },
    className: {
      type: DataTypes.TEXT,
      field: "class_name",
    },
    subject: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    chapterName: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "chapter_name",
    },
    attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    score: {
      type: DataTypes.DECIMAL(10, 2),
      validate: {
        min: 0,
      },
    },
    timeTaken: {
      type: "INTERVAL",
      field: "time_taken",
    },
    startedAt: {
      type: DataTypes.DATE,
      field: "started_at",
    },
    submittedAt: {
      type: DataTypes.DATE,
      field: "submitted_at",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
  },
  {
    tableName: "test_data",
    timestamps: false,
    indexes: [
      { fields: ["user_email"] },
      { fields: ["class_name"] },
      { fields: ["subject"] },
      { fields: ["chapter_name"] },
      { fields: ["created_at"] },
    ],
  },
);

export const PgLlmData = sequelize.define(
  "PgLlmData",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    userEmail: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "user_email",
    },
    userName: {
      type: DataTypes.TEXT,
      field: "user_name",
    },
    userClass: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "user_class",
    },
    subject: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    userRole: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "Student",
      field: "user_role",
    },
    platformContext: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "student",
      field: "platform_context",
    },
    activityType: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "chat",
      field: "activity_type",
    },
    questionsAsked: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "questions_asked",
      validate: {
        min: 0,
      },
    },
    questionsAskedRag: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "questions_asked_rag",
      validate: {
        min: 0,
      },
    },
    tokensUsed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "tokens_used",
      validate: {
        min: 0,
      },
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "last_used_at",
    },
  },
  {
    tableName: "llm_data",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: [
          "user_email",
          "user_role",
          "platform_context",
          "activity_type",
          "user_class",
          "subject",
        ],
      },
      { fields: ["user_email"] },
      { fields: ["user_role"] },
      { fields: ["platform_context"] },
      { fields: ["activity_type"] },
      { fields: ["subject"] },
      { fields: ["last_used_at"] },
    ],
  },
);

export const PgPracticeMessage = sequelize.define(
  "PgPracticeMessage",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userEmail: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    className: DataTypes.TEXT,
    subjectName: DataTypes.TEXT,
    chapterId: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    chapterName: DataTypes.TEXT,
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["user", "assistant"]],
      },
    },
    messageKind: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    messageText: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    messageHtml: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    problemText: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    clientMessageId: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "practice_messages",
    indexes: [
      { unique: true, fields: ["userId", "chapterId", "clientMessageId"] },
      { fields: ["userId", "chapterId", "createdAt"] },
      { fields: ["userEmail"] },
      { fields: ["chapterId"] },
    ],
  },
);
export const PgUserQuestionEvent = sequelize.define(
  "PgUserQuestionEvent",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    source: {
      type: DataTypes.STRING,
      defaultValue: "chat",
    },
    userRole: {
      type: DataTypes.STRING,
      defaultValue: "Student",
    },
    platformContext: {
      type: DataTypes.STRING,
      defaultValue: "student",
    },
    activityType: {
      type: DataTypes.STRING,
      defaultValue: "chat",
    },
    subject: DataTypes.STRING,
    chapter: DataTypes.STRING,
    chapterId: DataTypes.STRING,
    eventType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "question_asked",
    },
    questionCount: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    payload: DataTypes.JSONB,
  },
  {
    tableName: "user_question_events",
    indexes: [
      { fields: ["userId"] },
      { fields: ["userRole"] },
      { fields: ["platformContext"] },
      { fields: ["activityType"] },
      { fields: ["subject"] },
      { fields: ["chapter"] },
      { fields: ["eventType"] },
      { fields: ["createdAt"] },
    ],
  },
);

PgUser.hasMany(PgChatSession, { foreignKey: "userId" });
PgChatSession.belongsTo(PgUser, { foreignKey: "userId" });

PgChatSession.hasMany(PgChatMessage, { foreignKey: "chatSessionId" });
PgChatMessage.belongsTo(PgChatSession, { foreignKey: "chatSessionId" });

PgUser.hasMany(PgChatMessage, { foreignKey: "userId" });
PgChatMessage.belongsTo(PgUser, { foreignKey: "userId" });

PgChatMessage.hasMany(PgChatFile, { foreignKey: "chatMessageId" });
PgChatFile.belongsTo(PgChatMessage, { foreignKey: "chatMessageId" });

PgUser.hasMany(PgSearchHistory, { foreignKey: "userId" });
PgSearchHistory.belongsTo(PgUser, { foreignKey: "userId" });

PgUser.hasMany(PgGrokSearchHistory, { foreignKey: "userId" });
PgGrokSearchHistory.belongsTo(PgUser, { foreignKey: "userId" });

PgUser.hasMany(PgTestAttempt, { foreignKey: "userId" });
PgTestAttempt.belongsTo(PgUser, { foreignKey: "userId" });

PgTestAttempt.hasMany(PgTestQuestionResult, { foreignKey: "testAttemptId" });
PgTestQuestionResult.belongsTo(PgTestAttempt, { foreignKey: "testAttemptId" });

PgUser.hasMany(PgPracticeMessage, { foreignKey: "userId" });
PgPracticeMessage.belongsTo(PgUser, { foreignKey: "userId" });
PgUser.hasMany(PgUserQuestionEvent, { foreignKey: "userId" });
PgUserQuestionEvent.belongsTo(PgUser, { foreignKey: "userId" });

