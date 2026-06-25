import React from 'react';
import { StatusBar } from 'react-native';
import { useTheme, useThemeMode } from '../theme/ThemeContext';

/** Drives the OS status bar (text + background) from the active theme. */
export function ThemedStatusBar() {
  const Colors = useTheme();
  const { mode } = useThemeMode();
  return (
    <StatusBar
      barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
      backgroundColor={Colors.bg}
    />
  );
}
