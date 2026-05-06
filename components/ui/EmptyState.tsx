import React from 'react';
import { motion } from 'framer-motion';
import { GlassButton } from './GlassButton';
import { 
  Search, CreditCard, Target, Repeat, PieChart, 
  TrendingUp, Wallet, List, BarChart3, Settings,
  Plus
} from 'lucide-react';

type EmptyStateVariant = 
  | 'transactions' | 'cards' | 'goals' | 'recurring' 
  | 'budgets' | 'forecast' | 'accounts' | 'reports' 
  | 'generic';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const iconMap: Record<EmptyStateVariant, React.ReactNode> = {
  transactions: <List size={40} />,
  cards: <CreditCard size={40} />,
  goals: <Target size={40} />,
  recurring: <Repeat size={40} />,
  budgets: <PieChart size={40} />,
  forecast: <TrendingUp size={40} />,
  accounts: <Wallet size={40} />,
  reports: <BarChart3 size={40} />,
  generic: <Search size={40} />,
};

const decorativeColors: Record<EmptyStateVariant, { ring: string; glow: string; icon: string }> = {
  transactions: { ring: 'border-blue-500/20', glow: 'shadow-blue-500/10', icon: 'text-blue-400' },
  cards: { ring: 'border-violet-500/20', glow: 'shadow-violet-500/10', icon: 'text-violet-400' },
  goals: { ring: 'border-amber-500/20', glow: 'shadow-amber-500/10', icon: 'text-amber-400' },
  recurring: { ring: 'border-cyan-500/20', glow: 'shadow-cyan-500/10', icon: 'text-cyan-400' },
  budgets: { ring: 'border-emerald-500/20', glow: 'shadow-emerald-500/10', icon: 'text-emerald-400' },
  forecast: { ring: 'border-indigo-500/20', glow: 'shadow-indigo-500/10', icon: 'text-indigo-400' },
  accounts: { ring: 'border-teal-500/20', glow: 'shadow-teal-500/10', icon: 'text-teal-400' },
  reports: { ring: 'border-sky-500/20', glow: 'shadow-sky-500/10', icon: 'text-sky-400' },
  generic: { ring: 'border-slate-500/20', glow: 'shadow-slate-500/10', icon: 'text-slate-400' },
};

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  variant = 'generic', 
  title, 
  description, 
  actionLabel, 
  onAction,
  className = '' 
}) => {
  const colors = decorativeColors[variant];
  const icon = iconMap[variant];

  return (
    <motion.div 
      className={`relative overflow-hidden rounded-2xl border border-dashed border-white/10 bg-white/[0.02] backdrop-blur-sm ${className}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Decorative background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-[rgb(var(--c-primary-500)/0.06)] to-transparent blur-3xl animate-orb-1`} />
        <div className={`absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-gradient-to-tr from-[rgb(var(--c-primary-600)/0.04)] to-transparent blur-3xl animate-orb-2`} />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center py-16 sm:py-20 px-6">
        {/* Animated icon container */}
        <motion.div 
          className="relative mb-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4, ease: 'easeOut' }}
        >
          {/* Outer ring pulse */}
          <div className={`absolute -inset-4 rounded-full border ${colors.ring} animate-pulse opacity-40`} />
          
          {/* Icon background */}
          <div className={`relative p-5 rounded-2xl bg-white/[0.04] border ${colors.ring} shadow-lg ${colors.glow} backdrop-blur-sm`}>
            <div className={`${colors.icon} opacity-70`}>
              {icon}
            </div>
          </div>
          
          {/* Decorative dots */}
          <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[rgb(var(--c-primary-400)/0.4)]" />
          <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 rounded-full bg-[rgb(var(--c-primary-500)/0.3)]" />
        </motion.div>

        {/* Text content */}
        <motion.div 
          className="text-center max-w-sm"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-slate-200 mb-1.5">{title}</h3>
          {description && (
            <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
          )}
        </motion.div>

        {/* CTA Button */}
        {actionLabel && onAction && (
          <motion.div 
            className="mt-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <GlassButton onClick={onAction} icon={<Plus size={16} />} size="sm">
              {actionLabel}
            </GlassButton>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
