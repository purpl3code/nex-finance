import { LocalStorageAdapter } from './storageAdapter';

export type AppTheme = 'dark' | 'midnight' | 'graphite' | 'royal' | 'sunset' | 'forest' | 'pure-black' | 'pure-white';

const THEME_KEY = 'nex-finance-theme';
const DEFAULT_THEME: AppTheme = 'dark';

export const ThemeService = {
  getTheme: (): AppTheme => {
    const stored = LocalStorageAdapter.getItem(THEME_KEY);
    // Simple validation to ensure it's a valid theme string
    if (stored === 'dark' || stored === 'midnight' || stored === 'graphite' || stored === 'royal' || stored === 'sunset' || stored === 'forest' || stored === 'pure-black' || stored === 'pure-white') {
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

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      let color = '#020617'; // default dark (slate-950)
      switch (theme) {
        case 'midnight': color = '#0a0a0a'; break;
        case 'graphite': color = '#111827'; break;
        case 'royal': color = '#1e1b4b'; break;
        case 'sunset': color = '#450a0a'; break;
        case 'forest': color = '#022c22'; break;
        case 'pure-black': color = '#000000'; break;
        case 'pure-white': color = '#fafafa'; break;
      }
      metaThemeColor.setAttribute('content', color);
    }
  },

  initialize: () => {
    const current = ThemeService.getTheme();
    ThemeService.applyTheme(current);
    return current;
  }
};