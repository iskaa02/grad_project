"use server";

import {
  NewResourceParams,
  insertResourceSchema,
  resources,
} from "@/lib/db/schema/resources";
import { db } from "../db";
import { generateEmbeddings } from "../ai/embedding";
import { embeddings as embeddingsTable } from "../db/schema/embeddings";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export const createResource = async (input: NewResourceParams) => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("You must be signed in");
  }

  try {
    const { content } = insertResourceSchema.parse(input);
    const embeddings = await generateEmbeddings(content);
    console.log("Embeddings:", embeddings);
    await db.transaction(async (tx) => {
      const [resource] = await tx
        .insert(resources)
        .values({ content, userId })
        .returning();

      await tx.insert(embeddingsTable).values(
        embeddings.map((embedding) => ({
          resourceId: resource.id,
          ...embedding,
        })),
      );
    });

    return "Resource successfully created and embedded.";
  } catch (error) {
    return error instanceof Error && error.message.length > 0
      ? error.message
      : "Error, please try again.";
  }
};

export const getResources = async () => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("You must be signed in");
  }

  const res = await db
    .select()
    .from(resources)
    .where(eq(resources.userId, userId))
    .execute();
  return res;
};
export const deleteResource = async (id: string) => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("You must be signed in");
  }
  await db
    .delete(resources)
    .where(and(eq(resources.id, id), eq(resources.userId, userId)))
    .execute();
};
