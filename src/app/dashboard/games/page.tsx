
'use client';

import { Card } from "@/components/ui/card";
import { Gamepad2, Search } from 'lucide-react';
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useHints } from '@/context/HintContext';
import { useGridNavigation } from '@/hooks/use-grid-navigation';
import { useBackNavigation } from '@/hooks/use-back-navigation';
import { useUser } from '@/context/UserContext';
import type { Game } from '@/lib/data';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { OnScreenKeyboard } from "@/components/on-screen-keyboard";
import { useGames } from "@/context/GameContext";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackground } from "@/context/BackgroundContext";

const GameCard = ({ game }: { game: Game }) => {
  const { setBackgroundImage } = useBackground();
  
  return (
    <Link 
      href={`/dashboard/games/${game.id}`} 
      className="block group w-full h-full rounded-lg focus:outline-none text-left aspect-[3/4]"
      onFocus={() => setBackgroundImage(game.posterUrl || null)}
      onBlur={() => setBackgroundImage(null)}
    >
      <Card className="bg-black/20 backdrop-blur-lg border border-white/10 group-hover:border-primary focus-within:border-primary focus-within:ring-2 focus-within:ring-primary transition-all duration-300 ease-in-out h-full w-full overflow-hidden">
        {game.posterUrl ? (
            <Image 
              src={game.posterUrl} 
              alt={game.name} 
              fill 
              className="object-cover group-hover:scale-105 group-focus-within:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
                <Gamepad2 className="h-16 w-16 text-primary/50 drop-shadow-[0_0_8px_hsl(var(--primary))] transition-all duration-300 group-hover:scale-110 group-focus-within:scale-110 group-hover:text-primary" />
            </div>
          )}
      </Card>
    </Link>
  );
};

const GameCardSkeleton = () => (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-[350px] w-full rounded-xl" />
    </div>
)

export default function GamesPage() {
  const { setHints } = useHints();
  const gridRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useUser();
  const { games, isLoading, fetchGameMetadata } = useGames();
  useGridNavigation({ gridRef });
  useBackNavigation('/dashboard');

  const [searchQuery, setSearchQuery] = useState('');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  
  useEffect(() => {
    fetchGameMetadata();
  }, [fetchGameMetadata]);

  useEffect(() => {
    setHints([
      { key: '↕↔', action: 'Navigate' },
      { key: 'A', action: 'Launch' },
      { key: 'B', action: 'Back' },
      { key: 'Y', action: 'Search' },
      { key: 'Q', action: 'Prev Tab' },
      { key: 'E', action: 'Next Tab' },
    ]);

    const firstElement = gridRef.current?.querySelector('button, a') as HTMLElement;
    if (firstElement) firstElement.focus();

    return () => setHints([]);
  }, [setHints, isLoading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const isAnyDialogOpen = !!document.querySelector('[role="dialog"]');
        if (e.key.toLowerCase() === 'y' && !isAnyDialogOpen) {
            e.preventDefault();
            setIsKeyboardOpen(true);
        }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const permittedGames = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.name === 'Admin') {
      return games;
    }
    return games.filter(game => currentUser.permissions.games.includes(game.id));
  }, [currentUser, games]);

  const filteredGames = useMemo(() => {
    if (!searchQuery) return permittedGames;
    return permittedGames.filter(game =>
      game.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, permittedGames]);

  const handleKeyboardClose = () => {
    setIsKeyboardOpen(false);
    const firstElement = gridRef.current?.querySelector('button, a') as HTMLElement;
    if (firstElement) firstElement.focus();
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="space-y-12">
      <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-4xl font-bold tracking-tight text-glow">My Game Library</h2>
            <div className="relative w-1/3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                placeholder="Search library..."
                className="pl-10 focus-visible:ring-primary focus-visible:ring-2"
                value={searchQuery}
                onFocus={() => setIsKeyboardOpen(true)}
                onClick={() => setIsKeyboardOpen(true)}
                readOnly
                />
            </div>
        </div>
        <div ref={gridRef} className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {isLoading 
              ? Array.from({ length: 10 }).map((_, i) => <GameCardSkeleton key={i} />)
              : filteredGames.map(game => <GameCard key={game.id} game={game} />)
            }
        </div>
      </div>

       <Dialog open={isKeyboardOpen} onOpenChange={(isOpen) => !isOpen && handleKeyboardClose()}>
        <DialogContent className="bg-transparent border-none shadow-none p-0 max-w-4xl flex justify-center" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader className="sr-only">
              <DialogTitle>On-Screen Keyboard</DialogTitle>
              <DialogDescription>
                Search for a game in your library.
              </DialogDescription>
            </DialogHeader>
            <OnScreenKeyboard
                onInput={(char) => setSearchQuery(q => q + char)}
                onDelete={() => setSearchQuery(q => q.slice(0, -1))}
                onEnter={handleKeyboardClose}
                onClose={handleKeyboardClose}
            />
        </DialogContent>
      </Dialog>
    </div>
  );
}
