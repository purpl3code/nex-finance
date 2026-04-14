import React from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  controls?: React.ReactNode;
  badge?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, controls, badge }) => {
  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              {title}
            </h1>
            {badge && (
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25 backdrop-blur-sm">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-slate-400 text-sm leading-relaxed">{subtitle}</p>
          )}
          {/* Animated accent underline */}
          <div className="mt-2 h-px w-16 rounded-full bg-gradient-to-r from-blue-500/70 to-transparent" />
        </div>
        {actions && (
          <div className="flex items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
      
      {controls && (
        <div className="flex flex-wrap items-center gap-3 p-1">
          {controls}
        </div>
      )}
    </motion.div>
  );
};