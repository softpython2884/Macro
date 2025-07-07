
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { INITIAL_GAMES, type Game } from '@/lib/data';
import { searchGame, getGrids, getHeroes, getLogos } from '@/lib/steamgrid';

type GameContextType = {
  games: Game[];
  isLoading: boolean;
  fetchGameMetadata: () => Promise<void>;
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [games, setGames] = useState<Game[]>(INITIAL_GAMES);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchGameMetadata = useCallback(async () => {
    if (hasFetched || isLoading) return;

    setIsLoading(true);

    const enrichedGames = await Promise.all(
      INITIAL_GAMES.map(async (game) => {
        const foundGame = await searchGame(game.name);
        if (!foundGame) return game;

        const [grids, heroes, logos] = await Promise.all([
            getGrids(foundGame.id, ['600x900']),
            getHeroes(foundGame.id),
            getLogos(foundGame.id)
        ]);

        return {
          ...game,
          posterUrl: grids.length > 0 ? grids[0].url : undefined,
          heroUrl: heroes.length > 0 ? heroes[0].url : undefined,
          logoUrl: logos.length > 0 ? logos[0].url : undefined,
        };
      })
    );

    setGames(enrichedGames);
    setIsLoading(false);
    setHasFetched(true);
  }, [hasFetched, isLoading]);

  const value = { games, isLoading, fetchGameMetadata };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGames = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGames must be used within a GameProvider');
  }
  return context;
};
