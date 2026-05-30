# PostgreSQL Runtime Status

The backend runtime has been cut over to PostgreSQL. MongoDB is no longer connected at startup and the old Mongo migration/runtime files have been removed.

## What stays file-based

RAG assets are still file/vector-store based and are not stored in PostgreSQL:

- `chatbot-backend/Math_Data`
- `python-rag-service/data/vector_db`
- `python-rag-service/data/index_manifest.json`

This is expected. Chapter lists, PDFs, and vector indexes are separate from user/chat/payment/test data.

## PostgreSQL data now used by the app

Runtime data is stored in PostgreSQL tables/models, including:

- `users`
- `chat_sessions`
- `chat_messages`
- `chat_files`
- `search_history`
- `grok_search_history`
- `transactions`
- `receipt_counters`
- `test_attempts`
- `test_question_results`
- `user_question_events`
- `llm_data`

Some legacy-compatible PostgreSQL tables/models also exist, such as `"ChatSessions"` and `"Users"`, to preserve the old frontend chat-history JSON shape while keeping the database as PostgreSQL.

## User and analytics status

Implemented PostgreSQL paths include:

- registration and login using PostgreSQL users
- admin/manual user creation using PostgreSQL users
- chat/token/search history moving through PostgreSQL models
- Smart AI, Smart AI Pro, and Smart AI Nxt using PostgreSQL session storage
- test attempt and question-event analytics tables/endpoints
- aggregated LLM usage table for one row per `user_email + user_class + subject`
- receipt counter generation using PostgreSQL

## Required environment

Set PostgreSQL connection values in `.env`:

```env
POSTGRES_URL=...
POSTGRES_SSL=true
```

`POSTGRES_SSL` is optional depending on the database host.

## Important note

MongoDB migration scripts and Mongoose models have been removed from the active codebase. If old production Mongo data ever needs to be re-imported again, restore the migration script from git history or a backup before running a migration.

## LLM Usage Aggregation

`llm_data` stores aggregated LLM usage. One row represents one unique combination of `user_email`, `user_class`, and `subject`.

Runtime behavior:

- Chat requests send the selected study class and subject from the frontend.
- If chapter/RAG mode is not active, `questions_asked` increments.
- If chapter/RAG mode is active, `questions_asked_rag` increments.
- `tokens_used` always increments by the token usage from the successful answer.
- Repeated questions for the same `user_email + user_class + subject` update the same row.

### Create Table

```sql
CREATE TABLE llm_data (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  user_name TEXT,
  user_class TEXT NOT NULL,
  subject TEXT NOT NULL,
  questions_asked INTEGER NOT NULL DEFAULT 0 CHECK (questions_asked >= 0),
  questions_asked_rag INTEGER NOT NULL DEFAULT 0 CHECK (questions_asked_rag >= 0),
  tokens_used INTEGER NOT NULL DEFAULT 0 CHECK (tokens_used >= 0),
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT llm_data_user_email_user_class_subject_key
    UNIQUE (user_email, user_class, subject)
);
```

### Indexes

```sql
CREATE INDEX idx_llm_data_user_email
  ON llm_data (user_email);

CREATE INDEX idx_llm_data_subject
  ON llm_data (subject);

CREATE INDEX idx_llm_data_last_used_at
  ON llm_data (last_used_at);
```

### Update Timestamp Trigger

```sql
CREATE OR REPLACE FUNCTION set_llm_data_last_used_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_used_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_llm_data_last_used_at
BEFORE UPDATE ON llm_data
FOR EACH ROW
EXECUTE FUNCTION set_llm_data_last_used_at();
```

### UPSERT Usage

```sql
INSERT INTO llm_data (
  user_email,
  user_name,
  user_class,
  subject,
  questions_asked,
  questions_asked_rag,
  tokens_used
)
VALUES (
  'onkar@example.com',
  'Onkar',
  'Class 10',
  'Maths',
  1,
  0,
  450
)
ON CONFLICT (user_email, user_class, subject)
DO UPDATE SET
  questions_asked = llm_data.questions_asked + 1,
  questions_asked_rag = llm_data.questions_asked_rag + EXCLUDED.questions_asked_rag,
  tokens_used = llm_data.tokens_used + EXCLUDED.tokens_used,
  user_name = COALESCE(NULLIF(EXCLUDED.user_name, ''), llm_data.user_name);
```

`last_used_at` is updated automatically by the trigger whenever the row is updated.

### Example Selects

```sql
-- get usage by user_email
SELECT *
FROM llm_data
WHERE user_email = 'onkar@example.com'
ORDER BY last_used_at DESC;
```

```sql
-- get usage by user_email and subject
SELECT *
FROM llm_data
WHERE user_email = 'onkar@example.com'
  AND subject = 'Maths'
ORDER BY last_used_at DESC;
```

```sql
-- get top users by tokens_used
SELECT
  user_email,
  user_name,
  SUM(tokens_used) AS total_tokens_used,
  SUM(questions_asked) AS total_questions_asked,
  SUM(questions_asked_rag) AS total_rag_questions_asked
FROM llm_data
GROUP BY user_email, user_name
ORDER BY total_tokens_used DESC
LIMIT 10;
```

```sql
-- get most active users by last_used_at
SELECT
  user_email,
  user_name,
  MAX(last_used_at) AS most_recent_activity
FROM llm_data
GROUP BY user_email, user_name
ORDER BY most_recent_activity DESC
LIMIT 10;
```
