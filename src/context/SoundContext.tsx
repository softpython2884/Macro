
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useCallback, useEffect, useState } from 'react';
import * as Tone from 'tone';

type SoundType = 'navigate' | 'select' | 'back' | 'launch' | 'error';

type SoundContextType = {
  playSound: (sound: SoundType) => void;
  isInitialized: boolean;
};

const SoundContext = createContext<SoundContextType | undefined>(undefined);

// Mapping of sound types to their audio file paths.
// You will need to add these files to your `public/sounds` directory.
const soundMap: Record<SoundType, string> = {
  navigate: '/sounds/navigate.wav',
  select: '/sounds/select.wav',
  back: '/sounds/back.wav',
  launch: '/sounds/launch.wav',
  error: '/sounds/error.wav',
};

export const SoundProvider = ({ children }: { children: ReactNode }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  const players = useMemo(() => {
    if (typeof window === 'undefined') return null; // Don't run on server
    
    // Check if Tone.js context is already running and initialize if not
    const initializeAudio = async () => {
        if (Tone.context.state !== 'running') {
            await Tone.start();
            console.log('Audio context started');
        }
        setIsInitialized(true);
        document.removeEventListener('keydown', initializeAudio);
        document.removeEventListener('mousedown', initializeAudio);
    };

    if (!isInitialized) {
        document.addEventListener('keydown', initializeAudio, { once: true });
        document.addEventListener('mousedown', initializeAudio, { once: true });
    }
    
    const playerInstances = new Tone.Players(soundMap).toDestination();
    playerInstances.volume.value = -6; // Lower volume slightly for UI sounds
    return playerInstances;
  }, [isInitialized]);

  const playSound = useCallback((sound: SoundType) => {
    if (players && players.has(sound) && isInitialized) {
      try {
        if (players.player(sound).state === 'started') {
            players.player(sound).stop();
        }
        players.player(sound).start();
      } catch (e) {
        console.error(`Could not play sound: ${sound}`, e);
      }
    }
  }, [players, isInitialized]);
  
  const value = { playSound, isInitialized };

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};
