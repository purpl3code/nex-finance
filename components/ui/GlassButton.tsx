import React from 'react';
import { Loader2 } from 'lucide-react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
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
  const baseStyles = "relative inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-blue-foreground shadow-lg shadow-blue-900/20 border border-blue-500/30 hover:shadow-blue-500/20",
    secondary: "glass-sm hover:bg-white/10 text-slate-200 border border-white/5 hover:border-white/10",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30",
    ghost: "hover:bg-white/5 text-slate-400 hover:text-white",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
    icon: "h-10 w-10 p-2",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 hover:opacity-100 transition-opacity" />
      )}
      
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      
      {children}
    </button>
  );
};
