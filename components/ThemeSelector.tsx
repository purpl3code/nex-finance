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
    description: 'Azul clássico',
    colors: { bg: '#0f172a', surface: '#1e293b', primary: '#3b82f6', text: '#94a3b8' }
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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {THEMES.map(theme => {
        const isActive = currentTheme === theme.id;
        return (
          <button
            key={theme.id}
            onClick={() => handleSelect(theme.id)}
            className={`
              relative group outline-none text-left rounded-2xl transition-all duration-300
              ${isActive 
                ? 'ring-2 ring-offset-2 ring-offset-transparent scale-[1.02]' 
                : 'hover:scale-[1.01]'}
            `}
            style={{ 
              '--tw-ring-color': theme.colors.primary + '80',
            } as React.CSSProperties}
          >
            {/* Card */}
            <div 
              className={`
                rounded-2xl p-3 border transition-all duration-300 h-full overflow-hidden relative
                ${isActive 
                  ? 'border-white/20 shadow-lg' 
                  : 'border-white/8 hover:border-white/15'}
              `}
              style={{ backgroundColor: theme.colors.surface }}
            >
              {/* Top gradient bar */}
              <div 
                className="absolute top-0 left-0 right-0 h-[2px] opacity-80"
                style={{ background: `linear-gradient(90deg, transparent, ${theme.colors.primary}90, transparent)` }}
              />

              {/* Color palette preview */}
              <div 
                className="w-full h-14 rounded-xl mb-3 relative overflow-hidden border border-white/5"
                style={{ backgroundColor: theme.colors.bg }}
              >
                {/* Mini UI mockup inside */}
                <div className="absolute inset-2 flex gap-1.5">
                  {/* Mini sidebar */}
                  <div 
                    className="w-3 h-full rounded-md opacity-70"
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
  );
};