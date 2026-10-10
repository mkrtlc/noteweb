import { useCallback, useEffect, useState } from 'react';
import { ThemeMode } from '../types';

const THEME_KEY = 'noteweb_theme';

const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

const applyTheme = (mode: ThemeMode) => {
  const dark = mode === 'dark' || (mode === 'system' && prefersDark());
  document.documentElement.classList.toggle('dark', dark);
};

const readTheme = (): ThemeMode => {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === 'light' || t === 'dark' ? t : 'system';
  } catch {
    return 'system';
  }
};

export const useTheme = () => {
  const [theme, setThemeState] = useState<ThemeMode>(readTheme);

  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch {
      // ignore
    }
    setThemeState(mode);
  }, []);

  const cycleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light');
  }, [theme, setTheme]);

  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && prefersDark());

  return { theme, setTheme, cycleTheme, isDark };
};
