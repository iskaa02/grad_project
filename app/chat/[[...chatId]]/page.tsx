"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useChat } from "ai/react";
import { BotIcon, Loader2 } from "lucide-react";
import Markdown from "react-markdown";
import { ChatInput } from "@/components/ChatInput";
import { SettingsModal } from "@/components/SettingsModal";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { getMessagesForChat } from "@/lib/actions/chats"; // Combined imports
import { toast } from "sonner"; // For notifications
import { nanoid } from "nanoid"; // For temporary IDs if needed
import { fetchChats } from "@/lib/store/chat-history-store";
import { SUPPORTED_MODELS } from "@/lib/ai/supported_models";

// Define supported models (consider moving to a shared location)

export default function ChatPage() {
  const router = useRouter();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const hasFetchedInitialMessages = useRef(false);

  const params = useParams(); // Type the params

  // Extract chatId if present (it's an array from catch-all, take the first element)
  const existingChatId = params?.chatId?.[0];

  const [sessionId, setSessionId] = useState(existingChatId || nanoid());
  const [dbError, setDbError] = useState<string | null>(null);
  // Default to the first supported model
  const [selectedModel, setSelectedModel] = useState(SUPPORTED_MODELS[0]);

  const {
    messages,
    stop,
    input,
    handleInputChange,
    handleSubmit, // Rename to avoid conflict
    setMessages,
    isLoading: isAiLoading,
    error: aiError,
  } = useChat({
    api: "/api/chat",
    id: sessionId, // Pass sessionId to useChat
    initialMessages: [],
    // Send chatId and default model in the body
    body: {
      chatId: sessionId,
      model: selectedModel, // Default model for requests
    },
    onError(error) {
      console.error("AI Error:", error);
      toast.error(`AI Error: ${error.message}`);
    },
    onFinish() {
      if (!existingChatId) {
        fetchChats();
        router.push(`/chat/${sessionId}`);
      }
    },
  });

  // Effect to fetch initial messages for existing chats
  useEffect(() => {
    const fetchInitialMessages = async (chatId: string) => {
      setDbError(null);
      try {
        const initialMessages = await getMessagesForChat(chatId);
        const messagesWithIds = initialMessages.map((m) => ({
          ...m,
          id: m.id || nanoid(),
        }));
        setMessages(messagesWithIds);
        hasFetchedInitialMessages.current = true;
      } catch (err) {
        console.error("Failed to load messages:", err);
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load chat history.";
        setDbError(errorMsg);
        toast.error(errorMsg);
        if (errorMsg.includes("not found") || errorMsg.includes("permission")) {
          router.replace("/chat");
        }
      }
    };

    if (existingChatId) fetchInitialMessages(existingChatId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingChatId, router, setMessages]); // Keep setMessages here

  // Effect to scroll to bottom
  useEffect(() => {
    // Delay scroll slightly to allow DOM updates
    setTimeout(() => {
      chatContainerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 100);
  }, [messages, isAiLoading]); // Scroll on messages change or AI loading state change

  // Wrapper handleSubmit to include the selected model in the request options
  const superHandleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
    model: string,
  ) => {
    // Update the model state for subsequent default requests if needed
    if (SUPPORTED_MODELS.includes(model)) {
      setSelectedModel(model);
    }
    // Pass the selected model in the options body for this specific submission
    handleSubmit(event, {
      body: {
        model: model,
        chatId: sessionId,
      },
    });
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-4 bg-background z-10 w-full border-b">
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
        <SettingsModal />
      </div>

      <div className="flex flex-col w-full flex-1 max-w-4xl mx-auto overflow-y-auto py-4">
        <div className="flex-1 px-4">
          {dbError && (
            <div className="flex justify-center items-center h-full text-destructive">
              <p>Error loading chat: {dbError}</p>
            </div>
          )}

          {!dbError && messages.length === 0 && !isAiLoading && (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">
                Send a message to start chatting.
              </p>
            </div>
          )}

          {/* Messages List */}
          {!dbError && (
            <div className="flex flex-col gap-4 w-full mb-20">
              {messages.map((m) => (
                <div key={m.id} className="flex flex-col">
                  {m.role === "assistant" && (
                    <div className="flex items-start gap-2 mb-1">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <BotIcon className="size-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg p-2 px-3 max-w-[80%] break-words prose dark:prose-invert prose-p:leading-relaxed prose-p:m-0 prose-headings:m-0">
                        <Markdown>{m.content}</Markdown>
                      </div>
                    </div>
                  )}
                  {m.role === "user" && (
                    <div className="flex items-start justify-end gap-2 mb-1">
                      <div className="bg-blue-500 text-white rounded-lg p-2 px-3 max-w-[80%] break-words prose dark:prose-invert prose-p:leading-relaxed prose-p:m-0 prose-headings:m-0">
                        <Markdown>{m.content}</Markdown>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* AI Typing Indicator */}
              {isAiLoading && (
                <div className="flex items-start gap-2 mb-1">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Loader2 className="size-5 animate-spin" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-2 px-3 max-w-[80%] italic text-muted-foreground">
                    Assistant is thinking...
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Scroll Anchor */}
          <div ref={chatContainerRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-background border-t">
        <div className="w-full p-4">
          {aiError && (
            <p className="text-destructive text-xs mb-2 px-1">
              Error: {aiError?.message || "An unexpected error occurred."}
            </p>
          )}
          <ChatInput
            isLoading={isAiLoading}
            onStop={stop}
            input={input}
            handleInputChange={handleInputChange}
            onSubmit={superHandleSubmit} // Pass the new wrapper function
          />
        </div>
      </div>
    </div>
  );
}
