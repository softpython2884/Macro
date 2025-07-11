
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
  allScannedGames: Game[];
  refreshGames: () => void;
  updateGameMetadata: (game: Game) => Promise<Game>;
  updateGamePoster: (gameId: string, posterUrl: string) => void;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [allScannedGames, setAllScannedGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useUser();
  const hasFetched = useRef(false);

  const fetchInitialGames = useCallback(async () => {
    if (hasFetched.current) return;
    setIsLoading(true);
    hasFetched.current = true;

    let initialGames: Omit<Game, 'posterUrl' | 'heroUrls' | 'logoUrl' | 'steamgridGameId'>[] = [];
    try {
        const savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            const gameDirsRaw = settings.games?.map((g: { value: string }) => g.value).filter(Boolean) ?? [];
            const gameDirs = [...new Set(gameDirsRaw)];

            if (gameDirs.length > 0) {
                initialGames = await scanForGames(gameDirs);
            }
        }
    } catch (error) {
        console.error("Failed to scan for games:", error);
    }
    
    setGames(initialGames as Game[]);
    setAllScannedGames(initialGames as Game[]);
    setIsLoading(false);
  }, []);

  const updateGameMetadata = useCallback(async (game: Game): Promise<Game> => {
      if (!currentUser || game.steamgridGameId) return game; // Already enriched

      try {
          const { nsfwEnabled, prioritizeNsfw } = currentUser.permissions;
          const nsfwApiSetting = nsfwEnabled ? 'any' : 'false';

          const customPostersJSON = localStorage.getItem(`macro-custom-posters-${currentUser.id}`);
          const customPosters = customPostersJSON ? JSON.parse(customPostersJSON) : {};

          const foundGame = await searchGame(game.name, nsfwApiSetting, nsfwEnabled && prioritizeNsfw);
          if (!foundGame) return game;

          const [grids, heroes, logos] = await Promise.all([
              getGrids(foundGame.id, ['600x900'], nsfwApiSetting, nsfwEnabled && prioritizeNsfw),
              getHeroes(foundGame.id, nsfwApiSetting, nsfwEnabled && prioritizeNsfw),
              getLogos(foundGame.id, nsfwApiSetting, nsfwEnabled && prioritizeNsfw)
          ]);
          
          const customPosterUrl = customPosters[game.id];
          const posterUrl = customPosterUrl || (grids.length > 0 ? grids[0].url : undefined);
          const heroUrls = heroes.length > 0 ? heroes.map(h => h.url).slice(0, 9) : undefined;
          const logoUrl = logos.length > 0 ? logos[0].url : undefined;
          
          const enrichedGame = {
            ...game,
            steamgridGameId: foundGame.id,
            posterUrl,
            heroUrls,
            logoUrl,
          };

          setGames(prevGames => prevGames.map(g => g.id === game.id ? enrichedGame : g));
          return enrichedGame;
      } catch (error) {
          console.error(`Failed to enrich metadata for game "${game.name}":`, error);
          return game; // Return original game on error
      }
  }, [currentUser]);

  useEffect(() => {
    fetchInitialGames();
  }, [fetchInitialGames]);

  const updateGamePoster = (gameId: string, posterUrl: string) => {
    setGames(prevGames => 
        prevGames.map(g => g.id === gameId ? { ...g, posterUrl } : g)
    );
  };
  
  const refreshGames = useCallback(() => {
    hasFetched.current = false;
    setGames([]);
    setAllScannedGames([]);
    fetchInitialGames();
  }, [fetchInitialGames]);

  useEffect(() => {
    window.addEventListener('settings-updated', refreshGames);
    return () => {
      window.removeEventListener('settings-updated', refreshGames);
    };
  }, [refreshGames]);

  const value = { games, isLoading, allScannedGames, refreshGames, updateGameMetadata, updateGamePoster };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGames = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGames must be used within a GameProvider');
  }
  return context;
};
