import React, { useState } from 'react';
import { Debt } from '../types';
import { computeDebtStats, formatCurrency } from '../utils/debtHelpers';
import { Edit2, Trash2, DollarSign, Clock, AlertTriangle, Calendar, CheckCircle2, User, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GlassCard } from './ui/GlassCard';
import { motion } from 'framer-motion';

interface DebtCardProps {
  debt: Debt;
  onEdit: (debt: Debt) => void;
  onPay: (id: string) => void;
  onSettle: (id: string) => void;
  onDelete: () => void;
}

export const DebtCard: React.FC<DebtCardProps> = ({ debt, onEdit, onPay, onSettle, onDelete }) => {
  const stats = computeDebtStats(debt);
  const [isHovered, setIsHovered] = useState(false);

  const isComplete = stats.progressPercent >= 100 || debt.isSettled;
  
  // Progress colors: red→amber→green as debt is paid off
  const progressColor = isComplete
    ? 'from-emerald-400 to-teal-500'
    : stats.progressPercent >= 50
    ? 'from-amber-400 to-yellow-500'
    : 'from-red-400 to-rose-500';

  const progressGlow = isComplete
    ? 'rgba(16,185,129,0.5)'
    : stats.progressPercent >= 50
    ? 'rgba(245,158,11,0.4)'
    : 'rgba(239,68,68,0.4)';

  return (
    <GlassCard
      className="p-6 relative group overflow-hidden"
      variant={isComplete ? 'success' : stats.isOverdue ? 'danger' : 'default'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated progress bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5 overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${progressColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(stats.progressPercent, 100)}%` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          style={{ boxShadow: `0 0 8px ${progressGlow}` }}
        />
      </div>

      {/* Completion glow overlay */}
      {isComplete && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
      )}

      {/* Overdue glow */}
      {stats.isOverdue && !isComplete && (
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-0.5">
            {isComplete && (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            )}
            {stats.isOverdue && !isComplete && (
              <AlertTriangle size={16} className="text-red-400 shrink-0" />
            )}
            <h3 className="text-lg font-bold text-white tracking-tight truncate">{debt.title}</h3>
          </div>
          {debt.creditor && (
            <p className="text-slate-500 text-xs flex items-center gap-1 line-clamp-1">
              <User size={10} className="shrink-0" />
              {debt.creditor}
            </p>
          )}
          {debt.description && !debt.creditor && (
            <p className="text-slate-500 text-xs line-clamp-1">{debt.description}</p>
          )}
        </div>

        <div className={`flex gap-1 transition-opacity duration-200 shrink-0 ${isHovered ? 'opacity-100' : 'opacity-0 sm:opacity-0'} opacity-100 sm:opacity-0 sm:group-hover:opacity-100`}>
          <button
            onClick={() => onEdit(debt)}
            className="p-1.5 bg-white/5 hover:bg-white/12 rounded-lg text-slate-400 hover:text-white transition-all duration-150 hover:scale-105"
            title="Editar"
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={() => onSettle(debt.id)}
            className="p-1.5 bg-white/5 hover:bg-white/12 rounded-lg text-slate-400 hover:text-white transition-all duration-150 hover:scale-105"
            title={debt.isSettled ? 'Reabrir' : 'Marcar como quitada'}
          >
            {debt.isSettled ? <RotateCcw size={13} /> : <CheckCircle2 size={13} />}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-all duration-150 hover:scale-105"
            title="Excluir"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Progress amounts */}
      <div className="flex items-end gap-2 mb-1">
        <span className="text-3xl font-bold text-white tabular-nums">{formatCurrency(stats.remaining)}</span>
        <span className="text-sm text-slate-500 mb-1.5 font-medium">restante</span>
      </div>

      {/* Secondary info */}
      <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
        <span>Total: {formatCurrency(debt.totalAmount)}</span>
        <span className="text-white/10">•</span>
        <span className="text-emerald-400">Pago: {formatCurrency(debt.paidAmount)}</span>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${progressColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(stats.progressPercent, 100)}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />
        </div>
        <span className={`text-xs font-bold tabular-nums shrink-0 ${
          isComplete ? 'text-emerald-400' : stats.progressPercent >= 50 ? 'text-amber-400' : 'text-red-400'
        }`}>
          {Math.min(Math.round(stats.progressPercent), 100)}%
        </span>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {/* Monthly Payment */}
        {debt.monthlyPayment > 0 ? (
          <div className="bg-white/5 p-3 rounded-xl border border-white/8">
            <p className="text-slate-500 text-[10px] flex items-center gap-1 mb-1 uppercase tracking-wider font-bold">
              <Clock size={10} /> Estimativa
            </p>
            <p className="text-slate-200 font-semibold text-sm">
              {stats.monthsToPayOff} meses
              {stats.estimatedPayOffDate && (
                <span className="text-slate-500 font-normal text-xs ml-1">
                  ({format(stats.estimatedPayOffDate, 'MMM/yy', { locale: ptBR })})
                </span>
              )}
            </p>
          </div>
        ) : (
          <div className="bg-white/5 p-3 rounded-xl border border-white/8 opacity-50">
            <p className="text-slate-500 text-[10px] flex items-center gap-1 mb-1 uppercase tracking-wider font-bold">
              <Clock size={10} /> Estimativa
            </p>
            <p className="text-slate-400 text-xs italic">Defina parcela mensal</p>
          </div>
        )}

        {/* Due Date or Monthly Payment */}
        {debt.dueDate ? (
          <div className={`p-3 rounded-xl border ${stats.isOverdue ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/8'}`}>
            <p className={`${stats.isOverdue ? 'text-red-400' : 'text-slate-500'} text-[10px] flex items-center gap-1 mb-1 uppercase tracking-wider font-bold`}>
              {stats.isOverdue ? <AlertTriangle size={10} /> : <Calendar size={10} />}
              {stats.isOverdue ? 'Vencida' : 'Vencimento'}
            </p>
            <p className="text-slate-200 font-semibold text-sm">
              {format(new Date(debt.dueDate), 'dd/MM/yyyy')}
            </p>
          </div>
        ) : (
          <div className="bg-white/5 p-3 rounded-xl border border-white/8">
            <p className="text-slate-500 text-[10px] flex items-center gap-1 mb-1 uppercase tracking-wider font-bold">
              <DollarSign size={10} /> Parcela
            </p>
            <p className="text-slate-200 font-semibold text-sm">
              {debt.monthlyPayment > 0 ? formatCurrency(debt.monthlyPayment) + '/mês' : 'Não definida'}
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      {!isComplete && (
        <div className="mt-5 pt-4 border-t border-white/6">
          <button
            onClick={() => onPay(debt.id)}
            className="
              w-full relative flex items-center justify-center gap-2
              py-2.5 px-4 rounded-xl
              font-semibold text-sm text-white
              overflow-hidden group/cta
              transition-all duration-300
              hover:-translate-y-0.5
              focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60
            "
            style={{
              background: 'linear-gradient(135deg, rgb(16, 185, 129) 0%, rgb(5, 150, 105) 100%)',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(110, 231, 183, 0.25)',
            }}
          >
            {/* Shimmer sweep on hover */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/cta:translate-x-full transition-transform duration-700 pointer-events-none" />
            {/* Top highlight */}
            <span className="absolute top-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
            <DollarSign size={15} className="transition-transform duration-200 group-hover/cta:scale-110" />
            <span>Registrar Pagamento</span>
          </button>
        </div>
      )}

      {isComplete && (
        <div className="mt-5 pt-4 border-t border-emerald-500/20 flex items-center justify-center gap-2 text-emerald-400 text-sm font-bold">
          <CheckCircle2 size={16} />
          Dívida Quitada! 🎉
        </div>
      )}
    </GlassCard>
  );
};
