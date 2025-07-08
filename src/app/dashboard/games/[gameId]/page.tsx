
'use client';

import { useGames } from "@/context/GameContext";
import { useUser } from "@/context/UserContext";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Rocket, FileCode, ArrowLeft, Clock, Star } from "lucide-react";
import { useBackNavigation } from "@/hooks/use-back-navigation";
import { useHints } from "@/context/HintContext";
import { useGridNavigation } from "@/hooks/use-grid-navigation";
import { launchGame } from "@/lib/game-launcher";
import { useSound } from "@/context/SoundContext";
import { formatDuration, cn } from "@/lib/utils";
import { useBackground } from "@/context/BackgroundContext";

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
    
    const gameId = typeof params.gameId === 'string' ? params.gameId : '';
    const game = React.useMemo(() => games.find(g => g.id === gameId), [games, gameId]);
    
    const [playtime, setPlaytime] = useState<string | null>(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const favoritesKey = currentUser ? `macro-favorites-${currentUser.id}` : null;

    useBackNavigation(`/dashboard/games`);
    useGridNavigation({ gridRef: executableListRef });

    useEffect(() => {
        if (game) {
            setBackgroundImage(game.heroUrls?.[0] || game.posterUrl || null);
        }
        return () => setBackgroundImage(null);
    }, [game, setBackgroundImage]);

    useEffect(() => {
        if (!game?.heroUrls || game.heroUrls.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentHeroIndex(prevIndex => {
                const newIndex = (prevIndex + 1) % game.heroUrls.length;
                if (game.heroUrls[newIndex]) {
                    setBackgroundImage(game.heroUrls[newIndex]);
                }
                return newIndex;
            });
        }, 8000);
        return () => clearInterval(timer);
    }, [game, setBackgroundImage]);

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
        if (!favoritesKey) return;
        try {
            const favoritesJSON = localStorage.getItem(favoritesKey);
            if (favoritesJSON) {
                const favorites = JSON.parse(favoritesJSON);
                setIsFavorite(favorites.games?.includes(gameId));
            } else {
                setIsFavorite(false);
            }
        } catch (e) {
            console.error("Failed to read game favorites", e);
        }
    }, [gameId, favoritesKey]);

    useEffect(() => {
        setHints([
            { key: 'A', action: 'Launch' },
            { key: 'Y', action: 'Favorite' },
            { key: 'B', action: 'Back' },
        ]);
        
        const firstButton = executableListRef.current?.querySelector('button') as HTMLElement;
        firstButton?.focus();

        return () => setHints([]);
    }, [setHints]);

    const handleLaunch = async (executable: string) => {
        playSound('launch');
        localStorage.setItem('macro-active-session', JSON.stringify({ gameId: game.id, startTime: Date.now() }));
        await launchGame(game.path, executable);
        router.push(`/dashboard/games/${game.id}/launching?exe=${encodeURIComponent(executable)}`);
    }

    const toggleFavorite = () => {
        if (!favoritesKey) return;
        const newFavStatus = !isFavorite;
        setIsFavorite(newFavStatus);
        try {
            const favoritesJSON = localStorage.getItem(favoritesKey) || '{}';
            const favorites = JSON.parse(favoritesJSON);
            const gameFavorites = new Set(favorites.games || []);

            if (newFavStatus) {
                gameFavorites.add(gameId);
            } else {
                gameFavorites.delete(gameId);
            }
            
            const newFavorites = {
                ...favorites,
                games: Array.from(gameFavorites),
            };
            localStorage.setItem(favoritesKey, JSON.stringify(newFavorites));
            playSound(newFavStatus ? 'select' : 'back');
        } catch (e) {
            console.error("Failed to update game favorites", e);
        }
    };
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'y') {
                toggleFavorite();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [toggleFavorite]);

    if (!currentUser || !game) {
        return null; 
    }

    return (
        <div className="flex flex-col text-white animate-fade-in">
            <Button variant="outline" size="sm" onClick={() => router.back()} className="absolute top-4 left-4 m-4 bg-black/30 hover:bg-black/50 border-white/20 z-20">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Library
            </Button>

            <div className="relative w-full h-72 md:h-[450px] rounded-lg overflow-hidden">
                {game.heroUrls && game.heroUrls.length > 0 && (
                    <Image
                        key={game.heroUrls[currentHeroIndex]}
                        src={game.heroUrls[currentHeroIndex]}
                        alt={`${game.name} Hero Image`}
                        fill
                        className="object-cover object-center animate-fade-in"
                        priority={currentHeroIndex === 0}
                    />
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
                        <Button onClick={toggleFavorite} variant="outline" size="icon" aria-label="Toggle Favorite" className="h-11 w-11">
                            <Star className={cn("h-5 w-5", isFavorite ? "fill-yellow-400 text-yellow-400" : "text-foreground")} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
