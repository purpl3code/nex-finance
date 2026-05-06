import React, { useState } from 'react';
import { Goal } from '../types';
import { PageShell } from './ui/PageShell';
import { PageHeader } from './ui/PageHeader';
import { MobileFab } from './ui/MobileFab';
import { GlassInput } from './ui/GlassInput';
import { GlassButton } from './ui/GlassButton';
import { ModalShell, ModalBody, ModalFooter } from './ui/ModalShell';
import { GoalCard } from './GoalCard';
import { Plus, Target, AlertTriangle } from 'lucide-react';
import { EmptyState } from './ui/EmptyState';

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
          <GlassButton onClick={() => handleOpenForm()} icon={<Plus size={18}/>} className="hidden md:flex">Nova Meta</GlassButton>
        }
      />

      <div className="border-b border-white/10 mb-4">
         <div className="flex gap-4">
            <button onClick={() => setActiveTab('active')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'active' ? 'border-[rgb(var(--c-primary-500))] text-[rgb(var(--c-primary-400))]' : 'border-transparent text-slate-400 hover:text-slate-300'}`}>Em Aberto</button>
            <button onClick={() => setActiveTab('archived')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'archived' ? 'border-[rgb(var(--c-primary-500))] text-[rgb(var(--c-primary-400))]' : 'border-transparent text-slate-400 hover:text-slate-300'}`}>Arquivadas</button>
         </div>
      </div>

      {displayedGoals.length === 0 ? (
        <EmptyState
          variant="goals"
          title={`Nenhuma meta ${activeTab === 'active' ? 'ativa' : 'arquivada'} encontrada.`}
          description={activeTab === 'active' ? 'Defina metas de poupança e acompanhe seu progresso até conquistá-las.' : undefined}
          actionLabel={activeTab === 'active' ? 'Criar Primeira Meta' : undefined}
          onAction={activeTab === 'active' ? () => handleOpenForm() : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <form id="goal-form" onSubmit={handleSubmitForm} className="space-y-3">
               <GlassInput 
                  label="Nome da Meta" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  required 
                  placeholder="Ex: Viagem para Europa, PS5..." 
               />
               
               <div className="grid grid-cols-2 gap-4">
                  <GlassInput 
                     label="Valor Alvo (R$)" 
                     type="number" 
                     step="0.01" 
                     value={formData.targetAmount} 
                     onChange={e => setFormData({...formData, targetAmount: e.target.value})} 
                     required 
                  />
                  <GlassInput 
                     label="Já Tenho (R$)" 
                     type="number" 
                     step="0.01" 
                     value={formData.currentAmount} 
                     onChange={e => setFormData({...formData, currentAmount: e.target.value})} 
                  />
               </div>

               <div>
                  <GlassInput 
                     label="Aporte Mensal Estimado (R$)" 
                     type="number" 
                     step="0.01" 
                     value={formData.monthlyContribution} 
                     onChange={e => setFormData({...formData, monthlyContribution: e.target.value})} 
                  />
                  <p className="text-xs text-slate-500 mt-1 ml-1">Usado para calcular quando você atingirá a meta.</p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <GlassInput 
                     label="Data Início" 
                     type="date" 
                     value={formData.startDate} 
                     onChange={e => setFormData({...formData, startDate: e.target.value})} 
                     required 
                  />
                  <GlassInput 
                     label="Prazo Final (Opcional)" 
                     type="date" 
                     value={formData.deadline} 
                     onChange={e => setFormData({...formData, deadline: e.target.value})} 
                  />
               </div>

               <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Descrição (Opcional)</label>
                  <textarea 
                     className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-white h-20 resize-none focus:border-[rgb(var(--c-primary-500))] focus:ring-1 focus:ring-[rgb(var(--c-primary-500))] outline-none transition-all" 
                     value={formData.description} 
                     onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
               </div>
            </form>
         </ModalBody>
         <ModalFooter>
            <GlassButton type="button" variant="ghost" onClick={() => setIsFormModalOpen(false)}>Cancelar</GlassButton>
            <GlassButton type="submit" form="goal-form">Salvar Meta</GlassButton>
         </ModalFooter>
      </ModalShell>

      {/* ADD VALUE MODAL */}
      <ModalShell isOpen={isAddValueModalOpen} onClose={() => setIsAddValueModalOpen(false)} title="Adicionar Valor">
         <ModalBody>
            <form id="add-value-form" onSubmit={handleSubmitAddValue} className="space-y-4">
               <div className="p-4 bg-[rgb(var(--c-primary-500)/0.1)] border border-[rgb(var(--c-primary-500)/0.2)] rounded-xl text-sm text-[rgb(var(--c-primary-200))]">
                  Isso apenas atualiza o saldo da meta. Não cria uma transação no extrato.
               </div>
               <GlassInput 
                  label="Valor a adicionar (R$)" 
                  type="number" 
                  step="0.01" 
                  value={addAmount} 
                  onChange={e => setAddAmount(e.target.value)} 
                  autoFocus 
                  required 
                  className="text-lg font-bold"
               />
            </form>
         </ModalBody>
         <ModalFooter>
            <GlassButton type="button" variant="ghost" onClick={() => setIsAddValueModalOpen(false)}>Cancelar</GlassButton>
            <GlassButton type="submit" form="add-value-form">Confirmar</GlassButton>
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
