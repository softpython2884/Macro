'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Hint = {
  key: string;
  action: string;
};

type HintContextType = {
  hints: Hint[];
  setHints: (hints: Hint[]) => void;
};

const HintContext = createContext<HintContextType | undefined>(undefined);

export const HintProvider = ({ children }: { children: ReactNode }) => {
  const [hints, setHints] = useState<Hint[]>([]);

  return (
    <HintContext.Provider value={{ hints, setHints }}>
      {children}
    </HintContext.Provider>
  );
};

export const useHints = () => {
  const context = useContext(HintContext);
  if (context === undefined) {
    throw new Error('useHints must be used within a HintProvider');
  }
  return context;
};
