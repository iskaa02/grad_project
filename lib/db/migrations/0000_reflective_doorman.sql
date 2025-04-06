CREATE TABLE "chats" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"user_id" varchar(191) NOT NULL,
	"title" text DEFAULT 'New Chat' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "embeddings" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"resource_id" varchar(191),
	"content" text NOT NULL,
	"embedding" vector(768) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"chat_id" varchar(191) NOT NULL,
	"role" varchar(64) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" varchar(191) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "embeddings" ADD CONSTRAINT "embeddings_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "embeddingIndex" ON "embeddings" USING hnsw ("embedding" vector_cosine_ops);