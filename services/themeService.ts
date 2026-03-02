import { LocalStorageAdapter } from './storageAdapter';

export type AppTheme = 'dark' | 'midnight' | 'graphite' | 'royal' | 'sunset' | 'forest';

const THEME_KEY = 'nex-finance-theme';
const DEFAULT_THEME: AppTheme = 'dark';

export const ThemeService = {
  getTheme: (): AppTheme => {
    const stored = LocalStorageAdapter.getItem(THEME_KEY);
    // Simple validation to ensure it's a valid theme string
    if (stored === 'dark' || stored === 'midnight' || stored === 'graphite' || stored === 'royal') {
      return stored as AppTheme;
    }
    return DEFAULT_THEME;
  },

  setTheme: (theme: AppTheme) => {
    LocalStorageAdapter.setItem(THEME_KEY, theme);
    ThemeService.applyTheme(theme);
  },

  applyTheme: (theme: AppTheme) => {
    const root = document.documentElement;
    // Removing data-theme attribute creates "default" state (dark)
    // Adding it applies the specific CSS variables
    if (theme === 'dark') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
  },

  initialize: () => {
    const current = ThemeService.getTheme();
    ThemeService.applyTheme(current);
    return current;
  }
};