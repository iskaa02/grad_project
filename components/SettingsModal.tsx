import { getResources } from "@/lib/actions/resources";
import { SettingsIcon } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Textarea } from "./ui/textarea";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { deleteResource } from "@/lib/actions/resources";
import { Trash2 } from "lucide-react";

interface Resource {
  id: string;
  content: string;
  createdAt: Date;
}

function ResourceModal({
  resource,
  onDelete,
}: {
  resource: Resource;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open === false) return;
    setOpen(true);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <TableRow key={resource.id} className="cursor-pointer">
          <TableCell className="font-medium">{resource.id}</TableCell>
          <TableCell className="font-medium">
            {resource.content.slice(0, 12)}...
          </TableCell>
          <TableCell>{resource.createdAt.toLocaleDateString()}</TableCell>
        </TableRow>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resource Content</DialogTitle>
          <DialogDescription>
            Content of resource {resource.id}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={resource.content}
          readOnly
          className="resize-none h-64"
        />
        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              deleteResource(resource.id);
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SettingsModal() {
  const [open, setOpen] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  useEffect(() => {
    getResources().then((data) => setResources(data));
  }, [open]);

  const refetchResources = () => {
    getResources().then((data) => setResources(data));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="icon" className="mr-2">
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Knowledge base</DialogTitle>
          <DialogDescription>
            View and delete knowledge base resources
          </DialogDescription>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.length > 0 ? (
              resources.map((resource) => (
                <ResourceModal
                  key={resource.id}
                  resource={resource}
                  onDelete={refetchResources}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No resources found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableCaption>A list of your knowledge base resources.</TableCaption>
        </Table>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
