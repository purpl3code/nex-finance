import React from 'react';
import { ThemeService, AppTheme } from '../services/themeService';
import { Check, Sun, Moon } from 'lucide-react';

interface ThemeOption {
  id: AppTheme;
  name: string;
  description: string;
  colors: {
    bg: string;
    surface: string;
    primary: string;
    text: string;
  };
  icon?: React.ReactNode;
}

const THEMES: ThemeOption[] = [

  { 
    id: 'dark', 
    name: 'Padrão Dark', 
    description: 'Nex Teal',
    colors: { bg: '#07141d', surface: '#10232b', primary: '#2dd4bf', text: '#94a3b8' }
  },
  { 
    id: 'midnight', 
    name: 'Midnight', 
    description: 'Azul profundo',
    colors: { bg: '#0a0f1e', surface: '#172038', primary: '#0ea5e9', text: '#8ca0c0' }
  },
  { 
    id: 'graphite', 
    name: 'Grafite', 
    description: 'Verde esmeralda',
    colors: { bg: '#171717', surface: '#262626', primary: '#10b981', text: '#a3a3a3' }
  },
  { 
    id: 'royal', 
    name: 'Royal', 
    description: 'Violeta premium',
    colors: { bg: '#18181b', surface: '#27272a', primary: '#8b5cf6', text: '#a1a1aa' }
  },
  { 
    id: 'sunset', 
    name: 'Sunset', 
    description: 'Laranja quente',
    colors: { bg: '#1c1917', surface: '#292524', primary: '#f97316', text: '#a8a29e' }
  },
  { 
    id: 'forest', 
    name: 'Forest', 
    description: 'Verde selva',
    colors: { bg: '#064e3b', surface: '#065f46', primary: '#14b8a6', text: '#34d399' }
  },
  { 
    id: 'pure-black', 
    name: 'Pure Black', 
    description: 'AMOLED puro',
    icon: <Moon size={12} />,
    colors: { bg: '#000000', surface: '#0f0f0f', primary: '#ffffff', text: '#737373' }
  },
  { 
    id: 'pure-white', 
    name: 'Pure White', 
    description: 'Modo claro',
    icon: <Sun size={12} />,
    colors: { bg: '#f5f5f5', surface: '#e5e5e5', primary: '#000000', text: '#525252' }
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

  const selectedTheme = THEMES.find((theme) => theme.id === currentTheme) ?? THEMES[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="h-10 w-1 rounded-full" style={{ backgroundColor: selectedTheme.colors.primary }} />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Tema selecionado</p>
            <p className="truncate text-sm font-semibold text-white">{selectedTheme.name}</p>
            <p className="truncate text-xs text-slate-400">{selectedTheme.description}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5" aria-label="Cores do tema">
          {[selectedTheme.colors.bg, selectedTheme.colors.surface, selectedTheme.colors.primary].map((color) => (
            <span key={color} className="h-5 w-5 rounded-full border border-white/15" style={{ backgroundColor: color }} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {THEMES.map(theme => {
        const isActive = currentTheme === theme.id;
        return (
          <button
            key={theme.id}
            onClick={() => handleSelect(theme.id)}
            aria-pressed={isActive}
            className={`
              relative group text-left rounded-2xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
              ${isActive 
                ? 'scale-[1.01]'
                : 'hover:-translate-y-0.5'}
            `}
            style={{ 
              '--tw-ring-color': theme.colors.primary + '80',
            } as React.CSSProperties}
          >
            {/* Card */}
            <div 
              className={`
                rounded-2xl p-3.5 border transition-all duration-200 h-full overflow-hidden relative backdrop-blur-xl
                ${isActive 
                  ? 'border-white/30 shadow-lg shadow-black/20'
                  : 'border-white/10 hover:border-white/20'}
              `}
              style={{ background: `linear-gradient(145deg, ${theme.colors.surface}, ${theme.colors.bg})` }}
            >
              {/* Top gradient bar */}
              <div 
                className="absolute top-0 left-0 right-0 h-[2px] opacity-80"
                style={{ background: `linear-gradient(90deg, transparent, ${theme.colors.primary}90, transparent)` }}
              />

              {/* Color palette preview */}
              <div 
                className="w-full h-16 rounded-xl mb-3.5 relative overflow-hidden border border-white/10 shadow-inner"
                style={{ backgroundColor: theme.colors.bg }}
              >
                {/* Mini UI mockup inside */}
                <div className="absolute inset-2 flex gap-1.5">
                  {/* Mini sidebar */}
                  <div 
                    className="w-3 h-full rounded-md opacity-80 border border-white/10"
                    style={{ backgroundColor: theme.colors.surface }}
                  />
                  {/* Mini content */}
                  <div className="flex-1 flex flex-col gap-1 justify-center">
                    <div 
                      className="h-1.5 rounded-full w-3/4"
                      style={{ backgroundColor: theme.colors.primary, opacity: 0.9 }}
                    />
                    <div 
                      className="h-1 rounded-full w-full opacity-30"
                      style={{ backgroundColor: theme.colors.text }}
                    />
                    <div 
                      className="h-1 rounded-full w-1/2 opacity-20"
                      style={{ backgroundColor: theme.colors.text }}
                    />
                  </div>
                </div>

                {/* Primary dot accent */}
                <div 
                  className="absolute bottom-2 right-2 w-4 h-4 rounded-full shadow-lg"
                  style={{ 
                    backgroundColor: theme.colors.primary,
                    boxShadow: `0 0 8px ${theme.colors.primary}80`
                  }}
                />
              </div>

              {/* Theme info */}
              <div className="flex items-start justify-between">
                <div>
                  <p 
                    className="text-xs font-bold leading-tight"
                    style={{ color: theme.colors.text === theme.colors.primary ? '#fff' : theme.colors.text }}
                  >
                    {theme.name}
                  </p>
                  <p 
                    className="text-[10px] mt-0.5 opacity-60"
                    style={{ color: theme.colors.text }}
                  >
                    {theme.description}
                  </p>
                </div>
                {theme.icon && (
                  <span style={{ color: theme.colors.primary }} className="opacity-60 mt-0.5">{theme.icon}</span>
                )}
              </div>

              {/* Active checkmark */}
              {isActive && (
                <div 
                  className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  <Check size={10} strokeWidth={3} style={{ color: theme.id === 'pure-white' ? '#fff' : '#000' }} />
                </div>
              )}
            </div>
          </button>
        );
      })}
      </div>
    </div>
  );
};