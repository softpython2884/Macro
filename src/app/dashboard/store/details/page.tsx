
'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Tv, HardDrive } from 'lucide-react';
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

export default function StoreDetailsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { setBackgroundImage } = useBackground();
    const { setHints } = useHints();
    const { playSound } = useSound();
    
    const url = searchParams.get('url');
    const title = searchParams.get('title');

    const [details, setDetails] = useState<Omit<SkidrowGameDetails, 'title'> | null>(null);
    const [heroUrl, setHeroUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { currentUser } = useUser();

    useBackNavigation('/dashboard/store');

    useEffect(() => {
        setHints([
            { key: 'A', action: 'Download' },
            { key: 'B', action: 'Back' },
        ]);
        return () => setHints([]);
    }, [setHints]);

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
                    setHeroUrl(heroes[0].url);
                    setBackgroundImage(heroes[0].url);
                }
            }

            setIsLoading(false);
        };
        fetchData();
        
        return () => setBackgroundImage(null);

    }, [url, title, currentUser, setBackgroundImage]);

    const handleDownload = (downloadUrl: string) => {
        playSound('launch');
        const settings = JSON.parse(localStorage.getItem('macro-settings') || '{}');
        const browser = settings.browser || 'chrome.exe';
        launchWebApp(downloadUrl, browser);
        toast({ title: "Opening Download Page", description: "Your browser should now be opening the download link." });
    };

    if (isLoading) {
        return (
            <div className="space-y-8">
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
        return <p>Could not load game details. Please try again.</p>;
    }

    return (
        <div className="flex flex-col text-white animate-fade-in">
             <div className="absolute top-4 left-4 m-4 z-20">
                <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/store')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Store
                </Button>
            </div>

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
            
            <div className="relative z-10 -mt-24 md:-mt-36 px-8 md:px-12 pb-8 space-y-6">
                <h1 className="text-5xl md:text-6xl font-bold text-glow">{title}</h1>
                
                <div className="flex items-center gap-6 text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5" />
                        <span>{details.size}</span>
                    </div>
                </div>

                <p className="max-w-4xl text-foreground/80 leading-relaxed">
                    {details.description}
                </p>

                <div>
                    <h3 className="text-2xl font-bold mb-4">Download Links</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {Object.entries(details.allLinks).map(([host, link]) => (
                            <Button key={host} variant="outline" onClick={() => handleDownload(link)}>
                                <Download className="mr-2 h-4 w-4" />
                                {host}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

