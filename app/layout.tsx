import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner"; // Import Toaster if not already in chat layout

export const metadata: Metadata = {
  title: "AI Chat App", // Update title
  description: "Chat with your AI assistant", // Update description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full" suppressHydrationWarning>
        <body className="font-mono h-full bg-background text-foreground">
          {children}
          <Toaster richColors position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
