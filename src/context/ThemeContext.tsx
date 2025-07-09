'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { extractThemeColors } from '@/ai/flows/extract-theme-colors-flow';
import { hexToHsl } from '@/lib/utils';

type ThemeContextType = {
  setDynamicTheme: (imageUrl: string | null) => void;
  resetDynamicTheme: () => void;
  isThemeLoading: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isThemeLoading, setIsThemeLoading] = useState(false);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);

  const applyTheme = (primaryHex: string, accentHex: string) => {
    const primaryHsl = hexToHsl(primaryHex);
    const accentHsl = hexToHsl(accentHex);
    
    if (primaryHsl && accentHsl) {
      const root = document.documentElement;
      root.style.setProperty('--primary-dynamic', `${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%`);
      root.style.setProperty('--accent-dynamic', `${accentHsl.h} ${accentHsl.s}% ${accentHsl.l}%`);
      root.classList.add('dynamic-theme');
    }
  };

  const resetDynamicTheme = useCallback(() => {
    setActiveImageUrl(null);
    const root = document.documentElement;
    root.classList.remove('dynamic-theme');
    root.style.removeProperty('--primary-dynamic');
    root.style.removeProperty('--accent-dynamic');
  }, []);

  const setDynamicTheme = useCallback(async (imageUrl: string | null) => {
    if (!imageUrl || imageUrl === activeImageUrl) {
        if (!imageUrl) resetDynamicTheme();
        return;
    }

    setIsThemeLoading(true);
    setActiveImageUrl(imageUrl);

    try {
      const colors = await extractThemeColors({ imageUrl });
      if (colors.primaryColor && colors.accentColor) {
        applyTheme(colors.primaryColor, colors.accentColor);
      } else {
        resetDynamicTheme();
      }
    } catch (error) {
      console.error("Failed to set dynamic theme:", error);
      resetDynamicTheme();
    } finally {
      setIsThemeLoading(false);
    }
  }, [activeImageUrl, resetDynamicTheme]);

  const value = { setDynamicTheme, resetDynamicTheme, isThemeLoading };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
