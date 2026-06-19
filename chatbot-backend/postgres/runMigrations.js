import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { QueryTypes } from "sequelize";
import { sequelize } from "./connect.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, "migrations");

async function ensureMigrationsTable() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "schema_migrations" (
      "id" BIGSERIAL PRIMARY KEY,
      "name" TEXT NOT NULL UNIQUE,
      "checksum" TEXT NOT NULL,
      "applied_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getAppliedMigrations() {
  const rows = await sequelize.query(
    `SELECT "name" FROM "schema_migrations" ORDER BY "name" ASC;`,
    { type: QueryTypes.SELECT },
  );

  return new Set(rows.map((row) => row.name));
}

async function getMigrationFiles() {
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort();
}

function checksum(sql) {
  return crypto.createHash("sha256").update(sql).digest("hex");
}

async function runMigration(fileName) {
  const filePath = path.join(migrationsDir, fileName);
  const sql = await fs.readFile(filePath, "utf8");
  const hash = checksum(sql);

  await sequelize.transaction(async (transaction) => {
    await sequelize.query(sql, { transaction });
    await sequelize.query(
      `
        INSERT INTO "schema_migrations" ("name", "checksum")
        VALUES (:name, :checksum);
      `,
      {
        replacements: { name: fileName, checksum: hash },
        transaction,
      },
    );
  });
}

export async function runPendingMigrations() {
  await sequelize.authenticate();
  await ensureMigrationsTable();

  const applied = await getAppliedMigrations();
  const files = await getMigrationFiles();
  const pending = files.filter((fileName) => !applied.has(fileName));

  if (!pending.length) {
    console.log("No pending PostgreSQL migrations.");
    return;
  }

  for (const fileName of pending) {
    console.log(`Applying migration: ${fileName}`);
    await runMigration(fileName);
  }

  console.log(`Applied ${pending.length} PostgreSQL migration(s).`);
}

const isCliRun =
  process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isCliRun) {
  runPendingMigrations()
    .then(async () => {
      await sequelize.close();
    })
    .catch(async (error) => {
      console.error("PostgreSQL migration failed:", error);
      await sequelize.close();
      process.exit(1);
    });
}
