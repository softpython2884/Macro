
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
// The user provided: intro.wav, move.wav, open.wav, close.wav, error.wav
const soundMap: Record<SoundType, string> = {
  navigate: '/sounds/move.wav',
  select: '/sounds/open.wav',
  back: '/sounds/close.wav',
  launch: '/sounds/open.wav', // Using 'open' for launch as well
  error: '/sounds/error.wav',
};

export const SoundProvider = ({ children }: { children: ReactNode }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [areSoundsLoaded, setAreSoundsLoaded] = useState(false);
  
  const players = useMemo(() => {
    if (typeof window === 'undefined') return null;
    
    const playerInstances = new Tone.Players(soundMap, () => {
        setAreSoundsLoaded(true);
        console.log('UI sounds loaded.');
    }).toDestination();

    playerInstances.volume.value = -6; // Lower volume slightly for UI sounds
    return playerInstances;
  }, []);

  useEffect(() => {
     if (typeof window === 'undefined' || isInitialized) return;

    const initializeAudio = async () => {
        if (Tone.context.state !== 'running') {
            await Tone.start();
            console.log('Audio context started');
        }
        setIsInitialized(true);
        document.removeEventListener('keydown', initializeAudio);
        document.removeEventListener('mousedown', initializeAudio);
    };

    document.addEventListener('keydown', initializeAudio, { once: true });
    document.addEventListener('mousedown', initializeAudio, { once: true });
    
    return () => {
        document.removeEventListener('keydown', initializeAudio);
        document.removeEventListener('mousedown', initializeAudio);
    }
  }, [isInitialized]);

  const playSound = useCallback((sound: SoundType) => {
    if (players && players.has(sound) && isInitialized && areSoundsLoaded) {
      try {
        if (players.player(sound).state === 'started') {
            players.player(sound).stop();
        }
        players.player(sound).start();
      } catch (e) {
        if (e instanceof Error && e.message.includes('buffer')) {
             console.error(`Sound file for '${sound}' (${soundMap[sound]}) might be missing or failed to load.`);
        } else {
            console.error(`Could not play sound: ${sound}`, e);
        }
      }
    }
  }, [players, isInitialized, areSoundsLoaded]);
  
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
