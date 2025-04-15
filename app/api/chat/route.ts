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
import { SUPPORTED_MODELS } from "@/lib/ai/supported_models";

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
  // Validate that the model is one of the supported ones, or undefined
  model: z.string(),
});
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "User not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const json = await req.json();
    const body = RequestSchema.parse(json); // Zod now validates the model
    const { messages, chatId, model } = body;
    if (!SUPPORTED_MODELS.includes(model)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: Model not supported." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 1. Validate messages and extract the latest user question
    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid request: No messages provided." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== "user") {
      return new Response(
        JSON.stringify({
          error: "Invalid request: Last message must be from the user.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    const userQuestion = lastMessage.content;

    // 2. Prepare context for similarity search (include recent conversation)
    const CONVERSATION_HISTORY_LENGTH_FOR_CONTEXT = 20;
    const recentMessages = messages.slice(
      -CONVERSATION_HISTORY_LENGTH_FOR_CONTEXT,
    );
    const contextQuery = recentMessages.map((msg) => msg.content).join("\n\n");

    // 3. Find relevant content using a hybrid approach
    let relevantContent = "";
    let similarGuides: { name: string; similarity: number }[] = [];
    const MIN_RESULTS_THRESHOLD = 2;
    const MIN_SIMILARITY_THRESHOLD = 0.6;

    try {
      console.log("Attempting RAG search with user question only...");
      const initialSimilarGuides = await findRelevantContent(userQuestion);
      console.log(
        `Initial search found ${initialSimilarGuides.length} results.`,
      );

      const isSufficient =
        initialSimilarGuides.length >= MIN_RESULTS_THRESHOLD &&
        (initialSimilarGuides.length === 0 ||
          initialSimilarGuides[0].similarity > MIN_SIMILARITY_THRESHOLD);

      if (isSufficient) {
        console.log("Initial RAG results deemed sufficient.");
        similarGuides = initialSimilarGuides;
      } else {
        console.log(
          "Initial RAG results insufficient, searching with conversation context...",
        );
        const contextualSimilarGuides = await findRelevantContent(contextQuery);
        console.log(
          `Contextual search found ${contextualSimilarGuides.length} results.`,
        );
        similarGuides = contextualSimilarGuides;
      }

      if (similarGuides.length > 0) {
        relevantContent = similarGuides.map((guide) => guide.name).join("\n\n");
      } else {
        console.log("No relevant content found after both search attempts.");
      }
    } catch (error) {
      console.error("Error during RAG search:", error);
    }

    // 4. Construct messages for the AI model
    // Use the validated model or the default (first supported model)
    const AI_MODEL = model || SUPPORTED_MODELS[0];
    const SYSTEM_PROMPT = `Your goal is to answer the question provided in the following question block.
Important instructions:
- Answer using Markdown formatting only. Penalties apply for non-Markdown responses where Markdown is possible.
- Supported Markdown: headings, bold, italic, links, tables, lists, code blocks, blockquotes.
- HTML in Markdown is not supported.
- Admit when you don't know something. Do not invent information.
- Provide only the Markdown output. Do not include extraneous text.`;

    const finalMessages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...messages.slice(0, -1).map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      })),
      {
        role: "user" as const,
        content: `<question>\n${userQuestion}\n</question>`,
      },
    ];

    if (relevantContent.length > 0) {
      finalMessages.push({
        role: "user" as const,
        content: `Base your answers on the context provided in the following context block and on our chat history.
DO NOT answer with anything other than the markdown output, and do not include the <question> or <context> within your answer and do not make up your own markdown elements.
<context>\n${relevantContent}\n</context>`,
      });
    } else {
      finalMessages.push({
        role: "user" as const,
        content: `Unfortunately, no specific context was retrieved for your query. Answer to the best of your ability based on our chat history.
Please mention that no context was found and suggest uploading relevant documents for a more factual answer.
DO NOT answer with anything other than the markdown output, and do not include the <question> or <context> within your answer and do not make up your own markdown elements.`,
      });
    }

    // 5. Save the user message to the database
    const userMessageToSave = {
      id: lastMessage.id || nanoid(),
      role: "user" as const,
      content: userQuestion,
    };
    try {
      const chatExists = await db
        .select({ id: chats.id })
        .from(chats)
        .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
        .limit(1);

      if (chatExists.length === 0) {
        await createChatSession(chatId, [userMessageToSave]);
      } else {
        await addMessageToChat(chatId, userMessageToSave);
      }
    } catch (error) {
      console.error("Failed to save user message to database:", error);
      return new Response(JSON.stringify({ error: "Failed to save message" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 6. Call the AI model and stream the response
    const stream = streamText({
      model: google(AI_MODEL),
      messages: finalMessages,
      async onFinish(completion) {
        const assistantMessage = {
          id: nanoid(),
          role: "assistant" as const,
          content: completion.text,
        };
        try {
          await addMessageToChat(chatId, {
            id: assistantMessage.id,
            role: assistantMessage.role,
            content: assistantMessage.content,
          });
        } catch (error) {
          console.error("Failed to save assistant message to database:", error);
        }
      },
    });

    // 7. Return the streaming response
    return stream.toDataStreamResponse();
  } catch (e) {
    console.error("API error:", e);
    if (e instanceof z.ZodError) {
      // Provide more specific error for invalid model
      const modelError = e.errors.find((err) => err.path.includes("model"));
      const errorDetail = modelError
        ? `Invalid model selected. Supported models are: ${SUPPORTED_MODELS.join(", ")}`
        : "Invalid request body";
      return new Response(
        JSON.stringify({ error: errorDetail, details: e.errors }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
