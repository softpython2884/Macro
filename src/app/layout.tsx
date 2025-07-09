import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/context/UserContext";
import { SoundProvider } from "@/context/SoundContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Macro",
  description: "Your personal application and media hub.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} overflow-hidden`}>
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
