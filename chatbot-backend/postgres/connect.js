import dotenv from "dotenv";
import { Sequelize } from "sequelize";

dotenv.config();

const postgresUrl = (process.env.POSTGRES_URL || "").trim();

if (!postgresUrl) {
  throw new Error("POSTGRES_URL is required for PostgreSQL migration");
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

export async function connectPG({ sync = false } = {}) {
  await sequelize.authenticate();
  if (sync) {
    await sequelize.sync({ alter: true });
  }
}
