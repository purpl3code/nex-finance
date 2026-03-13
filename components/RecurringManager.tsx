import React, { useState } from 'react';
import { RecurringRule, Category, Account, TransactionType, CreditCard } from '../types';
import { ModalShell, ModalBody, ModalFooter } from './ui/ModalShell';
import { GlassButton } from './ui/GlassButton';
import { GlassInput } from './ui/GlassInput';
import { GlassSelect } from './ui/GlassSelect';
import { GlassCard } from './ui/GlassCard';
import { GlassBadge } from './ui/GlassBadge';
import { PageShell } from './ui/PageShell';
import { PageHeader } from './ui/PageHeader';
import { MobileFab } from './ui/MobileFab';
import { Repeat, Plus, Trash2, Edit2, Play, CheckCircle, AlertCircle, ToggleLeft, ToggleRight, Calendar, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface RecurringManagerProps {
  rules: RecurringRule[];
  categories: Category[];
  accounts: Account[];
  creditCards?: CreditCard[];
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
  creditCards = [],
  onAddRule,
  onEditRule,
  onDeleteRule,
  onToggleRule,
  onGeneratePreview,
  onCommitGeneration
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
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
    toast.success(`${toCreate.length} lançamentos gerados com sucesso!`);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || '-';
  const getAccountName = (id: string) => {
    const account = accounts.find(a => a.id === id);
    if (account) return account.name;
    const card = creditCards.find(c => c.id === id);
    if (card) return card.name;
    return '-';
  };

  const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  return (
    <PageShell>
      <PageHeader 
        title="Regras de Recorrência" 
        subtitle="Automatize lançamentos frequentes como salários e assinaturas."
        actions={
          <>
            <GlassButton variant="secondary" onClick={() => { setHasGeneratedPreview(false); setIsGenModalOpen(true); }} icon={<Play size={16} />}>
              Gerar Mês
            </GlassButton>
            <GlassButton onClick={() => handleOpenForm()} icon={<Plus size={16} />} className="hidden md:flex">
              Nova Regra
            </GlassButton>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4">
        {rules.map(rule => (
          <GlassCard key={rule.id} className={`p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group transition-all ${!rule.isActive ? 'opacity-60' : ''}`}>
             <div className="flex items-center gap-5">
                <button onClick={() => onToggleRule(rule.id)} className={`transition-colors ${rule.isActive ? 'text-blue-400 hover:text-blue-300' : 'text-slate-600 hover:text-slate-500'}`}>
                   {rule.isActive ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                </button>
                <div>
                   <h3 className="text-lg font-semibold text-white">{rule.description || getCategoryName(rule.categoryId)}</h3>
                   <div className="flex flex-wrap gap-2 text-xs text-slate-400 mt-1.5">
                      <GlassBadge variant={rule.type === 'income' ? 'success' : 'danger'}>
                        {rule.type === 'income' ? 'Entrada' : 'Saída'}
                      </GlassBadge>
                      <GlassBadge variant="secondary">
                        {rule.frequency === 'monthly' ? `Todo dia ${rule.dayOfMonth}` : `Toda ${daysOfWeek[rule.dayOfWeek || 0]}`}
                      </GlassBadge>
                      <GlassBadge variant="outline">
                        {getAccountName(rule.accountId)}
                      </GlassBadge>
                   </div>
                </div>
             </div>
             
             <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                <span className={`text-xl font-bold ${rule.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                   {formatCurrency(rule.amount)}
                </span>
                <div className="flex gap-2">
                   <GlassButton variant="ghost" size="sm" onClick={() => handleOpenForm(rule)} icon={<Edit2 size={18} />} />
                   <GlassButton variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => setDeletingRuleId(rule.id)} icon={<Trash2 size={18} />} />
                </div>
             </div>
          </GlassCard>
        ))}

        {rules.length === 0 && (
          <GlassCard className="text-center py-16 border-dashed border-2 border-white/10 bg-transparent">
             <Repeat size={48} className="mx-auto mb-4 text-slate-600" />
             <p className="text-lg font-medium text-slate-300">Nenhuma regra cadastrada.</p>
             <p className="text-sm text-slate-500">Crie regras para lançar contas fixas automaticamente.</p>
          </GlassCard>
        )}
      </div>

      {/* CREATE/EDIT MODAL */}
      <ModalShell isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingRuleId ? 'Editar Regra' : 'Nova Regra'}>
         <ModalBody>
            <form id="rule-form" onSubmit={handleSubmit} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <GlassSelect 
                     label="Tipo" 
                     value={formData.type} 
                     onChange={e => {
                       const newType = e.target.value as any;
                       const isCreditCard = creditCards.some(c => c.id === formData.accountId);
                       setFormData({
                         ...formData, 
                         type: newType,
                         accountId: (newType === 'income' && isCreditCard) ? '' : formData.accountId
                       });
                     }}
                     options={[
                       { value: 'expense', label: 'Saída' },
                       { value: 'income', label: 'Entrada' }
                     ]}
                  />
                  <GlassInput 
                     label="Valor" 
                     type="number" 
                     step="0.01" 
                     value={formData.amount} 
                     onChange={e => setFormData({...formData, amount: e.target.value})} 
                     required 
                  />
               </div>

               <GlassSelect 
                  label="Categoria" 
                  value={formData.categoryId} 
                  onChange={e => setFormData({...formData, categoryId: e.target.value})} 
                  required
                  options={[
                    { value: '', label: 'Selecione...' },
                    ...categories.filter(c => c.kind === formData.type).map(c => ({ value: c.id, label: `${c.emoji} ${c.name}` }))
                  ]}
               />

               <GlassSelect 
                 label="Conta / Cartão"
                 value={formData.accountId} 
                 onChange={e => setFormData({...formData, accountId: e.target.value})} 
                 required
                 groups={[
                   {
                     label: 'Contas',
                     options: accounts.map(a => ({ value: a.id, label: a.name }))
                   },
                   ...(formData.type === 'expense' && creditCards.length > 0 ? [{
                     label: 'Cartões de Crédito',
                     options: creditCards.map(c => ({ value: c.id, label: c.name, color: c.color }))
                   }] : [])
                 ]}
                 options={!(formData.type === 'expense' && creditCards.length > 0) ? [
                   { value: '', label: 'Selecione...' },
                   ...accounts.map(a => ({ value: a.id, label: a.name }))
                 ] : undefined}
               />

               <GlassInput 
                  label="Descrição" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Ex: Aluguel" 
               />

               <div className="grid grid-cols-2 gap-4">
                  <GlassSelect 
                     label="Frequência" 
                     value={formData.frequency} 
                     onChange={e => setFormData({...formData, frequency: e.target.value})}
                     options={[
                       { value: 'monthly', label: 'Mensal' },
                       { value: 'weekly', label: 'Semanal' }
                     ]}
                  />
                  <div>
                     {formData.frequency === 'monthly' ? (
                        <GlassInput 
                           label="Dia do Mês" 
                           type="number" 
                           min="1" 
                           max="31" 
                           value={formData.dayOfMonth} 
                           onChange={e => setFormData({...formData, dayOfMonth: e.target.value})} 
                           required 
                        />
                     ) : (
                        <GlassSelect 
                           label="Dia da Semana" 
                           value={formData.dayOfWeek} 
                           onChange={e => setFormData({...formData, dayOfWeek: e.target.value})}
                           options={daysOfWeek.map((d, i) => ({ value: i.toString(), label: d }))}
                        />
                     )}
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <GlassInput 
                     label="Início" 
                     type="date" 
                     value={formData.startDate} 
                     onChange={e => setFormData({...formData, startDate: e.target.value})} 
                     required 
                  />
                  <GlassInput 
                     label="Fim (Opcional)" 
                     type="date" 
                     value={formData.endDate} 
                     onChange={e => setFormData({...formData, endDate: e.target.value})} 
                  />
               </div>
            </form>
         </ModalBody>
         <ModalFooter>
            <GlassButton type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</GlassButton>
            <GlassButton type="submit" form="rule-form">Salvar Regra</GlassButton>
         </ModalFooter>
      </ModalShell>

      {/* GENERATE MODAL */}
      <ModalShell isOpen={isGenModalOpen} onClose={() => setIsGenModalOpen(false)} title="Gerar Lançamentos">
         <ModalBody>
            <div className="space-y-6">
               <GlassCard className="flex gap-4 items-center justify-center p-6 bg-white/5 border-white/10">
                  <Calendar className="text-blue-400" size={24} />
                  <div className="flex gap-2 w-full">
                    <div className="flex-1">
                      <GlassSelect 
                         value={genMonth} 
                         onChange={e => { setGenMonth(parseInt(e.target.value)); setHasGeneratedPreview(false); }}
                         options={Array.from({length: 12}, (_, i) => i).map(m => ({
                           value: m,
                           label: new Date(2000, m, 1).toLocaleDateString('pt-BR', {month: 'long'})
                         }))}
                      />
                    </div>
                    <div className="flex-1">
                      <GlassSelect 
                         value={genYear} 
                         onChange={e => { setGenYear(parseInt(e.target.value)); setHasGeneratedPreview(false); }}
                         options={Array.from({length: 5}, (_, i) => currentDate.getFullYear() - 1 + i).map(y => ({
                           value: y,
                           label: String(y)
                         }))}
                      />
                    </div>
                  </div>
               </GlassCard>

               {!hasGeneratedPreview ? (
                  <div className="text-center py-4">
                     <GlassButton onClick={handlePreview} className="w-full" size="lg">
                        Pré-visualizar Lançamentos
                     </GlassButton>
                  </div>
               ) : (
                  <div className="space-y-4">
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Resultado da Prévia</h3>
                     <div className="space-y-2 pr-1">
                        {previewData.length === 0 ? (
                           <p className="text-center text-slate-500 text-sm py-4">Nenhuma regra ativa para este período.</p>
                        ) : (
                           previewData.map((item, idx) => (
                              <div key={idx} className={`p-3 rounded-xl border flex justify-between items-center transition-all ${item.isDuplicate ? 'bg-white/5 border-white/5 opacity-60' : 'bg-white/10 border-white/10'}`}>
                                 <div>
                                    <p className="text-sm font-medium text-white">{item.ruleName}</p>
                                    <p className="text-xs text-slate-400">{new Date(item.transaction.date).toLocaleDateString('pt-BR')} • {formatCurrency(item.transaction.amount)}</p>
                                 </div>
                                 <div className="text-xs">
                                    {item.isDuplicate ? (
                                       <GlassBadge variant="secondary" className="flex items-center gap-1">
                                         <AlertCircle size={12}/> Já existe
                                       </GlassBadge>
                                    ) : (
                                       <GlassBadge variant="success" className="flex items-center gap-1">
                                         <CheckCircle size={12}/> Criar
                                       </GlassBadge>
                                    )}
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  </div>
               )}
            </div>
         </ModalBody>
         <ModalFooter>
            {hasGeneratedPreview && (
               <>
                  <GlassButton variant="ghost" onClick={() => setIsGenModalOpen(false)}>Cancelar</GlassButton>
                  <GlassButton onClick={handleCommit} disabled={previewData.filter(p => !p.isDuplicate).length === 0}>
                     Confirmar Geração
                  </GlassButton>
               </>
            )}
            {!hasGeneratedPreview && (
               <GlassButton variant="ghost" onClick={() => setIsGenModalOpen(false)}>Cancelar</GlassButton>
            )}
         </ModalFooter>
      </ModalShell>

      <ModalShell isOpen={!!deletingRuleId} onClose={() => setDeletingRuleId(null)} title="Excluir Regra">
        <ModalBody>
          <div className="text-center space-y-4 py-4">
            <div className="bg-red-500/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2 border border-red-500/20">
               <AlertTriangle size={32} className="text-red-500" />
            </div>
            <div>
              <p className="text-lg text-slate-200">Tem certeza que deseja excluir esta regra?</p>
              <p className="text-sm text-slate-400 mt-2">
                As movimentações já geradas por esta regra não serão apagadas.
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <GlassButton type="button" variant="ghost" onClick={() => setDeletingRuleId(null)}>Cancelar</GlassButton>
          <GlassButton type="button" variant="danger" onClick={() => {
            if (deletingRuleId) {
              onDeleteRule(deletingRuleId);
              setDeletingRuleId(null);
            }
          }}>Confirmar Exclusão</GlassButton>
        </ModalFooter>
      </ModalShell>

      <MobileFab
        visible={!isFormOpen && !isGenModalOpen}
        actions={[
          { 
            id: 'new-rule', 
            label: 'Nova Regra', 
            icon: <Plus size={24} />, 
            onClick: () => handleOpenForm() 
          }
        ]}
      />
    </PageShell>
  );
};