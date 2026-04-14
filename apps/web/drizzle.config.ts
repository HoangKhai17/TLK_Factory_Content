import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./data/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data/tlk_factory.db",
  },
} satisfies Config;
