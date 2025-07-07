
'use client';

import Link from 'next/link';
import { Card } from "@/components/ui/card";
import { useHints } from '@/context/HintContext';
import React, { useRef, useEffect } from 'react';
import { useGridNavigation } from '@/hooks/use-grid-navigation';
import { useBackNavigation } from '@/hooks/use-back-navigation';
import { useUser } from '@/context/UserContext';
import { ALL_APPS } from '@/lib/data';
import type { AppInfo } from '@/lib/data';
import { useSound } from '@/context/SoundContext';
import { launchWebApp } from '@/lib/webapp-launcher';

const AppCard = ({ name, icon: Icon, href, description, onClick }: AppInfo) => {
    const { playSound } = useSound();

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
    
    const handleLaunch = async () => {
        if (href) {
            const isHttp = href.startsWith('http');
            const isSpecialProtocol = href.startsWith('steam') || href.startsWith('spotify');

            if (isHttp) {
                playSound('launch');
                await launchWebApp(href);
                return;
            }

            // For special protocols, we need to use window.location, not Next's Link.
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
    
    // Internal Next.js links use the Link component for SPA transitions
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
    
    // Everything else (web apps, special protocols, custom functions) uses a button.
    return (
        <button onClick={handleLaunch} {...commonProps} type="button">
            {cardContent}
        </button>
    );
};


export default function ApplicationsPage() {
  const { setHints } = useHints();
  const gridRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useUser();
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

  const permittedApps = React.useMemo(() => {
    if (!currentUser) return [];

    if (currentUser.name === 'Admin') {
      return ALL_APPS;
    }
    
    // Ensure settings is always available for other users
    const requiredAppIds = ['settings'];
    const userAppIds = new Set([...currentUser.permissions.apps, ...requiredAppIds]);
    return ALL_APPS.filter(app => userAppIds.has(app.id));
  }, [currentUser]);

  if (!currentUser) {
    return null;
  }

  return (
    <div className="animate-fade-in space-y-12">
      <div>
        <h2 className="text-4xl font-bold tracking-tight text-glow mb-6">Applications &amp; Actions</h2>
        <div ref={gridRef} className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {permittedApps.map((app) => <AppCard key={app.id} {...app} />)}
        </div>
      </div>
    </div>
  );
}
