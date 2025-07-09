import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/context/UserContext";
import { SoundProvider } from "@/context/SoundContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Macro",
  description: "Your personal application and media hub.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The setup check logic is now handled entirely by the middleware.
  // This layout is now a clean, universal wrapper.
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="overflow-hidden">
        <UserProvider>
          <SoundProvider>
            <div className="relative z-10">
            {children}
            </div>
            <Toaster />
          </SoundProvider>
        </UserProvider>
      </body>
    </html>
  );
}
