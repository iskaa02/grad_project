"use server";

import {
  NewResourceParams,
  insertResourceSchema,
  resources,
} from "@/lib/db/schema/resources";
import { db } from "../db";
import { generateEmbeddings } from "../ai/embedding";
import { embeddings as embeddingsTable } from "../db/schema/embeddings";
import { eq } from "drizzle-orm";

export const createResource = async (input: NewResourceParams) => {
  try {
    const { content } = insertResourceSchema.parse(input);
    const embeddings = await generateEmbeddings(content);
    console.log("Embeddings:", embeddings);
    await db.transaction(async (tx) => {
      const [resource] = await tx
        .insert(resources)
        .values({ content })
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
  const res = await db.select().from(resources).execute();
  return res;
};
export const deleteResource = async (id: string) => {
  await db.delete(resources).where(eq(resources.id, id)).execute();
};
