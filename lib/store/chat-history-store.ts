import { atom, computed, onMount, onSet } from "nanostores";
import type { Chat } from "@/lib/db/schema/chats"; // Assuming this type exists
import { getUserChats } from "../actions/chats";
import { toast } from "sonner";

export const $chatHistory = atom<Chat[]>([]);
export const $error = atom<string | null>(null);

// Optionally, a computed store to derive some state from the chat history
export const $chatCount = computed($chatHistory, (chats) => chats.length);

// Function to set the chats - can be used with await
export const setChats = (newChats: Chat[]) => {
  $chatHistory.set(newChats);
};

export const setError = (error: string | null) => {
  $error.set(error);
};

// Function to add a chat to the store
export const addChat = (chat: Chat) => {
  $chatHistory.set([...$chatHistory.get(), chat]);
};

// Function to update a chat in the store
export const updateChat = (updatedChat: Chat) => {
  $chatHistory.set(
    $chatHistory
      .get()
      .map((chat) => (chat.id === updatedChat.id ? updatedChat : chat)),
  );
};

// Function to remove a chat from the store
export const removeChat = (chatId: string) => {
  $chatHistory.set($chatHistory.get().filter((chat) => chat.id !== chatId));
};

export const fetchChats = async () => {
  setError(null);
  try {
    const userChats = await getUserChats();
    setChats(userChats);
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : "Failed to load chat history.";
    setError(errorMsg);
    toast.error(errorMsg); // Show error toast
    console.error(err);
  }
};
