
'use client';

import { useGames } from "@/context/GameContext";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Rocket } from "lucide-react";
import { useHints } from "@/context/HintContext";

export default function GameLaunchingPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { games } = useGames();
    const { setHints } = useHints();
    
    const gameId = typeof params.gameId === 'string' ? params.gameId : '';
    const executable = searchParams.get('exe');
    const game = React.useMemo(() => games.find(g => g.id === gameId), [games, gameId]);

    useEffect(() => {
        setHints([
            { key: 'B', action: 'Close Game' },
        ]);
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === 'Backspace') {
                router.back();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            setHints([]);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [setHints, router]);

    if (!game) {
        return null;
    }

    return (
        <div className="relative h-full min-h-[calc(100vh-10rem)] flex flex-col justify-center items-center p-8 text-white space-y-8 animate-fade-in">
            {game.logoUrl ? (
                <div className="relative w-1/2 max-w-lg h-48">
                    <Image
                        src={game.logoUrl}
                        alt={`${game.name} Logo`}
                        fill
                        className="object-contain"
                    />
                </div>
            ) : (
                <h1 className="text-6xl font-bold text-glow">{game.name}</h1>
            )}
            
            <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                <Rocket className="w-12 h-12 animate-pulse text-primary mb-4" />
                <p className="text-2xl text-foreground">Launching {executable}...</p>
                <p className="mt-2 text-sm">The game should now be running. Press B to return to Macro.</p>
            </div>

            <Button variant="outline" onClick={() => router.back()} className="bg-black/30 hover:bg-black/50 border-white/20">
                <ArrowLeft className="mr-2 h-4 w-4" /> Return to Macro
            </Button>
        </div>
    );
}
