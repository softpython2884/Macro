
'use client';

import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import React, { useEffect, useState } from 'react';
import { useHints } from '@/context/HintContext';
import { useSound } from '@/context/SoundContext';
import { useUser } from "@/context/UserContext";
import { useGames } from "@/context/GameContext";
import { getHeroes } from "@/lib/steamgrid";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import Image from "next/image";
import { Globe } from "lucide-react";

// Simplified type for content cards
type ContentItem = {
    id: string;
    name: string;
    image: string | null;
    href: string;
    type: 'game';
};

const ContentCard = ({ item }: { item: ContentItem }) => {
    const { playSound } = useSound();
    
    const cardContent = (
      <Card className="bg-black/20 backdrop-blur-lg border border-white/10 group-hover:border-primary focus-within:border-primary h-full w-full aspect-video overflow-hidden relative">
          {item.image ? (
            <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full bg-card flex flex-col items-center justify-center p-4">
              <Globe className="w-10 h-10 text-muted-foreground mb-2" />
              <p className="text-center text-foreground">{item.name}</p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 p-4">
              <h3 className="text-xl font-bold text-white text-glow">{item.name}</h3>
          </div>
      </Card>
    );

    return (
        <Link href={item.href} className="block group w-full h-full rounded-lg focus:outline-none focus:animate-levitate" onClick={() => playSound('select')}>
            {cardContent}
        </Link>
    );
};

const ContentCarousel = ({ title, items, isLoading }: { title: string, items: ContentItem[], isLoading?: boolean }) => {
    if (isLoading) {
        return (
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-glow mb-4">{title}</h2>
                <div className="flex space-x-4">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-[28rem] h-[15.75rem] rounded-lg" />)}
                </div>
            </div>
        );
    }
    if (!items || items.length === 0) return null;
    
    return (
        <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-glow">{title}</h2>
            <Carousel opts={{ align: "start", slidesToScroll: 'auto' }} className="w-full">
                <CarouselContent className="-ml-4">
                    {items.map((item) => (
                        <CarouselItem key={item.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                            <ContentCard item={item} />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
            </Carousel>
        </div>
    );
}

export default function DashboardPage() {
    const { setHints } = useHints();
    const { currentUser } = useUser();
    const { games } = useGames();

    const [recentlyPlayed, setRecentlyPlayed] = useState<ContentItem[]>([]);
    const [loadingRecent, setLoadingRecent] = useState(true);
  
    useEffect(() => {
        setHints([
            { key: '↕↔', action: 'Navigate' },
            { key: 'A', action: 'Select' },
            { key: 'Q', action: 'Prev Tab' },
            { key: 'E', action: 'Next Tab' },
        ]);
        return () => setHints([]);
    }, [setHints]);

    // Fetch Recently Played
    useEffect(() => {
        const fetchRecentlyPlayed = async () => {
            if (!games.length || !currentUser) return;
            setLoadingRecent(true);
            const { nsfwEnabled, prioritizeNsfw } = currentUser.permissions;
            const nsfwApiSetting = nsfwEnabled ? 'any' : 'false';

            try {
                const playtimeJSON = localStorage.getItem('macro-playtime');
                if (!playtimeJSON) {
                    setLoadingRecent(false);
                    return;
                };

                const allPlaytimes = JSON.parse(playtimeJSON);
                const playedGames = Object.entries(allPlaytimes)
                    .map(([gameId, data]: [string, any]) => ({ gameId, lastPlayed: data.lastPlayed, totalSeconds: data.totalSeconds }))
                    .sort((a, b) => b.lastPlayed - a.lastPlayed)
                    .slice(0, 10);
                
                const enrichedGames = await Promise.all(playedGames.map(async (playedGame) => {
                    const gameData = games.find(g => g.id === playedGame.gameId);
                    if (!gameData) return null;

                    const heroImages = await getHeroes(gameData.id, nsfwApiSetting, nsfwEnabled && prioritizeNsfw);
                    
                    return {
                        id: gameData.id,
                        name: gameData.name,
                        image: heroImages[0]?.url || gameData.posterUrl || null,
                        href: `/dashboard/games/${gameData.id}`,
                        type: 'game',
                    } as ContentItem;
                }));

                setRecentlyPlayed(enrichedGames.filter(Boolean) as ContentItem[]);
            } catch (e) {
                console.error("Error fetching recently played:", e);
            }
            setLoadingRecent(false);
        };
        fetchRecentlyPlayed();
    }, [games, currentUser]);

    return (
        <div className="flex flex-col flex-1 space-y-8 animate-fade-in w-full">
            <ContentCarousel title="Recently Played" items={recentlyPlayed} isLoading={loadingRecent} />
        </div>
    );
}
