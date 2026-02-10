import React, { useState } from 'react';
import { Goal } from '../types';
import { computeGoalStats, formatCurrency } from '../utils/goalHelpers';
import { Edit2, Plus, Archive, Calendar, Target, Clock, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onArchive: (id: string) => void;
  onAddValue: (id: string, amount: number) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onArchive, onAddValue }) => {
  const stats = computeGoalStats(goal);
  const [isHovered, setIsHovered] = useState(false);

  // Quick Add Value Logic within Card (optional, or trigger modal)
  // For now we trigger the parent's modal handler

  return (
    <div 
      className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-sm relative group overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Progress Tint */}
      <div 
        className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-1000 ease-out" 
        style={{ width: `${stats.progressPercent}%` }} 
      />

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">{goal.title}</h3>
          {goal.description && <p className="text-slate-400 text-xs mt-1 line-clamp-1">{goal.description}</p>}
        </div>
        <div className={`flex gap-2 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
           <button onClick={() => onEdit(goal)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors" title="Editar">
             <Edit2 size={16} />
           </button>
           <button onClick={() => onArchive(goal.id)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors" title="Arquivar">
             <Archive size={16} />
           </button>
        </div>
      </div>

      <div className="flex items-end gap-2 mb-2">
        <span className="text-3xl font-bold text-white">{formatCurrency(goal.currentAmount)}</span>
        <span className="text-sm text-slate-500 mb-1.5 font-medium">de {formatCurrency(goal.targetAmount)}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-700/50 rounded-full h-2.5 mb-4 overflow-hidden">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-out" 
          style={{ width: `${stats.progressPercent}%` }} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
         {/* Monthly Contribution Info */}
         {goal.monthlyContribution > 0 ? (
            <div className="bg-slate-900/50 p-2.5 rounded border border-slate-700/50">
               <p className="text-slate-400 text-xs flex items-center gap-1 mb-1">
                  <Clock size={12} /> Estimativa
               </p>
               <p className="text-slate-200 font-medium">
                  {stats.monthsToGoal} meses
                  {stats.estimatedFinishDate && (
                     <span className="text-slate-500 font-normal ml-1">
                        (até {format(stats.estimatedFinishDate, 'MMM/yy', { locale: ptBR })})
                     </span>
                  )}
               </p>
            </div>
         ) : (
            <div className="bg-slate-900/50 p-2.5 rounded border border-slate-700/50 opacity-60">
               <p className="text-slate-400 text-xs flex items-center gap-1 mb-1"><Clock size={12} /> Estimativa</p>
               <p className="text-slate-300 text-xs italic">Defina um aporte mensal</p>
            </div>
         )}

         {/* Deadline Info */}
         {goal.deadline ? (
            <div className={`p-2.5 rounded border ${stats.isDelayed ? 'bg-amber-900/10 border-amber-500/30' : 'bg-slate-900/50 border-slate-700/50'}`}>
               <p className={`${stats.isDelayed ? 'text-amber-400' : 'text-slate-400'} text-xs flex items-center gap-1 mb-1`}>
                  {stats.isDelayed ? <AlertTriangle size={12}/> : <Target size={12} />} 
                  {stats.isDelayed ? 'Atenção' : 'Prazo'}
               </p>
               <p className="text-slate-200 font-medium">
                  {format(new Date(goal.deadline), 'dd/MM/yyyy')}
               </p>
               {stats.requiredMonthlyForDeadline && stats.remaining > 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                     Necessário: <span className="text-white font-bold">{formatCurrency(stats.requiredMonthlyForDeadline)}</span>/mês
                  </p>
               )}
            </div>
         ) : (
            <div className="bg-slate-900/50 p-2.5 rounded border border-slate-700/50">
               <p className="text-slate-400 text-xs flex items-center gap-1 mb-1"><Target size={12} /> Restante</p>
               <p className="text-slate-200 font-medium">{formatCurrency(stats.remaining)}</p>
            </div>
         )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-700/50 flex justify-end">
         <Button 
            onClick={() => onAddValue(goal.id, 0)} // 0 triggers open modal with 0
            size="sm" 
            variant="secondary" 
            icon={<Plus size={14}/>}
            className="w-full md:w-auto"
         >
            Adicionar Valor
         </Button>
      </div>
    </div>
  );
};
