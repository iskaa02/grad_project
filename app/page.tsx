"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useChat } from "ai/react";
import { BotIcon, Loader, LoaderCircle, PlusCircle } from "lucide-react"; // Import PlusCircle
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createResource } from "@/lib/actions/resources";
import { KnowledgeModal } from "@/components/KnowledgeModal";
import { ChatInput } from "@/components/ChatInput";
import { SettingsModal } from "@/components/SettingsModal";

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
    <>
      <div className="px-4 py-4 fixed">
        <SettingsModal />
      </div>
      <div className="flex flex-col w-full px-4 py-12 h-full flex-1 min-h-screen max-w-4xl mx-auto">
        <div className="flex flex-col gap-8 w-full mb-8">
          {messages.map((m) => (
            <div key={m.id}>
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
                <>
                  {m.content.length > 0 ? (
                    <Markdown>{m.content}</Markdown>
                  ) : (
                    <span className="italic font-light">
                      {"calling tool: " + m?.toolInvocations?.[0].toolName}
                    </span>
                  )}
                </>
              </div>
            </div>
          ))}
        </div>

        <ChatInput
          onSubmit={handleSubmit}
          input={input}
          handleInputChange={handleInputChange}
        />
      </div>
    </>
  );
}
