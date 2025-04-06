import { embed, embedMany } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "../db";
import { and, cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import { embeddings } from "../db/schema/embeddings";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { resources } from "../db/schema/resources";
import { auth } from "@clerk/nextjs/server";

const CHUNK_SIZE = 2000; // Target chunk size in characters
const CHUNK_OVERLAP = 200; // Target chunk overlap
const embeddingModel = google.textEmbeddingModel("text-embedding-004");

export const generateEmbeddings = async (
  value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });
  const chunks = await textSplitter.splitText(value);

  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  }).catch((error) => {
    console.error("Error generating embeddings:", error);
    throw error;
  });
  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\\n", " ");
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });
  return embedding;
};

export const findRelevantContent = async (userQuery: string) => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("You must be signed in");
  }

  const userQueryEmbedded = await generateEmbedding(userQuery);
  const similarity = sql<number>`1 - (${cosineDistance(
    embeddings.embedding,
    userQueryEmbedded,
  )})`;

  const similarGuides = await db
    .select({ name: embeddings.content, similarity })
    .from(embeddings)
    .innerJoin(resources, eq(embeddings.resourceId, resources.id))
    .where(gt(similarity, 0.5))
    .orderBy((t) => desc(t.similarity))
    .limit(14);

  return similarGuides;
};
