import "dotenv/config";
import type { Config } from "drizzle-kit";
import { env } from "@/lib/env.mjs";

export default {
  schema: "./lib/db/schema",
  dialect: "postgresql",
  driver: "pglite",
  out: "./lib/db/migrations",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
} satisfies Config;
