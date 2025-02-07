import { embed, embedMany } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "../db";
import { cosineDistance, desc, gt, sql } from "drizzle-orm";
import { embeddings } from "../db/schema/embeddings";

const CHUNK_SIZE = 500; // Target chunk size in characters
const embeddingModel = google.textEmbeddingModel("text-embedding-005");

const generateChunks = (input: string): string[] => {
  const sentences = input.trim().split(/(?<=[.!?])\s+/); // Split into sentences, keeping delimiters
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length + 1 <= CHUNK_SIZE) {
      // Add sentence to current chunk
      currentChunk += (currentChunk.length > 0 ? " " : "") + sentence;
    } else {
      // Current chunk is full, push it and start a new one
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }
      currentChunk = sentence;
    }
  }

  // Add the last chunk if it's not empty
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
};

export const generateEmbeddings = async (
  value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(value);

  console.log("Chunks:", chunks);
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
  const userQueryEmbedded = await generateEmbedding(userQuery);
  const similarity = sql<number>`1 - (${cosineDistance(
    embeddings.embedding,
    userQueryEmbedded,
  )})`;
  const similarGuides = await db
    .select({ name: embeddings.content, similarity })
    .from(embeddings)
    .where(gt(similarity, 0.5))
    .orderBy((t) => desc(t.similarity))
    .limit(4);
  return similarGuides;
};
