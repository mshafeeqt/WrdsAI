import { DataTypes } from "sequelize";
import { sequelize } from "./connect.js";

export const PgUser = sequelize.define(
  "PgUser",
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
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
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
      type: DataTypes.STRING,
      allowNull: false,
    },
    parentName: DataTypes.STRING,
    parentEmail: DataTypes.STRING,
    parentMobile: DataTypes.STRING,
    subscriptionPlan: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    childPlan: DataTypes.STRING,
    subscriptionType: {
      type: DataTypes.STRING,
      allowNull: false,
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

export const PgTransaction = sequelize.define(
  "PgTransaction",
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
    legacyEmail: DataTypes.STRING,
    razorpayOrderId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    razorpayPaymentId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: "INR",
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "success",
    },
    legacyPayload: DataTypes.JSONB,
  },
  {
    tableName: "transactions",
    indexes: [{ fields: ["legacyEmail"] }, { fields: ["userId"] }],
  },
);

export const PgReceiptCounter = sequelize.define(
  "PgReceiptCounter",
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
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    seq: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    legacyPayload: DataTypes.JSONB,
  },
  {
    tableName: "receipt_counters",
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

PgUser.hasMany(PgTransaction, { foreignKey: "userId" });
PgTransaction.belongsTo(PgUser, { foreignKey: "userId" });

export async function syncPostgresModels() {
  await sequelize.sync({ alter: true });
}
