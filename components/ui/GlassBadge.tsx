import React from 'react';

interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'secondary' | 'outline';
  dot?: boolean;
  className?: string;
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({ 
  children, 
  variant = 'neutral',
  dot = false,
  className = ''
}) => {
  const variants = {
    success:   'bg-emerald-500/12 text-emerald-300 border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.1)]',
    warning:   'bg-amber-500/12   text-amber-300   border-amber-500/25   shadow-[0_0_12px_rgba(245,158,11,0.1)]',
    danger:    'bg-red-500/12     text-red-300     border-red-500/25     shadow-[0_0_12px_rgba(239,68,68,0.1)]',
    info:      'bg-[rgb(var(--c-primary-500)/0.12)] text-[rgb(var(--c-primary-300))] border-[rgb(var(--c-primary-500)/0.25)] shadow-[0_0_12px_rgb(var(--c-primary-500)/0.1)]',
    neutral:   'bg-white/10 text-slate-300 border-white/15',
    secondary: 'bg-white/5 text-slate-400 border-white/10',
    outline:   'bg-transparent text-slate-300 border-white/20',
  };

  const dotColors = {
    success:   'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]',
    warning:   'bg-amber-400   shadow-[0_0_6px_rgba(245,158,11,0.8)]',
    danger:    'bg-red-400     shadow-[0_0_6px_rgba(239,68,68,0.8)]',
    info:      'bg-[rgb(var(--c-primary-400))] shadow-[0_0_6px_rgb(var(--c-primary-500)/0.8)]',
    neutral:   'bg-slate-400',
    secondary: 'bg-slate-500',
    outline:   'bg-slate-400',
  };

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm tracking-tight
      ${variants[variant]}
      ${className}
    `}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
};
