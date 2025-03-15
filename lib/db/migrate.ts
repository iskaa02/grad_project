import { migrate } from "drizzle-orm/pglite/migrator";
import { db } from "./index";

async function main() {
  await db.execute(`CREATE EXTENSION IF NOT EXISTS vector;`);
  await migrate(db, {
    migrationsFolder: "lib/db/migrations",
  });
  console.log("Migration complete");
}

main();
