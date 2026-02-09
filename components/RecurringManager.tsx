import React, { useState } from 'react';
import { RecurringRule, Category, Account, TransactionType } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Repeat, Plus, Trash2, Edit2, Play, CheckCircle, AlertCircle, ToggleLeft, ToggleRight, Calendar } from 'lucide-react';

interface RecurringManagerProps {
  rules: RecurringRule[];
  categories: Category[];
  accounts: Account[];
  onAddRule: (rule: any) => void;
  onEditRule: (id: string, rule: any) => void;
  onDeleteRule: (id: string) => void;
  onToggleRule: (id: string) => void;
  onGeneratePreview: (month: number, year: number) => any[];
  onCommitGeneration: (txs: any[]) => void;
}

export const RecurringManager: React.FC<RecurringManagerProps> = ({
  rules,
  categories,
  accounts,
  onAddRule,
  onEditRule,
  onDeleteRule,
  onToggleRule,
  onGeneratePreview,
  onCommitGeneration
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    type: 'expense' as TransactionType,
    amount: '',
    categoryId: '',
    accountId: '',
    description: '',
    frequency: 'monthly',
    dayOfMonth: '5',
    dayOfWeek: '1', // 1=Monday
    startDate: new Date().toISOString().split('T')[0],
    endDate: ''
  });

  // Generator State
  const currentDate = new Date();
  const [genMonth, setGenMonth] = useState(currentDate.getMonth());
  const [genYear, setGenYear] = useState(currentDate.getFullYear());
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [hasGeneratedPreview, setHasGeneratedPreview] = useState(false);

  const resetForm = () => {
    setFormData({
      type: 'expense',
      amount: '',
      categoryId: '',
      accountId: accounts[0]?.id || '',
      description: '',
      frequency: 'monthly',
      dayOfMonth: '5',
      dayOfWeek: '1',
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    });
    setEditingRuleId(null);
  };

  const handleOpenForm = (rule?: RecurringRule) => {
    if (rule) {
      setEditingRuleId(rule.id);
      setFormData({
        type: rule.type,
        amount: rule.amount.toString(),
        categoryId: rule.categoryId,
        accountId: rule.accountId,
        description: rule.description || '',
        frequency: rule.frequency,
        dayOfMonth: (rule.dayOfMonth || 5).toString(),
        dayOfWeek: (rule.dayOfWeek || 1).toString(),
        startDate: rule.startDate,
        endDate: rule.endDate || ''
      });
    } else {
      resetForm();
    }
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      amount: parseFloat(formData.amount),
      dayOfMonth: parseInt(formData.dayOfMonth),
      dayOfWeek: parseInt(formData.dayOfWeek),
      interval: 1, // Default to 1 for now
      endDate: formData.endDate || undefined
    };

    if (editingRuleId) {
      onEditRule(editingRuleId, payload);
    } else {
      onAddRule(payload);
    }
    setIsFormOpen(false);
  };

  const handlePreview = () => {
    const results = onGeneratePreview(genMonth, genYear);
    setPreviewData(results);
    setHasGeneratedPreview(true);
  };

  const handleCommit = () => {
    const toCreate = previewData.filter(p => !p.isDuplicate).map(p => p.transaction);
    onCommitGeneration(toCreate);
    setIsGenModalOpen(false);
    setHasGeneratedPreview(false);
    alert(`${toCreate.length} lançamentos gerados com sucesso!`);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || '-';
  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || '-';

  const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
           <h2 className="text-lg font-semibold text-slate-200">Regras de Recorrência</h2>
           <p className="text-sm text-slate-400">Gerencie pagamentos automáticos como salários e assinaturas.</p>
         </div>
         <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setHasGeneratedPreview(false); setIsGenModalOpen(true); }}>
              <Play size={16} /> Gerar Mês
            </Button>
            <Button onClick={() => handleOpenForm()}>
              <Plus size={16} /> Nova Regra
            </Button>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rules.map(rule => (
          <div key={rule.id} className={`bg-slate-800 border ${rule.isActive ? 'border-slate-700' : 'border-slate-800 opacity-60'} p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}>
             <div className="flex items-center gap-4">
                <button onClick={() => onToggleRule(rule.id)} className={`text-2xl ${rule.isActive ? 'text-blue-500' : 'text-slate-600'}`}>
                   {rule.isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
                <div>
                   <h3 className="font-semibold text-white">{rule.description || getCategoryName(rule.categoryId)}</h3>
                   <div className="flex flex-wrap gap-2 text-xs text-slate-400 mt-1">
                      <span className="bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                        {rule.type === 'income' ? 'Entrada' : 'Saída'}
                      </span>
                      <span>
                        {rule.frequency === 'monthly' ? `Todo dia ${rule.dayOfMonth}` : `Toda ${daysOfWeek[rule.dayOfWeek || 0]}`}
                      </span>
                      <span>• {getAccountName(rule.accountId)}</span>
                   </div>
                </div>
             </div>
             
             <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <span className={`font-bold ${rule.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                   {formatCurrency(rule.amount)}
                </span>
                <div className="flex gap-1">
                   <button onClick={() => handleOpenForm(rule)} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg">
                     <Edit2 size={16} />
                   </button>
                   <button onClick={() => { if(window.confirm('Excluir regra?')) onDeleteRule(rule.id) }} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg">
                     <Trash2 size={16} />
                   </button>
                </div>
             </div>
          </div>
        ))}

        {rules.length === 0 && (
          <div className="text-center py-10 text-slate-500 border border-dashed border-slate-700 rounded-xl">
             <Repeat size={48} className="mx-auto mb-3 opacity-20" />
             <p>Nenhuma regra cadastrada.</p>
          </div>
        )}
      </div>

      {/* CREATE/EDIT MODAL */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingRuleId ? 'Editar Regra' : 'Nova Regra'}>
         <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm text-slate-300 mb-1">Tipo</label>
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                     <option value="expense">Saída</option>
                     <option value="income">Entrada</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm text-slate-300 mb-1">Valor</label>
                  <input type="number" step="0.01" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
               </div>
            </div>

            <div>
               <label className="block text-sm text-slate-300 mb-1">Categoria</label>
               <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} required>
                  <option value="">Selecione...</option>
                  {categories.filter(c => c.kind === formData.type).map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
               </select>
            </div>

            <div>
               <label className="block text-sm text-slate-300 mb-1">Conta</label>
               <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={formData.accountId} onChange={e => setFormData({...formData, accountId: e.target.value})} required>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
               </select>
            </div>

            <div>
               <label className="block text-sm text-slate-300 mb-1">Descrição</label>
               <input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ex: Aluguel" />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm text-slate-300 mb-1">Frequência</label>
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value})}>
                     <option value="monthly">Mensal</option>
                     <option value="weekly">Semanal</option>
                  </select>
               </div>
               <div>
                  {formData.frequency === 'monthly' ? (
                     <>
                        <label className="block text-sm text-slate-300 mb-1">Dia do Mês</label>
                        <input type="number" min="1" max="31" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={formData.dayOfMonth} onChange={e => setFormData({...formData, dayOfMonth: e.target.value})} required />
                     </>
                  ) : (
                     <>
                        <label className="block text-sm text-slate-300 mb-1">Dia da Semana</label>
                        <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={formData.dayOfWeek} onChange={e => setFormData({...formData, dayOfWeek: e.target.value})}>
                           {daysOfWeek.map((d, i) => <option key={i} value={i}>{d}</option>)}
                        </select>
                     </>
                  )}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm text-slate-300 mb-1">Início</label>
                  <input type="date" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
               </div>
               <div>
                  <label className="block text-sm text-slate-300 mb-1">Fim (Opcional)</label>
                  <input type="date" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
               </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
               <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
               <Button type="submit">Salvar Regra</Button>
            </div>
         </form>
      </Modal>

      {/* GENERATE MODAL */}
      <Modal isOpen={isGenModalOpen} onClose={() => setIsGenModalOpen(false)} title="Gerar Lançamentos">
         <div className="space-y-4">
            <div className="flex gap-2 items-center justify-center p-4 bg-slate-900 rounded-lg">
               <Calendar className="text-blue-500" />
               <select className="bg-slate-800 text-white border border-slate-600 rounded p-2" value={genMonth} onChange={e => { setGenMonth(parseInt(e.target.value)); setHasGeneratedPreview(false); }}>
                  {Array.from({length: 12}, (_, i) => i).map(m => <option key={m} value={m}>{new Date(2000, m, 1).toLocaleDateString('pt-BR', {month: 'long'})}</option>)}
               </select>
               <select className="bg-slate-800 text-white border border-slate-600 rounded p-2" value={genYear} onChange={e => { setGenYear(parseInt(e.target.value)); setHasGeneratedPreview(false); }}>
                  {Array.from({length: 5}, (_, i) => currentDate.getFullYear() - 1 + i).map(y => <option key={y} value={y}>{y}</option>)}
               </select>
            </div>

            {!hasGeneratedPreview ? (
               <div className="text-center py-4">
                  <Button onClick={handlePreview} className="w-full">
                     Pré-visualizar Lançamentos
                  </Button>
               </div>
            ) : (
               <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase">Resultado da Prévia</h3>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                     {previewData.length === 0 ? (
                        <p className="text-center text-slate-500 text-sm">Nenhuma regra ativa para este período.</p>
                     ) : (
                        previewData.map((item, idx) => (
                           <div key={idx} className={`p-3 rounded border flex justify-between items-center ${item.isDuplicate ? 'bg-slate-800/50 border-slate-700 opacity-60' : 'bg-slate-800 border-slate-600'}`}>
                              <div>
                                 <p className="text-sm font-medium text-white">{item.ruleName}</p>
                                 <p className="text-xs text-slate-400">{new Date(item.transaction.date).toLocaleDateString('pt-BR')} • {formatCurrency(item.transaction.amount)}</p>
                              </div>
                              <div className="text-xs">
                                 {item.isDuplicate ? (
                                    <span className="flex items-center gap-1 text-slate-400"><AlertCircle size={14}/> Já existe</span>
                                 ) : (
                                    <span className="flex items-center gap-1 text-emerald-400"><CheckCircle size={14}/> Criar</span>
                                 )}
                              </div>
                           </div>
                        ))
                     )}
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                     <Button variant="ghost" onClick={() => setIsGenModalOpen(false)}>Cancelar</Button>
                     <Button onClick={handleCommit} disabled={previewData.filter(p => !p.isDuplicate).length === 0}>
                        Confirmar Geração
                     </Button>
                  </div>
               </div>
            )}
         </div>
      </Modal>
    </div>
  );
};