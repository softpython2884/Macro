
'use client';

import Link from 'next/link';
import { Card } from "@/components/ui/card";
import { Film, Youtube, Twitch, Globe, Settings, Music, Power, Moon } from 'lucide-react';
import { SiAmazonalexa, SiSteam } from '@icons-pack/react-simple-icons';
import { useHints } from '@/context/HintContext';
import React, { useRef, useEffect } from 'react';
import { useGridNavigation } from '@/hooks/use-grid-navigation';
import { useBackNavigation } from '@/hooks/use-back-navigation';

const allItems = [
  { name: 'Xalaflix', icon: Film, href: 'https://xalaflix.io', description: 'Movies & TV shows' },
  { name: 'Netflix', icon: Film, href: 'https://netflix.com', description: 'Stream movies & shows' },
  { name: 'YouTube', icon: Youtube, href: 'https://youtube.com', description: 'Watch & share videos' },
  { name: 'Twitch', icon: Twitch, href: 'https://twitch.tv', description: 'Live streaming for gamers' },
  { name: 'Moonlight', icon: Moon, href: 'https://moonlight-stream.org/', description: 'Stream games from your PC' },
  { name: 'Brave', icon: Globe, href: 'https://brave.com', description: 'Secure & private browser' },
  { name: 'Alexa', icon: SiAmazonalexa, href: 'https://alexa.amazon.com', description: 'Manage your assistant' },
  { name: 'Steam', icon: SiSteam, href: 'steam://open/main', description: 'Access your game library' },
  { name: 'Spotify', icon: Music, href: 'spotify:', description: 'Open your music' },
  { name: 'Settings', icon: Settings, href: '/dashboard/settings', description: 'Configure your system' },
  { name: 'Shutdown', icon: Power, onClick: () => console.log('Shutdown initiated'), description: 'Shutdown the PC' },
];

type AppCardProps = {
  name: string;
  icon: React.ElementType;
  description: string;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
}

const AppCard = ({ name, icon: Icon, href, description, onClick }: AppCardProps) => {
    const cardContent = (
      <Card className="bg-black/20 backdrop-blur-lg border border-white/10 group-hover:bg-primary/30 group-focus-within:bg-primary/30 group-hover:backdrop-blur-xl group-focus-within:backdrop-blur-xl group-hover:drop-shadow-glow group-focus-within:drop-shadow-glow transition-all duration-300 ease-in-out h-full w-full flex flex-col justify-center items-center p-6 aspect-video transform group-hover:scale-105 group-focus-within:scale-105">
        <Icon className="h-16 w-16 text-primary drop-shadow-[0_0_8px_hsl(var(--primary))] transition-all duration-300 group-hover:scale-110 group-focus-within:scale-110" />
        <h3 className="mt-4 text-xl font-bold text-card-foreground">{name}</h3>
        <p className="mt-1 text-sm text-muted-foreground text-center">
          {description}
        </p>
      </Card>
    );

    const commonProps = {
        className:"block group w-full h-full rounded-lg focus:outline-none"
    };

    if (href) {
        const isExternal = href.startsWith('http') || href.startsWith('steam') || href.startsWith('spotify');
        return (
            <Link 
                href={href} 
                onClick={onClick}
                target={isExternal ? '_blank' : '_self'} 
                rel="noopener noreferrer" 
                {...commonProps}
            >
              {cardContent}
            </Link>
        )
    }

    return (
        <button onClick={onClick} {...commonProps} type="button">
            {cardContent}
        </button>
    )
  };


export default function ApplicationsPage() {
  const { setHints } = useHints();
  const gridRef = useRef<HTMLDivElement>(null);
  useGridNavigation({ gridRef });
  useBackNavigation('/dashboard');

  useEffect(() => {
    setHints([
      { key: '↕↔', action: 'Navigate' },
      { key: 'A', action: 'Launch' },
      { key: 'B', action: 'Back' },
      { key: 'Q', action: 'Prev Tab' },
      { key: 'E', action: 'Next Tab' },
    ]);
     // Focus the first element on mount for immediate navigation
    const firstElement = gridRef.current?.querySelector('button, a') as HTMLElement;
    firstElement?.focus();

    return () => setHints([]);
  }, [setHints]);

  return (
    <div className="animate-fade-in space-y-12">
      <div>
        <h2 className="text-4xl font-bold tracking-tight text-glow mb-6">Applications &amp; Actions</h2>
        <div ref={gridRef} className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {allItems.map((app, index) => <AppCard key={index} {...app} />)}
        </div>
      </div>
    </div>
  );
}
