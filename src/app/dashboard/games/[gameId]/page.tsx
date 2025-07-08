
'use client';

import { useGames } from "@/context/GameContext";
import { useUser } from "@/context/UserContext";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Rocket, FileCode, ArrowLeft } from "lucide-react";
import { useBackNavigation } from "@/hooks/use-back-navigation";
import { useHints } from "@/context/HintContext";
import { useGridNavigation } from "@/hooks/use-grid-navigation";
import { launchGame } from "@/lib/game-launcher";
import { useSound } from "@/context/SoundContext";
import { hexToHsl } from "@/lib/utils";

export default function GameDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { games } = useGames();
    const { currentUser } = useUser();
    const { setHints } = useHints();
    const { playSound } = useSound();
    const executableListRef = useRef<HTMLDivElement>(null);
    
    const gameId = typeof params.gameId === 'string' ? params.gameId : '';
    const game = React.useMemo(() => games.find(g => g.id === gameId), [games, gameId]);

    useBackNavigation(`/dashboard/games`);
    useGridNavigation({ gridRef: executableListRef });

    useEffect(() => {
      if (!game?.themeColors) return;

      const root = document.documentElement;
      const originalPrimary = root.style.getPropertyValue('--primary');
      const originalAccent = root.style.getPropertyValue('--accent');

      const primaryHsl = hexToHsl(game.themeColors.primary);
      const accentHsl = hexToHsl(game.themeColors.accent);

      if (primaryHsl) {
        root.style.setProperty('--primary-dynamic', `${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%`);
        root.classList.add('dynamic-theme');
      }
      if (accentHsl) {
        root.style.setProperty('--accent-dynamic', `${accentHsl.h} ${accentHsl.s}% ${accentHsl.l}%`);
        root.classList.add('dynamic-theme');
      }
  
      return () => {
        root.style.setProperty('--primary', originalPrimary);
        root.style.setProperty('--accent', originalAccent);
        root.classList.remove('dynamic-theme');
      };
    }, [game?.themeColors]);


    useEffect(() => {
        setHints([
            { key: 'A', action: 'Launch' },
            { key: 'B', action: 'Back' },
        ]);
        
        const firstButton = executableListRef.current?.querySelector('button') as HTMLElement;
        firstButton?.focus();

        return () => setHints([]);
    }, [setHints]);

    if (!currentUser || !game) {
        // You can add a loading or not found state here
        return null; 
    }

    const handleLaunch = async (executable: string) => {
        playSound('launch');
        await launchGame(game.path, executable);
        router.push(`/dashboard/games/${game.id}/launching?exe=${encodeURIComponent(executable)}`);
    }

    return (
        <div className="relative h-full min-h-[calc(100vh-10rem)] flex flex-col justify-end p-8 md:p-12 text-white animate-fade-in">
             {game.heroUrl && (
                <Image
                    src={game.heroUrl}
                    alt={game.name}
                    fill
                    className="object-cover object-center z-0"
                    priority
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent z-10" />

            <div className="relative z-20 space-y-6">
                <Button variant="outline" size="sm" onClick={() => router.back()} className="absolute top-0 left-0 m-4 bg-black/30 hover:bg-black/50 border-white/20">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Library
                </Button>
                
                {game.logoUrl ? (
                    <div className="relative w-1/2 max-w-md h-40">
                        <Image
                            src={game.logoUrl}
                            alt={`${game.name} Logo`}
                            fill
                            className="object-contain"
                        />
                    </div>
                ) : (
                     <h1 className="text-6xl font-bold text-glow">{game.name}</h1>
                )}
               
                <div className="max-w-xl">
                    <p className="text-lg text-muted-foreground">Select an executable to launch the game.</p>
                </div>
                <div ref={executableListRef} className="flex flex-col items-start gap-4">
                    {game.executables.map(exe => (
                         <Button key={exe} onClick={() => handleLaunch(exe)} size="lg">
                            <Rocket className="mr-2 h-5 w-5" />
                            Launch {game.name}
                            <span className="ml-2 text-sm text-primary-foreground/70 flex items-center gap-1">
                                (<FileCode className="h-3 w-3" /> {exe})
                            </span>
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
