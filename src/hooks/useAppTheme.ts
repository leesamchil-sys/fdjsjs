import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeMode } from '../types';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDarkMode: boolean;
  fontSizeLevel: number;
  setFontSizeLevel: (level: number | ((prev: number) => number)) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('pig_town_theme_mode') as ThemeMode) || 'system';
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(() => {
    return parseInt(localStorage.getItem('pig_town_font_size_level') || '3', 10);
  });

  useEffect(() => {
    localStorage.setItem('pig_town_theme_mode', themeMode);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      let resolvedIsDark = false;
      if (themeMode === 'system') {
        resolvedIsDark = mediaQuery.matches;
      } else {
        resolvedIsDark = themeMode === 'dark';
      }
      
      setIsDarkMode(resolvedIsDark);
      document.documentElement.classList.toggle('dark', resolvedIsDark);
    };
    
    applyTheme();

    if (themeMode === 'system') {
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem('pig_town_font_size_level', fontSizeLevel.toString());
    const scaleMap: Record<number, string> = {
      1: '0.86',
      2: '0.93',
      3: '1.0',
      4: '1.08',
      5: '1.16',
      6: '1.25'
    };
    const scaleFactor = scaleMap[fontSizeLevel] || '1.0';
    document.documentElement.style.setProperty('--app-font-scale', scaleFactor);
  }, [fontSizeLevel]);

  return React.createElement(
    ThemeContext.Provider,
    { value: { themeMode, setThemeMode, isDarkMode, fontSizeLevel, setFontSizeLevel } },
    children
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};
