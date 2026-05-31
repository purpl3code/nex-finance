import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AppleEmoji } from './ui/AppleEmoji';
import { Budget, Category } from '../types';
import { GlassInput } from './ui/GlassInput';
import { CurrencyInput } from './ui/CurrencyInput';
import { GlassButton } from './ui/GlassButton';
import { ModalShell, ModalBody, ModalFooter } from './ui/ModalShell';
import { PageShell } from './ui/PageShell';
import { PageHeader } from './ui/PageHeader';
import { MobileFab } from './ui/MobileFab';
import { GlassSelect } from './ui/GlassSelect';
import { GlassCard } from './ui/GlassCard';
import { Trash2, Edit2, Plus, AlertTriangle, CheckCircle } from 'lucide-react';
import { EmptyState } from './ui/EmptyState';

interface BudgetManagerProps {
  budgets: Budget[];
  categories: Category[];
  currentMonth: number;
  currentYear: number;
  onAddBudget: (budget: any) => void;
  onEditBudget: (id: string, budget: any) => void;
  onDeleteBudget: (id: string) => void;
  getCategorySpending: (categoryId: string, month: number, year: number) => number;
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({
  budgets,
  categories,
  currentMonth: initialMonth,
  currentYear: initialYear,
  onAddBudget,
  onEditBudget,
  onDeleteBudget,
  getCategorySpending
}) => {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const [form, setForm] = useState({ categoryId: '', amountLimit: '', alertAtPercent: '80' });

  // Filter budgets for current view
  const currentBudgets = budgets.filter(b => b.month === selectedMonth && b.year === selectedYear);
  
  // Find categories that don't have budget yet
  const categoriesWithoutBudget = categories
    .filter(c => c.kind === 'expense')
    .filter(c => !currentBudgets.find(b => b.categoryId === c.id));

  // Sort budgets by usage percentage (highest first)
  const sortedBudgets = [...currentBudgets].sort((a, b) => {
    const spentA = getCategorySpending(a.categoryId, selectedMonth, selectedYear);
    const spentB = getCategorySpending(b.categoryId, selectedMonth, selectedYear);
    return (spentB / b.amountLimit) - (spentA / a.amountLimit);
  });

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const openModal = (budget?: Budget) => {
    if (budget) {
      setEditingBudget(budget);
      setForm({
        categoryId: budget.categoryId,
        amountLimit: budget.amountLimit.toString(),
        alertAtPercent: budget.alertAtPercent.toString()
      });
    } else {
      setEditingBudget(null);
      setForm({ categoryId: '', amountLimit: '', alertAtPercent: '80' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      month: selectedMonth,
      year: selectedYear,
      categoryId: form.categoryId,
      amountLimit: parseFloat(form.amountLimit),
      alertAtPercent: parseInt(form.alertAtPercent)
    };

    if (editingBudget) {
      onEditBudget(editingBudget.id, payload);
    } else {
      onAddBudget(payload);
    }
    setIsModalOpen(false);
  };

  const getCategory = (id: string) => categories.find(c => c.id === id);

  // Top spending categories without budget (Suggestion)
  const suggestions = categoriesWithoutBudget
     .map(c => ({ category: c, spent: getCategorySpending(c.id, selectedMonth, selectedYear) }))
     .filter(item => item.spent > 0)
     .sort((a, b) => b.spent - a.spent)
     .slice(0, 3);

  return (
    <PageShell>
      <PageHeader 
        title="Orçamentos" 
        subtitle="Defina limites de gastos por categoria para controlar suas finanças."
        actions={
          <GlassButton onClick={() => openModal()} icon={<Plus size={18} />} className="hidden md:flex">Novo Orçamento</GlassButton>
        }
        controls={
          <div className="flex gap-2 w-full sm:w-auto">
             <div className="w-32">
               <GlassSelect 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  options={Array.from({length: 12}, (_, i) => i).map(m => ({
                    value: m,
                    label: new Date(2000, m, 1).toLocaleDateString('pt-BR', {month: 'long'})
                  }))}
               />
             </div>
             <div className="w-24">
               <GlassSelect 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  options={Array.from({length: 5}, (_, i) => new Date().getFullYear() - 1 + i).map(y => ({
                    value: y,
                    label: String(y)
                  }))}
               />
             </div>
          </div>
        }
      />

      {/* Suggestion Box */}
      {suggestions.length > 0 && (
         <div className="bg-white/5 border border-white/10 p-4 rounded-2xl shadow-sm backdrop-blur-md">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Sugerido para você</h3>
           <div className="flex flex-wrap gap-2">
              {suggestions.map(s => (
                 <button key={s.category.id} onClick={() => { setForm({...form, categoryId: s.category.id}); openModal(); }} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl text-sm text-slate-200 transition-colors border border-white/5">
                    <span><AppleEmoji emoji={s.category.emoji} /> {s.category.name}</span>
                    <span className="text-slate-400 text-xs bg-black/20 px-1.5 py-0.5 rounded-md">Gastou: {formatCurrency(s.spent)}</span>
                    <Plus size={14} className="text-[rgb(var(--c-primary-400))] ml-1"/>
                 </button>
              ))}
           </div>
         </div>
      )}

      {/* Budgets List */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } }}>
        {sortedBudgets.map(budget => {
           const category = getCategory(budget.categoryId);
           const spent = getCategorySpending(budget.categoryId, selectedMonth, selectedYear);
           const percent = (spent / budget.amountLimit) * 100;
           const isDanger = percent >= 100;
           const isWarning = percent >= budget.alertAtPercent && !isDanger;
           
           return (
             <motion.div key={budget.id} variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } } }}>
              <GlassCard className="p-6 relative group hover:border-white/10 transition-colors">
                <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-4">
                      <div className="text-3xl bg-white/5 p-2 rounded-xl border border-white/5"><AppleEmoji emoji={category?.emoji} /></div>
                      <div>
                         <h3 className="font-semibold text-white">{category?.name}</h3>
                         <div className="text-xs font-bold flex gap-2 mt-1">
                            {isDanger && <span className="text-red-400 flex items-center gap-1"><AlertTriangle size={12}/> ESTOURADO</span>}
                            {isWarning && <span className="text-amber-400 flex items-center gap-1"><AlertTriangle size={12}/> ATENÇÃO</span>}
                            {!isDanger && !isWarning && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={12}/> DENTRO DO LIMITE</span>}
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(budget)} className="p-2 text-[rgb(var(--c-primary-400))] hover:bg-white/10 rounded-lg transition-colors"><Edit2 size={16}/></button>
                      <button onClick={() => setDeletingBudgetId(budget.id)} className="p-2 text-red-400 hover:bg-white/10 rounded-lg transition-colors"><Trash2 size={16}/></button>
                   </div>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Gasto: <span className="text-slate-200 font-medium">{formatCurrency(spent)}</span></span>
                      <span className="text-slate-400">Limite: <span className="text-slate-200 font-medium">{formatCurrency(budget.amountLimit)}</span></span>
                   </div>
                   <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/5">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 shadow-sm ${isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      ></div>
                   </div>
                   <div className="text-right text-xs text-slate-500 font-medium">{percent.toFixed(0)}% utilizado</div>
                </div>
             </GlassCard>
              </motion.div>
           );
        })}
      </motion.div>
      
      {sortedBudgets.length === 0 && (
         <EmptyState
           variant="budgets"
           title="Nenhum orçamento definido para este mês."
           description="Defina limites de gastos por categoria e acompanhe visualmente o quanto já usou."
           actionLabel="Criar Primeiro Orçamento"
           onAction={() => openModal()}
         />
      )}

      {/* Modal */}
      <ModalShell isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}>
         <ModalBody>
            <form id="budget-form" onSubmit={handleSubmit} className="space-y-3">
               <GlassSelect 
                  label="Categoria"
                  value={form.categoryId} 
                  onChange={e => setForm({...form, categoryId: e.target.value})}
                  disabled={!!editingBudget}
                  required
                  options={[
                    { value: '', label: 'Selecione...' },
                    ...categories.filter(c => c.kind === 'expense').map(c => ({ value: c.id, label: <span className="flex items-center gap-1.5"><AppleEmoji emoji={c.emoji}/> {c.name}</span> }))
                  ]}
               />
               <CurrencyInput 
                  label="Limite (R$)" 
                  value={form.amountLimit} 
                  onChange={val => setForm({...form, amountLimit: val})} 
                  required 
               />
               <div>
                  <GlassInput 
                     label="Alertar em (%)" 
                     type="number" 
                     min="1" 
                     max="100" 
                     value={form.alertAtPercent} 
                     onChange={e => setForm({...form, alertAtPercent: e.target.value})} 
                     required 
                  />
                  <p className="text-xs text-slate-500 mt-1 ml-1">Quando o gasto atingir essa %, a barra ficará amarela.</p>
               </div>
            </form>
         </ModalBody>
         <ModalFooter>
            <GlassButton type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</GlassButton>
            <GlassButton type="submit" form="budget-form">Salvar</GlassButton>
         </ModalFooter>
      </ModalShell>

      <ModalShell isOpen={!!deletingBudgetId} onClose={() => setDeletingBudgetId(null)} title="Excluir Orçamento">
        <ModalBody>
          <div className="text-center space-y-4 py-4">
            <div className="bg-red-500/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2 border border-red-500/20">
               <AlertTriangle size={32} className="text-red-500" />
            </div>
            <div>
              <p className="text-lg text-slate-200">Tem certeza que deseja excluir este orçamento?</p>
              <p className="text-sm text-slate-400 mt-2">
                O histórico de gastos desta categoria não será afetado.
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <GlassButton type="button" variant="ghost" onClick={() => setDeletingBudgetId(null)}>Cancelar</GlassButton>
          <GlassButton type="button" variant="danger" onClick={() => {
            if (deletingBudgetId) {
              onDeleteBudget(deletingBudgetId);
              setDeletingBudgetId(null);
            }
          }}>Confirmar Exclusão</GlassButton>
        </ModalFooter>
      </ModalShell>

      <MobileFab
        visible={!isModalOpen}
        actions={[
          { 
            id: 'new-budget', 
            label: 'Novo Orçamento', 
            icon: <Plus size={24} />, 
            onClick: () => openModal() 
          }
        ]}
      />
    </PageShell>
  );
};