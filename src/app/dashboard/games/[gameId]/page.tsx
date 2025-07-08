
'use client';

import { useGames } from "@/context/GameContext";
import { useUser } from "@/context/UserContext";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Rocket, FileCode, ArrowLeft, Clock, Camera } from "lucide-react";
import { useBackNavigation } from "@/hooks/use-back-navigation";
import { useHints } from "@/context/HintContext";
import { useGridNavigation } from "@/hooks/use-grid-navigation";
import { launchGame } from "@/lib/game-launcher";
import { useSound } from "@/context/SoundContext";
import { formatDuration } from "@/lib/utils";
import { useBackground } from "@/context/BackgroundContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { HeroImageSelector } from "@/components/hero-image-selector";

export default function GameDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { games } = useGames();
    const { currentUser } = useUser();
    const { setHints } = useHints();
    const { playSound } = useSound();
    const executableListRef = useRef<HTMLDivElement>(null);
    const { setBackgroundImage } = useBackground();
    
    const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
    const [isHeroSelectorOpen, setIsHeroSelectorOpen] = useState(false);
    const [effectiveHeroUrls, setEffectiveHeroUrls] = useState<string[]>([]);

    const gameId = typeof params.gameId === 'string' ? params.gameId : '';
    const game = React.useMemo(() => games.find(g => g.id === gameId), [games, gameId]);
    
    const [playtime, setPlaytime] = useState<string | null>(null);

    useBackNavigation(`/dashboard/games`);
    useGridNavigation({ gridRef: executableListRef });
    
    // Effect to set the effective hero URLs, considering custom ones from localStorage
    useEffect(() => {
        if (!game) return;
        
        try {
            const customHeroesJSON = localStorage.getItem('macro-custom-heroes');
            const customHeroes = customHeroesJSON ? JSON.parse(customHeroesJSON) : {};
            const customHero = customHeroes[game.id];
            
            let urls = [...(game.heroUrls || [])];
            
            if (customHero) {
                // Remove the custom hero from its original position to avoid duplicates
                urls = urls.filter(url => url !== customHero);
                // Add it to the front of the array to be displayed first
                urls.unshift(customHero);
            }
            setEffectiveHeroUrls(urls);
        } catch(e) {
            console.error("Failed to parse custom heroes", e);
            setEffectiveHeroUrls(game.heroUrls || []);
        }

    }, [game]);

    // Effect to set the background image based on the current index
    useEffect(() => {
        if (game) {
            const newImage = effectiveHeroUrls?.[currentHeroIndex] || game.posterUrl;
            setBackgroundImage(newImage || null);
        }
        // On component unmount, clear the background
        return () => setBackgroundImage(null);
    }, [game, currentHeroIndex, effectiveHeroUrls, setBackgroundImage]);

    // Effect to handle the timer for cycling hero images
    useEffect(() => {
        if (!effectiveHeroUrls || effectiveHeroUrls.length <= 1) return;
        
        const timer = setInterval(() => {
            setCurrentHeroIndex(prevIndex => (prevIndex + 1) % effectiveHeroUrls.length);
        }, 8000); // 8 seconds
        
        return () => clearInterval(timer);
    }, [effectiveHeroUrls]);


    useEffect(() => {
        try {
            const playtimeJSON = localStorage.getItem('macro-playtime');
            if (playtimeJSON) {
                const allPlaytimes = JSON.parse(playtimeJSON);
                const gamePlaytime = allPlaytimes[gameId];
                if (gamePlaytime && gamePlaytime.totalSeconds > 0) {
                    setPlaytime(formatDuration(gamePlaytime.totalSeconds));
                }
            }
        } catch (error) {
            console.error("Failed to read playtime from localStorage", error);
        }
    }, [gameId]);

    useEffect(() => {
        setHints([
            { key: 'A', action: 'Launch' },
            { key: 'B', action: 'Back' },
            { key: 'Y', action: 'Change Art' },
        ]);
        
        const firstButton = executableListRef.current?.querySelector('button') as HTMLElement;
        firstButton?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'y' && !isHeroSelectorOpen) {
                setIsHeroSelectorOpen(true);
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            setHints([]);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [setHints, isHeroSelectorOpen]);

    const handleLaunch = async (executable: string) => {
        if (!game) return;
        playSound('launch');
        localStorage.setItem('macro-active-session', JSON.stringify({ gameId: game.id, startTime: Date.now() }));
        await launchGame(game.path, executable);
        router.push(`/dashboard/games/${game.id}/launching?exe=${encodeURIComponent(executable)}`);
    }

    const handleSaveCustomHero = (url: string) => {
        if (!game) return;
        try {
            const customHeroesJSON = localStorage.getItem('macro-custom-heroes');
            const customHeroes = customHeroesJSON ? JSON.parse(customHeroesJSON) : {};
            customHeroes[game.id] = url;
            localStorage.setItem('macro-custom-heroes', JSON.stringify(customHeroes));

            // Update state immediately for visual feedback
            setEffectiveHeroUrls(prevUrls => {
                const newUrls = prevUrls.filter(u => u !== url);
                newUrls.unshift(url);
                return newUrls;
            });
            setCurrentHeroIndex(0); // Reset to show the new image
            setIsHeroSelectorOpen(false); // Close dialog
            playSound('select');
        } catch(e) {
            console.error("Failed to save custom hero", e);
        }
    };

    if (!currentUser || !game) {
        return null; 
    }

    return (
        <div className="flex flex-col text-white animate-fade-in">
            <div className="absolute top-4 left-4 m-4 z-20 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => router.back()} >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Library
                </Button>
                <Button variant="outline" size="icon" onClick={() => setIsHeroSelectorOpen(true)}>
                    <Camera className="h-4 w-4" />
                </Button>
            </div>

            <div className="relative w-full h-72 md:h-[450px] rounded-lg overflow-hidden">
                {effectiveHeroUrls && effectiveHeroUrls.length > 0 ? (
                    <Image
                        key={effectiveHeroUrls[currentHeroIndex]}
                        src={effectiveHeroUrls[currentHeroIndex]}
                        alt={`${game.name} Hero Image`}
                        fill
                        className="object-cover object-center animate-fade-in"
                        priority={currentHeroIndex === 0}
                    />
                ) : (
                    <div className="w-full h-full bg-card" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            </div>

            <div className="relative z-10 -mt-24 md:-mt-48 px-8 md:px-12 pb-8 flex flex-col md:flex-row items-center md:items-end gap-8">
                <div className="flex-shrink-0">
                     {game.posterUrl ? (
                        <div className="relative w-48 md:w-64 aspect-[3/4] rounded-lg overflow-hidden shadow-2xl shadow-black/50 border-2 border-white/10">
                            <Image
                                src={game.posterUrl}
                                alt={`${game.name} Poster`}
                                fill
                                className="object-cover"
                            />
                        </div>
                    ) : (
                         <div className="relative w-48 md:w-64 aspect-[3/4] rounded-lg bg-card flex items-center justify-center">
                            <h2 className="text-2xl font-bold text-center p-4">{game.name}</h2>
                        </div>
                    )}
                </div>

                <div className="flex-grow space-y-4 pt-8 text-center md:text-left">
                    {game.logoUrl ? (
                         <div className="relative w-full max-w-sm h-24 mb-4 drop-shadow-2xl mx-auto md:mx-0">
                            <Image
                                src={game.logoUrl}
                                alt={`${game.name} Logo`}
                                fill
                                className="object-contain"
                            />
                        </div>
                    ) : (
                        <h1 className="text-5xl md:text-6xl font-bold text-glow">{game.name}</h1>
                    )}

                    <div className="max-w-2xl flex items-center justify-center md:justify-start gap-4 mx-auto md:mx-0">
                        <p className="text-lg text-muted-foreground">Select an executable to launch.</p>
                         {playtime && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground border-l border-white/20 pl-4">
                                <Clock className="h-4 w-4" />
                                <span>{playtime} played</span>
                            </div>
                        )}
                    </div>
                    <div ref={executableListRef} className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
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

            <Dialog open={isHeroSelectorOpen} onOpenChange={setIsHeroSelectorOpen}>
                <DialogContent className="max-w-4xl">
                   {game.steamgridGameId && <HeroImageSelector gameId={game.steamgridGameId} onSave={handleSaveCustomHero} onClose={() => setIsHeroSelectorOpen(false)} />}
                </DialogContent>
            </Dialog>
        </div>
    );
}
