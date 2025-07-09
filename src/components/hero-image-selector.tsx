
'use client';

import { useState, useEffect, useRef } from 'react';
import { getHeroes } from '@/lib/steamgrid';
import type { SteamGridDbImage } from '@/lib/steamgrid';
import Image from 'next/image';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { useUser } from '@/context/UserContext';
import { Skeleton } from './ui/skeleton';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { useGridNavigation } from '@/hooks/use-grid-navigation';

interface HeroImageSelectorProps {
  gameId: number;
  onSave: (url: string) => void;
  onRevert: () => void;
  onClose: () => void;
}

export function HeroImageSelector({ gameId, onSave, onRevert, onClose }: HeroImageSelectorProps) {
  const [heroes, setHeroes] = useState<SteamGridDbImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customUrl, setCustomUrl] = useState('');
  const { currentUser } = useUser();
  const gridRef = useRef<HTMLDivElement>(null);
  useGridNavigation({ gridRef });

  useEffect(() => {
    async function fetchHeroOptions() {
      if (!currentUser) return;
      setIsLoading(true);
      const { nsfwEnabled, prioritizeNsfw } = currentUser.permissions;
      const nsfwApiSetting = nsfwEnabled ? 'any' : 'false';
      const fetchedHeroes = await getHeroes(gameId, nsfwApiSetting, prioritizeNsfw);
      setHeroes(fetchedHeroes);
      setIsLoading(false);
    }
    if (gameId) {
      fetchHeroOptions();
    }
  }, [gameId, currentUser]);
  
  useEffect(() => {
    if (!isLoading) {
        gridRef.current?.querySelector('button')?.focus();
    }
  }, [isLoading]);

  const handleSaveCustomUrl = () => {
    if (customUrl) {
      onSave(customUrl);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Change Game Banner</DialogTitle>
        <DialogDescription>
          Select a new banner from the list below or provide a custom image URL.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <ScrollArea className="h-72 pr-4 -mr-4">
            <div ref={gridRef}>
              {isLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-full aspect-video rounded-md" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {heroes.map((hero) => (
                    <button key={hero.id} className="block rounded-md overflow-hidden border-2 border-transparent focus:border-primary focus:outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2" onClick={() => onSave(hero.url)}>
                      <Image src={hero.url} alt={`Hero image ${hero.id}`} width={300} height={150} className="object-cover w-full aspect-video" />
                    </button>
                  ))}
                </div>
              )}
            </div>
        </ScrollArea>
        <div className="space-y-2">
          <p className="text-sm font-medium">Or use a custom URL</p>
          <div className="flex items-center gap-2">
            <Input
              placeholder="https://example.com/image.png"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
            />
            <Button onClick={handleSaveCustomUrl}>Save URL</Button>
          </div>
        </div>
      </div>
      <DialogFooter className="justify-between">
        <Button variant="outline" onClick={onRevert}>Re-enable Rotation</Button>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
      </DialogFooter>
    </>
  );
}
