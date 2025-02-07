"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "ai/react";
import { BotIcon } from "lucide-react";
import { useEffect, useRef } from "react";

export default function Chat() {
  return <ChatUI />;
}
function ChatUI() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    maxSteps: 3,
    initialMessages: [
      {
        id: "320j24e3",
        role: "user",
        content: "Hello!",
      },
      {
        id: "320j24e",
        role: "assistant",
        content: "Hello how can I help you?",
      },
    ],
  });
  return (
    <div className="flex flex-col w-full px-4 py-12 h-full flex-1 min-h-screen max-w-4xl mx-auto">
      <div className="flex-col gap-4 w-full ">
        {messages.map((m) => (
          <>
            {m.role == "assistant" && (
              <div className="flex items-center ">
                <Avatar className="size-8 ">
                  <AvatarFallback className="bg-purple-400">
                    <BotIcon className="size-5 text-white" />
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            <div
              className={`${
                m.role === "user"
                  ? "ms-auto bg-blue-100 rounded-lg p-2 px-3"
                  : "me-auto ps-12"
              } max-w-fit`}
            >
              <p>
                {m.content.length > 0 ? (
                  m.content
                ) : (
                  <span className="italic font-light">
                    {"calling tool: " + m?.toolInvocations?.[0].toolName}
                  </span>
                )}
              </p>
            </div>
          </>
        ))}
      </div>

      <ChatInput
        onSubmit={handleSubmit}
        input={input}
        handleInputChange={handleInputChange}
      />
    </div>
  );
}

type ChatInputProps = {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  input: string;
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

function ChatInput({ onSubmit, input, handleInputChange }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  return (
    <form
      onSubmit={onSubmit}
      className="flex justify-center mt-auto w-full mx-auto"
    >
      <Textarea
        ref={textareaRef}
        placeholder="Say something..."
        className="resize-none overflow-hidden"
        value={input}
        onChange={handleInputChange}
        style={{ maxHeight: "300px" }}
      />
    </form>
  );
}
