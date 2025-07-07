'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { VideoBackground } from '@/components/video-background';
import { HintProvider, useHints } from '@/context/HintContext';
import { ControllerHints } from '@/components/controller-hints';
import { useGridNavigation } from '@/hooks/use-grid-navigation';
import { useUser } from '@/context/UserContext';
import type { User } from '@/lib/data';
import { PinInputPad } from '@/components/pin-input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const LoginView = () => {
  const [introState, setIntroState] = useState('playing'); // playing, fading, finished
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPinPad, setShowPinPad] = useState(false);
  const [pinError, setPinError] = useState(false);
  
  const { setHints } = useHints();
  const gridRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { users, login } = useUser();
  useGridNavigation({ gridRef });

  useEffect(() => {
    const fadeTimer = setTimeout(() => setIntroState('fading'), 4500);
    const endTimer = setTimeout(() => setIntroState('finished'), 5000);
    return () => { clearTimeout(fadeTimer); clearTimeout(endTimer); };
  }, []);

  useEffect(() => {
    if (introState === 'finished' && !showPinPad) {
      setHints([{ key: '↕↔', action: 'Navigate' }, { key: 'A', action: 'Select' }]);
      const firstElement = gridRef.current?.querySelector('button') as HTMLElement;
      firstElement?.focus();
    } else {
      setHints([]);
    }
  }, [introState, showPinPad, setHints]);

  const handleProfileSelect = (user: User) => {
    setSelectedUser(user);
    if (user.pin) {
      setShowPinPad(true);
    } else {
      if(login(user)) {
        setIsTransitioning(true);
        setTimeout(() => {
            router.push('/dashboard');
        }, 500);
      }
    }
  };

  const handlePinComplete = (pin: string) => {
    if (selectedUser) {
        const success = login(selectedUser, pin);
        if (success) {
            setShowPinPad(false);
            setPinError(false);
            setIsTransitioning(true);
             setTimeout(() => {
                router.push('/dashboard');
            }, 500);
        } else {
            setPinError(true);
        }
    }
  };

  const handleCancelPin = () => {
    setShowPinPad(false);
    setSelectedUser(null);
    setPinError(false);
    // Refocus grid
    const firstElement = gridRef.current?.querySelector('button') as HTMLElement;
    firstElement?.focus();
  };

  if (introState !== 'finished') {
    return (
      <div className={cn('fixed inset-0 z-50 bg-black transition-opacity duration-500 ease-in-out', introState === 'fading' ? 'opacity-0' : 'opacity-100')}>
        <video autoPlay muted playsInline className="w-full h-full object-cover" src="/intro.mp4">
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  return (
    <>
      <VideoBackground />
      <main className={cn(
        "flex flex-col items-center justify-center min-h-screen bg-transparent p-4 transition-all duration-500",
        isTransitioning ? 'animate-zoom-out-fade' : 'animate-fade-in'
      )}>
        <div className="text-center">
          <h2 className="text-7xl font-bold tracking-tight text-glow mb-4 animate-fade-in-slow">
            Who's Watching?
          </h2>
          <p className="text-muted-foreground mb-16 text-lg animate-fade-in-slow delay-200">
            Select a profile to launch
          </p>
        </div>
        <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {users.map((user, index) => (
            <button
              key={user.id}
              onClick={() => handleProfileSelect(user)}
              className="block group rounded-lg focus:outline-none animate-fade-in-slow text-left"
              style={{ animationDelay: `${200 + index * 100}ms` }}
            >
              <div className="flex flex-col items-center gap-4 transition-all duration-300 group-hover:scale-110 group-focus:scale-110">
                <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-transparent group-hover:border-primary group-focus:border-primary transition-all duration-300 rounded-lg shadow-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-4xl rounded-lg">
                    {user.name.substring(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold text-foreground transition-colors group-hover:text-primary group-focus:text-primary">
                  {user.name}
                </h3>
              </div>
            </button>
          ))}
        </div>
      </main>
      <Dialog open={showPinPad} onOpenChange={(isOpen) => { if (!isOpen) handleCancelPin(); }}>
        <DialogContent className="bg-card/90 backdrop-blur-lg max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Enter PIN for {selectedUser?.name}</DialogTitle>
              <DialogDescription>
                This profile is protected. Please enter the 4-digit PIN.
              </DialogDescription>
            </DialogHeader>
            <PinInputPad onPinComplete={handlePinComplete} onCancel={handleCancelPin} showError={pinError} />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function LoginPage() {
    return (
        <HintProvider>
            <LoginView />
            <ControllerHints />
        </HintProvider>
    )
}
