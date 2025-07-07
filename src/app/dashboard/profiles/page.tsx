
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from 'next/navigation';
import React, { useRef, useEffect } from 'react';
import { useHints } from '@/context/HintContext';
import { useGridNavigation } from "@/hooks/use-grid-navigation";
import { useBackNavigation } from "@/hooks/use-back-navigation";

const users = [
  { id: "user1", name: "Galaxy Wanderer", email: "wanderer@space.com", hint: "astronaut helmet" },
  { id: "user2", name: "Starlight Seeker", email: "seeker@stars.com", hint: "nebula space" },
  { id: "user3", name: "Cosmic Voyager", email: "voyager@cosmos.com", hint: "spaceship cockpit" },
  { id: "user4", name: "Guest", email: "guest@local.host", hint: "planet earth" },
];

export default function ProfilesPage() {
  const router = useRouter();
  const { setHints } = useHints();
  const gridRef = useRef<HTMLDivElement>(null);
  useGridNavigation({ gridRef });
  useBackNavigation('/dashboard');

  useEffect(() => {
    setHints([
      { key: '↕↔', action: 'Navigate' },
      { key: 'A', action: 'Select' },
      { key: 'B', action: 'Back' },
    ]);
     // Focus the first element on mount for immediate navigation
    const firstElement = gridRef.current?.querySelector('button, a') as HTMLElement;
    firstElement?.focus();
    
    return () => setHints([]);
  }, [setHints]);

  const handleSelectProfile = (userName: string) => {
    // This would handle the logic for switching user profiles
    console.log(`Switched to profile: ${userName}`);
    // Navigate back to dashboard after switching
    router.push('/dashboard');
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-glow">Manage Profiles</h2>
          <p className="text-muted-foreground mt-2">Select a profile to use.</p>
        </div>
      </div>

      <div ref={gridRef} className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {users.map(user => (
          <button 
            key={user.id} 
            className="block group w-full h-full rounded-lg focus:outline-none text-left"
            onClick={() => handleSelectProfile(user.name)}
          >
            <Card className="bg-black/20 backdrop-blur-lg border border-white/10 group-hover:bg-primary/30 group-focus-within:bg-primary/30 group-hover:backdrop-blur-xl group-focus-within:backdrop-blur-xl group-hover:drop-shadow-glow group-focus-within:drop-shadow-glow hover:border-primary focus-within:border-primary transition-all duration-300 ease-in-out transform group-hover:scale-105 group-focus-within:scale-105 h-full">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint={user.hint} alt={user.name} />
                    <AvatarFallback className="text-2xl">{user.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{user.name}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-center text-sm text-muted-foreground opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                  Switch to Profile
                </p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
