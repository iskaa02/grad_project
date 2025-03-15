import { useRef, useEffect } from "react";
import { KnowledgeModal } from "./KnowledgeModal";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

type ChatInputProps = {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  input: string;
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

export function ChatInput({
  onSubmit,
  input,
  handleInputChange,
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
        />
        <Button type="submit" className="ms-2">
          Send
        </Button>
      </form>
    </div>
  );
}
