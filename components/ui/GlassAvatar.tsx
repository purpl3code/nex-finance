import React from 'react';

interface GlassAvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const GlassAvatar: React.FC<GlassAvatarProps> = ({ src, name, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };

  const getInitials = (n: string) => {
    return n
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div 
      className={`
        relative rounded-full overflow-hidden flex items-center justify-center font-bold text-white shrink-0
        border border-white/10 shadow-lg backdrop-blur-sm
        ${sizeClasses[size]} 
        ${!src ? 'bg-gradient-to-tr from-blue-500/80 to-blue-600/80' : 'bg-white/5'}
        ${className}
      `}
    >
      {src ? (
        <img 
          src={src} 
          alt={name} 
          className="w-full h-full object-cover" 
        />
      ) : (
        <span className="drop-shadow-md">{getInitials(name)}</span>
      )}
      
      {/* Glossy overlay */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
    </div>
  );
};
