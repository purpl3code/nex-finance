import React, { useState } from 'react';
import { Goal } from '../types';
import { computeGoalStats, formatCurrency } from '../utils/goalHelpers';
import { Edit2, Plus, Archive, Target, Clock, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';
import { GlassButton } from './ui/GlassButton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GlassCard } from './ui/GlassCard';
import { motion } from 'framer-motion';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onArchive: (id: string) => void;
  onAddValue: (id: string, amount: number) => void;
  onDelete: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onArchive, onAddValue, onDelete }) => {
  const stats = computeGoalStats(goal);
  const [isHovered, setIsHovered] = useState(false);

  const isComplete = stats.progressPercent >= 100;
  const progressColor = isComplete
    ? 'from-emerald-400 to-teal-500'
    : stats.isDelayed
    ? 'from-amber-500 to-orange-500'
    : 'from-[rgb(var(--c-primary-400))] to-[rgb(var(--c-primary-600))]';

  const progressGlow = isComplete
    ? 'rgba(16,185,129,0.5)'
    : stats.isDelayed
    ? 'rgba(245,158,11,0.4)'
    : 'var(--accent-glow)';

  return (
    <GlassCard 
      className="p-6 relative group overflow-hidden"
      variant={isComplete ? 'success' : stats.isDelayed ? 'warning' : 'default'}
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

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-0.5">
            {isComplete && (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            )}
            <h3 className="text-lg font-bold text-white tracking-tight truncate">{goal.title}</h3>
          </div>
          {goal.description && (
            <p className="text-slate-500 text-xs line-clamp-1">{goal.description}</p>
          )}
        </div>
        
        <div className={`flex gap-1 transition-opacity duration-200 shrink-0 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button 
            onClick={() => onEdit(goal)} 
            className="p-1.5 bg-white/5 hover:bg-white/12 rounded-lg text-slate-400 hover:text-white transition-all duration-150 hover:scale-105"
            title="Editar"
          >
            <Edit2 size={13} />
          </button>
          <button 
            onClick={() => onArchive(goal.id)} 
            className="p-1.5 bg-white/5 hover:bg-white/12 rounded-lg text-slate-400 hover:text-white transition-all duration-150 hover:scale-105"
            title={goal.isArchived ? 'Desarquivar' : 'Arquivar'}
          >
            <Archive size={13} />
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
        <span className="text-3xl font-bold text-white tabular-nums">{formatCurrency(goal.currentAmount)}</span>
        <span className="text-sm text-slate-500 mb-1.5 font-medium">de {formatCurrency(goal.targetAmount)}</span>
      </div>

      {/* Progress percentage */}
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
          isComplete ? 'text-emerald-400' : stats.isDelayed ? 'text-amber-400' : 'text-slate-400'
        }`}>
          {Math.min(Math.round(stats.progressPercent), 100)}%
        </span>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {/* Monthly Contribution */}
        {goal.monthlyContribution > 0 ? (
          <div className="bg-white/5 p-3 rounded-xl border border-white/8">
            <p className="text-slate-500 text-[10px] flex items-center gap-1 mb-1 uppercase tracking-wider font-bold">
              <Clock size={10} /> Estimativa
            </p>
            <p className="text-slate-200 font-semibold text-sm">
              {stats.monthsToGoal} meses
              {stats.estimatedFinishDate && (
                <span className="text-slate-500 font-normal text-xs ml-1">
                  ({format(stats.estimatedFinishDate, 'MMM/yy', { locale: ptBR })})
                </span>
              )}
            </p>
          </div>
        ) : (
          <div className="bg-white/5 p-3 rounded-xl border border-white/8 opacity-50">
            <p className="text-slate-500 text-[10px] flex items-center gap-1 mb-1 uppercase tracking-wider font-bold">
              <Clock size={10} /> Estimativa
            </p>
            <p className="text-slate-400 text-xs italic">Defina aporte mensal</p>
          </div>
        )}

        {/* Deadline or Remaining */}
        {goal.deadline ? (
          <div className={`p-3 rounded-xl border ${stats.isDelayed ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/8'}`}>
            <p className={`${stats.isDelayed ? 'text-amber-400' : 'text-slate-500'} text-[10px] flex items-center gap-1 mb-1 uppercase tracking-wider font-bold`}>
              {stats.isDelayed ? <AlertTriangle size={10}/> : <Target size={10} />}
              {stats.isDelayed ? 'Atrasado' : 'Prazo'}
            </p>
            <p className="text-slate-200 font-semibold text-sm">
              {format(new Date(goal.deadline), 'dd/MM/yyyy')}
            </p>
            {stats.requiredMonthlyForDeadline && stats.remaining > 0 && (
              <p className="text-[10px] text-slate-500 mt-0.5">
                Necessário: <span className="text-white font-bold">{formatCurrency(stats.requiredMonthlyForDeadline)}/mês</span>
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white/5 p-3 rounded-xl border border-white/8">
            <p className="text-slate-500 text-[10px] flex items-center gap-1 mb-1 uppercase tracking-wider font-bold">
              <Target size={10} /> Restante
            </p>
            <p className="text-slate-200 font-semibold text-sm">{formatCurrency(stats.remaining)}</p>
          </div>
        )}
      </div>

      {/* CTA */}
      {!isComplete && (
        <div className="mt-5 pt-4 border-t border-white/6">
          <GlassButton 
            onClick={() => onAddValue(goal.id, 0)}
            size="sm"
            icon={<Plus size={14}/>}
            className="w-full justify-center"
          >
            Adicionar Valor
          </GlassButton>
        </div>
      )}

      {isComplete && (
        <div className="mt-5 pt-4 border-t border-emerald-500/20 flex items-center justify-center gap-2 text-emerald-400 text-sm font-bold">
          <CheckCircle2 size={16} />
          Meta Concluída! 🎉
        </div>
      )}
    </GlassCard>
  );
};
