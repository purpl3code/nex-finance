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
    disabled:opacity-50 disabled:cursor-not-allowed group
    focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent
  `;
  
  const variants = {
    primary: `
      bg-[var(--accent)] hover:brightness-110 
      text-[rgb(var(--c-primary-foreground))]
      border border-[rgb(var(--c-primary-400)/0.4)]
      shadow-[0_0_16px_var(--accent-glow)]
      hover:shadow-[0_0_24px_var(--accent-glow)]
      focus-visible:ring-[var(--accent)]
    `,
    secondary: `
      glass-sm hover:bg-white/10 
      text-slate-200 
      border border-white/10 hover:border-white/20
      hover:shadow-lg
      focus-visible:ring-white/40
    `,
    danger: `
      bg-red-500/10 hover:bg-red-500/20 
      text-red-400 
      border border-red-500/30 hover:border-red-500/50
      hover:shadow-[0_0_16px_rgba(239,68,68,0.2)]
      focus-visible:ring-red-500/50
    `,
    success: `
      bg-emerald-500/15 hover:bg-emerald-500/25 
      text-emerald-300
      border border-emerald-500/30 hover:border-emerald-500/50
      hover:shadow-[0_0_16px_rgba(16,185,129,0.2)]
      focus-visible:ring-emerald-500/50
    `,
    ghost: `
      hover:bg-white/5 
      text-slate-400 hover:text-white
      focus-visible:ring-white/30
    `,
  };

  const sizes = {
    sm:   'h-8  px-3   text-xs  gap-1.5',
    md:   'h-10 px-4   text-sm  gap-2',
    lg:   'h-12 px-6   text-base gap-2',
    icon: 'h-10 w-10  p-2',
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Decorative effects clipped to button shape */}
      {variant === 'primary' && (
        <span className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
          {/* Shimmer sweep on hover */}
          <span 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent 
                       -translate-x-full group-hover:translate-x-full transition-transform duration-700"
          />
          {/* Top highlight line */}
          <span className="absolute top-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </span>
      )}
      
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0 relative z-10" />
      ) : icon ? (
        <span className="shrink-0 flex items-center relative z-10">{icon}</span>
      ) : null}
      
      {children && (
        <span className="relative z-10">{children}</span>
      )}
    </button>
  );
};
