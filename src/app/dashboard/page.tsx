
'use client';

import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import React, { useEffect, useState } from 'react';
import { useHints } from '@/context/HintContext';
import { useSound } from '@/context/SoundContext';
import { useUser } from "@/context/UserContext";
import { useGames } from "@/context/GameContext";
import { ALL_APPS, AppInfo } from "@/lib/data";
import { Game } from "@/lib/data";
import { recommendGames } from "@/ai/flows/recommend-games-flow";
import { searchGame, getGrids } from "@/lib/steamgrid";
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
    type: 'game' | 'app' | 'recommendation';
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

    if (item.type === 'recommendation') {
      return (
        <a href={item.href} target="_blank" rel="noopener noreferrer" className="block group w-full h-full rounded-lg focus:outline-none focus:animate-levitate" onClick={() => playSound('launch')}>
          {cardContent}
        </a>
      );
    }

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
    const [favorites, setFavorites] = useState<ContentItem[]>([]);
    const [recommendations, setRecommendations] = useState<ContentItem[]>([]);
    
    const [loadingRecent, setLoadingRecent] = useState(true);
    const [loadingFavorites, setLoadingFavorites] = useState(true);
    const [loadingRecs, setLoadingRecs] = useState(true);
  
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
            if (!games.length) return;
            setLoadingRecent(true);
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

                    const heroImages = await getGrids(gameData.id, ['920x430', '460x215', '1920x620']);
                    
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
    }, [games]);

    // Fetch Favorites
    useEffect(() => {
        const fetchFavorites = async () => {
            if (!currentUser || !games) return;
            setLoadingFavorites(true);
            try {
                const favoritesKey = `macro-favorites-${currentUser.id}`;
                const favoritesJSON = localStorage.getItem(favoritesKey);
                if (!favoritesJSON) {
                    setLoadingFavorites(false);
                    return;
                }

                const favs = JSON.parse(favoritesJSON);
                const favGameIds: string[] = favs.games || [];
                const favAppIds: string[] = favs.apps || [];
                
                const favGames = await Promise.all(favGameIds.map(async (id) => {
                    const gameData = games.find(g => g.id === id);
                    if (!gameData) return null;
                    const heroImages = await getGrids(gameData.id, ['920x430', '460x215', '1920x620']);
                    return { id, name: gameData.name, image: heroImages[0]?.url || gameData.posterUrl, href: `/dashboard/games/${id}`, type: 'game' } as ContentItem;
                }));

                const favApps = await Promise.all(favAppIds.map(async (id) => {
                    const appData = ALL_APPS.find(a => a.id === id);
                    if (!appData) return null;
                    let image = appData.posterUrl || null;
                    if (!image) {
                       const foundGame = await searchGame(appData.searchName || appData.name);
                       if (foundGame) {
                         const heroes = await getGrids(foundGame.id, ['920x430', '460x215']);
                         image = heroes[0]?.url || null;
                       }
                    }
                    return { id, name: appData.name, image, href: appData.href || '#', type: 'app' } as ContentItem;
                }));
                
                setFavorites([...favGames.filter(Boolean), ...favApps.filter(Boolean)] as ContentItem[]);

            } catch (e) {
                console.error("Error fetching favorites:", e);
            }
            setLoadingFavorites(false);
        }
        fetchFavorites();
    }, [currentUser, games]);
    
    // Fetch AI Recommendations
    useEffect(() => {
        const fetchRecommendations = async () => {
            if (!games.length) return;
            setLoadingRecs(true);
            try {
                const playtimeJSON = localStorage.getItem('macro-playtime');
                if (!playtimeJSON) {
                    setLoadingRecs(false);
                    return;
                };
                const allPlaytimes = JSON.parse(playtimeJSON);

                const playedGameNames = Object.keys(allPlaytimes).map(gameId => {
                    return games.find(g => g.id === gameId)?.name;
                }).filter(Boolean) as string[];

                if (playedGameNames.length === 0) {
                  setLoadingRecs(false);
                  return;
                }

                const result = await recommendGames({ playedGames: playedGameNames.slice(0, 10) });
                
                const enrichedRecs = await Promise.all(result.recommendations.map(async (recName) => {
                    const foundGame = await searchGame(recName);
                    if (!foundGame) return null;

                    const heroImages = await getGrids(foundGame.id, ['920x430', '460x215', '1920x620']);

                    return {
                        id: `rec-${foundGame.id}`,
                        name: recName,
                        image: heroImages[0]?.url || null,
                        href: `https://www.skidrowreloaded.com/?s=${encodeURIComponent(recName)}`,
                        type: 'recommendation',
                    } as ContentItem;
                }));

                setRecommendations(enrichedRecs.filter(Boolean) as ContentItem[]);
            } catch (e) {
                console.error("Error fetching recommendations:", e);
            }
            setLoadingRecs(false);
        };
        fetchRecommendations();
    }, [games]);

    return (
        <div className="flex flex-col flex-1 space-y-8 animate-fade-in w-full">
            <ContentCarousel title="Recently Played" items={recentlyPlayed} isLoading={loadingRecent} />
            <ContentCarousel title="My Favorites" items={favorites} isLoading={loadingFavorites} />
            <ContentCarousel title="Recommended For You" items={recommendations} isLoading={loadingRecs} />
        </div>
    );
}
