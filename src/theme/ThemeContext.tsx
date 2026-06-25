import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors as darkColors } from './colors';

/** Full color palette shape. Both themes implement every key. */
export type ThemeColors = typeof darkColors;

export type ThemeMode = 'dark' | 'light';

/**
 * Light palette. Brand/accent colors (accent, success, warning, danger,
 * purple) stay identical across themes — only surfaces, borders and text
 * flip — so the UI keeps its identity while switching mode.
 */
const lightColors: ThemeColors = {
  bg: '#f4f5f7',
  surface: '#ffffff',
  elevated: '#eceef2',
  border: 'rgba(0,0,0,0.10)',
  borderActive: 'rgba(91,140,255,0.45)',
  accent: '#5b8cff',
  accentDark: '#3a63d8',
  accentSoft: 'rgba(91,140,255,0.14)',
  success: '#1faf73',
  successSoft: 'rgba(31,175,115,0.14)',
  warning: '#c98a14',
  warningSoft: 'rgba(201,138,20,0.14)',
  danger: '#e23b3b',
  dangerSoft: 'rgba(226,59,59,0.12)',
  purple: '#8a5bd6',
  purpleSoft: 'rgba(138,91,214,0.14)',
  textPrimary: '#16161a',
  textSecondary: '#54545e',
  textMuted: '#9a9aa4',
  textDim: '#6c6c76',
};

const PALETTES: Record<ThemeMode, ThemeColors> = {
  dark: darkColors,
  light: lightColors,
};

const STORAGE_KEY = 'homeos_theme_mode';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeCtx = createContext<ThemeContextValue>({
  mode: 'dark',
  colors: darkColors,
  toggleTheme: () => {},
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');

  // Restore the persisted theme on launch.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') setModeState(saved);
    });
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, colors: PALETTES[mode], toggleTheme, setMode }),
    [mode, toggleTheme, setMode],
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

/** Returns the active color palette. Use inside `makeStyles(colors)`. */
export function useTheme(): ThemeColors {
  return useContext(ThemeCtx).colors;
}

/** Returns theme mode + controls (for the settings toggle). */
export function useThemeMode() {
  const { mode, toggleTheme, setMode } = useContext(ThemeCtx);
  return { mode, toggleTheme, setMode };
}
