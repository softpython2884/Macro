
'use client';

import Link from 'next/link';
import { Card } from "@/components/ui/card";
import { useHints } from '@/context/HintContext';
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useGridNavigation } from '@/hooks/use-grid-navigation';
import { useBackNavigation } from '@/hooks/use-back-navigation';
import { useUser } from '@/context/UserContext';
import { ALL_APPS } from '@/lib/data';
import type { AppInfo } from '@/lib/data';
import { useSound } from '@/context/SoundContext';
import { launchWebApp } from '@/lib/webapp-launcher';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { launchExecutable } from '@/lib/launch-executable';
import { searchGame, getGrids } from '@/lib/steamgrid';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { putComputerToSleep } from '@/lib/system-commands';
import { useBackground } from '@/context/BackgroundContext';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

// New AppCard component, similar to GameCard
const AppCard = ({ app }: { app: AppInfo }) => {
    const { playSound } = useSound();
    const router = useRouter();
    const { toast } = useToast();
    const { setBackgroundImage } = useBackground();
    const { currentUser } = useUser();
    const { id, name, icon: Icon, href, description, onClick, posterUrl } = app;
    
    const favoritesKey = currentUser ? `macro-favorites-${currentUser.id}` : null;
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        if (!favoritesKey) return;
        try {
            const favoritesJSON = localStorage.getItem(favoritesKey);
            if (favoritesJSON) {
                const favorites = JSON.parse(favoritesJSON);
                setIsFavorite(favorites.apps?.includes(id));
            }
        } catch (e) {
            console.error("Failed to read app favorites", e);
        }
    }, [id, favoritesKey]);

    const toggleFavorite = () => {
        if (!favoritesKey) return;
        const newFavStatus = !isFavorite;
        setIsFavorite(newFavStatus);
        try {
            const favoritesJSON = localStorage.getItem(favoritesKey) || '{}';
            const favorites = JSON.parse(favoritesJSON);
            const appFavorites = new Set(favorites.apps || []);

            if (newFavStatus) {
                appFavorites.add(id);
            } else {
                appFavorites.delete(id);
            }
            
            const newFavorites = {
                ...favorites,
                apps: Array.from(appFavorites),
            };
            localStorage.setItem(favoritesKey, JSON.stringify(newFavorites));
            playSound(newFavStatus ? 'select' : 'back');
        } catch (e) {
            console.error("Failed to update app favorites", e);
        }
    };


    const handleLaunch = async () => {
        // Special case for Moonlight
        if (id === 'moonlight') {
            playSound('launch');
            try {
                const settingsString = localStorage.getItem('macro-settings');
                const settings = settingsString ? JSON.parse(settingsString) : {};
                const moonlightPath = settings.moonlightPath;

                if (moonlightPath) {
                    await launchExecutable(moonlightPath);
                    router.push(`/dashboard/applications/${id}/launching`);
                } else {
                    toast({
                        title: "Moonlight Not Configured",
                        description: "Please set the path to your Moonlight executable in the Settings page.",
                        variant: "destructive",
                    });
                }
            } catch (error) {
                console.error("Failed to launch Moonlight:", error);
                toast({
                    title: "Launch Error",
                    description: "Could not launch Moonlight.",
                    variant: "destructive",
                });
            }
            return;
        }
        
        // Special case for Sleep
        if (id === 'sleep') {
            playSound('select');
            toast({ title: 'Putting computer to sleep...' });
            putComputerToSleep().then(result => {
                if (!result.success) {
                    toast({
                        title: 'Failed to sleep',
                        description: result.error || 'Could not put the computer to sleep.',
                        variant: 'destructive',
                    });
                }
            });
            return;
        }

        if (href) {
            const isHttp = href.startsWith('http');
            const isSpecialProtocol = href.startsWith('steam') || href.startsWith('spotify');

            if (isHttp) {
                playSound('launch');
                try {
                    const settings = JSON.parse(localStorage.getItem('macro-settings') || '{}');
                    const browser = settings.browser || 'chrome.exe'; // Default to chrome
                    await launchWebApp(href, browser);
                    router.push(`/dashboard/applications/${id}/launching`);
                } catch (error) {
                    console.error("Failed to launch web app:", error);
                }
                return;
            }
            
            if (isSpecialProtocol) {
                playSound('launch');
                window.location.href = href;
                return;
            }
        }

        if (onClick) {
            playSound('select');
            onClick();
        }
    };
    
    const cardContent = (
      <Card className="bg-black/20 backdrop-blur-lg border border-white/10 group-hover:border-primary focus-within:border-primary focus-within:ring-2 focus-within:ring-primary transition-all duration-300 ease-in-out h-full w-full overflow-hidden">
        <button 
            onClick={(e) => {
                e.preventDefault(); // Stop the card's main action
                e.stopPropagation(); // Stop bubbling
                toggleFavorite();
            }}
            className="absolute top-2 right-2 z-20 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/80 transition-opacity opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100"
            aria-label="Toggle Favorite"
        >
            <Star className={cn("h-4 w-4", isFavorite ? "fill-yellow-400 text-yellow-400" : "text-white/80")} />
        </button>
        {posterUrl ? (
            <Image 
              src={posterUrl} 
              alt={name} 
              fill 
              className="object-cover group-hover:scale-105 group-focus-within:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Icon className="h-16 w-16 text-primary/50 drop-shadow-[0_0_8px_hsl(var(--primary))] transition-all duration-300 group-hover:scale-110 group-focus-within:scale-110 group-hover:text-primary" />
                <h3 className="mt-4 text-xl font-bold text-card-foreground">{name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            </div>
          )}
      </Card>
    );

    const commonProps = {
        className:"block group w-full h-full rounded-lg focus:outline-none text-left aspect-[3/4]",
        onFocus: () => setBackgroundImage(posterUrl || null),
        onBlur: () => setBackgroundImage(null),
    };
    
    if (href && !href.startsWith('http') && !href.startsWith('steam') && !href.startsWith('spotify')) {
        return (
             <Link 
                href={href} 
                onClick={() => playSound('select')}
                {...commonProps}
            >
              {cardContent}
            </Link>
        );
    }
    
    return (
        <button onClick={handleLaunch} {...commonProps} type="button">
            {cardContent}
        </button>
    );
};

const AppCardSkeleton = () => (
    <div className="flex flex-col space-y-3 aspect-[3/4]">
      <Skeleton className="h-full w-full rounded-xl" />
    </div>
)

export default function ApplicationsPage() {
  const { setHints } = useHints();
  const gridRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useUser();
  useGridNavigation({ gridRef });
  useBackNavigation('/dashboard');

  const [enrichedApps, setEnrichedApps] = useState<AppInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const permittedApps = useMemo(() => {
    if (!currentUser) return [];

    if (currentUser.name === 'Admin') {
      return ALL_APPS;
    }
    
    // Ensure settings is always available for other users
    const requiredAppIds = ['settings', 'sleep'];
    const userAppIds = new Set([...currentUser.permissions.apps, ...requiredAppIds]);
    return ALL_APPS.filter(app => userAppIds.has(app.id));
  }, [currentUser]);

  useEffect(() => {
    const fetchAppMetadata = async () => {
        setIsLoading(true);

        const enriched = await Promise.all(
          permittedApps.map(async (app) => {
            if (['settings', 'plugins', 'sleep'].includes(app.id)) {
                return app; 
            }
            
            try {
                const searchName = app.searchName || app.name;
                const foundGame = await searchGame(searchName);
                if (!foundGame) return app;

                const grids = await getGrids(foundGame.id, ['600x900']);
                
                let posterUrl: string | undefined;

                if (app.id === 'moonlight') {
                    // User requested the second image for Moonlight
                    posterUrl = grids.length > 1 ? grids[1].url : (grids.length > 0 ? grids[0].url : undefined);
                } else {
                    posterUrl = grids.length > 0 ? grids[0].url : undefined;
                }

                return { ...app, posterUrl };
            } catch (error) {
                console.error(`Failed to enrich metadata for app "${app.name}":`, error);
                return app; // Return original app on error
            }
          })
        );
        
        setEnrichedApps(enriched);
        setIsLoading(false);
    };

    if (currentUser) {
        fetchAppMetadata();
    }
  }, [currentUser, permittedApps]);


  useEffect(() => {
    setHints([
      { key: '↕↔', action: 'Navigate' },
      { key: 'A', action: 'Launch' },
      { key: 'B', action: 'Back' },
      { key: 'Q', action: 'Prev Tab' },
      { key: 'E', action: 'Next Tab' },
    ]);
    
    if (!isLoading) {
      const firstElement = gridRef.current?.querySelector('button, a') as HTMLElement;
      firstElement?.focus();
    }

    return () => setHints([]);
  }, [setHints, isLoading]);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="animate-fade-in space-y-12">
      <div>
        <h2 className="text-4xl font-bold tracking-tight text-glow mb-6">Applications &amp; Actions</h2>
        <div ref={gridRef} className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {isLoading 
              ? Array.from({ length: permittedApps.length || 10 }).map((_, i) => <AppCardSkeleton key={i} />)
              : enrichedApps.map((app) => <AppCard key={app.id} app={app} />)}
        </div>
      </div>
    </div>
  );
}
