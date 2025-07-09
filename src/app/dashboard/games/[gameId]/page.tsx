
'use client';

import { useGames } from "@/context/GameContext";
import { useUser } from "@/context/UserContext";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Rocket, FileCode, ArrowLeft, Clock, Camera, GalleryThumbnails } from "lucide-react";
import { useBackNavigation } from "@/hooks/use-back-navigation";
import { useHints } from "@/context/HintContext";
import { useGridNavigation } from "@/hooks/use-grid-navigation";
import { launchGame } from "@/lib/game-launcher";
import { useSound } from "@/context/SoundContext";
import { formatDuration } from "@/lib/utils";
import { useBackground } from "@/context/BackgroundContext";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { HeroImageSelector } from "@/components/hero-image-selector";
import { getGrids, type SteamGridDbImage } from "@/lib/steamgrid";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

// --- PosterImageSelector Component Definition ---
// Defined inside this file to keep it scoped, as it's only used here.
const PosterImageSelector = ({ gameId, onSave, onRevert, onClose }: { gameId: number, onSave: (url: string) => void, onRevert: () => void, onClose: () => void }) => {
    const [images, setImages] = useState<SteamGridDbImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [customUrl, setCustomUrl] = useState('');
    const { currentUser } = useUser();
    const gridRef = useRef<HTMLDivElement>(null);
    useGridNavigation({ gridRef });

    useEffect(() => {
        async function fetchImageOptions() {
            if (!currentUser) return;
            setIsLoading(true);
            const { nsfwEnabled, prioritizeNsfw } = currentUser.permissions;
            const nsfwApiSetting = nsfwEnabled ? 'any' : 'false';
            const fetchedImages = await getGrids(gameId, ['600x900'], nsfwApiSetting, prioritizeNsfw);
            setImages(fetchedImages);
            setIsLoading(false);
        }
        if (gameId) fetchImageOptions();
    }, [gameId, currentUser]);

    useEffect(() => {
        if (!isLoading) gridRef.current?.querySelector('button')?.focus();
    }, [isLoading]);

    const handleSaveCustomUrl = () => { if (customUrl) onSave(customUrl); };

    return (
        <>
            <DialogHeader>
                <DialogTitle>Change Game Poster</DialogTitle>
                <DialogDescription>Select a new poster from the list below or provide a custom image URL.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <ScrollArea className="h-96 pr-4 -mr-4">
                    <div ref={gridRef} className="grid grid-cols-3 gap-4">
                        {isLoading
                            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="w-full aspect-[3/4] rounded-md" />)
                            : images.map((img) => (
                                <button key={img.id} className="block rounded-md overflow-hidden border-2 border-transparent focus:border-primary focus:outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2" onClick={() => onSave(img.url)}>
                                    <Image src={img.thumb} alt={`Poster ${img.id}`} width={200} height={300} className="object-cover w-full aspect-[3/4]" />
                                </button>
                            ))}
                    </div>
                </ScrollArea>
                <div className="space-y-2">
                    <p className="text-sm font-medium">Or use a custom URL</p>
                    <div className="flex items-center gap-2">
                        <Input placeholder="https://example.com/image.png" value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} />
                        <Button onClick={handleSaveCustomUrl}>Save URL</Button>
                    </div>
                </div>
            </div>
            <DialogFooter className="justify-between">
                <Button variant="outline" onClick={onRevert}>Revert to Default</Button>
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </DialogFooter>
        </>
    );
};


// --- GameDetailPage Component ---
export default function GameDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { games, updateGamePoster } = useGames();
    const { currentUser } = useUser();
    const { setHints } = useHints();
    const { playSound } = useSound();
    const executableListRef = useRef<HTMLDivElement>(null);
    const { setBackgroundImage } = useBackground();
    
    const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
    const [isHeroSelectorOpen, setIsHeroSelectorOpen] = useState(false);
    const [isPosterSelectorOpen, setIsPosterSelectorOpen] = useState(false);
    const [effectiveHeroUrls, setEffectiveHeroUrls] = useState<string[]>([]);
    const [isCustomHeroPinned, setIsCustomHeroPinned] = useState(false);

    const gameId = typeof params.gameId === 'string' ? params.gameId : '';
    const game = React.useMemo(() => games.find(g => g.id === gameId), [games, gameId]);
    
    const [playtime, setPlaytime] = useState<string | null>(null);

    useBackNavigation(`/dashboard/games`);
    useGridNavigation({ gridRef: executableListRef });
    
    useEffect(() => {
        if (!game || !currentUser) return;
        
        try {
            const customHeroesJSON = localStorage.getItem(`macro-custom-heroes-${currentUser.id}`);
            const customHeroes = customHeroesJSON ? JSON.parse(customHeroesJSON) : {};
            const customHero = customHeroes[game.id];
            
            let urls = [...(game.heroUrls || [])];
            
            if (customHero) {
                urls = urls.filter(url => url !== customHero);
                urls.unshift(customHero);
                setIsCustomHeroPinned(true);
            } else {
                setIsCustomHeroPinned(false);
            }
            setEffectiveHeroUrls(urls);
        } catch(e) {
            console.error("Failed to parse custom heroes", e);
            setEffectiveHeroUrls(game.heroUrls || []);
            setIsCustomHeroPinned(false);
        }

    }, [game, currentUser]);

    useEffect(() => {
        if (game) {
            const newImage = effectiveHeroUrls?.[currentHeroIndex] || game.posterUrl;
            setBackgroundImage(newImage || null);
        }
        return () => setBackgroundImage(null);
    }, [game, currentHeroIndex, effectiveHeroUrls, setBackgroundImage]);

    useEffect(() => {
        if (!game || !effectiveHeroUrls || effectiveHeroUrls.length <= 1 || isCustomHeroPinned) {
            return;
        }
        
        const timer = setInterval(() => {
            setCurrentHeroIndex(prevIndex => (prevIndex + 1) % effectiveHeroUrls.length);
        }, 8000);
        
        return () => clearInterval(timer);
    }, [game, effectiveHeroUrls, isCustomHeroPinned]);


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
        const isDialogOpen = isHeroSelectorOpen || isPosterSelectorOpen;
        setHints([
            { key: 'A', action: 'Launch' },
            { key: 'B', action: 'Back' },
            { key: 'Y', action: 'Change Banner' },
            { key: 'X', action: 'Change Poster' },
        ]);
        
        if (!isDialogOpen) {
            const firstButton = executableListRef.current?.querySelector('button') as HTMLElement;
            firstButton?.focus();
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (isDialogOpen) return;
            const key = e.key.toLowerCase();
            if (key === 'y') setIsHeroSelectorOpen(true);
            if (key === 'x') setIsPosterSelectorOpen(true);
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            setHints([]);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [setHints, isHeroSelectorOpen, isPosterSelectorOpen]);

    const handleLaunch = async (executable: string) => {
        if (!game) return;
        playSound('launch');

        let socialUserId: number | undefined;
        try {
            const socialUserJson = localStorage.getItem('macro-social-user');
            if (socialUserJson) {
                socialUserId = JSON.parse(socialUserJson).id;
            }
        } catch (e) {
            console.error("Could not parse social user from localStorage", e);
        }

        localStorage.setItem('macro-active-session', JSON.stringify({ 
            gameId: game.id,
            gameName: game.name,
            startTime: Date.now() 
        }));
        await launchGame(game.path, executable, game.name, socialUserId);
        router.push(`/dashboard/games/${game.id}/launching?exe=${encodeURIComponent(executable)}`);
    }

    const triggerLibraryRefresh = () => {
        window.dispatchEvent(new Event('settings-updated'));
    };

    const handleSaveCustomHero = (url: string) => {
        if (!game || !currentUser) return;
        const customHeroes = JSON.parse(localStorage.getItem(`macro-custom-heroes-${currentUser.id}`) || '{}');
        customHeroes[game.id] = url;
        localStorage.setItem(`macro-custom-heroes-${currentUser.id}`, JSON.stringify(customHeroes));
        setIsCustomHeroPinned(true);
        setEffectiveHeroUrls(prev => [url, ...prev.filter(u => u !== url)]);
        setCurrentHeroIndex(0);
        setIsHeroSelectorOpen(false);
        playSound('select');
    };

    const handleRevertCustomHero = () => {
        if (!game || !currentUser) return;
        const customHeroes = JSON.parse(localStorage.getItem(`macro-custom-heroes-${currentUser.id}`) || '{}');
        delete customHeroes[game.id];
        localStorage.setItem(`macro-custom-heroes-${currentUser.id}`, JSON.stringify(customHeroes));
        setIsCustomHeroPinned(false);
        setEffectiveHeroUrls(game.heroUrls || []); // Revert to original list
        setIsHeroSelectorOpen(false);
        playSound('select');
    };

    const handleSaveCustomPoster = (url: string) => {
        if (!game || !currentUser) return;
        const customPosters = JSON.parse(localStorage.getItem(`macro-custom-posters-${currentUser.id}`) || '{}');
        customPosters[game.id] = url;
        localStorage.setItem(`macro-custom-posters-${currentUser.id}`, JSON.stringify(customPosters));
        updateGamePoster(game.id, url); // Update context
        setIsPosterSelectorOpen(false);
        playSound('select');
        triggerLibraryRefresh();
    };

    const handleRevertCustomPoster = () => {
        if (!game || !currentUser) return;
        const customPosters = JSON.parse(localStorage.getItem(`macro-custom-posters-${currentUser.id}`) || '{}');
        delete customPosters[game.id];
        localStorage.setItem(`macro-custom-posters-${currentUser.id}`, JSON.stringify(customPosters));
        setIsPosterSelectorOpen(false);
        playSound('select');
        triggerLibraryRefresh(); // Let the context re-fetch the original poster
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
                <Button variant="outline" size="icon" onClick={() => setIsHeroSelectorOpen(true)} aria-label="Change Banner (Y)">
                    <Camera className="h-4 w-4" />
                </Button>
                 <Button variant="outline" size="icon" onClick={() => setIsPosterSelectorOpen(true)} aria-label="Change Poster (X)">
                    <GalleryThumbnails className="h-4 w-4" />
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
                   {game.steamgridGameId && <HeroImageSelector gameId={game.steamgridGameId} onSave={handleSaveCustomHero} onRevert={handleRevertCustomHero} onClose={() => setIsHeroSelectorOpen(false)} />}
                </DialogContent>
            </Dialog>

            <Dialog open={isPosterSelectorOpen} onOpenChange={setIsPosterSelectorOpen}>
                <DialogContent className="max-w-4xl">
                   {game.steamgridGameId && <PosterImageSelector gameId={game.steamgridGameId} onSave={handleSaveCustomPoster} onRevert={handleRevertCustomPoster} onClose={() => setIsPosterSelectorOpen(false)} />}
                </DialogContent>
            </Dialog>
        </div>
    );
}
