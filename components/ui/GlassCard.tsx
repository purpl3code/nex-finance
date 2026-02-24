import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  hoverEffect = true,
  ...props 
}) => {
  return (
    <div 
      className={`
        glass-lg rounded-2xl p-6 relative overflow-hidden transition-all duration-300
        ${hoverEffect ? 'hover:-translate-y-1 hover:shadow-lg hover:bg-slate-800/60' : ''}
        ${className}
      `}
      {...props}
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
      {children}
    </div>
  );
};
