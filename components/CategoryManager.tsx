
import React, { useState } from 'react';
import { COLORS } from '../constants';
import { AppleEmoji } from './ui/AppleEmoji';
import { Category, CategoryGroup, TransactionType } from '../types';
import { GlassButton } from './ui/GlassButton';
import { ModalShell, ModalBody, ModalFooter } from './ui/ModalShell';
import { GlassInput } from './ui/GlassInput';
import { GlassSelect } from './ui/GlassSelect';
import { GlassCard } from './ui/GlassCard';
import { GlassBadge } from './ui/GlassBadge';
import { Plus, Edit2, Archive, AlertTriangle, Lock, RotateCcw, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CategoryManagerProps {
  categories: Category[];
  transactions: any[];
  creditCardTransactions: any[];
  onAdd: (cat: any) => void;
  onEdit: (id: string, updates: any) => void;
  onArchive: (id: string) => void;
  onReassign: (oldId: string, newId: string) => void;
  onDelete: (id: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  transactions,
  creditCardTransactions,
  onAdd,
  onEdit,
  onArchive,
  onReassign,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [showArchived, setShowArchived] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [targetCategory, setTargetCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', emoji: '', group: 'Personalizado' as CategoryGroup, type: 'expense' as TransactionType, color: COLORS[0] });
  const [usageCount, setUsageCount] = useState(0);
  const [reassignId, setReassignId] = useState('');
  const [deleteReassignId, setDeleteReassignId] = useState('');

  const displayedCategories = categories.filter(c => c.kind === activeTab && (showArchived ? true : !c.isArchived));
  const expenseCount = categories.filter(c => c.kind === 'expense' && !c.isArchived).length;
  const incomeCount = categories.filter(c => c.kind === 'income' && !c.isArchived).length;
  const groups: CategoryGroup[] = ['Essencial', 'Estilo de Vida', 'Investimentos e D\u00edvidas', 'Renda', 'Personalizado'];
  const colors = COLORS;
  const getCategoryAccent = (category: Category) => category.kind === 'income' ? '#34D399' : category.color || COLORS[0];

  const resetForm = () => { setForm({ name: '', emoji: '', group: 'Personalizado', type: activeTab, color: COLORS[0] }); setEditingCategory(null); };

  const handleOpenModal = (cat?: Category) => {
    if (cat) { setEditingCategory(cat); setForm({ name: cat.name, emoji: cat.emoji, group: cat.group, type: cat.kind, color: cat.color || COLORS[0] }); }
    else { resetForm(); }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const duplicate = categories.find(c => c.kind === form.type && c.name.toLowerCase() === form.name.toLowerCase() && c.id !== editingCategory?.id);
    if (duplicate) { toast.error('Ja existe uma categoria com este nome.'); return; }
    if (editingCategory) { onEdit(editingCategory.id, { name: form.name, emoji: form.emoji, group: form.group, color: form.color }); }
    else { onAdd({ name: form.name, emoji: form.emoji, group: form.group, kind: form.type, color: form.color }); }
    setIsModalOpen(false);
  };

  const handleInitiateArchive = (cat: Category) => {
    const total = transactions.filter(t => t.categoryId === cat.id).length + creditCardTransactions.filter(t => t.categoryId === cat.id).length;
    setTargetCategory(cat); setUsageCount(total); setReassignId(''); setIsArchiveModalOpen(true);
  };

  const handleConfirmArchive = () => {
    if (!targetCategory) return;
    if (reassignId) { onReassign(targetCategory.id, reassignId); } else { onArchive(targetCategory.id); }
    setIsArchiveModalOpen(false); setTargetCategory(null);
  };

  const handleInitiateDelete = (cat: Category) => {
    const total = transactions.filter(t => t.categoryId === cat.id).length + creditCardTransactions.filter(t => t.categoryId === cat.id).length;
    setTargetCategory(cat); setUsageCount(total); setDeleteReassignId(''); setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!targetCategory) return;
    if (deleteReassignId) { onReassign(targetCategory.id, deleteReassignId); }
    onDelete(targetCategory.id);
    toast.success('Categoria excluida permanentemente.');
    setIsDeleteModalOpen(false); setTargetCategory(null);
  };

  return (
    <div className="min-h-full flex flex-col">
      <div className="sticky -top-4 -mx-5 -mt-5 px-5 pt-5 pb-3.5 bg-slate-950/85 backdrop-blur-xl z-10 mb-4">
         <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-xl bg-slate-950/45 p-1 shadow-inner">
               <button
                 onClick={() => setActiveTab('expense')}
                 aria-pressed={activeTab === 'expense'}
                 className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${activeTab === 'expense' ? 'bg-red-500/15 text-red-300 shadow-sm ring-1 ring-red-400/20' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
               >
                 Despesas <span className={`rounded-md px-1.5 py-0.5 text-[10px] tabular-nums ${activeTab === 'expense' ? 'bg-red-500/20 text-red-200' : 'bg-white/5 text-slate-500'}`}>{expenseCount}</span>
               </button>
               <button
                 onClick={() => setActiveTab('income')}
                 aria-pressed={activeTab === 'income'}
                 className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${activeTab === 'income' ? 'bg-emerald-500/15 text-emerald-300 shadow-sm ring-1 ring-emerald-400/20' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
               >
                 Entradas <span className={`rounded-md px-1.5 py-0.5 text-[10px] tabular-nums ${activeTab === 'income' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/5 text-slate-500'}`}>{incomeCount}</span>
               </button>
            </div>
            <label className="inline-flex items-center gap-2.5 rounded-xl bg-white/[0.03] px-3 py-2 text-xs sm:text-sm font-medium text-slate-400 cursor-pointer select-none hover:bg-white/[0.06] hover:text-slate-200 transition-colors">
               <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} className="h-4 w-4 rounded accent-emerald-400 focus:ring-emerald-400/30" />
               Mostrar arquivadas
            </label>
            <GlassButton onClick={() => handleOpenModal()} icon={<Plus size={16}/>} className="w-full sm:w-auto sm:ml-auto">Nova categoria</GlassButton>
         </div>
      </div>

      {displayedCategories.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-10 text-slate-500 border-dashed border-2 border-white/10 bg-transparent">
           <div className="bg-white/5 p-4 rounded-full mb-3 border border-white/5"><Archive size={24} className="opacity-50" /></div>
           <p className="text-sm">Nenhuma categoria encontrada.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-2">
           {displayedCategories.map(cat => (
              <GlassCard key={cat.id} className={`p-3 flex items-center justify-between group min-h-[76px] transition-all hover:border-white/15 hover:bg-white/[0.04] ${cat.isArchived ? 'opacity-55 grayscale' : ''}`}>
                 <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border shadow-sm" style={{ color: getCategoryAccent(cat), backgroundColor: `${getCategoryAccent(cat)}18`, borderColor: `${getCategoryAccent(cat)}45` }}>
                       <AppleEmoji emoji={cat.emoji} />
                    </div>
                    <div className="min-w-0 flex-1">
                       <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`font-semibold text-slate-100 text-sm truncate flex-1 min-w-0 ${cat.isArchived ? 'line-through' : ''}`} title={cat.name}>{cat.name}</span>
                          {cat.isSystem && <GlassBadge variant="secondary" className="px-1 py-0.5 shrink-0"><Lock size={10}/></GlassBadge>}
                          {cat.isArchived && <GlassBadge variant="outline" className="px-1.5 py-0.5 shrink-0">Arquivada</GlassBadge>}
                       </div>
                       <span className="text-[11px] text-slate-500 truncate block mt-0.5" title={cat.group}>{cat.group}</span>
                    </div>
                 </div>
                 <div className="flex gap-0.5 opacity-100 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity pl-2">
                    {!cat.isArchived && (
                       <GlassButton variant="ghost" size="sm" onClick={() => handleOpenModal(cat)} title="Editar" icon={<Edit2 size={16} />} />
                    )}
                    {!cat.isSystem && !cat.isArchived && (
                       <GlassButton variant="ghost" size="sm" className="text-slate-400 hover:text-amber-400 hover:bg-amber-500/10" onClick={() => handleInitiateArchive(cat)} title="Arquivar" icon={<Archive size={16} />} />
                    )}
                    {cat.isArchived && !cat.isSystem && (
                       <GlassButton variant="ghost" size="sm" className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10" onClick={() => onEdit(cat.id, { isArchived: false })} title="Restaurar" icon={<RotateCcw size={16} />} />
                    )}
                    {!cat.isSystem && (
                       <GlassButton variant="ghost" size="sm" className="text-slate-400 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleInitiateDelete(cat)} title="Excluir permanentemente" icon={<Trash2 size={16} />} />
                    )}
                 </div>
              </GlassCard>
           ))}
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      <ModalShell isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? 'Editar Categoria' : 'Nova Categoria'}>
         <ModalBody>
            <form id="category-form" onSubmit={handleSubmit} className="space-y-3">
               <div>
                  <GlassInput label="Nome" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required maxLength={20} disabled={editingCategory?.isSystem} />
                  {editingCategory?.isSystem && <p className="text-xs text-amber-500 mt-1 flex items-center gap-1"><Lock size={10}/> Nome protegido pelo sistema.</p>}
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <GlassInput label="Icone (Emoji)" value={form.emoji} onChange={e => setForm({...form, emoji: e.target.value})} required maxLength={2} className="text-center text-xl" />
                  <GlassSelect label="Grupo" value={form.group} onChange={e => setForm({...form, group: e.target.value as any})} options={groups.map(g => ({ value: g, label: g }))} />
               </div>
               <div>
                   <label className="block text-sm text-slate-300 mb-2">Cor</label>
                   <div className="grid grid-cols-8 gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
                      {colors.map(c => (
                         <button
                           type="button"
                           key={c}
                           onClick={() => setForm({...form, color: c})}
                           aria-label={`Selecionar cor ${c}`}
                           aria-pressed={form.color === c}
                           className={`relative w-7 h-7 rounded-full border-2 transition-all duration-200 hover:scale-110 hover:shadow-lg ${
                             form.color === c
                               ? 'border-white ring-2 ring-white/30 scale-110 shadow-lg'
                               : 'border-transparent hover:border-white/50'
                           }`}
                           style={{
                             backgroundColor: c,
                             boxShadow: form.color === c ? `0 0 12px ${c}80` : undefined
                           }}
                         >
                           {form.color === c && <Check size={13} className="absolute inset-0 m-auto text-white drop-shadow" />}
                         </button>
                      ))}
                   </div>
                </div>
            </form>
         </ModalBody>
         <ModalFooter>
            <GlassButton type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</GlassButton>
            <GlassButton type="submit" form="category-form">Salvar</GlassButton>
         </ModalFooter>
      </ModalShell>

      {/* ARCHIVE/REASSIGN MODAL */}
      <ModalShell isOpen={isArchiveModalOpen} onClose={() => setIsArchiveModalOpen(false)} title="Arquivar Categoria">
         <ModalBody>
            <div className="space-y-4">
               <GlassCard className="bg-amber-500/10 border-amber-500/30 p-4 flex gap-3">
                  <AlertTriangle className="text-amber-500 shrink-0" size={24} />
                  <div>
                     <h4 className="text-amber-500 font-bold mb-1">Atencao</h4>
                     <p className="text-sm text-slate-300">
                        Voce esta prestes a arquivar <strong>{targetCategory?.name}</strong>.
                        {usageCount > 0 ? ` Esta categoria e usada em ${usageCount} transacoes.` : ' Ela nao esta em uso.'}
                     </p>
                  </div>
               </GlassCard>
               {usageCount > 0 && (
                  <div>
                     <label className="block text-sm text-slate-300 mb-2">O que deseja fazer com os itens existentes?</label>
                     <div className="space-y-3">
                        <label className="flex items-start gap-3 p-3 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                           <input type="radio" name="archiveAction" checked={!reassignId} onChange={() => setReassignId('')} className="mt-1 bg-white/5 border-white/10 text-blue-500 focus:ring-blue-500/20" />
                           <div>
                              <span className="block text-sm font-medium text-white">Manter historico (Recomendado)</span>
                              <span className="block text-xs text-slate-400">Itens antigos continuam nesta categoria, mas ela nao aparecera para novos lancamentos.</span>
                           </div>
                        </label>
                        <label className="flex items-start gap-3 p-3 rounded-xl border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                           <input type="radio" name="archiveAction" checked={!!reassignId} onChange={() => setReassignId(categories.find(c => c.id !== targetCategory?.id && c.kind === targetCategory?.kind && !c.isArchived)?.id || '')} className="mt-1 bg-white/5 border-white/10 text-blue-500 focus:ring-blue-500/20" />
                           <div className="w-full">
                              <span className="block text-sm font-medium text-white">Mover para outra categoria</span>
                              {!!reassignId && (
                                 <div className="mt-2" onClick={e => e.preventDefault()}>
                                   <GlassSelect value={reassignId} onChange={(e) => setReassignId(e.target.value)} options={categories.filter(c => c.id !== targetCategory?.id && c.kind === targetCategory?.kind && !c.isArchived).map(c => ({ value: c.id, label: <span className="flex items-center gap-1.5"><AppleEmoji emoji={c.emoji}/> {c.name}</span> }))} />
                                 </div>
                              )}
                           </div>
                        </label>
                     </div>
                  </div>
               )}
            </div>
         </ModalBody>
         <ModalFooter>
            <GlassButton type="button" variant="ghost" onClick={() => setIsArchiveModalOpen(false)}>Cancelar</GlassButton>
            <GlassButton type="button" variant="danger" onClick={handleConfirmArchive}>{reassignId ? 'Mover e Arquivar' : 'Arquivar'}</GlassButton>
         </ModalFooter>
      </ModalShell>

      {/* DELETE CONFIRMATION MODAL */}
      <ModalShell isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Excluir Categoria">
         <ModalBody>
            <div className="space-y-4">
               <GlassCard className="bg-red-500/10 border-red-500/30 p-4 flex gap-3">
                  <Trash2 className="text-red-400 shrink-0" size={24} />
                  <div>
                     <h4 className="text-red-400 font-bold mb-1">Exclusao Permanente</h4>
                     <p className="text-sm text-slate-300">
                        Voce esta prestes a excluir <strong>{targetCategory?.name}</strong> permanentemente. Esta acao nao pode ser desfeita.
                        {usageCount > 0 ? ` Esta categoria esta em uso em ${usageCount} transacao(oes). Escolha o que fazer com elas abaixo.` : ' Ela nao possui transacoes vinculadas.'}
                     </p>
                  </div>
               </GlassCard>
               {usageCount > 0 && (
                  <div>
                     <label className="block text-sm text-slate-300 mb-2">Mover transacoes existentes para outra categoria:</label>
                     <GlassSelect
                        value={deleteReassignId}
                        onChange={(e) => setDeleteReassignId(e.target.value)}
                        options={[
                           { value: '', label: 'Deixar sem categoria' },
                           ...categories.filter(c => c.id !== targetCategory?.id && c.kind === targetCategory?.kind && !c.isArchived).map(c => ({ value: c.id, label: c.emoji + ' ' + c.name }))
                        ]}
                     />
                  </div>
               )}
            </div>
         </ModalBody>
         <ModalFooter>
            <GlassButton type="button" variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</GlassButton>
            <GlassButton type="button" variant="danger" onClick={handleConfirmDelete}>Excluir Permanentemente</GlassButton>
         </ModalFooter>
      </ModalShell>
    </div>
  );
};
