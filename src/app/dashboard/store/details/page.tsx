
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
import type { SkidrowGameDetails } from '@/lib/skidrow-scraper';
import { getHeroes, searchGame } from '@/lib/steamgrid';
import { Skeleton } from '@/components/ui/skeleton';
import { useBackground } from '@/context/BackgroundContext';
import { useToast } from '@/hooks/use-toast';
import { downloadAndInstallGame } from '@/lib/installer';
import { useGridNavigation } from '@/hooks/use-grid-navigation';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function StoreDetailsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { setBackgroundImage } = useBackground();
    const { setHints } = useHints();
    const { playSound } = useSound();
    const { toast } = useToast();
    
    const url = searchParams.get('url');
    const title = searchParams.get('title') || '';

    const [details, setDetails] = useState<Omit<SkidrowGameDetails, 'title'> | null>(null);
    const [heroUrl, setHeroUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInstalling, setIsInstalling] = useState(false);
    const { currentUser } = useUser();

    const linksRef = useRef<HTMLDivElement>(null);
    const scrollViewportRef = useRef<HTMLDivElement>(null);

    useBackNavigation('/dashboard/store');
    useGridNavigation({ gridRef: linksRef });

    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            const viewport = scrollViewportRef.current;
            if (!viewport) return;

            let scrollAmount = 0;
            const scrollSpeed = 150;

            if (e.key === 'ArrowDown' || e.key === '+') {
                scrollAmount = scrollSpeed;
            } else if (e.key === 'ArrowUp' || e.key === '-') {
                scrollAmount = -scrollSpeed;
            }

            if (scrollAmount !== 0) {
                e.preventDefault();
                e.stopPropagation();
                viewport.scrollBy({ top: scrollAmount, behavior: 'smooth' });
            }
        };

        document.addEventListener('keydown', handleKeys, true);
        return () => document.removeEventListener('keydown', handleKeys, true);
    }, []);

    useEffect(() => {
        setHints([
            { key: 'A', action: isInstalling ? 'Installing...' : 'Install/Download' },
            { key: 'B', action: 'Back' },
            { key: '↑↓ or +/-', action: 'Scroll' },
            { key: '↔', action: 'Navigate Links' },
        ]);
        return () => setHints([]);
    }, [setHints, isInstalling]);

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

            if (steamgridGame) {
                const heroes = await getHeroes(steamgridGame.id, currentUser.permissions.nsfwEnabled ? 'any' : 'false', currentUser.permissions.prioritizeNsfw);
                if (heroes.length > 0) {
                    const hero = heroes[0].url;
                    setHeroUrl(hero);
                    setBackgroundImage(hero);
                }
            }
            setIsLoading(false);
        };
        fetchData();
        
        return () => setBackgroundImage(null);

    }, [url, title, currentUser, setBackgroundImage]);

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
                <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/store')} disabled={isInstalling}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Store
                </Button>
            </div>
            
            <ScrollArea className="h-full w-full" viewportRef={scrollViewportRef}>
                <div className="flex flex-col text-white pb-8 pr-4">
                    <div className="relative w-full h-72 md:h-[450px] rounded-lg overflow-hidden bg-card">
                        {heroUrl && (
                            <Image
                                src={heroUrl}
                                alt={`${title} Hero Image`}
                                fill
                                className="object-cover object-center"
                                priority
                            />
                        )}
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
                                <Button size="lg" onClick={() => handleDirectInstall(details.pixeldrainApi!, title)} disabled={isInstalling}>
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
                                {Object.entries(details.allLinks).map(([host, link]) => (
                                    <Button key={host} variant="outline" onClick={() => handleManualDownload(link)} disabled={isInstalling}>
                                        <Download className="mr-2 h-4 w-4" />
                                        {host}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <ScrollBar />
            </ScrollArea>
        </div>
    );
}
