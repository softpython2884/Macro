
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, HardDrive, AlertTriangle } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { useHints } from '@/context/HintContext';
import { useBackNavigation } from '@/hooks/use-back-navigation';
import { useSound } from '@/context/SoundContext';
import { launchWebApp } from '@/lib/webapp-launcher';
import { getSkidrowGameDetails } from '@/lib/skidrow-scraper';
import type { SkidrowSearchResult } from '@/lib/skidrow-scraper';
import { getHeroes, searchGame } from '@/lib/steamgrid';
import { Skeleton } from '@/components/ui/skeleton';
import { useBackground } from '@/context/BackgroundContext';
import { useToast } from '@/hooks/use-toast';
import { downloadAndInstallGame } from '@/lib/installer';
import { useGridNavigation } from '@/hooks/use-grid-navigation';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { checkAndAwardAchievements } from '@/lib/social-service';
import { useGames } from '@/context/GameContext';

export default function StoreDetailsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { setBackgroundImage } = useBackground();
    const { setHints } = useHints();
    const { playSound } = useSound();
    const { toast } = useToast();
    
    const url = searchParams.get('url');
    const title = searchParams.get('title') || '';
    const posterUrl = searchParams.get('posterUrl');

    const [details, setDetails] = useState<Omit<SkidrowGameDetails, 'title'> | null>(null);
    const [heroUrl, setHeroUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInstalling, setIsInstalling] = useState(false);
    const { currentUser } = useUser();
    const { games } = useGames();

    const linksRef = useRef<HTMLDivElement>(null);
    const scrollViewportRef = useRef<HTMLDivElement>(null);

    useBackNavigation('/dashboard/store');
    useGridNavigation({ gridRef: linksRef, disabledKeys: ['ArrowUp', 'ArrowDown'] });

    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            const viewport = scrollViewportRef.current;
            if (!viewport || !['+', '-', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;

            const activeElTag = document.activeElement?.tagName.toLowerCase();
            if (activeElTag === 'input' || activeElTag === 'textarea') return;

            e.preventDefault();
            e.stopPropagation();
            
            let scrollAmount = 0;
            const scrollSpeed = 150;
            
            if (e.key === '+' || e.key === 'ArrowDown') {
                scrollAmount = scrollSpeed;
            } else if (e.key === '-' || e.key === 'ArrowUp') {
                scrollAmount = -scrollSpeed;
            }

            if (scrollAmount !== 0) {
                viewport.scrollBy({ top: scrollAmount, behavior: 'smooth' });
            }
        };

        document.addEventListener('keydown', handleKeys, true);
        return () => document.removeEventListener('keydown', handleKeys, true);
    }, []);

    useEffect(() => {
        setHints([
            { key: 'A', action: isInstalling ? 'Installing...' : 'Download' },
            { key: 'B', action: 'Back' },
            { key: '↕/+-', action: 'Scroll' },
            { key: '↔', action: 'Navigate Links' },
        ]);
        return () => setHints([]);
    }, [setHints, isInstalling]);
    
    useEffect(() => {
        if (!isLoading) {
            setTimeout(() => {
                const backButton = document.getElementById('back-to-store-button');
                const directInstallButton = document.getElementById('direct-install-button');
                const firstLink = linksRef.current?.querySelector('button');
                
                if (directInstallButton) {
                    directInstallButton.focus();
                } else if (firstLink) {
                    firstLink.focus();
                } else if (backButton) {
                    (backButton as HTMLElement).focus();
                }
            }, 300); // Increased timeout for safety
        }
    }, [isLoading]);


    useEffect(() => {
        if (!url || !title || !currentUser) {
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);

            const [gameDetails, steamgridGame] = await Promise.all([
                getSkidrowGameDetails(url),
                searchGame(title, currentUser.permissions.nsfwEnabled ? 'any' : 'false', currentUser.permissions.prioritizeNsfw)
            ]);

            setDetails(gameDetails);

            let finalHeroUrl: string | null = null;
            if (steamgridGame) {
                const heroes = await getHeroes(steamgridGame.id, currentUser.permissions.nsfwEnabled ? 'any' : 'false', currentUser.permissions.prioritizeNsfw);
                if (heroes.length > 0) {
                    finalHeroUrl = heroes[0].url;
                    setHeroUrl(finalHeroUrl);
                    setBackgroundImage(finalHeroUrl);
                }
            }

            if (url && title) {
                try {
                    const socialUserJson = localStorage.getItem('macro-social-user');
                    const historyString = localStorage.getItem('macro-store-history');
                    let history: SkidrowSearchResult[] = historyString ? JSON.parse(historyString) : [];
                    
                    const newItem: SkidrowSearchResult = {
                        title,
                        url,
                        posterUrl: posterUrl,
                    };

                    const isNewItem = !history.some(item => item.url === url);
                    if (isNewItem) {
                        history.unshift(newItem);
                        history = history.slice(0, 50); // Store up to 50 for achievement tracking
                        localStorage.setItem('macro-store-history', JSON.stringify(history));

                        if (socialUserJson) {
                            const socialUserId = JSON.parse(socialUserJson).id;
                            const newAchievements = await checkAndAwardAchievements(socialUserId, {
                                storeHistoryCount: history.length,
                                gameCount: games.length, // Pass current game count
                            });

                             if (newAchievements.length > 0) {
                                toast({
                                    title: "Achievement Unlocked!",
                                    description: `You've earned: ${newAchievements.join(', ')}`,
                                    action: <Award className="h-6 w-6 text-yellow-400" />,
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.error("Failed to save to store history or check achievements:", e);
                }
            }

            setIsLoading(false);
        };
        fetchData();
        
        return () => setBackgroundImage(null);

    }, [url, title, currentUser, setBackgroundImage, posterUrl, games, toast]);

    const handleDirectInstall = async (apiUrl: string, gameTitle: string) => {
        if (isInstalling) return;

        setIsInstalling(true);
        playSound('select');
        toast({ title: 'Installation started...', description: 'This might take a while depending on game size and your connection speed.' });

        const settingsString = localStorage.getItem('macro-settings');
        const settings = settingsString ? JSON.parse(settingsString) : {};
        const localGamesPath = settings.localGamesPath;

        if (!localGamesPath) {
            toast({
                title: 'Installation Path Missing',
                description: 'Please set your "Local Games Extraction Path" in the Settings page first.',
                variant: 'destructive',
            });
            setIsInstalling(false);
            return;
        }

        const result = await downloadAndInstallGame(apiUrl, gameTitle, localGamesPath);
        
        toast({
            title: result.success ? 'Installation Complete' : 'Installation Failed',
            description: result.message,
            variant: result.success ? 'default' : 'destructive',
        });

        if (result.success) {
            window.dispatchEvent(new Event('settings-updated'));
            setTimeout(() => router.push('/dashboard/games'), 2000);
        }

        setIsInstalling(false);
    };

    const handleManualDownload = (downloadUrl: string) => {
        playSound('launch');
        const settings = JSON.parse(localStorage.getItem('macro-settings') || '{}');
        const browser = settings.browser || 'chrome.exe';
        launchWebApp(downloadUrl, browser);
        toast({ title: "Opening Download Page", description: "Your browser is opening the download link." });
    };

    if (isLoading) {
        return (
            <div className="space-y-8 animate-fade-in">
                <Skeleton className="w-full h-72 md:h-[450px] rounded-lg" />
                <div className="px-8 md:px-12">
                    <Skeleton className="h-12 w-2/3 mb-4" />
                    <Skeleton className="h-6 w-1/4 mb-8" />
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {Array.from({length: 8}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                </div>
            </div>
        );
    }
    
    if (!details || !title) {
        return <p className="text-center text-lg mt-20">Could not load game details. Please try again.</p>;
    }

    const hasDirectInstall = !!details.pixeldrainApi;

    return (
         <div className="flex flex-col h-full animate-fade-in">
             <div className="absolute top-0 left-0 p-4 z-20">
                <Button id="back-to-store-button" variant="outline" size="sm" onClick={() => router.push('/dashboard/store')} disabled={isInstalling}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to App Store
                </Button>
            </div>
            
            <ScrollArea className="w-full flex-1" viewportRef={scrollViewportRef}>
                <div className="flex flex-col text-white pb-8 pr-4">
                    <div className="relative w-full h-72 md:h-[450px] rounded-lg overflow-hidden bg-card">
                        {heroUrl ? (
                            <Image
                                src={heroUrl}
                                alt={`${title} Hero Image`}
                                fill
                                className="object-cover object-center"
                                priority
                            />
                        ) : ( posterUrl && <Image src={posterUrl} alt={`${title} Poster`} fill className="object-contain" />)
                        }
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                    </div>
                    
                    <div className="relative z-10 -mt-24 md:-mt-36 px-8 md:px-12 pb-8 space-y-8">
                        <div>
                            <h1 className="text-5xl md:text-6xl font-bold text-glow">{title}</h1>
                            <div className="flex items-center gap-6 text-muted-foreground mt-4">
                                <div className="flex items-center gap-2">
                                    <HardDrive className="h-5 w-5" />
                                    <span>{details.size}</span>
                                </div>
                            </div>
                        </div>

                        {hasDirectInstall && (
                            <div className="flex flex-col items-start gap-4 p-6 rounded-lg bg-primary/10 border border-primary/20">
                                <h2 className="text-2xl font-bold text-primary text-glow">Direct Install Available</h2>
                                <p className="text-primary-foreground/80 max-w-2xl">
                                    This game can be downloaded and installed automatically by Macro. Click the button below to start the process.
                                </p>
                                <Button id="direct-install-button" size="lg" onClick={() => handleDirectInstall(details.pixeldrainApi!, title)} disabled={isInstalling}>
                                    <Download className="mr-2 h-5 w-5" />
                                    {isInstalling ? 'Installing... Please Wait' : 'Install Game Directly'}
                                </Button>
                            </div>
                        )}
                        
                        <p className="max-w-4xl text-foreground/80 leading-relaxed">
                            {details.description}
                        </p>
                        
                        <div>
                            <h3 className="text-2xl font-bold mb-4">{hasDirectInstall ? "Manual Download Links" : "Download Links"}</h3>
                            {!hasDirectInstall && (
                                <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-900/20 border border-yellow-700/50 mb-4 text-yellow-300">
                                <AlertTriangle className="h-5 w-5 mt-1 flex-shrink-0" />
                                    <div className="text-sm">
                                        <p className="font-bold">Manual Installation Required</p>
                                        <p className="text-yellow-300/80">
                                        Download one of the files below and place the .zip archive in the "Downloads" directory configured in your settings. Macro will handle the rest on the next scan.
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div ref={linksRef} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {Object.keys(details.allLinks).length > 0 ? Object.entries(details.allLinks).map(([host, link]) => (
                                    <Button key={host} variant="outline" onClick={() => handleManualDownload(link)} disabled={isInstalling}>
                                        <Download className="mr-2 h-4 w-4" />
                                        {host}
                                    </Button>
                                )) : <p className="text-muted-foreground col-span-full">No download links found.</p>}
                            </div>
                        </div>
                    </div>
                </div>
                <ScrollBar />
            </ScrollArea>
        </div>
    );
}
