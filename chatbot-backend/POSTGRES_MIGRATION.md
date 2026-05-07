# PostgreSQL Migration

This migration path is designed to preserve product data while leaving RAG assets untouched.

## What does not move

The following remain file-based and are not part of the MongoDB to PostgreSQL migration:

- `chatbot-backend/Math_Data`
- `python-rag-service/data/vector_db`
- `python-rag-service/data/index_manifest.json`

That means chapter lists, chapter PDFs, and vector indexes are not deleted or rewritten by this migration.

## What does move

The migration script copies these Mongo collections into PostgreSQL:

- `User`
- `ChatSession`
- `SearchHistory`
- `GrokSearchHistory`
- `Transaction`
- `ReceiptCounter`

## New PostgreSQL layout

Instead of keeping all chat data in one embedded JSON array, PostgreSQL splits it into:

- `users`
- `chat_sessions`
- `chat_messages`
- `chat_files`
- `search_history`
- `grok_search_history`
- `transactions`
- `receipt_counters`

This keeps product data safer and easier to query.

## Safety features

- The script is idempotent by using `legacyMongoId` mapping fields.
- Rerunning the migration updates rows instead of blindly duplicating them.
- Chat messages are migrated with stable per-session message indexes.
- Attached files are migrated separately per message.
- Raw legacy payloads are preserved in JSONB columns for audit/debugging.

## Required environment

Set both:

```env
MONGO_URI=...
POSTGRES_URL=...
```

Optional:

```env
POSTGRES_SSL=true
```

## Run a dry run

```bash
node scripts/migrateMongoToPg.js --dry-run
```

## Run the real migration

```bash
node scripts/migrateMongoToPg.js
```

## Recommended rollout

1. Run dry run first.
2. Run real migration into PostgreSQL.
3. Compare counts between Mongo and PostgreSQL.
4. Verify a few real users: login identity, sessions, searches, payments, receipt counters.
5. Only after validation, switch application reads/writes to PostgreSQL.

## Important note

This commit adds the migration foundation and schema. It does not yet switch the live app runtime from MongoDB to PostgreSQL. That cutover should happen only after data validation.
