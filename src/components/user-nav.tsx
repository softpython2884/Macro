
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useEffect, useState } from "react";
import { Gamepad2 } from "lucide-react";

export function UserNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, logout } = useUser();
  const [nowPlaying, setNowPlaying] = useState<string | null>(null);

  useEffect(() => {
    try {
      const sessionJSON = localStorage.getItem('macro-active-session');
      if (sessionJSON) {
        const session = JSON.parse(sessionJSON);
        setNowPlaying(session.gameName || null);
      } else {
        setNowPlaying(null);
      }
    } catch (error) {
      console.error("Failed to read active session from localStorage", error);
      setNowPlaying(null);
    }
  }, [pathname]); // Re-check whenever the route changes

  const handleLogout = () => {
    logout();
  };

  if (!currentUser) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            <AvatarFallback>{currentUser.name.substring(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{currentUser.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {currentUser.name.toLowerCase().replace(' ', '.')}@macro.sys
            </p>
          </div>
        </DropdownMenuLabel>
        
        {nowPlaying && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground flex items-center gap-2">
                <Gamepad2 className="h-4 w-4" />
                <span>Playing: {nowPlaying}</span>
            </div>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/dashboard/profiles')}>
            Profiles
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
