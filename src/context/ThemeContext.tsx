'use client';

import React, { createContext, useContext, ReactNode, useCallback, useEffect, useState } from 'react';

type Theme = 'gaming' | 'media' | 'minimal' | 'neon' | 'default';

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('default');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('macro-theme') as Theme;
    if (savedTheme) {
      setThemeState(savedTheme);
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('macro-theme', newTheme);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const html = document.documentElement;
    
    // Remove all theme classes
    html.classList.remove('theme-gaming', 'theme-media', 'theme-minimal', 'theme-neon');
    
    // Add the new theme class if not default
    if (theme !== 'default') {
      html.classList.add(`theme-${theme}`);
    }
  }, [theme, mounted]);

  const value = { theme, setTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
