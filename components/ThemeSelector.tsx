import React from 'react';
import { ThemeService, AppTheme } from '../services/themeService';
import { Check } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';

interface ThemeOption {
  id: AppTheme;
  name: string;
  colors: {
    bg: string;
    primary: string;
  };
}

const THEMES: ThemeOption[] = [
  { 
    id: 'dark', 
    name: 'Padrão (Dark)', 
    colors: { bg: '#0f172a', primary: '#3b82f6' } // Slate-900 / Blue-500
  },
  { 
    id: 'midnight', 
    name: 'Midnight', 
    colors: { bg: '#0a0f1e', primary: '#0ea5e9' } // Deep Navy / Sky-500
  },
  { 
    id: 'graphite', 
    name: 'Grafite', 
    colors: { bg: '#171717', primary: '#10b981' } // Neutral-900 / Emerald-500
  },
  { 
    id: 'royal', 
    name: 'Royal', 
    colors: { bg: '#18181b', primary: '#8b5cf6' } // Zinc-900 / Violet-500
  }
];

interface ThemeSelectorProps {
  currentTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange }) => {
  
  const handleSelect = (id: AppTheme) => {
    ThemeService.setTheme(id);
    onThemeChange(id);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {THEMES.map(theme => (
        <button
          key={theme.id}
          onClick={() => handleSelect(theme.id)}
          className="relative group outline-none text-left"
        >
          <GlassCard 
            className={`
              flex flex-col items-center gap-3 p-4 transition-all h-full
              ${currentTheme === theme.id 
                ? 'ring-2 ring-blue-500/50 bg-slate-800/80' 
                : 'hover:bg-white/5'}
            `}
          >
            {/* Color Preview */}
            <div 
              className="w-full h-16 rounded-lg shadow-inner flex items-center justify-center relative overflow-hidden border border-white/10"
              style={{ backgroundColor: theme.colors.bg }}
            >
               <div 
                 className="w-8 h-8 rounded-full shadow-lg absolute ring-2 ring-white/10" 
                 style={{ backgroundColor: theme.colors.primary }}
               ></div>
            </div>

            <span className={`text-sm font-medium ${currentTheme === theme.id ? 'text-white' : 'text-slate-400'}`}>
              {theme.name}
            </span>

            {currentTheme === theme.id && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full shadow-lg shadow-blue-500/20">
                <Check size={10} strokeWidth={3} />
              </div>
            )}
          </GlassCard>
        </button>
      ))}
    </div>
  );
};