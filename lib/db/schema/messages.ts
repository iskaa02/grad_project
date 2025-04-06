import { sql } from "drizzle-orm";
import { text, varchar, timestamp, pgTable, index } from "drizzle-orm/pg-core";
import { nanoid } from "@/lib/utils";
import { chats } from "./chats"; // Import the chats table

// Define possible roles matching Vercel AI SDK and common usage
export type MessageRole =
  | "user"
  | "assistant"
  | "system"
  | "function"
  | "data"
  | "tool";

export const messages = pgTable(
  "messages",
  {
    id: varchar("id", { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    chatId: varchar("chat_id", { length: 191 })
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 64 }).$type<MessageRole>().notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`now()`),
  },
  // (table) => ({
  //   // Indexing chatId is good practice for fetching messages for a specific chat
  //   chatIdIndex: index("chatId_idx").on(table.chatId),
  // }),
);

export type Message = typeof messages.$inferSelect;
