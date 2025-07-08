
'use client';

import React, { createContext, useContext, ReactNode, useCallback, useEffect, useState, useRef } from 'react';
import * as Tone from 'tone';

type SoundType = 'navigate' | 'select' | 'back' | 'launch' | 'error';

type SoundContextType = {
  playSound: (sound: SoundType) => void;
  isInitialized: boolean;
};

const SoundContext = createContext<SoundContextType | undefined>(undefined);

const soundMap: Record<SoundType, string> = {
  navigate: '/sounds/move.wav',
  select: '/sounds/open.wav',
  back: '/sounds/close.wav',
  launch: '/sounds/open.wav',
  error: '/sounds/error.wav',
};

export const SoundProvider = ({ children }: { children: ReactNode }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const playersRef = useRef<Tone.Players | null>(null);

  // This effect handles the one-time user gesture requirement for audio.
  useEffect(() => {
    const startAudio = async () => {
      await Tone.start();
      console.log('Audio context started.');
      setIsInitialized(true);
    };

    // Tone.start() must be called in response to a user gesture.
    // We only need to do this once.
    if (typeof window !== 'undefined' && Tone.context.state !== 'running') {
      document.body.addEventListener('mousedown', startAudio, { once: true });
      document.body.addEventListener('keydown', startAudio, { once: true });
    } else {
      setIsInitialized(true); // Already running, so we're initialized.
    }

    return () => {
      document.body.removeEventListener('mousedown', startAudio);
      document.body.removeEventListener('keydown', startAudio);
    };
  }, []); // Empty dependency array ensures this runs only once on mount.

  // This effect loads the sound files once the audio context is initialized.
  useEffect(() => {
    if (isInitialized && !playersRef.current) {
      playersRef.current = new Tone.Players(soundMap, () => {
        console.log('UI sounds loaded.');
      }).toDestination();
      playersRef.current.volume.value = -6;
    }

    // On cleanup, dispose of the players to free up memory.
    return () => {
      if (playersRef.current) {
        playersRef.current.dispose();
        playersRef.current = null;
      }
    };
  }, [isInitialized]);

  const playSound = useCallback((sound: SoundType) => {
    const players = playersRef.current;
    if (players && players.loaded && players.has(sound)) {
      try {
        const player = players.player(sound);
        if (player.state === 'started') {
          player.stop().start();
        } else {
          player.start();
        }
      } catch (e) {
        if (e instanceof Error && e.message.includes('buffer')) {
          console.error(`Sound file for '${sound}' (${soundMap[sound]}) might be missing or failed to load.`);
        } else {
            console.error(`Could not play sound: ${sound}`, e);
        }
      }
    }
  }, []);

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
