import React from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  controls?: React.ReactNode;
  badge?: string;
  icon?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, controls, badge, icon }) => {
  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            {/* Optional page icon */}
            {icon && (
              <div 
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 sidebar-brand-logo"
                aria-hidden="true"
              >
                <span className="text-white [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-[18px] sm:[&>svg]:h-[18px]">
                  {icon}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight gradient-text leading-tight">
                {title}
              </h1>
              {badge && (
                <span className="ml-2 inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full bg-[rgb(var(--c-primary-500)/0.15)] text-[rgb(var(--c-primary-300))] border border-[rgb(var(--c-primary-500)/0.25)] backdrop-blur-sm">
                  {badge}
                </span>
              )}
            </div>
          </div>
          {subtitle && (
            <p className="text-slate-400 text-sm leading-relaxed mt-0.5 truncate sm:whitespace-normal">{subtitle}</p>
          )}
          {/* Animated accent underline — uses theme primary color */}
          <motion.div 
            className="mt-2 h-[2px] rounded-full"
            style={{ 
              background: 'linear-gradient(90deg, rgb(var(--c-primary-500) / 0.8) 0%, transparent 100%)',
              width: 48
            }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          />
        </div>

        {actions && (
          <div className="flex items-center gap-3 shrink-0 mt-1 sm:mt-0">
            {actions}
          </div>
        )}
      </div>
      
      {controls && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {controls}
        </div>
      )}
    </motion.div>
  );
};