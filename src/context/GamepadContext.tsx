'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useGamepad } from '@/hooks/use-gamepad';

type GamepadContextType = {
  isConnected: boolean;
  isEnabled: boolean;
};

const GamepadContext = createContext<GamepadContextType | undefined>(undefined);

export const GamepadProvider = ({ children }: { children: ReactNode }) => {
  const { isConnected, isEnabled } = useGamepad();

  const value = { isConnected, isEnabled };

  return <GamepadContext.Provider value={value}>{children}</GamepadContext.Provider>;
};

export const useGamepadContext = () => {
  const context = useContext(GamepadContext);
  if (context === undefined) {
    throw new Error('useGamepadContext must be used within a GamepadProvider');
  }
  return context;
};
