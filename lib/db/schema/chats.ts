import { sql } from "drizzle-orm";
import { text, varchar, timestamp, pgTable } from "drizzle-orm/pg-core";
import { nanoid } from "@/lib/utils";

export const chats = pgTable("chats", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  userId: varchar("user_id", { length: 191 }).notNull(),
  title: text("title").notNull().default("New Chat"),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`)
    .$onUpdate(() => new Date()),
});

export type Chat = typeof chats.$inferSelect;
