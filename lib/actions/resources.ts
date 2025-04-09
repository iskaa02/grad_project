"use server";

import { insertResourceSchema, resources } from "@/lib/db/schema/resources";
import { db } from "../db";
import { generateEmbeddings } from "../ai/embedding";
import { embeddings as embeddingsTable } from "../db/schema/embeddings";
import { eq, and } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { FilePart, generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function createResourceFromFile(input: { file: File }) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("You must be signed in");
  }

  const file = input.file;
  const fileType = file.type;

  try {
    let content: string;
    if (fileType === "text/plain" || fileType === "text/markdown") {
      content = await file.text();
      return createResourceFromText({ content });
    } else if (fileType === "application/pdf") {
      // Use Vercel AI SDK (Gemini) to parse PDF
      const filePart: FilePart = {
        type: "file",
        mimeType: fileType,
        data: await file.arrayBuffer(),
      };

      const gen = await generateText({
        model: google("gemini-2.0-flash-lite"), // Consider stable model
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `
                  You are an expert in document parsing and Markdown formatting. do not use any <br> tags.
                  Your task is to only extract content from a PDF document and represent it accurately in Markdown format.
                  This includes text, images, and tables, for images try to describe the content of the image in detail,
                  `,
              },
              filePart,
            ],
          },
        ],
      });
      console.log(gen.text);

      return createResourceFromText({ content: gen.text });
    } else {
      throw new Error("Unsupported file type.");
    }
  } catch (error) {
    console.error("Error processing file:", error);
    return error instanceof Error && error.message.length > 0
      ? error.message
      : "Error processing file, please try again.";
  }
}
export const createResourceFromText = async (input: { content: string }) => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("You must be signed in");
  }

  try {
    const { content } = input;
    if (!content) throw new Error("Content is required");

    const embeddings = await generateEmbeddings(content);
    const [resource] = await db
      .insert(resources)
      .values({ content, userId })
      .returning();

    await db.insert(embeddingsTable).values(
      embeddings.map((embedding) => ({
        resourceId: resource.id,
        ...embedding,
      })),
    );

    return "Resource successfully created and embedded.";
  } catch (error) {
    console.log(error);
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
