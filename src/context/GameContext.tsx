
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import type { Game } from '@/lib/data';
import { searchGame, getGrids, getHeroes, getLogos } from '@/lib/steamgrid';
import { scanForGames } from '@/lib/game-scanner';
import { useUser } from './UserContext';

const SETTINGS_KEY = 'macro-settings';

type GameContextType = {
  games: Game[];
  isLoading: boolean;
  fetchGameMetadata: () => Promise<void>;
  allScannedGames: Game[];
  updateGamePoster: (gameId: string, posterUrl: string) => void;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [allScannedGames, setAllScannedGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useUser();
  const hasFetched = useRef(false);

  const fetchGameMetadata = useCallback(async () => {
    if (hasFetched.current || !currentUser) {
        return;
    }

    setIsLoading(true);
    hasFetched.current = true;
    
    const { nsfwEnabled, prioritizeNsfw } = currentUser.permissions;
    const nsfwApiSetting = nsfwEnabled ? 'any' : 'false';

    let initialGames: Omit<Game, 'posterUrl' | 'heroUrls' | 'logoUrl' | 'steamgridGameId'>[] = [];
    try {
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            const gameDirs = settings.games?.map((g: { value: string }) => g.value).filter(Boolean) ?? [];
            
            if (settings.localGamesPath) {
                gameDirs.push(settings.localGamesPath);
            }

            if (gameDirs.length > 0) {
                initialGames = await scanForGames(gameDirs);
                setAllScannedGames(initialGames as Game[]);
            }
        }
    } catch (error) {
        console.error("Failed to scan for games:", error);
        setIsLoading(false);
        return;
    }
    
    if (initialGames.length === 0) {
        setGames([]);
        setIsLoading(false);
        return;
    }

    const customPostersJSON = localStorage.getItem('macro-custom-posters');
    const customPosters = customPostersJSON ? JSON.parse(customPostersJSON) : {};

    const enrichedGames = await Promise.all(
      initialGames.map(async (game) => {
        try {
            const foundGame = await searchGame(game.name, nsfwApiSetting, nsfwEnabled && prioritizeNsfw);
            if (!foundGame) return game as Game;

            const [grids, heroes, logos] = await Promise.all([
                getGrids(foundGame.id, ['600x900'], nsfwApiSetting, nsfwEnabled && prioritizeNsfw),
                getHeroes(foundGame.id, nsfwApiSetting, nsfwEnabled && prioritizeNsfw),
                getLogos(foundGame.id, nsfwApiSetting, nsfwEnabled && prioritizeNsfw)
            ]);
            
            const customPosterUrl = customPosters[game.id];
            const posterUrl = customPosterUrl || (grids.length > 0 ? grids[0].url : undefined);
            const heroUrls = heroes.length > 0 ? heroes.map(h => h.url).slice(0, 9) : undefined;
            const logoUrl = logos.length > 0 ? logos[0].url : undefined;
            
            return {
              ...game,
              steamgridGameId: foundGame.id,
              posterUrl,
              heroUrls,
              logoUrl,
            };
        } catch (error) {
            console.error(`Failed to enrich metadata for game "${game.name}":`, error);
            return game as Game;
        }
      })
    );

    setGames(enrichedGames);
    setIsLoading(false);
  }, [currentUser]);

  const updateGamePoster = (gameId: string, posterUrl: string) => {
    setGames(prevGames => 
        prevGames.map(g => g.id === gameId ? { ...g, posterUrl } : g)
    );
  };

  useEffect(() => {
    const handleSettingsUpdate = () => {
      hasFetched.current = false;
      setGames([]);
      setAllScannedGames([]);
      setTimeout(() => fetchGameMetadata(), 0);
    };
    window.addEventListener('settings-updated', handleSettingsUpdate);
    return () => {
      window.removeEventListener('settings-updated', handleSettingsUpdate);
    };
  }, [fetchGameMetadata]);

  const value = { games, isLoading, fetchGameMetadata, allScannedGames, updateGamePoster };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGames = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGames must be used within a GameProvider');
  }
  return context;
};
