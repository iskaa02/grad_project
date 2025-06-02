"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useChat } from "ai/react";
import { BotIcon, Loader2 } from "lucide-react";
import Markdown from "react-markdown";
import { ChatInput } from "@/components/ChatInput";
import { SettingsModal } from "@/components/SettingsModal"; // Removed temporarily
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
  // const hasFetchedInitialMessages = useRef(false); // No longer needed with new logic

  const params = useParams(); // Type the params

  // Extract chatId if present (it's an array from catch-all, take the first element)
  const existingChatId = params?.chatId?.[0];

  const [sessionId, setSessionId] = useState(existingChatId || nanoid());
  const [dbError, setDbError] = useState<string | null>(null);
  // Default to the first supported model
  const [selectedModel, setSelectedModel] = useState(SUPPORTED_MODELS[0]);
  // State to track loading of initial messages from DB
  const [isDbLoading, setIsDbLoading] = useState(false);

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
      // Check if we just finished the *first* interaction of a *new* chat
      if (!existingChatId) {
        // Update chat list in sidebar
        fetchChats();
        // Navigate to the persistent URL for the chat
        // useChat hook should preserve messages state due to matching sessionId
        router.push(`/chat/${sessionId}`);
      }
    },
  });

  // Update sessionId if the route parameter changes (e.g., user navigates between chats)
  useEffect(() => {
    if (existingChatId) {
      setSessionId(existingChatId);
    } else {
      // If navigating back to the base /chat page, generate a new ID for the next chat
      setSessionId(nanoid());
    }
  }, [existingChatId]);

  // Effect to fetch initial messages for existing chats, only if needed
  useEffect(() => {
    const fetchInitialMessages = async (chatId: string) => {
      setDbError(null);
      setIsDbLoading(true); // Start DB loading indicator
      console.log(`Attempting to fetch initial messages for chat: ${chatId}`);
      try {
        const initialMessages = await getMessagesForChat(chatId);
        const messagesWithIds = initialMessages.map((m) => ({
          ...m,
          id: m.id || nanoid(), // Ensure IDs exist
        }));
        console.log(
          `Fetched ${messagesWithIds.length} messages for chat: ${chatId}. Setting state.`,
        );
        // Set messages fetched from DB. This is correct when loading an existing chat directly
        // or when switching between chats where useChat clears the state for the new ID.
        setMessages(messagesWithIds);
      } catch (err) {
        console.error("Failed to load messages:", err);
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load chat history.";
        setDbError(errorMsg);
        toast.error(errorMsg);
        // If chat not found or permission denied, redirect to base chat page
        if (errorMsg.includes("not found") || errorMsg.includes("permission")) {
          router.replace("/chat");
        }
      } finally {
        setIsDbLoading(false); // Stop DB loading indicator
      }
    };

    // --- MODIFIED LOGIC ---
    // Only fetch from DB if:
    // 1. There is an existingChatId (we are on a /chat/[id] page)
    // 2. The messages array managed by useChat is currently empty for this sessionId.
    // This prevents overwriting messages after the first turn of a new chat when navigating.
    if (existingChatId && messages.length === 0) {
      // We likely landed directly on an existing chat URL or switched chats. Fetch history.
      fetchInitialMessages(existingChatId);
    } else if (existingChatId && messages.length > 0) {
      // We have an existingChatId and messages. This could be after creating a new chat
      // and navigating, or switching back to a chat whose state useChat preserved.
      // Assume useChat state is correct, no fetch needed.
      console.log(
        `Chat ${existingChatId}: Found ${messages.length} messages in useChat state, skipping DB fetch.`,
      );
      // Ensure DB loading is false if we skipped the fetch
      if (isDbLoading) setIsDbLoading(false);
    } else if (!existingChatId) {
      // We are on the base /chat page (new chat).
      // Ensure any previous chat's messages are cleared.
      // useChat should handle this automatically when its `id` prop changes (due to sessionId changing).
      // Clear dbError and ensure loading is false.
      setDbError(null);
      setIsDbLoading(false);
      // Explicitly clear messages if useChat doesn't do it automatically on ID change
      // (Test this behaviour - it should clear automatically)
      // if (messages.length > 0) {
      //    console.log("On /chat page, clearing messages.");
      //    setMessages([]);
      // }
    }
    // Dependencies: Run when the chat ID changes, or when setMessages function itself changes (rare).
    // Do NOT depend on `messages.length` directly here to avoid potential re-fetch loops.
    // Rely on useChat updating `messages` when `sessionId` changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingChatId, setMessages]); // Removed isDbLoading from deps

  // Effect to scroll to bottom
  useEffect(() => {
    // Delay scroll slightly to allow DOM updates, especially after messages are set
    setTimeout(() => {
      chatContainerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 150); // Slightly increased delay might help
  }, [messages, isAiLoading, isDbLoading]); // Scroll on messages change or loading states change

  // Wrapper handleSubmit to include the selected model in the request options
  const superHandleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
    model: string,
  ) => {
    // Update the model state for subsequent default requests if needed
    if (SUPPORTED_MODELS.includes(model)) {
      setSelectedModel(model);
    }
    // Pass the selected model and correct chatId in the options body for this specific submission
    handleSubmit(event, {
      body: {
        model: model,
        chatId: sessionId, // Ensure the current sessionId is sent
      },
    });
  };

  // Render Logic
  const showLoadingIndicator = isDbLoading;
  const showDbError = !isDbLoading && dbError;
  const showStartMessage =
    !isDbLoading && !dbError && messages.length === 0 && !isAiLoading;
  const showMessages = !isDbLoading && !dbError;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-4 bg-background z-10 w-full border-b">
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
        <SettingsModal />
        <div className="flex-grow" /> {/* Spacer */}
      </div>

      <div className="flex flex-col w-full flex-1 max-w-4xl mx-auto overflow-y-auto py-4">
        <div className="flex-1 px-4 relative">
          {showLoadingIndicator && (
            <div className="absolute inset-0 flex justify-center items-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {showDbError && (
            <div className="flex justify-center items-center h-full text-destructive">
              <p>Error loading chat: {dbError}</p>
            </div>
          )}
          {showStartMessage && (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">
                Send a message to start chatting.
              </p>
            </div>
          )}
          {/* Messages List */}
          {showMessages && (
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

              {/* AI Typing Indicator - Show only when AI is loading AND messages are visible */}
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
              AI Error: {aiError?.message || "An unexpected error occurred."}
            </p>
          )}
          <ChatInput
            // Disable input while DB is loading history as well
            isLoading={isAiLoading || isDbLoading}
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
