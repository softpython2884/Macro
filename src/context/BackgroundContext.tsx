'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type BackgroundContextType = {
  backgroundImage: string | null;
  setBackgroundImage: (imageUrl: string | null) => void;
};

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export const BackgroundProvider = ({ children }: { children: ReactNode }) => {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  return (
    <BackgroundContext.Provider value={{ backgroundImage, setBackgroundImage }}>
      {children}
    </BackgroundContext.Provider>
  );
};

export const useBackground = () => {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
};
