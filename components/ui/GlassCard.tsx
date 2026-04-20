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
  accent:   'border-[rgb(var(--c-primary-500)/0.2)]   shadow-[0_0_24px_rgb(var(--c-primary-500)/0.1)]',
  success:  'border-emerald-500/20 shadow-[0_0_24px_rgba(16,185,129,0.08)]',
  warning:  'border-amber-500/20   shadow-[0_0_24px_rgba(245,158,11,0.08)]',
  danger:   'border-red-500/20     shadow-[0_0_24px_rgba(239,68,68,0.08)]',
};

const variantTopLine: Record<GlassVariant, string> = {
  default:  'from-transparent via-white/20 to-transparent',
  accent:   'from-transparent via-[rgb(var(--c-primary-400)/0.4)] to-transparent',
  success:  'from-transparent via-emerald-400/40 to-transparent',
  warning:  'from-transparent via-amber-400/40 to-transparent',
  danger:   'from-transparent via-red-400/40 to-transparent',
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
      {/* Top highlight line */}
      <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r ${variantTopLine[variant]} opacity-70 pointer-events-none`} />
      
      {/* Bottom subtle reflection */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
      
      {children}
    </div>
  );
};
