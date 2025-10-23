import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface ThemeColors {
  'bg': string;
  'surface': string;
  'primary': string;
  'secondary': string;
  'accent': string;
  'text': string;
  'text-muted': string;
  'border': string;
  'primary-text': string;
}

interface ThemeContextType {
  theme: ThemeColors;
  setTheme: (newTheme: ThemeColors) => void;
  resetTheme: () => void;
}

const THEME_STORAGE_KEY = 'kanjiAppTheme';

export const defaultTheme: ThemeColors = {
  bg: '#020617',
  surface: '#0f172a',
  primary: '#0e7490',
  secondary: '#4338ca',
  accent: '#06b6d4',
  text: '#e2e8f0',
  'text-muted': '#94a3b8',
  border: '#1e293b',
  'primary-text': '#ffffff',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeColors>(() => {
    try {
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      // FIX: Cast the parsed theme from localStorage to ThemeColors to prevent type inference issues.
      return storedTheme ? (JSON.parse(storedTheme) as ThemeColors) : defaultTheme;
    } catch (error) {
      console.error("Failed to load theme from local storage", error);
      return defaultTheme;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    // FIX: Iterate over keys for better type safety with setProperty. This resolves an error where the value from Object.entries was inferred as 'unknown'.
    for (const key of Object.keys(theme) as Array<keyof ThemeColors>) {
        root.style.setProperty(`--theme-${key}`, theme[key]);
    }
    try {
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
    } catch (error) {
        console.error("Failed to save theme to local storage", error);
    }
  }, [theme]);

  const setTheme = (newTheme: ThemeColors) => {
    setThemeState(newTheme);
  };
  
  const resetTheme = useCallback(() => {
    setThemeState(defaultTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};