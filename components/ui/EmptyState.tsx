import React from 'react';
import { motion } from 'framer-motion';
import { GlassButton } from './GlassButton';
import { 
  Search, CreditCard, Target, Repeat, PieChart, 
  TrendingUp, Wallet, List, BarChart3,
  Plus, AlertTriangle
} from 'lucide-react';

type EmptyStateVariant = 
  | 'transactions' | 'cards' | 'goals' | 'recurring' 
  | 'budgets' | 'forecast' | 'accounts' | 'reports' 
  | 'debts' | 'generic';

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
  debts: <AlertTriangle size={40} />,
  generic: <Search size={40} />,
};

const decorativeColors: Record<EmptyStateVariant, { ring: string; glow: string; icon: string }> = {
  transactions: { ring: 'border-[rgb(var(--c-primary-500)/0.2)]', glow: 'shadow-[0_8px_24px_rgb(var(--c-primary-500)/0.08)]', icon: 'text-[rgb(var(--c-primary-400))]' },
  cards: { ring: 'border-[rgb(var(--c-primary-500)/0.2)]', glow: 'shadow-[0_8px_24px_rgb(var(--c-primary-500)/0.08)]', icon: 'text-[rgb(var(--c-primary-400))]' },
  goals: { ring: 'border-[rgb(var(--c-primary-500)/0.2)]', glow: 'shadow-[0_8px_24px_rgb(var(--c-primary-500)/0.08)]', icon: 'text-[rgb(var(--c-primary-400))]' },
  recurring: { ring: 'border-[rgb(var(--c-primary-500)/0.2)]', glow: 'shadow-[0_8px_24px_rgb(var(--c-primary-500)/0.08)]', icon: 'text-[rgb(var(--c-primary-400))]' },
  budgets: { ring: 'border-[rgb(var(--c-primary-500)/0.2)]', glow: 'shadow-[0_8px_24px_rgb(var(--c-primary-500)/0.08)]', icon: 'text-[rgb(var(--c-primary-400))]' },
  forecast: { ring: 'border-[rgb(var(--c-primary-500)/0.2)]', glow: 'shadow-[0_8px_24px_rgb(var(--c-primary-500)/0.08)]', icon: 'text-[rgb(var(--c-primary-400))]' },
  accounts: { ring: 'border-[rgb(var(--c-primary-500)/0.2)]', glow: 'shadow-[0_8px_24px_rgb(var(--c-primary-500)/0.08)]', icon: 'text-[rgb(var(--c-primary-400))]' },
  reports: { ring: 'border-[rgb(var(--c-primary-500)/0.2)]', glow: 'shadow-[0_8px_24px_rgb(var(--c-primary-500)/0.08)]', icon: 'text-[rgb(var(--c-primary-400))]' },
  debts: { ring: 'border-rose-500/20', glow: 'shadow-rose-500/10', icon: 'text-rose-400' },
  generic: { ring: 'border-[rgb(var(--c-primary-500)/0.2)]', glow: 'shadow-[0_8px_24px_rgb(var(--c-primary-500)/0.08)]', icon: 'text-[rgb(var(--c-primary-400))]' },
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
        <div className={`absolute -top-16 -right-16 w-36 h-36 rounded-full bg-gradient-to-br from-[rgb(var(--c-primary-500)/0.05)] to-transparent blur-3xl`} />
        <div className={`absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-gradient-to-tr from-[rgb(var(--c-primary-600)/0.035)] to-transparent blur-3xl`} />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center py-14 sm:py-16 px-6">
        {/* Animated icon container */}
        <motion.div 
          className="relative mb-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.3, ease: 'easeOut' }}
        >
          {/* Outer ring pulse */}
          <div className={`absolute -inset-3 rounded-full border ${colors.ring} opacity-50`} />
          
          {/* Icon background */}
          <div className={`relative p-4 rounded-2xl bg-white/[0.04] border ${colors.ring} shadow-lg ${colors.glow} backdrop-blur-sm`}>
            <div className={`${colors.icon} opacity-80`}>
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
