
'use client';

import { Card } from "@/components/ui/card";
import { Gamepad2, Search, Wand2, Loader2, Award } from 'lucide-react';
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
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
import { recommendGames } from "@/ai/flows/recommend-games-flow";
import { Button } from "@/components/ui/button";
import { checkAndAwardAchievements } from "@/lib/social-service";
import { useToast } from "@/hooks/use-toast";
import { GlareHover } from "@/components/animations/glare-hover";
import { AnimatedContent } from "@/components/animations/animated-content";
import { ShinyText } from "@/components/animations/shiny-text";

const GameCard = ({ initialGame }: { initialGame: Game }) => {
  const { setBackgroundImage } = useBackground();
  const { updateGameMetadata } = useGames();
  const [game, setGame] = useState(initialGame);
  const [isEnriching, setIsEnriching] = useState(!initialGame.posterUrl);

  useEffect(() => {
    let isMounted = true;
    async function enrichGame() {
      if (!game.posterUrl) {
        setIsEnriching(true);
        const enrichedGame = await updateGameMetadata(game);
        if (isMounted) {
          setGame(enrichedGame);
          setIsEnriching(false);
        }
      }
    }
    enrichGame();
    return () => { isMounted = false };
  }, [game, updateGameMetadata]);
  
  const cardContent = (
      <Card className="bg-black/20 backdrop-blur-lg border border-transparent group-hover:border-primary focus-within:border-primary focus-within:ring-2 focus-within:ring-primary transition-all duration-300 ease-in-out h-full w-full overflow-hidden">
        {isEnriching ? (
            <Skeleton className="h-full w-full" />
        ) : game.posterUrl ? (
            <Image 
              src={game.posterUrl} 
              alt={game.name} 
              fill 
              className="object-cover group-hover:scale-105 group-focus-within:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Gamepad2 className="h-16 w-16 text-primary/50 drop-shadow-[0_0_8px_hsl(var(--primary))] transition-all duration-300 group-hover:scale-110 group-focus-within:scale-110 group-hover:text-primary" />
                <h3 className="mt-4 text-xl font-bold text-card-foreground">{game.name}</h3>
            </div>
          )}
      </Card>
  );

  return (
    <Link 
      href={`/dashboard/games/${game.id}`} 
      className="block group w-full h-full rounded-lg focus:outline-none text-left aspect-[3/4]"
      onFocus={() => setBackgroundImage(game.posterUrl || null)}
      onBlur={() => setBackgroundImage(null)}
    >
      <GlareHover className="w-full h-full" borderRadius="var(--radius)">
        {cardContent}
      </GlareHover>
    </Link>
  );
};

const GameCardSkeleton = () => (
    <div className="flex flex-col space-y-3 aspect-[3/4]">
      <Skeleton className="h-full w-full rounded-xl" />
    </div>
)

export default function GamesPage() {
  const { setHints } = useHints();
  const gridRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useUser();
  const { games, isLoading } = useGames();
  useGridNavigation({ gridRef });
  useBackNavigation('/dashboard');

  const [searchQuery, setSearchQuery] = useState('');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  
  const [isRecsOpen, setIsRecsOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isRecsLoading, setIsRecsLoading] = useState(false);
  const { toast } = useToast();
  
  const permittedGames = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.permissions.allGames) {
      return games;
    }
    return games.filter(game => currentUser.permissions.games.includes(game.id));
  }, [currentUser, games]);

  const handleGetRecommendations = useCallback(async () => {
    if (permittedGames.length === 0) return;
    setIsRecsOpen(true);
    setIsRecsLoading(true);
    setRecommendations([]);
    const gameNames = permittedGames.map(g => g.name);
    try {
        const result = await recommendGames({ playedGames: gameNames });
        setRecommendations(result.recommendations);
    } catch (error) {
        console.error("Failed to get recommendations:", error);
    } finally {
        setIsRecsLoading(false);
    }
  }, [permittedGames]);

  useEffect(() => {
    const checkAchievements = async () => {
        if (isLoading || permittedGames.length === 0) return;

        try {
            const socialUserJson = localStorage.getItem('macro-social-user');
            if (!socialUserJson) return;
            
            const socialUser = JSON.parse(socialUserJson);
            if (!socialUser.id) return;

            const newAchievements = await checkAndAwardAchievements(socialUser.id, { gameCount: permittedGames.length });
            
            if (newAchievements.length > 0) {
                toast({
                    title: "Achievement Unlocked!",
                    description: `You've earned: ${newAchievements.join(', ')}`,
                    action: <Award className="h-6 w-6 text-yellow-400" />,
                });
            }
        } catch (e) {
            console.error("Failed to check for achievements:", e);
        }
    };
    if (!isLoading && permittedGames.length > 0) {
        checkAchievements();
    }
  }, [permittedGames, isLoading, toast]);

  useEffect(() => {
    setHints([
      { key: '↕↔', action: 'Navigate' },
      { key: 'A', action: 'Select' },
      { key: 'B', action: 'Back' },
      { key: 'Y', action: 'Search' },
      { key: 'X', action: 'Suggestions' },
      { key: 'Q', action: 'Prev Tab' },
      { key: 'E', action: 'Next Tab' },
    ]);

    if (!isLoading) {
      const firstElement = gridRef.current?.querySelector('button, a') as HTMLElement;
      if (gridRef.current && !gridRef.current.contains(document.activeElement)) {
        firstElement?.focus();
      }
    }

  }, [setHints, isLoading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const isAnyDialogOpen = !!document.querySelector('[role="dialog"]');
        if (isAnyDialogOpen) return;

        const key = e.key.toLowerCase();
        if (key === 'y') {
            e.preventDefault();
            setIsKeyboardOpen(true);
        }
        if (key === 'x') {
            e.preventDefault();
            handleGetRecommendations();
        }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleGetRecommendations]);

  const filteredGames = useMemo(() => {
    if (!searchQuery) return permittedGames;
    return permittedGames.filter(game =>
      game.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, permittedGames]);

  const handleKeyboardClose = () => {
    setIsKeyboardOpen(false);
    setTimeout(() => {
        const firstElement = gridRef.current?.querySelector('button, a') as HTMLElement;
        if (firstElement) {
            firstElement.focus();
        }
    }, 100);
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="space-y-12">
      <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-4xl font-bold tracking-tight">
                <ShinyText text="My Game Library" />
            </h2>
            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={handleGetRecommendations}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Suggestions IA
                </Button>
                <div className="relative w-72">
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
        </div>
        <div ref={gridRef} className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {isLoading 
              ? Array.from({ length: 10 }).map((_, i) => <GameCardSkeleton key={i} />)
              : filteredGames.map((game, index) => (
                  <AnimatedContent key={game.id} delay={index * 0.05}>
                    <GameCard initialGame={game} />
                  </AnimatedContent>
              ))
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
                onClose={() => setIsKeyboardOpen(false)}
            />
        </DialogContent>
      </Dialog>

      <Dialog open={isRecsOpen} onOpenChange={setIsRecsOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Suggestions de jeux</DialogTitle>
                <DialogDescription>
                    Basé sur votre bibliothèque, voici quelques jeux qui pourraient vous plaire.
                </DialogDescription>
            </DialogHeader>
            {isRecsLoading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <ul className="list-disc list-inside space-y-2 py-4">
                    {recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

    