import React from 'react';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const GlassInput: React.FC<GlassInputProps> = ({ 
  label, 
  error,
  hint,
  icon,
  className = '', 
  ...props 
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[11px] font-bold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[var(--accent)] transition-colors duration-200 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full 
            bg-white/5 hover:bg-white/7
            border border-white/10 hover:border-white/18
            rounded-xl 
            ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 
            text-sm text-slate-100 
            placeholder:text-slate-600
            focus:outline-none 
            focus:ring-2 focus:ring-[var(--ring)]
            focus:border-[rgb(var(--c-primary-500)/0.5)]
            focus:bg-[rgb(var(--c-primary-950)/0.2)]
            transition-all duration-200
            ${error ? 'border-red-500/50 focus:ring-red-500/40 focus:border-red-500/50' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {hint && !error && (
        <p className="mt-1 text-[11px] text-slate-500 ml-1">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-[11px] text-red-400 ml-1 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-red-400 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};
