
'use client';

import { Card } from "@/components/ui/card";
import { Gamepad2 } from 'lucide-react';
import React, { useRef, useEffect } from 'react';
import { useHints } from '@/context/HintContext';
import { useGridNavigation } from '@/hooks/use-grid-navigation';
import { useBackNavigation } from '@/hooks/use-back-navigation';

const games = [
  { name: 'Cyberpunk 2077', hint: 'dystopian city' },
  { name: 'The Witcher 3', hint: 'fantasy landscape' },
  { name: 'Red Dead Redemption 2', hint: 'western landscape' },
  { name: 'Elden Ring', hint: 'dark fantasy' },
  { name: 'Baldur\'s Gate 3', hint: 'fantasy rpg' },
  { name: 'Starfield', hint: 'space exploration' },
  { name: 'Forza Horizon 5', hint: 'race car' },
  { name: 'Helldivers 2', hint: 'sci-fi soldiers' },
];

const GameCard = ({ name, hint }: { name: string, hint: string }) => (
    <button className="block group w-full h-full rounded-lg focus:outline-none text-left">
      <Card className="bg-black/20 backdrop-blur-lg border border-white/10 group-hover:backdrop-blur-xl group-focus-within:backdrop-blur-xl group-hover:drop-shadow-glow group-focus-within:drop-shadow-glow transition-all duration-300 ease-in-out h-full w-full flex flex-col justify-between items-start p-4 aspect-[3/4] transform group-hover:scale-105 group-focus-within:scale-105">
        <div 
            className="w-full h-4/5 bg-cover bg-center rounded-md flex items-center justify-center mb-4" 
            style={{backgroundImage: `url(https://placehold.co/300x400.png)`}}
            data-ai-hint={hint}
        >
          <Gamepad2 className="h-16 w-16 text-primary/50 drop-shadow-[0_0_8px_hsl(var(--primary))] transition-all duration-300 group-hover:scale-110 group-focus-within:scale-110 group-hover:text-primary" />
        </div>
        <h3 className="text-lg font-bold text-card-foreground truncate w-full">{name}</h3>
      </Card>
    </button>
);

export default function GamesPage() {
  const { setHints } = useHints();
  const gridRef = useRef<HTMLDivElement>(null);
  useGridNavigation({ gridRef });
  useBackNavigation('/dashboard');
  
  useEffect(() => {
    setHints([
      { key: '↕↔', action: 'Navigate' },
      { key: 'A', action: 'Launch' },
      { key: 'B', action: 'Back' },
    ]);
     // Focus the first element on mount for immediate navigation
    const firstElement = gridRef.current?.querySelector('button, a') as HTMLElement;
    firstElement?.focus();

    return () => setHints([]);
  }, [setHints]);

  return (
    <div className="animate-fade-in space-y-12">
      <div>
        <h2 className="text-4xl font-bold tracking-tight text-glow mb-6">My Game Library</h2>
        <div ref={gridRef} className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {games.map(game => <GameCard key={game.name} {...game} />)}
        </div>
      </div>
    </div>
  );
}
