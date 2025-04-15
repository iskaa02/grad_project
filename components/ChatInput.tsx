import { useRef, useEffect, useState } from "react";
import { KnowledgeModal } from "./KnowledgeModal";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { SendHorizonal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_MODELS } from "@/lib/ai/supported_models";

type ChatInputProps = {
  onSubmit: (event: React.FormEvent<HTMLFormElement>, model: string) => void;
  input: string;
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  onStop: () => void;
};

export function ChatInput({
  onSubmit,
  input,
  handleInputChange,
  isLoading,
  onStop,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Default to the first supported model
  const [selectedModel, setSelectedModel] = useState(SUPPORTED_MODELS[0]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && event.ctrlKey) {
      event.preventDefault(); // Prevent default behavior (newline)
      handleSubmit(event as any);
    }
  };

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(event, selectedModel);
  };

  return (
    <div className="flex items-center justify-center mt-auto w-full mx-auto">
      <form onSubmit={handleSubmit} className="flex-1">
        <div className="flex mb-2">
          <KnowledgeModal />
          <Select value={selectedModel} onValueChange={handleModelChange}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_MODELS.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className=" flex items-center">
          <Textarea
            ref={textareaRef}
            placeholder="Say something..."
            className="resize-none overflow-hidden"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            style={{ maxHeight: "400px", minHeight: "100px" }}
            disabled={isLoading}
          />
          <div>
            {isLoading ? (
              <Button
                onClick={onStop}
                type="button"
                className="ms-4 rounded-full animate-pulse"
                variant="destructive"
                size="icon"
              >
                <div className="size-3 bg-white" />
              </Button>
            ) : (
              <Button type="submit" size="icon" className="ms-4 rounded-full">
                <SendHorizonal />
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
