import dotenv from "dotenv";
import { Sequelize } from "sequelize";

dotenv.config({ quiet: true });

const postgresUrl = (process.env.POSTGRES_URL || "").trim();

if (!postgresUrl) {
  throw new Error("POSTGRES_URL is required");
}

const useSsl =
  process.env.POSTGRES_SSL === "true" ||
  process.env.POSTGRES_SSL === "1" ||
  postgresUrl.includes("render.com") ||
  postgresUrl.includes("railway.app") ||
  postgresUrl.includes("supabase.co");

export const sequelize = new Sequelize(postgresUrl, {
  dialect: "postgres",
  logging: false,
  dialectOptions: useSsl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : {},
});

const requiredColumns = {
  users: ["className", "schoolName", "userRole"],
  llm_data: ["user_role", "platform_context", "activity_type"],
  user_question_events: ["userRole", "platformContext", "activityType"],
  practice_messages: ["userId", "userEmail", "chapterId", "clientMessageId", "messageText"],
};

async function getExistingTableColumns(tableName) {
  const [rows] = await sequelize.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = :tableName
    `,
    { replacements: { tableName } },
  );

  return new Set(rows.map((row) => row.column_name));
}

export async function validatePostgresSchema() {
  const missing = [];

  for (const [tableName, columns] of Object.entries(requiredColumns)) {
    const existingColumns = await getExistingTableColumns(tableName);

    if (!existingColumns.size) {
      missing.push(`${tableName} table`);
      continue;
    }

    for (const columnName of columns) {
      if (!existingColumns.has(columnName)) {
        missing.push(`${tableName}.${columnName}`);
      }
    }
  }

  if (missing.length) {
    throw new Error(
      [
        "PostgreSQL schema is not up to date.",
        `Missing: ${missing.join(", ")}`,
        "Run `npm run migrate` from chatbot-backend before starting the server.",
      ].join(" "),
    );
  }
}

export async function connectPG({ validateSchema = true } = {}) {
  await sequelize.authenticate();
  console.log("PostgreSQL connected successfully");

  if (validateSchema) {
    await validatePostgresSchema();
  }
}
