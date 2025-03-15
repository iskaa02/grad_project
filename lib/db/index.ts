import { drizzle } from "drizzle-orm/pglite";
import { vector } from "@electric-sql/pglite/vector";
import { PGlite } from "@electric-sql/pglite";
import { env } from "@/lib/env.mjs";

const client = new PGlite({
  dataDir: env.DATABASE_URL,
  extensions: { vector },
});
export const db = drizzle(client);
