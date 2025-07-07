'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserNav } from "@/components/user-nav";
import { cn } from "@/lib/utils";
import { Home, User, Settings, Gamepad2, LayoutGrid } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/games", label: "Games", icon: Gamepad2 },
  { href: "/dashboard/applications", label: "Apps", icon: LayoutGrid },
  { href: "/dashboard/profiles", label: "Profiles", icon: User },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-screen w-full flex-col bg-transparent">
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
                      pathname === item.href
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
          <UserNav />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 pt-0">
        {children}
      </main>
    </div>
  );
}
