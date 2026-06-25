CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "practice_messages" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "userEmail" TEXT NOT NULL,
  "className" TEXT,
  "subjectName" TEXT,
  "chapterId" TEXT NOT NULL,
  "chapterName" TEXT,
  "role" TEXT NOT NULL CHECK ("role" IN ('user', 'assistant')),
  "messageKind" TEXT NOT NULL DEFAULT '',
  "messageText" TEXT NOT NULL DEFAULT '',
  "messageHtml" TEXT NOT NULL DEFAULT '',
  "problemText" TEXT NOT NULL DEFAULT '',
  "clientMessageId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "practice_messages_user_chapter_client_unique"
  ON "practice_messages" ("userId", "chapterId", "clientMessageId");

CREATE INDEX IF NOT EXISTS "practice_messages_user_chapter_created_idx"
  ON "practice_messages" ("userId", "chapterId", "createdAt");

CREATE INDEX IF NOT EXISTS "practice_messages_user_email_idx"
  ON "practice_messages" ("userEmail");

CREATE INDEX IF NOT EXISTS "practice_messages_chapter_idx"
  ON "practice_messages" ("chapterId");
