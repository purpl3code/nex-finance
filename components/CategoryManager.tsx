
import React, { useState } from 'react';
import { Category, CategoryGroup, TransactionType } from '../types';
import { PageShell } from './ui/PageShell';
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Plus, Edit2, Archive, AlertTriangle, ArrowRightLeft, Lock, CheckCircle, RotateCcw } from 'lucide-react';

interface CategoryManagerProps {
  categories: Category[];
  transactions: any[]; // Used to check for usage
  creditCardTransactions: any[];
  onAdd: (cat: any) => void;
  onEdit: (id: string, updates: any) => void;
  onArchive: (id: string) => void;
  onReassign: (oldId: string, newId: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  transactions,
  creditCardTransactions,
  onAdd,
  onEdit,
  onArchive,
  onReassign
}) => {
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [showArchived, setShowArchived] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [targetCategory, setTargetCategory] = useState<Category | null>(null); // For archive/reassign

  // Form State
  const [form, setForm] = useState({
    name: '',
    emoji: '',
    group: 'Personalizado' as CategoryGroup,
    type: 'expense' as TransactionType,
    color: '#3b82f6'
  });

  // Archive State
  const [usageCount, setUsageCount] = useState(0);
  const [reassignId, setReassignId] = useState('');

  const displayedCategories = categories.filter(c => 
    c.kind === activeTab && (showArchived ? true : !c.isArchived)
  );

  const groups: CategoryGroup[] = ['Essencial', 'Estilo de Vida', 'Investimentos e Dívidas', 'Renda', 'Personalizado'];
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const resetForm = () => {
    setForm({
      name: '',
      emoji: '🏷️',
      group: 'Personalizado',
      type: activeTab,
      color: '#3b82f6'
    });
    setEditingCategory(null);
  };

  const handleOpenModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setForm({
        name: cat.name,
        emoji: cat.emoji,
        group: cat.group,
        type: cat.kind,
        color: cat.color || '#3b82f6'
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate duplicates
    const duplicate = categories.find(c => 
      c.kind === form.type && 
      c.name.toLowerCase() === form.name.toLowerCase() && 
      c.id !== editingCategory?.id
    );

    if (duplicate) {
      alert('Já existe uma categoria com este nome.');
      return;
    }

    if (editingCategory) {
      onEdit(editingCategory.id, {
        name: form.name,
        emoji: form.emoji,
        group: form.group,
        color: form.color
      });
    } else {
      onAdd({
        name: form.name,
        emoji: form.emoji,
        group: form.group,
        kind: form.type,
        color: form.color
      });
    }
    setIsModalOpen(false);
  };

  const handleInitiateArchive = (cat: Category) => {
    // Check usage
    const txUsage = transactions.filter(t => t.categoryId === cat.id).length;
    const cardUsage = creditCardTransactions.filter(t => t.categoryId === cat.id).length;
    const total = txUsage + cardUsage;

    setTargetCategory(cat);
    setUsageCount(total);
    setReassignId('');
    setIsArchiveModalOpen(true);
  };

  const handleConfirmArchive = () => {
    if (!targetCategory) return;

    if (reassignId) {
      onReassign(targetCategory.id, reassignId);
    } else {
      onArchive(targetCategory.id);
    }
    setIsArchiveModalOpen(false);
    setTargetCategory(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
         <div className="flex bg-slate-800 p-1 rounded-lg">
            <button onClick={() => setActiveTab('expense')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'expense' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-slate-200'}`}>Despesas</button>
            <button onClick={() => setActiveTab('income')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}>Entradas</button>
         </div>
         <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
               <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500/20" />
               Mostrar Arquivadas
            </label>
            <Button onClick={() => handleOpenModal()} icon={<Plus size={16}/>}>Nova Categoria</Button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {displayedCategories.map(cat => (
            <div key={cat.id} className={`bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center justify-between group ${cat.isArchived ? 'opacity-50' : ''}`}>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-slate-700/50" style={{ color: cat.color }}>
                     {cat.emoji}
                  </div>
                  <div>
                     <div className="flex items-center gap-2">
                        <span className={`font-semibold text-slate-200 ${cat.isArchived ? 'line-through' : ''}`}>{cat.name}</span>
                        {cat.isSystem && <span title="Sistema" className="bg-blue-900/30 text-blue-400 text-[10px] px-1.5 py-0.5 rounded border border-blue-500/20"><Lock size={10}/></span>}
                        {cat.isArchived && <span className="bg-slate-700 text-slate-400 text-[10px] px-1.5 py-0.5 rounded">Arquivada</span>}
                     </div>
                     <span className="text-xs text-slate-500">{cat.group}</span>
                  </div>
               </div>
               
               <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!cat.isArchived && (
                     <button onClick={() => handleOpenModal(cat)} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg" disabled={cat.isSystem && false}>
                        <Edit2 size={16} />
                     </button>
                  )}
                  {!cat.isSystem && !cat.isArchived && (
                     <button onClick={() => handleInitiateArchive(cat)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg" title="Arquivar">
                        <Archive size={16} />
                     </button>
                  )}
                  {cat.isArchived && !cat.isSystem && (
                     <button onClick={() => onEdit(cat.id, { isArchived: false })} className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded-lg" title="Restaurar">
                        <RotateCcw size={16} />
                     </button>
                  )}
               </div>
            </div>
         ))}
      </div>

      {/* CREATE/EDIT MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? 'Editar Categoria' : 'Nova Categoria'}>
         <form onSubmit={handleSubmit} className="space-y-4">
            <div>
               <label className="block text-sm text-slate-300 mb-1">Nome</label>
               <input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required maxLength={20} disabled={editingCategory?.isSystem} />
               {editingCategory?.isSystem && <p className="text-xs text-amber-500 mt-1">Nome protegido pelo sistema.</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm text-slate-300 mb-1">Ícone (Emoji)</label>
                  <input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-center text-xl" value={form.emoji} onChange={e => setForm({...form, emoji: e.target.value})} required maxLength={2} />
               </div>
               <div>
                  <label className="block text-sm text-slate-300 mb-1">Grupo</label>
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={form.group} onChange={e => setForm({...form, group: e.target.value as any})}>
                     {groups.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
               </div>
            </div>

            <div>
               <label className="block text-sm text-slate-300 mb-2">Cor</label>
               <div className="flex flex-wrap gap-3">
                  {colors.map(c => (
                     <button type="button" key={c} onClick={() => setForm({...form, color: c})} className={`w-8 h-8 rounded-full border-2 ${form.color === c ? 'border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                  ))}
               </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
               <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
               <Button type="submit">Salvar</Button>
            </div>
         </form>
      </Modal>

      {/* ARCHIVE/REASSIGN MODAL */}
      <Modal isOpen={isArchiveModalOpen} onClose={() => setIsArchiveModalOpen(false)} title="Arquivar Categoria">
         <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-lg flex gap-3">
               <AlertTriangle className="text-amber-500 shrink-0" size={24} />
               <div>
                  <h4 className="text-amber-500 font-bold mb-1">Atenção</h4>
                  <p className="text-sm text-slate-300">
                     Você está prestes a arquivar <strong>{targetCategory?.name}</strong>.
                     {usageCount > 0 ? ` Esta categoria é usada em ${usageCount} transações.` : ' Ela não está em uso.'}
                  </p>
               </div>
            </div>

            {usageCount > 0 && (
               <div>
                  <label className="block text-sm text-slate-300 mb-2">O que deseja fazer com os itens existentes?</label>
                  <div className="space-y-3">
                     <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-700 bg-slate-800/50 cursor-pointer hover:bg-slate-800">
                        <input type="radio" name="archiveAction" checked={!reassignId} onChange={() => setReassignId('')} className="mt-1" />
                        <div>
                           <span className="block text-sm font-medium text-white">Manter histórico (Recomendado)</span>
                           <span className="block text-xs text-slate-400">Itens antigos continuam nesta categoria, mas ela não aparecerá para novos lançamentos.</span>
                        </div>
                     </label>
                     <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-700 bg-slate-800/50 cursor-pointer hover:bg-slate-800">
                        <input type="radio" name="archiveAction" checked={!!reassignId} onChange={() => setReassignId(categories.find(c => c.id !== targetCategory?.id && c.kind === targetCategory?.kind && !c.isArchived)?.id || '')} className="mt-1" />
                        <div className="w-full">
                           <span className="block text-sm font-medium text-white">Mover para outra categoria</span>
                           {!!reassignId && (
                              <select 
                                 className="mt-2 w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
                                 value={reassignId}
                                 onChange={(e) => setReassignId(e.target.value)}
                                 onClick={(e) => e.stopPropagation()}
                              >
                                 {categories
                                    .filter(c => c.id !== targetCategory?.id && c.kind === targetCategory?.kind && !c.isArchived)
                                    .map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)
                                 }
                              </select>
                           )}
                        </div>
                     </label>
                  </div>
               </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
               <Button type="button" variant="ghost" onClick={() => setIsArchiveModalOpen(false)}>Cancelar</Button>
               <Button type="button" variant="danger" onClick={handleConfirmArchive}>
                  {reassignId ? 'Mover e Arquivar' : 'Arquivar'}
               </Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};
