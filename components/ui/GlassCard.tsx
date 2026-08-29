import React from 'react';

type GlassVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  variant?: GlassVariant;
  shimmer?: boolean;
}

const variantStyles: Record<GlassVariant, string> = {
  default:  '',
  accent:   'border-[rgb(var(--c-primary-500)/0.25)] shadow-[0_4px_28px_rgb(var(--c-primary-500)/0.12)]',
  success:  'border-emerald-500/25 shadow-[0_4px_28px_rgba(16,185,129,0.1)]',
  warning:  'border-amber-500/25   shadow-[0_4px_28px_rgba(245,158,11,0.1)]',
  danger:   'border-red-500/25     shadow-[0_4px_28px_rgba(239,68,68,0.1)]',
};

const variantTopLine: Record<GlassVariant, string> = {
  default:  'from-transparent via-white/25 to-transparent',
  accent:   'from-transparent via-[rgb(var(--c-primary-300)/0.5)] to-transparent',
  success:  'from-transparent via-emerald-300/50 to-transparent',
  warning:  'from-transparent via-amber-300/50 to-transparent',
  danger:   'from-transparent via-red-300/50 to-transparent',
};

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  hoverEffect = true,
  variant = 'default',
  shimmer = false,
  ...props 
}) => {
  return (
    <div 
      className={`
        glass-lg rounded-2xl p-4 sm:p-6 relative overflow-hidden
        transition-all duration-300 ease-out
        ${variantStyles[variant]}
        ${hoverEffect ? 'glass-card-hover cursor-default' : ''}
        ${shimmer ? 'animate-shimmer' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Top specular highlight line */}
      <div 
        className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r ${variantTopLine[variant]} opacity-80 pointer-events-none`} 
      />
      
      {/* Bottom subtle ambient reflection line */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" 
      />
      
      {children}
    </div>
  );
};
