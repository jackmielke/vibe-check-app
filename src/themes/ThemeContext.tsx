import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  defaultThemeId,
  isThemeId,
  themeOrder,
  themes,
  type Theme,
  type ThemeId,
} from './index';

const STORAGE_KEY = 'vibe.themeId';

type ThemeContextValue = {
  theme: Theme;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  cycleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(defaultThemeId);

  // Restore the last pick. A missing or unknown value just keeps the default.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (active && isThemeId(stored)) setThemeIdState(stored);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeIdState((current) => {
      const next = themeOrder[(themeOrder.indexOf(current) + 1) % themeOrder.length]!;
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: themes[themeId], themeId, setThemeId, cycleTheme }),
    [themeId, setThemeId, cycleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside a ThemeProvider');
  return value;
}
