import React from 'react';
import { Loader2 } from 'lucide-react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({ 
  children, 
  className = '', 
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  disabled,
  ...props 
}) => {
  const baseStyles = `
    relative inline-flex items-center justify-center rounded-xl font-semibold 
    transition-all duration-200 active:scale-[0.97] outline-none 
    disabled:opacity-45 disabled:pointer-events-none group select-none
    focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--c-bg-950))]
  `;
  
  const variants = {
    primary: `
      bg-[var(--accent)] hover:brightness-110 active:brightness-95
      text-[rgb(var(--c-primary-foreground))]
      border border-[rgb(var(--c-primary-300)/0.4)]
      shadow-[0_4px_16px_var(--accent-glow)]
      hover:shadow-[0_6px_22px_var(--accent-glow)]
      focus-visible:ring-[var(--accent)]
    `,
    secondary: `
      bg-white/6 hover:bg-white/12 active:bg-white/8 backdrop-blur-md
      text-slate-200 hover:text-white
      border border-white/12 hover:border-white/22
      shadow-sm hover:shadow-md
      focus-visible:ring-white/40
    `,
    danger: `
      bg-red-500/12 hover:bg-red-500/22 active:bg-red-500/18
      text-red-400 hover:text-red-300
      border border-red-500/30 hover:border-red-500/50
      shadow-[0_2px_12px_rgba(239,68,68,0.15)]
      hover:shadow-[0_4px_18px_rgba(239,68,68,0.25)]
      focus-visible:ring-red-500/50
    `,
    success: `
      bg-emerald-500/15 hover:bg-emerald-500/25 active:bg-emerald-500/20
      text-emerald-300 hover:text-emerald-200
      border border-emerald-500/30 hover:border-emerald-500/50
      shadow-[0_2px_12px_rgba(16,185,129,0.15)]
      hover:shadow-[0_4px_18px_rgba(16,185,129,0.25)]
      focus-visible:ring-emerald-500/50
    `,
    ghost: `
      hover:bg-white/8 active:bg-white/5
      text-slate-400 hover:text-white
      focus-visible:ring-white/30
    `,
  };

  const sizes = {
    sm:   'h-8.5 px-3   text-xs  gap-1.5 rounded-lg',
    md:   'h-10  px-4   text-sm  gap-2   rounded-xl',
    lg:   'h-12  px-6   text-base gap-2.5 rounded-2xl',
    icon: 'h-10  w-10   p-2      rounded-xl',
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Decorative effects clipped to button shape */}
      {variant === 'primary' && (
        <span className="absolute inset-0 rounded-inherit overflow-hidden pointer-events-none">
          {/* Shimmer sweep on hover */}
          <span 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                       -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
          />
          {/* Top specular highlight line */}
          <span className="absolute top-0 inset-x-3 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </span>
      )}
      
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0 relative z-10" />
      ) : icon ? (
        <span className="shrink-0 flex items-center relative z-10 transition-transform duration-200 group-hover:scale-105">{icon}</span>
      ) : null}
      
      {children && (
        <span className="relative z-10 font-medium tracking-tight">{children}</span>
      )}
    </button>
  );
};
