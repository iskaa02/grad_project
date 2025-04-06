import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { findRelevantContent } from "@/lib/ai/embedding";
import { createChatSession, addMessageToChat } from "@/lib/actions/chats";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema/chats";
import { and, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const RequestSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string().optional(),
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    }),
  ),
  chatId: z.string(),
});
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");
  try {
    const json = await req.json();
    const body = RequestSchema.parse(json);
    const { messages, chatId } = body;

    // 1. Extract the user's question.
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
      return new Response("Invalid request: No user message found.", {
        status: 400,
      });
    }
    const userQuestion = lastMessage.content;

    let relevantContent: string;
    try {
      const similarGuides = await findRelevantContent(userQuestion);

      // 3. Process the array of results into a single string.
      relevantContent = similarGuides
        .map((guide) => guide.name) // Extract the 'name' (content) property
        .join("\n\n"); // Join the content strings with double newlines
    } catch (error) {
      console.error("Error finding relevant content:", error);
      relevantContent = ""; // Or handle as appropriate
    }

    // 4. Construct the system prompt and the final message.
    const systemPrompt = `You are a helpful assistant.  Use the following information to answer the user's question.
      If no relevant information is found below, respond, "Sorry, I don't know."`;
    // 5. Create combined message
    const finalMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.slice(0, -1), //add previous messages from the conversation
      {
        role: "user" as const,
        content: `
          Context:
          ${relevantContent}

          Question:
          ${userQuestion}
        `,
      },
    ];

    const userMessageToSave = {
      id: nanoid(),
      ...lastMessage,
    };
    try {
      const chatExists = await db
        .select()
        .from(chats)
        .where(and(eq(chats.id, chatId), eq(chats.userId, userId)));

      if (chatExists.length === 0) {
        await createChatSession(chatId, [userMessageToSave]);
      }
      await addMessageToChat(chatId, userMessageToSave); // Save user message
    } catch (error) {
      console.error("Failed to save initial messages to database:", error);
      throw error;
      // Consider how to handle this error, e.g., retry, log, or inform the user
    }

    // 6. Call the model.
    const stream = streamText({
      model: google("gemini-2.0-flash-exp"), // Consider stable model
      messages: finalMessages,

      async onFinish(completion) {
        // After the AI returns a response
        const assistantMessage = {
          id: nanoid(), // Generate ID for this specific message
          role: "assistant" as const, // Good practice for type safety
          content: completion.text, // 'completion' is the final TEXT string here
        };

        try {
          await addMessageToChat(chatId, {
            id: assistantMessage.id,
            role: "assistant" as const,
            content: assistantMessage.content, // Use the string content directly
          }); // Save AI message
        } catch (error) {
          console.error("Failed to save messages to database:", error);
          // Consider how to handle this error, e.g., retry, log, or inform the user
        }
      },
    });

    return stream.toDataStreamResponse();
  } catch (e) {
    console.error("API error", e);
    return new Response("Something went wrong", { status: 500 });
  }
}
