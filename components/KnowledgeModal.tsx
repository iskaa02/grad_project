import {
  createResourceFromText,
  createResourceFromFile,
} from "@/lib/actions/resources";
import { Label } from "@radix-ui/react-label";
import { PlusCircle, Loader } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { useAuth } from "@clerk/nextjs";

export function KnowledgeModal() {
  const [open, setOpen] = useState(false);
  const { userId } = useAuth();
  const [textInput, setTextInput] = useState("");
  const [file, setFileContent] = useState<File | null>(null); // Store file content
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileContent(file);
    }
  };

  const handleAddContent = () => {
    console.log("Adding content:", textInput, file);
    setIsLoading(true);
    if (!userId) return;
    if (file) {
      createResourceFromFile({ file })
        .then((i) => {
          console.log(i);
        })
        .catch((error) => {
          toast.error("Failed to add content: " + error.message);
        })
        .finally(() => {
          setIsLoading(false);
          setFileContent(null); // Clear file content after adding
        });
    } else if (textInput) {
      console.log("Adding text:", textInput);
      createResourceFromText({ content: textInput })
        .then(() => {
          setTextInput(""); // Clear text input after adding
          setOpen(false);
        })
        .catch((error) => {
          setOpen(false);
          toast.error("Failed to add content: " + error.message);
        })
        .finally(() => {
          setIsLoading(false);
          setOpen(false);
        });
    } else {
      toast.error("Please provide content to add.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="mr-2">
          <PlusCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
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
                className="h-32"
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
              {file && (
                <div className="mt-2 p-2 border rounded-md">
                  <p className="text-sm">File content preview:</p>
                  <pre className="text-xs whitespace-pre-wrap">
                    {/* Display a preview (first 500 chars for example) */}
                    {file.name.substring(0, 500)}
                    {file.name.length > 500 ? "..." : ""}
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
