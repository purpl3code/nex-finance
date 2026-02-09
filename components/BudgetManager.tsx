import React, { useState } from 'react';
import { Budget, Category } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { PieChart, Trash2, Edit2, Plus, AlertTriangle, CheckCircle } from 'lucide-react';

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
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
        <div>
           <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
             <PieChart size={20} className="text-blue-500" />
             Orçamentos
           </h2>
           <p className="text-xs text-slate-400">Defina limites de gastos por categoria.</p>
        </div>
        <div className="flex gap-2">
           <select className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
              {Array.from({length: 12}, (_, i) => i).map(m => <option key={m} value={m}>{new Date(2000, m, 1).toLocaleDateString('pt-BR', {month: 'long'})}</option>)}
           </select>
           <select className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
              {Array.from({length: 5}, (_, i) => new Date().getFullYear() - 1 + i).map(y => <option key={y} value={y}>{y}</option>)}
           </select>
           <Button onClick={() => openModal()} icon={<Plus size={16} />}>Novo Orçamento</Button>
        </div>
      </div>

      {/* Suggestion Box */}
      {suggestions.length > 0 && (
         <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 p-4 rounded-xl">
           <h3 className="text-sm font-medium text-slate-300 mb-2">Categorias com gastos sem orçamento:</h3>
           <div className="flex flex-wrap gap-2">
              {suggestions.map(s => (
                 <button key={s.category.id} onClick={() => { setForm({...form, categoryId: s.category.id}); openModal(); }} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-xs text-slate-200 transition-colors">
                    <span>{s.category.emoji} {s.category.name}</span>
                    <span className="text-slate-400">Gastou: {formatCurrency(s.spent)}</span>
                    <Plus size={14} className="text-blue-400"/>
                 </button>
              ))}
           </div>
         </div>
      )}

      {/* Budgets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedBudgets.map(budget => {
           const category = getCategory(budget.categoryId);
           const spent = getCategorySpending(budget.categoryId, selectedMonth, selectedYear);
           const percent = (spent / budget.amountLimit) * 100;
           const isDanger = percent >= 100;
           const isWarning = percent >= budget.alertAtPercent && !isDanger;
           
           return (
             <div key={budget.id} className="bg-slate-800 border border-slate-700 p-5 rounded-xl shadow-sm relative group">
                <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-3">
                      <div className="text-2xl bg-slate-700/50 p-2 rounded-lg">{category?.emoji}</div>
                      <div>
                         <h3 className="font-semibold text-white">{category?.name}</h3>
                         <div className="text-xs font-medium flex gap-2 mt-0.5">
                            {isDanger && <span className="text-red-400 flex items-center gap-1"><AlertTriangle size={12}/> Estourado</span>}
                            {isWarning && <span className="text-amber-400 flex items-center gap-1"><AlertTriangle size={12}/> Atenção</span>}
                            {!isDanger && !isWarning && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={12}/> Dentro do limite</span>}
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(budget)} className="p-1.5 text-blue-400 hover:bg-slate-700 rounded"><Edit2 size={16}/></button>
                      <button onClick={() => { if(window.confirm('Excluir orçamento?')) onDeleteBudget(budget.id) }} className="p-1.5 text-red-400 hover:bg-slate-700 rounded"><Trash2 size={16}/></button>
                   </div>
                </div>

                <div className="space-y-1 mb-1">
                   <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Gasto: <span className="text-slate-200">{formatCurrency(spent)}</span></span>
                      <span className="text-slate-400">Limite: <span className="text-slate-200">{formatCurrency(budget.amountLimit)}</span></span>
                   </div>
                   <div className="h-2.5 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      ></div>
                   </div>
                   <div className="text-right text-xs text-slate-500">{percent.toFixed(0)}%</div>
                </div>
             </div>
           );
        })}
      </div>
      
      {sortedBudgets.length === 0 && (
         <div className="text-center py-10 text-slate-500 border border-dashed border-slate-700 rounded-xl">
            <PieChart size={48} className="mx-auto mb-3 opacity-20" />
            <p>Nenhum orçamento definido para este mês.</p>
         </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}>
         <form onSubmit={handleSubmit} className="space-y-4">
            <div>
               <label className="block text-sm text-slate-300 mb-1">Categoria</label>
               <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" 
                  value={form.categoryId} 
                  onChange={e => setForm({...form, categoryId: e.target.value})}
                  disabled={!!editingBudget} // Don't change category on edit to avoid duplicates easily
                  required
               >
                  <option value="">Selecione...</option>
                  {categories.filter(c => c.kind === 'expense').map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
               </select>
            </div>
            <div>
               <label className="block text-sm text-slate-300 mb-1">Limite (R$)</label>
               <input type="number" step="0.01" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={form.amountLimit} onChange={e => setForm({...form, amountLimit: e.target.value})} required />
            </div>
            <div>
               <label className="block text-sm text-slate-300 mb-1">Alertar em (%)</label>
               <input type="number" min="1" max="100" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={form.alertAtPercent} onChange={e => setForm({...form, alertAtPercent: e.target.value})} required />
               <p className="text-xs text-slate-500 mt-1">Quando o gasto atingir essa %, a barra ficará amarela.</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
               <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
               <Button type="submit">Salvar</Button>
            </div>
         </form>
      </Modal>
    </div>
  );
};