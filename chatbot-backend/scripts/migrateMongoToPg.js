import dotenv from "dotenv";
import mongoose from "mongoose";

import User from "../model/User.js";
import ChatSession from "../model/ChatSession.js";
import SearchHistory from "../model/SearchHistory.js";
import GrokSearchHistory from "../model/grokSearchHistory.js";
import Transaction from "../model/Transaction.js";
import ReceiptCounter from "../model/ReceiptCounter.js";

import { connectPG, sequelize } from "../postgres/connect.js";
import {
  PgChatFile,
  PgChatMessage,
  PgChatSession,
  PgGrokSearchHistory,
  PgReceiptCounter,
  PgSearchHistory,
  PgTransaction,
  PgUser,
  syncPostgresModels,
} from "../postgres/models.js";

dotenv.config();

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");

function asDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function asNumber(value, fallback = null) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mongoId(doc) {
  return doc?._id ? String(doc._id) : null;
}

function plainDoc(doc) {
  return typeof doc?.toObject === "function" ? doc.toObject() : doc;
}

async function connectMongo() {
  const mongoUri = (process.env.MONGO_URI || "").trim();
  if (!mongoUri) {
    throw new Error("MONGO_URI is required for Mongo-to-Postgres migration");
  }

  await mongoose.connect(mongoUri);
}

async function upsertUser(userDoc) {
  const user = plainDoc(userDoc);
  const legacyMongoId = mongoId(userDoc);
  const email = String(user.email || "").trim().toLowerCase();

  if (!email) {
    return null;
  }

  const values = {
    legacyMongoId,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email,
    mobile: user.mobile || null,
    dateOfBirth: asDate(user.dateOfBirth),
    ageGroup: user.ageGroup || "",
    parentName: user.parentName || null,
    parentEmail: user.parentEmail || null,
    parentMobile: user.parentMobile || null,
    subscriptionPlan: user.subscriptionPlan || "Unknown",
    childPlan: user.childPlan || null,
    subscriptionType: user.subscriptionType || "Unknown",
    basePriceINR: asNumber(user.basePriceINR),
    discountINR: asNumber(user.discountINR),
    gstAmount: asNumber(user.gstAmount),
    totalPriceINR: asNumber(user.totalPriceINR),
    password: user.password || null,
    remainingTokens: asNumber(user.remainingTokens),
    country: user.country || null,
    currency: user.currency || null,
    subscriptionStatus: user.subscriptionStatus || null,
    isActive:
      typeof user.isActive === "boolean"
        ? user.isActive
        : user.subscriptionStatus === "active",
    planStartDate: asDate(user.planStartDate),
    planExpiryDate: asDate(user.planExpiryDate),
    planExpiryEmailSent: Boolean(user.planExpiryEmailSent),
    resetPasswordToken: user.resetPasswordToken || null,
    resetPasswordExpire: asDate(user.resetPasswordExpire),
    legacyPayload: user,
    createdAt: asDate(user.createdAt) || new Date(),
    updatedAt: asDate(user.updatedAt) || new Date(),
  };

  if (dryRun) {
    return { id: `dry-run:${legacyMongoId || email}`, email };
  }

  const existing =
    (legacyMongoId
      ? await PgUser.findOne({ where: { legacyMongoId } })
      : null) || (await PgUser.findOne({ where: { email } }));

  if (existing) {
    await existing.update(values);
    return existing;
  }

  return PgUser.create(values);
}

async function migrateUsers() {
  const users = await User.find().sort({ createdAt: 1 });
  const userMap = new Map();

  for (const userDoc of users) {
    const pgUser = await upsertUser(userDoc);
    if (!pgUser) continue;

    userMap.set(String(pgUser.email).toLowerCase(), pgUser);
    const legacyId = mongoId(userDoc);
    if (legacyId) userMap.set(legacyId, pgUser);
  }

  return { users, userMap };
}

async function migrateSearchHistory(userMap) {
  const records = await SearchHistory.find().sort({ createdAt: 1 });

  for (const recordDoc of records) {
    const record = plainDoc(recordDoc);
    const email = String(record.email || "").trim().toLowerCase();
    const pgUser = userMap.get(email) || null;
    const values = {
      legacyMongoId: mongoId(recordDoc),
      userId: pgUser?.id || null,
      legacyEmail: email,
      query: record.query || "",
      category: record.category || "general",
      resultsCount: asNumber(record.resultsCount, 0),
      raw: Boolean(record.raw),
      summaryWordCount: asNumber(record.summaryWordCount, 0),
      summaryTokenCount: asNumber(record.summaryTokenCount, 0),
      summary: record.summary || null,
      timestamp: asDate(record.timestamp),
      legacyPayload: record,
      createdAt: asDate(record.createdAt) || new Date(),
      updatedAt: asDate(record.updatedAt) || new Date(),
    };

    if (dryRun) continue;

    const existing = await PgSearchHistory.findOne({
      where: { legacyMongoId: values.legacyMongoId },
    });

    if (existing) await existing.update(values);
    else await PgSearchHistory.create(values);
  }

  return records.length;
}

async function migrateGrokSearchHistory(userMap) {
  const records = await GrokSearchHistory.find().sort({ createdAt: 1 });

  for (const recordDoc of records) {
    const record = plainDoc(recordDoc);
    const email = String(record.email || "").trim().toLowerCase();
    const pgUser = userMap.get(email) || null;
    const values = {
      legacyMongoId: mongoId(recordDoc),
      legacyExternalId: record.id || null,
      userId: pgUser?.id || null,
      legacyEmail: email,
      query: record.query || "",
      summary: record.summary || null,
      tokenUsage: record.tokenUsage || null,
      category: record.category || "general",
      resultsCount: asNumber(record.resultsCount, 0),
      raw: Boolean(record.raw),
      timestamp: asDate(record.timestamp),
      legacyPayload: record,
      createdAt: asDate(record.createdAt) || new Date(),
      updatedAt: asDate(record.updatedAt) || new Date(),
    };

    if (dryRun) continue;

    const existing = await PgGrokSearchHistory.findOne({
      where: { legacyMongoId: values.legacyMongoId },
    });

    if (existing) await existing.update(values);
    else await PgGrokSearchHistory.create(values);
  }

  return records.length;
}

async function migrateTransactions(userMap) {
  const records = await Transaction.find().sort({ createdAt: 1 });

  for (const recordDoc of records) {
    const record = plainDoc(recordDoc);
    const email = String(record.email || "").trim().toLowerCase();
    const pgUser = email ? userMap.get(email) || null : null;
    const values = {
      legacyMongoId: mongoId(recordDoc),
      userId: pgUser?.id || null,
      legacyEmail: email || null,
      razorpayOrderId: record.razorpay_order_id,
      razorpayPaymentId: record.razorpay_payment_id,
      amount: asNumber(record.amount, 0),
      currency: record.currency || "INR",
      status: record.status || "success",
      legacyPayload: record,
      createdAt: asDate(record.createdAt) || new Date(),
      updatedAt: asDate(record.updatedAt) || new Date(),
    };

    if (dryRun) continue;

    const existing =
      (values.legacyMongoId
        ? await PgTransaction.findOne({
            where: { legacyMongoId: values.legacyMongoId },
          })
        : null) ||
      (await PgTransaction.findOne({
        where: { razorpayPaymentId: values.razorpayPaymentId },
      }));

    if (existing) await existing.update(values);
    else await PgTransaction.create(values);
  }

  return records.length;
}

async function migrateReceiptCounters() {
  const records = await ReceiptCounter.find().sort({ year: 1 });

  for (const recordDoc of records) {
    const record = plainDoc(recordDoc);
    const values = {
      legacyMongoId: mongoId(recordDoc),
      year: asNumber(record.year, 0),
      seq: asNumber(record.seq, 0),
      legacyPayload: record,
      createdAt: asDate(record.createdAt) || new Date(),
      updatedAt: asDate(record.updatedAt) || new Date(),
    };

    if (dryRun) continue;

    const existing =
      (values.legacyMongoId
        ? await PgReceiptCounter.findOne({
            where: { legacyMongoId: values.legacyMongoId },
          })
        : null) || (await PgReceiptCounter.findOne({ where: { year: values.year } }));

    if (existing) await existing.update(values);
    else await PgReceiptCounter.create(values);
  }

  return records.length;
}

async function migrateChatSessions(userMap) {
  const sessions = await ChatSession.find().sort({ create_time: 1 });
  let messageCount = 0;
  let fileCount = 0;

  for (const sessionDoc of sessions) {
    const session = plainDoc(sessionDoc);
    const email = String(session.email || "").trim().toLowerCase();
    const pgUser = userMap.get(email) || null;
    const sessionValues = {
      legacyMongoId: mongoId(sessionDoc),
      userId: pgUser?.id || null,
      sessionId: session.sessionId || "",
      legacyEmail: email,
      grandTotalTokens: asNumber(session.grandTotalTokens, 0),
      type: session.type || "chat",
      createTime: asDate(session.create_time),
      legacyPayload: {
        sessionId: session.sessionId,
        email: session.email,
        type: session.type,
      },
      createdAt: asDate(session.createdAt) || new Date(),
      updatedAt: asDate(session.updatedAt) || new Date(),
    };

    let pgSession;
    if (dryRun) {
      pgSession = { id: `dry-run:${sessionValues.legacyMongoId}` };
    } else {
      const existing = await PgChatSession.findOne({
        where: { legacyMongoId: sessionValues.legacyMongoId },
      });

      if (existing) {
        await existing.update(sessionValues);
        pgSession = existing;
      } else {
        pgSession = await PgChatSession.create(sessionValues);
      }
    }

    const history = Array.isArray(session.history) ? session.history : [];

    for (let messageIndex = 0; messageIndex < history.length; messageIndex += 1) {
      const message = history[messageIndex] || {};
      messageCount += 1;

      const messageValues = {
        chatSessionId: pgSession.id,
        userId: pgUser?.id || null,
        legacyMessageIndex: messageIndex,
        prompt: message.prompt || null,
        response: message.response || null,
        wordCount: asNumber(message.wordCount),
        tokensUsed: asNumber(message.tokensUsed),
        totalTokensUsed: asNumber(message.totalTokensUsed),
        botName: message.botName || null,
        createTime: asDate(message.create_time),
        hasFiles: Boolean(message.hasFiles),
        fileWordCount: asNumber(message.fileWordCount),
        type: message.type || null,
        isComplete:
          typeof message.isComplete === "boolean" ? message.isComplete : null,
        isPartial:
          typeof message.isPartial === "boolean" ? message.isPartial : null,
        promptTokens: asNumber(message.promptTokens),
        responseTokens: asNumber(message.responseTokens),
        fileTokenCount: asNumber(message.fileTokenCount),
        promptWords: asNumber(message.promptWords),
        responseWords: asNumber(message.responseWords),
        totalWords: asNumber(message.totalWords),
        legacyPayload: message,
        createdAt: asDate(message.createdAt || message.create_time) || new Date(),
        updatedAt: asDate(message.updatedAt || message.create_time) || new Date(),
      };

      let pgMessage;
      if (dryRun) {
        pgMessage = { id: `dry-run:${sessionValues.legacyMongoId}:${messageIndex}` };
      } else {
        const existingMessage = await PgChatMessage.findOne({
          where: {
            chatSessionId: pgSession.id,
            legacyMessageIndex: messageIndex,
          },
        });

        if (existingMessage) {
          await existingMessage.update(messageValues);
          pgMessage = existingMessage;
        } else {
          pgMessage = await PgChatMessage.create(messageValues);
        }
      }

      const files = Array.isArray(message.files) ? message.files : [];
      for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
        const file = files[fileIndex] || {};
        fileCount += 1;
        const fileValues = {
          chatMessageId: pgMessage.id,
          fileIndex,
          filename: file.filename || null,
          cloudinaryUrl: file.cloudinaryUrl || null,
          publicId: file.publicId || null,
          content: file.content || null,
          wordCount: asNumber(file.wordCount),
          legacyPayload: file,
          createdAt: messageValues.createdAt,
          updatedAt: messageValues.updatedAt,
        };

        if (dryRun) continue;

        const existingFile = await PgChatFile.findOne({
          where: {
            chatMessageId: pgMessage.id,
            fileIndex,
          },
        });

        if (existingFile) await existingFile.update(fileValues);
        else await PgChatFile.create(fileValues);
      }
    }
  }

  return {
    sessions: sessions.length,
    messages: messageCount,
    files: fileCount,
  };
}

async function main() {
  console.log(
    dryRun
      ? "Starting Mongo -> PostgreSQL migration (dry run)..."
      : "Starting Mongo -> PostgreSQL migration...",
  );

  await connectMongo();
  await connectPG();
  await syncPostgresModels();

  const summary = {};

  try {
    const { users, userMap } = await migrateUsers();
    summary.users = users.length;

    summary.searchHistory = await migrateSearchHistory(userMap);
    summary.grokSearchHistory = await migrateGrokSearchHistory(userMap);
    summary.transactions = await migrateTransactions(userMap);
    summary.receiptCounters = await migrateReceiptCounters();

    const chatStats = await migrateChatSessions(userMap);
    summary.chatSessions = chatStats.sessions;
    summary.chatMessages = chatStats.messages;
    summary.chatFiles = chatStats.files;
  } finally {
    await mongoose.disconnect();
    await sequelize.close();
  }

  console.log("Migration summary:");
  console.table(summary);
  console.log(
    dryRun
      ? "Dry run completed. No PostgreSQL rows were written."
      : "Migration completed successfully.",
  );
}

main().catch(async (error) => {
  console.error("Migration failed:", error);
  try {
    await mongoose.disconnect();
  } catch {}
  try {
    await sequelize.close();
  } catch {}
  process.exitCode = 1;
});
