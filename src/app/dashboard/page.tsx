
'use client';

import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import React, { useEffect, useState } from 'react';
import { useHints } from '@/context/HintContext';
import { useSound } from '@/context/SoundContext';
import { useUser } from "@/context/UserContext";
import { useGames } from "@/context/GameContext";
import { getHeroes } from "@/lib/steamgrid";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import Image from "next/image";
import { Gamepad2, LayoutGrid, Settings, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Simplified type for content cards
type ContentItem = {
    id: string;
    name: string;
    image: string | null;
    href: string;
    type: 'game' | 'nav';
    Icon?: React.ElementType;
};

const ContentCard = ({ item }: { item: ContentItem }) => {
    const { playSound } = useSound();
    
    return (
        <Link href={item.href} className="block group w-full h-full rounded-lg focus:outline-none" onClick={() => playSound('select')}>
            <Card className="bg-black/20 backdrop-blur-lg border border-white/10 group-hover:border-primary group-focus-within:border-primary h-full w-full aspect-video overflow-hidden relative">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full bg-card flex flex-col items-center justify-center p-4">
                    {item.Icon && <item.Icon className="w-16 h-16 text-muted-foreground mb-4" />}
                    <p className="text-center text-3xl font-bold text-foreground">{item.name}</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6">
                    <h3 className="text-3xl font-bold text-white text-glow">{item.name}</h3>
                </div>
            </Card>
        </Link>
    );
};

const navItems: Omit<ContentItem, 'image'>[] = [
    { id: 'nav-games', name: 'My Library', href: '/dashboard/games', type: 'nav', Icon: Gamepad2 },
    { id: 'nav-apps', name: 'Applications', href: '/dashboard/applications', type: 'nav', Icon: LayoutGrid },
    { id: 'nav-profiles', name: 'Profiles', href: '/dashboard/profiles', type: 'nav', Icon: UserIcon },
    { id: 'nav-settings', name: 'Settings', href: '/dashboard/settings', type: 'nav', Icon: Settings },
];

export default function DashboardPage() {
    const { setHints, hints } = useHints();
    const { currentUser } = useUser();
    const { games } = useGames();
    const [api, setApi] = React.useState<CarouselApi>()
    const [current, setCurrent] = React.useState(0)
    const { playSound } = useSound();
    const router = useRouter();

    const [content, setContent] = useState<ContentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
  
    useEffect(() => {
        // Avoid re-setting hints if they are already correct, to prevent flicker
        if (hints.length === 0) {
            setHints([
                { key: '↔', action: 'Navigate' },
                { key: 'A', action: 'Select' },
                { key: 'Q', action: 'Prev Tab' },
                { key: 'E', action: 'Next Tab' },
            ]);
        }
    }, [setHints, hints]);

    useEffect(() => {
        if (!api) return;
        
        const onSelect = () => {
          playSound('navigate');
          setCurrent(api.selectedScrollSnap());
        };
    
        api.on("select", onSelect);
        return () => { api.off("select", onSelect) };
    }, [api, playSound]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const isDialogFocused = document.querySelector('[role="dialog"]');
                if (isDialogFocused) return;
                e.preventDefault();
                const currentItem = content[current];
                if (currentItem) {
                    playSound('select');
                    router.push(currentItem.href);
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => { document.removeEventListener('keydown', handleKeyDown); };
    }, [current, content, router, playSound]);


    // Fetch Recently Played and construct the final content array
    useEffect(() => {
        const fetchDashboardContent = async () => {
            if (!games.length || !currentUser) {
                // If no games, just show nav items
                const staticNavItems = navItems.map(item => ({...item, image: `https://placehold.co/1920x1080.png?text=${item.name.replace(' ', '+')}` }));
                setContent(staticNavItems);
                setIsLoading(false);
                return;
            };
            setIsLoading(true);
            const { nsfwEnabled, prioritizeNsfw } = currentUser.permissions;

            try {
                const playtimeJSON = localStorage.getItem('macro-playtime');
                let recentlyPlayed: ContentItem[] = [];

                if (playtimeJSON) {
                    const allPlaytimes = JSON.parse(playtimeJSON);
                    const playedGames = Object.entries(allPlaytimes)
                        .map(([gameId, data]: [string, any]) => ({ gameId, lastPlayed: data.lastPlayed, totalSeconds: data.totalSeconds }))
                        .sort((a, b) => b.lastPlayed - a.lastPlayed)
                        .slice(0, 5); // Limit to 5 recent games
                    
                    const enrichedGames = await Promise.all(playedGames.map(async (playedGame) => {
                        const gameData = games.find(g => g.id === playedGame.gameId);
                        if (!gameData) return null;

                        const heroImages = await getHeroes(gameData.id, nsfwEnabled ? 'any' : 'false', prioritizeNsfw);
                        
                        return {
                            id: gameData.id,
                            name: gameData.name,
                            image: heroImages[0]?.url || gameData.posterUrl || null,
                            href: `/dashboard/games/${gameData.id}`,
                            type: 'game',
                        } as ContentItem;
                    }));
                    recentlyPlayed = enrichedGames.filter(Boolean) as ContentItem[];
                }
                
                // Add placeholder images to nav items
                const staticNavItems = navItems.map(item => ({...item, image: null }));
                setContent([...recentlyPlayed, ...staticNavItems]);

            } catch (e) {
                console.error("Error constructing dashboard:", e);
                // Fallback to only nav items on error
                const staticNavItems = navItems.map(item => ({...item, image: null }));
                setContent(staticNavItems);
            }
            setIsLoading(false);
        };
        fetchDashboardContent();
    }, [games, currentUser]);
    
    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                 <div className="w-full max-w-6xl">
                    <Skeleton className="w-full aspect-video rounded-lg" />
                 </div>
            </div>
        )
    }

    if (content.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <p>No content to display.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-1 items-center justify-center animate-fade-in w-full">
            <Carousel 
                setApi={setApi}
                opts={{ align: "center", loop: content.length > 1 }} 
                className="w-full max-w-7xl focus:outline-none"
            >
              <CarouselContent className="-ml-8 py-12">
                {content.map((item, index) => (
                  <CarouselItem key={item.id} className="pl-8 md:basis-1/2 lg:basis-2/3">
                      <div className={cn(
                        "transition-all duration-300 ease-in-out transform",
                        index === current ? 'scale-100 opacity-100' : 'scale-75 opacity-50'
                      )}>
                        <ContentCard item={item} />
                      </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
        </div>
    );
}

