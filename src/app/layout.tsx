import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { GamepadStatus } from "@/components/gamepad-status";
import { UserProvider } from "@/context/UserContext";
import { SoundProvider } from "@/context/SoundContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { GamepadProvider } from "@/context/GamepadContext";
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="overflow-hidden">
        <ThemeProvider>
          <GamepadProvider>
            <UserProvider>
              <SoundProvider>
                <div className="relative z-10 safe-zone">
                {children}
                </div>
                <GamepadStatus />
                <Toaster />
              </SoundProvider>
            </UserProvider>
          </GamepadProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
