import { useRef, useEffect } from "react";
import { KnowledgeModal } from "./KnowledgeModal";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { SendHorizonal } from "lucide-react";

type ChatInputProps = {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
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
      </form>
    </div>
  );
}
