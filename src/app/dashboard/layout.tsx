
'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserNav } from "@/components/user-nav";
import { cn, formatDuration } from "@/lib/utils";
import { Home, User, Settings, Gamepad2, LayoutGrid } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HintProvider } from "@/context/HintContext";
import { ControllerHints } from "@/components/controller-hints";
import React from "react";
import { SystemStatus } from "@/components/system-status";
import { GameProvider } from "@/context/GameContext";
import { useToast } from "@/hooks/use-toast";
import { BackgroundProvider, useBackground } from "@/context/BackgroundContext";
import Image from "next/image";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/games", label: "Games", icon: Gamepad2 },
  { href: "/dashboard/applications", label: "Apps", icon: LayoutGrid },
  { href: "/dashboard/profiles", label: "Profiles", icon: User },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const DynamicBackground = () => {
  const { backgroundImage } = useBackground();
  
  if (!backgroundImage) {
    return null;
  }

  return (
    <div className="fixed inset-0 -z-10">
      <Image
        key={backgroundImage}
        src={backgroundImage}
        alt=""
        fill
        className="object-cover blur-2xl scale-110 opacity-30 animate-fade-in"
      />
      <div className="absolute inset-0 bg-background/60" />
    </div>
  );
};

const LayoutWithBackground = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (typeof e.key !== 'string') {
            return;
        }
        
        const key = e.key.toLowerCase();
        if (key === 'q' || key === 'e') {
            const isAnyDialogOpen = !!document.querySelector('[role="dialog"]');
            if (isAnyDialogOpen) return;

            const currentIndex = navItems.findIndex(item => pathname.startsWith(item.href) && item.href !== '/dashboard' || item.href === pathname);
            if (currentIndex === -1) return;

            let nextIndex;
            if (key === 'q') { // Previous (LB)
                nextIndex = (currentIndex - 1 + navItems.length) % navItems.length;
            } else { // Next (RB)
                nextIndex = (currentIndex + 1) % navItems.length;
            }
            
            const nextItem = navItems[nextIndex];
            if (nextItem) {
                router.push(nextItem.href);
            }
        }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [pathname, router]);

  React.useEffect(() => {
    try {
        const sessionJSON = localStorage.getItem('macro-active-session');
        if (sessionJSON) {
            const session = JSON.parse(sessionJSON);
            const durationInSeconds = Math.round((Date.now() - session.startTime) / 1000);

            const playtimeJSON = localStorage.getItem('macro-playtime') || '{}';
            const allPlaytimes = JSON.parse(playtimeJSON);
            
            const existingPlaytime = allPlaytimes[session.gameId] || { totalSeconds: 0 };
            
            allPlaytimes[session.gameId] = {
                totalSeconds: (existingPlaytime.totalSeconds || 0) + durationInSeconds,
                lastPlayed: Date.now(),
            };

            localStorage.setItem('macro-playtime', JSON.stringify(allPlaytimes));
            localStorage.removeItem('macro-active-session');

            if (durationInSeconds > 60) {
                 toast({
                    title: "Play Session Ended",
                    description: `You played for about ${formatDuration(durationInSeconds)}.`,
                });
            }
        }
    } catch (error) {
        console.error("Failed to process playtime session:", error);
    }
  }, [pathname, toast]);
  
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-transparent">
      <DynamicBackground />
      <header className="sticky top-0 flex h-20 items-center justify-center gap-4 px-4 md:px-8 z-50">
        <TooltipProvider>
          <nav className="flex items-center gap-2 rounded-full bg-background/50 p-2 backdrop-blur-md border border-white/10">
            {navItems.map((item) => (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary",
                       pathname.startsWith(item.href) && item.href !== '/dashboard' || pathname === item.href
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </nav>
        </TooltipProvider>

        <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 flex items-center gap-4">
          <SystemStatus />
          <UserNav />
        </div>
      </header>
      <main key={pathname} className="relative z-10 flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 pt-0 animate-fade-in">
        {children}
      </main>
      <ControllerHints />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HintProvider>
      <GameProvider>
        <BackgroundProvider>
          <LayoutWithBackground>{children}</LayoutWithBackground>
        </BackgroundProvider>
      </GameProvider>
    </HintProvider>
  );
}
