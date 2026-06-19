import { sequelize, validatePostgresSchema } from "./connect.js";

validatePostgresSchema()
  .then(async () => {
    console.log("PostgreSQL schema check passed.");
    await sequelize.close();
  })
  .catch(async (error) => {
    console.error("PostgreSQL schema check failed:", error.message);
    await sequelize.close();
    process.exit(1);
  });
