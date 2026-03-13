import React, { useState } from 'react';
import { Goal } from '../types';
import { PageShell } from './ui/PageShell';
import { PageHeader } from './ui/PageHeader';
import { MobileFab } from './ui/MobileFab';
import { Button } from './ui/Button';
import { ModalShell, ModalBody, ModalFooter } from './ui/ModalShell';
import { GoalCard } from './GoalCard';
import { Plus, Target, AlertTriangle } from 'lucide-react';
import { GlassButton } from './ui/GlassButton';

interface GoalManagerProps {
  goals: Goal[];
  onAddGoal: (goal: any) => void;
  onEditGoal: (id: string, updates: any) => void;
  onArchiveGoal: (id: string) => void;
  onAddValueToGoal: (id: string, amount: number) => void;
  onDeleteGoal: (id: string) => void;
}

export const GoalManager: React.FC<GoalManagerProps> = ({
  goals,
  onAddGoal,
  onEditGoal,
  onArchiveGoal,
  onAddValueToGoal,
  onDeleteGoal
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isAddValueModalOpen, setIsAddValueModalOpen] = useState(false);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  
  // Edit/Form State
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '',
    monthlyContribution: '',
    startDate: new Date().toISOString().split('T')[0],
    deadline: '',
    description: ''
  });

  // Add Value State
  const [targetGoalId, setTargetGoalId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState('');

  const displayedGoals = goals.filter(g => g.isArchived === (activeTab === 'archived'));

  // Handlers
  const handleOpenForm = (goal?: Goal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        title: goal.title,
        targetAmount: goal.targetAmount.toString(),
        currentAmount: goal.currentAmount.toString(),
        monthlyContribution: goal.monthlyContribution.toString(),
        startDate: goal.startDate,
        deadline: goal.deadline || '',
        description: goal.description || ''
      });
    } else {
      setEditingGoal(null);
      setFormData({
        title: '',
        targetAmount: '',
        currentAmount: '0',
        monthlyContribution: '0',
        startDate: new Date().toISOString().split('T')[0],
        deadline: '',
        description: ''
      });
    }
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: formData.title,
      targetAmount: parseFloat(formData.targetAmount) || 0,
      currentAmount: parseFloat(formData.currentAmount) || 0,
      monthlyContribution: parseFloat(formData.monthlyContribution) || 0,
      startDate: formData.startDate,
      deadline: formData.deadline || undefined,
      description: formData.description
    };

    if (editingGoal) {
      onEditGoal(editingGoal.id, payload);
    } else {
      onAddGoal(payload);
    }
    setIsFormModalOpen(false);
  };

  const handleOpenAddValue = (goalId: string) => {
    setTargetGoalId(goalId);
    setAddAmount('');
    setIsAddValueModalOpen(true);
  };

  const handleSubmitAddValue = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetGoalId && addAmount) {
      onAddValueToGoal(targetGoalId, parseFloat(addAmount));
      setIsAddValueModalOpen(false);
    }
  };

  return (
    <PageShell>
      <PageHeader 
        title="Metas Financeiras" 
        subtitle="Defina objetivos, acompanhe o progresso e planeje suas conquistas."
        actions={
          <Button onClick={() => handleOpenForm()} icon={<Plus size={18}/>} className="hidden md:flex">Nova Meta</Button>
        }
      />

      <div className="border-b border-white/10 mb-6">
         <div className="flex gap-4">
            <button onClick={() => setActiveTab('active')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'active' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}>Em Aberto</button>
            <button onClick={() => setActiveTab('archived')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'archived' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}>Arquivadas</button>
         </div>
      </div>

      {displayedGoals.length === 0 ? (
        <div className="text-center py-20 bg-white/5 border border-white/10 border-dashed rounded-2xl backdrop-blur-md">
           <Target size={48} className="mx-auto text-slate-500 mb-4 opacity-50" />
           <p className="text-slate-300 text-lg font-medium">Nenhuma meta {activeTab === 'active' ? 'ativa' : 'arquivada'} encontrada.</p>
           {activeTab === 'active' && <p className="text-slate-400 text-sm mt-1">Crie sua primeira meta para começar a poupar.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedGoals.map(goal => (
            <GoalCard 
              key={goal.id} 
              goal={goal} 
              onEdit={handleOpenForm}
              onArchive={onArchiveGoal}
              onAddValue={handleOpenAddValue}
              onDelete={() => setDeletingGoalId(goal.id)}
            />
          ))}
        </div>
      )}

      {/* FORM MODAL */}
      <ModalShell isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingGoal ? 'Editar Meta' : 'Nova Meta'}>
         <ModalBody>
            <form id="goal-form" onSubmit={handleSubmitForm} className="space-y-4">
               <div>
                  <label className="block text-sm text-slate-300 mb-1">Nome da Meta</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="Ex: Viagem para Europa, PS5..." />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm text-slate-300 mb-1">Valor Alvo (R$)</label>
                     <input type="number" step="0.01" className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={formData.targetAmount} onChange={e => setFormData({...formData, targetAmount: e.target.value})} required />
                  </div>
                  <div>
                     <label className="block text-sm text-slate-300 mb-1">Já Tenho (R$)</label>
                     <input type="number" step="0.01" className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={formData.currentAmount} onChange={e => setFormData({...formData, currentAmount: e.target.value})} />
                  </div>
               </div>

               <div>
                  <label className="block text-sm text-slate-300 mb-1">Aporte Mensal Estimado (R$)</label>
                  <input type="number" step="0.01" className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={formData.monthlyContribution} onChange={e => setFormData({...formData, monthlyContribution: e.target.value})} />
                  <p className="text-xs text-slate-500 mt-1">Usado para calcular quando você atingirá a meta.</p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm text-slate-300 mb-1">Data Início</label>
                     <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all [color-scheme:dark]" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
                  </div>
                  <div>
                     <label className="block text-sm text-slate-300 mb-1">Prazo Final (Opcional)</label>
                     <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all [color-scheme:dark]" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                  </div>
               </div>

               <div>
                  <label className="block text-sm text-slate-300 mb-1">Descrição (Opcional)</label>
                  <textarea className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white h-20 resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
               </div>
            </form>
         </ModalBody>
         <ModalFooter>
            <Button type="button" variant="ghost" onClick={() => setIsFormModalOpen(false)}>Cancelar</Button>
            <Button type="submit" form="goal-form">Salvar Meta</Button>
         </ModalFooter>
      </ModalShell>

      {/* ADD VALUE MODAL */}
      <ModalShell isOpen={isAddValueModalOpen} onClose={() => setIsAddValueModalOpen(false)} title="Adicionar Valor">
         <ModalBody>
            <form id="add-value-form" onSubmit={handleSubmitAddValue} className="space-y-4">
               <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-200">
                  Isso apenas atualiza o saldo da meta. Não cria uma transação no extrato.
               </div>
               <div>
                  <label className="block text-sm text-slate-300 mb-1">Valor a adicionar (R$)</label>
                  <input type="number" step="0.01" className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white text-lg font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" value={addAmount} onChange={e => setAddAmount(e.target.value)} autoFocus required />
               </div>
            </form>
         </ModalBody>
         <ModalFooter>
            <Button type="button" variant="ghost" onClick={() => setIsAddValueModalOpen(false)}>Cancelar</Button>
            <Button type="submit" form="add-value-form">Confirmar</Button>
         </ModalFooter>
      </ModalShell>

      {/* DELETE MODAL */}
      <ModalShell isOpen={!!deletingGoalId} onClose={() => setDeletingGoalId(null)} title="Excluir Meta">
        <ModalBody>
          <div className="text-center space-y-4 py-4">
            <div className="bg-red-500/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2 border border-red-500/20">
               <AlertTriangle size={32} className="text-red-500" />
            </div>
            <div>
              <p className="text-lg text-slate-200">Tem certeza que deseja excluir esta meta?</p>
              <p className="text-sm text-slate-400 mt-2">
                O histórico de valores guardados não será apagado do seu saldo, apenas a meta deixará de existir.
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <GlassButton type="button" variant="ghost" onClick={() => setDeletingGoalId(null)}>Cancelar</GlassButton>
          <GlassButton type="button" variant="danger" onClick={() => {
            if (deletingGoalId) {
              onDeleteGoal(deletingGoalId);
              setDeletingGoalId(null);
            }
          }}>Confirmar Exclusão</GlassButton>
        </ModalFooter>
      </ModalShell>

      <MobileFab
        visible={!isFormModalOpen && !isAddValueModalOpen}
        actions={[
          { 
            id: 'new-goal', 
            label: 'Nova Meta', 
            icon: <Plus size={24} />, 
            onClick: () => handleOpenForm() 
          }
        ]}
      />
    </PageShell>
  );
};
