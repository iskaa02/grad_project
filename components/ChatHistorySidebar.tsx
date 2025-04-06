"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import type { Chat } from "@/lib/db/schema/chats"; // Import Chat type
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  // SidebarTrigger, // Use if you need a manual trigger button
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  MessageSquareText,
  Trash2,
  Loader2,
  Pencil,
  XIcon,
  CheckIcon,
} from "lucide-react"; // Icons
import { deleteChatSession, renameChatSession } from "@/lib/actions/chats"; // Import actions
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input"; // For renaming
import { toast } from "sonner"; // Assuming you use sonner for notifications
import { useStore } from "@nanostores/react"; // Import the hook

import {
  $chatHistory,
  $error,
  updateChat,
  removeChat,
  fetchChats,
} from "@/lib/store/chat-history-store";

export function ChatHistorySidebar() {
  // Use the store values
  const chats = useStore($chatHistory);
  const error = useStore($error);
  const router = useRouter();

  const [isPendingDelete, startDeleteTransition] = useTransition();
  const [isPendingRename, startRenameTransition] = useTransition();
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const params = useParams(); // Type the params

  const pathname = usePathname();

  useEffect(() => {
    fetchChats();
  }, [pathname]);

  const handleDelete = (chatId: string) => {
    startDeleteTransition(async () => {
      try {
        await deleteChatSession(chatId);
        toast.success("Chat deleted successfully.");
        removeChat(chatId); // Update the store
        if (chatId === params?.chatId?.[0]) router.replace("/chat");
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Could not delete chat.";
        toast.error(errorMsg);
        console.error("Failed to delete chat:", err);
      }
    });
  };

  const handleRename = (chat: Chat) => {
    setRenamingChatId(chat.id);
    setNewTitle(chat.title);
  };

  const submitRename = (chatId: string) => {
    if (!newTitle.trim() || renamingChatId !== chatId) return;

    startRenameTransition(async () => {
      try {
        await renameChatSession(chatId, newTitle.trim());
        toast.success("Chat renamed successfully.");
        setRenamingChatId(null); // Exit rename mode

        // Update the store
        const updatedChat = {
          id: chatId,
          title: newTitle.trim(),
        } as Chat; // type assertion
        updateChat(updatedChat);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Could not rename chat.";
        toast.error(errorMsg);
        console.error("Failed to rename chat:", err);
      }
    });
  };

  const cancelRename = () => {
    setRenamingChatId(null);
    setNewTitle("");
  };

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      side="left"
      className="hidden lg:flex border-r"
    >
      <SidebarHeader className="p-2 flex justify-between items-center">
        <Button variant="ghost" className="w-full justify-start gap-2" asChild>
          <Link href="/chat">
            <PlusCircle className="size-4" />
            New Chat
          </Link>
        </Button>
      </SidebarHeader>
      <SidebarContent className="p-0 flex-1 flex flex-col">
        <SidebarMenu className="flex-1 overflow-y-auto p-2 space-y-1">
          {error && <p className="text-destructive text-xs p-2">{error}</p>}
          {!error && chats.length === 0 && (
            <p className="text-muted-foreground text-xs p-2 text-center">
              No chats yet.
            </p>
          )}
          {!error &&
            chats.map((chat) => {
              const isActive = pathname === `/chat/${chat.id}`;
              return (
                <div
                  key={chat.id}
                  className="group relative flex items-center gap-1"
                >
                  {renamingChatId === chat.id ? (
                    // Rename Input Mode
                    <div className="flex items-center gap-1 w-full">
                      <Input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submitRename(chat.id);
                          if (e.key === "Escape") cancelRename();
                        }}
                        className="h-7 flex-1"
                        autoFocus
                        disabled={isPendingRename}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => submitRename(chat.id)}
                        disabled={isPendingRename || !newTitle.trim()}
                      >
                        {isPendingRename ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <CheckIcon className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={cancelRename}
                        disabled={isPendingRename}
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    // Display Mode
                    <>
                      <SidebarMenuButton
                        className="w-full justify-start gap-2 flex-1 pr-14" // Increased padding for icons
                        isActive={isActive}
                        asChild
                      >
                        <Link href={`/chat/${chat.id}`}>
                          {/* Close sidebar on mobile nav */}
                          <MessageSquareText className="size-4" />
                          <span className="truncate flex-1">{chat.title}</span>
                        </Link>
                      </SidebarMenuButton>

                      {/* Action Icons - appear on hover */}
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Rename Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          aria-label="Rename chat"
                          onClick={() => handleRename(chat)}
                          disabled={isPendingDelete || isPendingRename}
                        >
                          <Pencil className="size-4" />
                        </Button>

                        {/* Delete Button with Confirmation */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              aria-label="Delete chat"
                              disabled={isPendingDelete || isPendingRename}
                            >
                              {isPendingDelete ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete the chat titled {chat.title}
                                and all its messages.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={isPendingDelete}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => {
                                  e.preventDefault(); // Prevent dialog closing immediately if action fails
                                  handleDelete(chat.id);
                                }}
                                disabled={isPendingDelete}
                                className="bg-destructive hover:bg-destructive/90" // Destructive style
                              >
                                {isPendingDelete ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2"></SidebarFooter>
    </Sidebar>
  );
}
