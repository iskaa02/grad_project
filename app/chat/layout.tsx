import { ChatHistorySidebar } from "@/components/ChatHistorySidebar";
import { SidebarProvider } from "@/components/ui/sidebar"; // Import SidebarProvider
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner"; // Import Toaster for notifications

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SignedIn>
        {/* Wrap with SidebarProvider */}
        {/* Ensure h-screen is applied correctly to allow flex child to fill height */}
        <SidebarProvider>
          <div className="flex h-screen w-full overflow-hidden"> {/* Added w-full and overflow-hidden */}
            <ChatHistorySidebar />
            {/* Main content area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden"> {/* Ensure flex-col and overflow */}
              {/* Children will be the specific chat page ([chatId]/page.tsx or page.tsx) */}
              {children}
            </main>
          </div>
        </SidebarProvider>
      </SignedIn>
      <SignedOut>
         {/* Center the sign-in button */}
         <div className="flex justify-center items-center h-screen">
           <div>
             <p className="mb-4">Please sign in to continue.</p>
             <SignInButton mode="modal">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
                    Sign In
                </button>
             </SignInButton>
           </div>
         </div>
      </SignedOut>
      {/* Place Toaster here, outside SignedIn/Out if you want notifications globally */}
      <Toaster richColors position="top-right" />
    </>
  );
}
