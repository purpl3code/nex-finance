import React from 'react';

interface GlassBadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'secondary' | 'outline';
  className?: string;
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({ 
  children, 
  variant = 'neutral',
  className = ''
}) => {
  const variants = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    neutral: 'bg-white/10 text-slate-400 border-white/20',
    secondary: 'bg-white/5 text-slate-400 border-white/10',
    outline: 'bg-transparent text-slate-400 border-white/20',
  };

  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
      ${variants[variant]}
      ${className}
    `}>
      {children}
    </span>
  );
};
