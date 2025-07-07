import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { VideoBackground } from "@/components/video-background";
import "./globals.css";

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
      <body>
        <VideoBackground />
        <div className="relative z-10">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
