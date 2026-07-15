import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { storage } from '../services/storage';
import { Colors } from '../constants/Colors';
import type { ThemeMode } from '../types/exercise';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: typeof Colors.dark;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  colors: Colors.dark,
  toggle: () => {},
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    storage.getTheme().then(setModeState);
  }, []);

  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode);
    await storage.saveTheme(newMode);
  }, []);

  const toggle = useCallback(async () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setModeState(next);
    await storage.saveTheme(next);
  }, [mode]);

  const colors = Colors[mode];

  return (
    <ThemeContext.Provider value={{ mode, colors, toggle, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
