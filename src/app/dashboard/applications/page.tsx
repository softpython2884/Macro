
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
import { searchGame, getGrids, type SteamGridDbImage } from '@/lib/steamgrid';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { putComputerToSleep } from '@/lib/system-commands';
import { useBackground } from '@/context/BackgroundContext';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { checkAndAwardAchievements } from '@/lib/social-service';
import { Award } from 'lucide-react';

// --- AppPosterSelector Component ---
const AppPosterSelector = ({ app, onSave, onRevert, onClose }: { app: AppInfo, onSave: (url: string) => void, onRevert: () => void, onClose: () => void }) => {
    const [images, setImages] = useState<SteamGridDbImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [customUrl, setCustomUrl] = useState('');
    const { currentUser } = useUser();
    const gridRef = useRef<HTMLDivElement>(null);
    useGridNavigation({ gridRef });

    useEffect(() => {
        async function fetchImageOptions() {
            if (!currentUser || !app) return;
            setIsLoading(true);
            const { nsfwEnabled, prioritizeNsfw } = currentUser.permissions;
            const nsfwApiSetting = nsfwEnabled ? 'any' : 'false';
            
            const searchName = app.searchName || app.name;
            const foundGame = await searchGame(searchName, nsfwApiSetting, prioritizeNsfw);
            if (!foundGame) {
                setIsLoading(false);
                return;
            }

            const fetchedImages = await getGrids(foundGame.id, ['600x900'], nsfwApiSetting, prioritizeNsfw);
            setImages(fetchedImages);
            setIsLoading(false);
        }
        fetchImageOptions();
    }, [app, currentUser]);

    useEffect(() => {
        if (!isLoading) gridRef.current?.querySelector('button')?.focus();
    }, [isLoading]);

    const handleSaveCustomUrl = () => { if (customUrl) onSave(customUrl); };

    return (
        <>
            <DialogHeader>
                <DialogTitle>Change Poster for {app.name}</DialogTitle>
                <DialogDescription>Select a new poster or provide a custom image URL.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <ScrollArea className="h-96 pr-4 -mr-4">
                    <div ref={gridRef} className="grid grid-cols-3 gap-4">
                        {isLoading
                            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="w-full aspect-[3/4] rounded-md" />)
                            : images.length > 0 ? images.map((img) => (
                                <button key={img.id} className="block rounded-md overflow-hidden border-2 border-transparent focus:border-primary focus:outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2" onClick={() => onSave(img.url)}>
                                    <Image src={img.thumb} alt={`Poster ${img.id}`} width={200} height={300} className="object-cover w-full aspect-[3/4]" />
                                </button>
                            )) : <p className="col-span-full text-center text-muted-foreground py-12">No images found for this app.</p>}
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

// --- AppCard Component ---
const AppCard = ({ app, onFocus }: { app: AppInfo; onFocus: () => void }) => {
    const { playSound } = useSound();
    const router = useRouter();
    const { toast } = useToast();
    const { setBackgroundImage } = useBackground();
    const { id, name, icon: Icon, href, description, onClick, posterUrl } = app;

    const handleAppLaunchAchievement = async (appId: string) => {
        try {
            const socialUserJson = localStorage.getItem('macro-social-user');
            if (!socialUserJson) return;
            const socialUserId = JSON.parse(socialUserJson).id;

            const launchedAppsKey = `macro-launched-apps-${socialUserId}`;
            const launchedApps = new Set(JSON.parse(localStorage.getItem(launchedAppsKey) || '[]'));

            if (!launchedApps.has(appId)) {
                launchedApps.add(appId);
                localStorage.setItem(launchedAppsKey, JSON.stringify(Array.from(launchedApps)));
                const newAchievements = await checkAndAwardAchievements(socialUserId, { launchedAppCount: launchedApps.size });
                
                if (newAchievements.length > 0) {
                    toast({
                        title: "Achievement Unlocked!",
                        description: `You've earned: ${newAchievements.join(', ')}`,
                        action: <Award className="h-6 w-6 text-yellow-400" />,
                    });
                }
            }
        } catch (e) {
            console.error("Failed to check for app launch achievements:", e);
        }
    };

    const handleLaunch = async () => {
        handleAppLaunchAchievement(id);

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
                    toast({ title: "Moonlight Not Configured", description: "Please set the path to your Moonlight executable in the Settings page.", variant: "destructive" });
                }
            } catch (error) {
                console.error("Failed to launch Moonlight:", error);
                toast({ title: "Launch Error", description: "Could not launch Moonlight.", variant: "destructive" });
            }
            return;
        }
        
        if (id === 'sleep') {
            playSound('select');
            toast({ title: 'Putting computer to sleep...' });
            putComputerToSleep().then(result => {
                if (!result.success) {
                    toast({ title: 'Failed to sleep', description: result.error || 'Could not put the computer to sleep.', variant: 'destructive' });
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
                    const browser = settings.browser || 'chrome.exe';
                    await launchWebApp(href, browser);
                    router.push(`/dashboard/applications/${id}/launching`);
                } catch (error) { console.error("Failed to launch web app:", error); }
                return;
            }
            if (isSpecialProtocol) {
                playSound('launch');
                window.location.href = href;
                return;
            }
        }
        if (onClick) { playSound('select'); onClick(); }
    };
    
    const cardContent = (
      <Card className="bg-black/20 backdrop-blur-lg border border-white/10 group-hover:border-primary focus-within:border-primary focus-within:ring-2 focus-within:ring-primary transition-all duration-300 ease-in-out h-full w-full overflow-hidden">
        {posterUrl ? (
            <Image src={posterUrl} alt={name} fill className="object-cover group-hover:scale-105 group-focus-within:scale-105 transition-transform duration-300" />
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
        onFocus: () => {
            setBackgroundImage(posterUrl || null);
            onFocus();
        },
        onBlur: () => setBackgroundImage(null),
    };
    
    if (href && !href.startsWith('http') && !href.startsWith('steam') && !href.startsWith('spotify')) {
        return <Link href={href} onClick={() => playSound('select')} {...commonProps}>{cardContent}</Link>;
    }
    
    return <button onClick={handleLaunch} {...commonProps} type="button">{cardContent}</button>;
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
  const { playSound } = useSound();

  const [enrichedApps, setEnrichedApps] = useState<AppInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosterSelectorOpen, setIsPosterSelectorOpen] = useState(false);
  const [focusedApp, setFocusedApp] = useState<AppInfo | null>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  const permittedApps = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.name === 'Admin') return ALL_APPS;
    const requiredAppIds = ['settings', 'sleep'];
    const userAppIds = new Set([...currentUser.permissions.apps, ...requiredAppIds]);
    return ALL_APPS.filter(app => userAppIds.has(app.id));
  }, [currentUser]);

  useEffect(() => {
    const fetchAppMetadata = async () => {
        if (!currentUser) return;
        setIsLoading(true);

        const { nsfwEnabled, prioritizeNsfw } = currentUser.permissions;
        const nsfwApiSetting = nsfwEnabled ? 'any' : 'false';

        const customAppPostersJSON = localStorage.getItem(`macro-custom-app-posters-${currentUser.id}`);
        const customAppPosters = customAppPostersJSON ? JSON.parse(customAppPostersJSON) : {};

        const enriched = await Promise.all(
          permittedApps.map(async (app) => {
            let finalPosterUrl = customAppPosters[app.id] || app.posterUrl;

            if (!finalPosterUrl && !['settings', 'plugins', 'sleep'].includes(app.id)) {
                try {
                    const searchName = app.searchName || app.name;
                    const foundGame = await searchGame(searchName, nsfwApiSetting, nsfwEnabled && prioritizeNsfw);
                    if (foundGame) {
                        const grids = await getGrids(foundGame.id, ['600x900'], nsfwApiSetting, nsfwEnabled && prioritizeNsfw);
                        if (app.id === 'moonlight' && grids.length > 1) {
                            finalPosterUrl = grids[1].url;
                        } else if (grids.length > 0) {
                            finalPosterUrl = grids[0].url;
                        }
                    }
                } catch (error) {
                    console.error(`Failed to enrich metadata for app "${app.name}":`, error);
                }
            }
            return { ...app, posterUrl: finalPosterUrl };
          })
        );
        
        setEnrichedApps(enriched);
        setIsLoading(false);
    };

    if (currentUser) {
        fetchAppMetadata();
    }
  }, [currentUser, permittedApps]);

  const triggerLibraryRefresh = () => {
    window.dispatchEvent(new Event('settings-updated'));
  };

  const handleSaveCustomPoster = (url: string) => {
    if (!focusedApp || !currentUser) return;
    const customAppPosters = JSON.parse(localStorage.getItem(`macro-custom-app-posters-${currentUser.id}`) || '{}');
    customAppPosters[focusedApp.id] = url;
    localStorage.setItem(`macro-custom-app-posters-${currentUser.id}`, JSON.stringify(customAppPosters));
    setEnrichedApps(prev => prev.map(app => app.id === focusedApp.id ? { ...app, posterUrl: url } : app));
    setIsPosterSelectorOpen(false);
    playSound('select');
  };

  const handleRevertCustomPoster = () => {
      if (!focusedApp || !currentUser) return;
      const customAppPosters = JSON.parse(localStorage.getItem(`macro-custom-app-posters-${currentUser.id}`) || '{}');
      delete customAppPosters[focusedApp.id];
      localStorage.setItem(`macro-custom-app-posters-${currentUser.id}`, JSON.stringify(customAppPosters));
      setIsPosterSelectorOpen(false);
      playSound('select');
      triggerLibraryRefresh();
  };

  // Effect for hints and keydown listener
  useEffect(() => {
    setHints([
      { key: '↕↔', action: 'Navigate' },
      { key: 'A', action: 'Launch' },
      { key: 'Y', action: 'Change Poster' },
      { key: 'B', action: 'Back' },
      { key: 'Q', action: 'Prev Tab' },
      { key: 'E', action: 'Next Tab' },
    ]);
    
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key.toLowerCase() === 'y' && focusedApp && !isPosterSelectorOpen) {
            lastFocusedElementRef.current = document.activeElement as HTMLElement;
            setIsPosterSelectorOpen(true);
        }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      setHints([]);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [setHints, focusedApp, isPosterSelectorOpen]);

  // Effect for focus management
  useEffect(() => {
    if (isLoading) return; // Wait until loading is done

    if (isPosterSelectorOpen) {
      // Focus is managed by the dialog component, so we do nothing here
      return;
    }

    if (lastFocusedElementRef.current) {
      // If we have a stored element, focus it (this happens after closing the dialog)
      lastFocusedElementRef.current.focus();
      lastFocusedElementRef.current = null; // Clear the ref after use
    } else if (gridRef.current && !gridRef.current.contains(document.activeElement)) {
      // Otherwise, if focus is not inside our grid, set initial focus
      const firstElement = gridRef.current?.querySelector('button, a') as HTMLElement;
      firstElement?.focus();
    }
  }, [isLoading, isPosterSelectorOpen]);

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
              : enrichedApps.map((app) => <AppCard key={app.id} app={app} onFocus={() => setFocusedApp(app)} />)}
        </div>
      </div>

       <Dialog open={isPosterSelectorOpen} onOpenChange={setIsPosterSelectorOpen}>
          <DialogContent className="max-w-4xl">
              {focusedApp && <AppPosterSelector app={focusedApp} onSave={handleSaveCustomPoster} onRevert={handleRevertCustomPoster} onClose={() => setIsPosterSelectorOpen(false)} />}
          </DialogContent>
      </Dialog>
    </div>
  );
}
