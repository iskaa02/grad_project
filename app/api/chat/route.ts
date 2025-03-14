import { createResource } from "@/lib/actions/resources";
import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";
import { findRelevantContent } from "@/lib/ai/embedding";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // 1. Extract the user's question.
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== "user") {
    return new Response("Invalid request: No user message found.", {
      status: 400,
    });
  }
  const userQuestion = lastMessage.content;

  // 2. Find relevant content *before* calling the model.
  let relevantContent: string; // Keep the string type
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
  console.log(relevantContent);

  // 4. Construct the system prompt and the final message.
  const systemPrompt = `You are a helpful assistant.  Use the following information to answer the user's question.
    If no relevant information is found below, respond, "Sorry, I don't know."`;
  // 5. Create combined message
  const finalMessages = [
    { role: "system", content: systemPrompt },
    ...messages.slice(0, -1), //add previous messages from the conversation
    {
      role: "user",
      content: `
        Context:
        ${relevantContent}

        Question:
        ${userQuestion}
      `,
    },
  ];

  // 6. Call the model.
  const result = streamText({
    model: google("gemini-2.0-flash-exp"), // Consider stable model
    messages: finalMessages,
  });

  return result.toDataStreamResponse();
}
