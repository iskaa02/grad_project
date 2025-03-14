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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && event.ctrlKey) {
      event.preventDefault(); // Prevent default behavior (newline)
      onSubmit(event as any);
    }
  };

  return (
    <div className="flex items-center justify-center mt-auto w-full mx-auto">
      <KnowledgeModal />
      <form onSubmit={onSubmit} className="flex-1 flex items-center">
        <Textarea
          ref={textareaRef}
          placeholder="Say something..."
          className="resize-none overflow-hidden"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          style={{ maxHeight: "300px" }}
        />
        <Button type="submit" className="ms-2">
          Send
        </Button>
      </form>
    </div>
  );
}

type KnowledgeModalProps = {};

function KnowledgeModal() {
  const [open, setOpen] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [fileContent, setFileContent] = useState<string | null>(null); // Store file content
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFileContent(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleAddContent = () => {
    console.log("Adding content:", textInput, fileContent);
    setIsLoading(true);
    if (fileContent) {
      setFileContent(null); // Clear file content after adding
    } else if (textInput) {
      console.log("Adding text:", textInput);
      createResource({ content: textInput })
        .then(() => {
          setIsLoading(false);
          setTextInput(""); // Clear text input after adding
          setOpen(false);
        })
        .catch((error) => {
          setIsLoading(false);
          setOpen(false);
          toast.error("Failed to add content: " + error.message);
        });
    } else {
      toast.error("Please provide content to add.");

      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="mr-2">
          <PlusCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add to Knowledge Base</DialogTitle>
          <DialogDescription>
            Upload a file or paste text to add to the knowledge base.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="text" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text">Paste Text</TabsTrigger>
            <TabsTrigger value="file">Upload File</TabsTrigger>
          </TabsList>
          <TabsContent value="text">
            <div className="space-y-4 py-2 pb-4">
              <Label htmlFor="knowledge-text">Text</Label>
              <Textarea
                id="knowledge-text"
                placeholder="Paste your text here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
            </div>
          </TabsContent>
          <TabsContent value="file">
            <div className="space-y-4 py-2 pb-4">
              <Label htmlFor="knowledge-file">File</Label>
              <Input
                id="knowledge-file"
                type="file"
                onChange={handleFileUpload}
              />
              {fileContent && (
                <div className="mt-2 p-2 border rounded-md">
                  <p className="text-sm">File content preview:</p>
                  <pre className="text-xs whitespace-pre-wrap">
                    {/* Display a preview (first 500 chars for example) */}
                    {fileContent.substring(0, 500)}
                    {fileContent.length > 500 ? "..." : ""}
                  </pre>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button disabled={isLoading} type="button" onClick={handleAddContent}>
            <span className={isLoading ? "invisible" : ""}>
              Add to Knowledge Base
            </span>
            {isLoading && <Loader className="absolute animate-spin" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
