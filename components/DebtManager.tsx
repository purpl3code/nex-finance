import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Debt } from '../types';
import { PageShell } from './ui/PageShell';
import { PageHeader } from './ui/PageHeader';
import { MobileFab } from './ui/MobileFab';
import { GlassInput } from './ui/GlassInput';
import { CurrencyInput } from './ui/CurrencyInput';
import { GlassButton } from './ui/GlassButton';
import { ModalShell, ModalBody, ModalFooter } from './ui/ModalShell';
import { DebtCard } from './DebtCard';
import { EmptyState } from './ui/EmptyState';
import { Plus, AlertTriangle, DollarSign } from 'lucide-react';
import { formatCurrency } from '../utils/debtHelpers';
import { AnimatedNumber } from './ui/AnimatedNumber';

interface DebtManagerProps {
  debts: Debt[];
  onAddDebt: (debt: any) => void;
  onEditDebt: (id: string, updates: any) => void;
  onPayDebt: (id: string, amount: number) => void;
  onSettleDebt: (id: string) => void;
  onDeleteDebt: (id: string) => void;
}

export const DebtManager: React.FC<DebtManagerProps> = ({
  debts,
  onAddDebt,
  onEditDebt,
  onPayDebt,
  onSettleDebt,
  onDeleteDebt,
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'settled'>('active');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [deletingDebtId, setDeletingDebtId] = useState<string | null>(null);

  // Edit/Form State
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    creditor: '',
    totalAmount: '',
    paidAmount: '0',
    monthlyPayment: '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    description: '',
  });

  // Pay Modal State
  const [payTargetId, setPayTargetId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');

  const displayedDebts = debts.filter(d => d.isSettled === (activeTab === 'settled'));

  // Summary stats
  const totalDebt = debts.filter(d => !d.isSettled).reduce((s, d) => s + d.totalAmount, 0);
  const totalPaid = debts.filter(d => !d.isSettled).reduce((s, d) => s + d.paidAmount, 0);
  const totalRemaining = totalDebt - totalPaid;

  // Handlers
  const handleOpenForm = (debt?: Debt) => {
    if (debt) {
      setEditingDebt(debt);
      setFormData({
        title: debt.title,
        creditor: debt.creditor || '',
        totalAmount: debt.totalAmount.toString(),
        paidAmount: debt.paidAmount.toString(),
        monthlyPayment: debt.monthlyPayment.toString(),
        startDate: debt.startDate,
        dueDate: debt.dueDate || '',
        description: debt.description || '',
      });
    } else {
      setEditingDebt(null);
      setFormData({
        title: '',
        creditor: '',
        totalAmount: '',
        paidAmount: '0',
        monthlyPayment: '0',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        description: '',
      });
    }
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      title: formData.title,
      creditor: formData.creditor || undefined,
      totalAmount: parseFloat(formData.totalAmount) || 0,
      paidAmount: parseFloat(formData.paidAmount) || 0,
      monthlyPayment: parseFloat(formData.monthlyPayment) || 0,
      startDate: formData.startDate,
      dueDate: formData.dueDate || undefined,
      description: formData.description || undefined,
    };
    if (editingDebt) {
      onEditDebt(editingDebt.id, data);
    } else {
      onAddDebt(data);
    }
    setIsFormModalOpen(false);
  };

  const handleOpenPay = (id: string) => {
    setPayTargetId(id);
    setPayAmount('');
    setIsPayModalOpen(true);
  };

  const handleSubmitPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (payTargetId && parseFloat(payAmount) > 0) {
      onPayDebt(payTargetId, parseFloat(payAmount));
    }
    setIsPayModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deletingDebtId) {
      onDeleteDebt(deletingDebtId);
      setDeletingDebtId(null);
    }
  };

  const payTargetDebt = debts.find(d => d.id === payTargetId);

  return (
    <PageShell>
      <PageHeader
        title="Dívidas"
        subtitle="Registre e acompanhe o pagamento das suas dívidas."
        actions={
          <GlassButton onClick={() => handleOpenForm()} icon={<Plus size={18} />} className="hidden md:flex">
            Nova Dívida
          </GlassButton>
        }
      />

      {/* Summary Cards */}
      {debts.filter(d => !d.isSettled).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="glass-lg rounded-xl p-4 border border-white/8">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Total em Dívidas</p>
            <AnimatedNumber value={totalDebt} format={formatCurrency} className="text-xl font-bold text-red-400" />
          </div>
          <div className="glass-lg rounded-xl p-4 border border-white/8">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Total Pago</p>
            <AnimatedNumber value={totalPaid} format={formatCurrency} className="text-xl font-bold text-emerald-400" />
          </div>
          <div className="glass-lg rounded-xl p-4 border border-white/8">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Saldo Devedor</p>
            <AnimatedNumber value={totalRemaining} format={formatCurrency} className="text-xl font-bold text-white" />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-xl w-fit border border-white/8">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'active'
              ? 'bg-[rgb(var(--c-primary-500)/0.2)] text-[rgb(var(--c-primary-300))] shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Em Aberto
        </button>
        <button
          onClick={() => setActiveTab('settled')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'settled'
              ? 'bg-[rgb(var(--c-primary-500)/0.2)] text-[rgb(var(--c-primary-300))] shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Quitadas
        </button>
      </div>

      {/* Debt Cards Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        initial="hidden"
        animate="visible"
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
      >
        {displayedDebts.map(debt => (
          <motion.div
            key={debt.id}
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } }}
          >
            <DebtCard
              debt={debt}
              onEdit={handleOpenForm}
              onPay={handleOpenPay}
              onSettle={onSettleDebt}
              onDelete={() => setDeletingDebtId(debt.id)}
            />
          </motion.div>
        ))}
      </motion.div>

      {displayedDebts.length === 0 && (
        <EmptyState
          variant="debts"
          title={activeTab === 'active' ? 'Nenhuma dívida registrada.' : 'Nenhuma dívida quitada ainda.'}
          description={
            activeTab === 'active'
              ? 'Registre suas dívidas e acompanhe o progresso dos pagamentos até a quitação total.'
              : 'Quando você quitar uma dívida, ela aparecerá aqui como um histórico.'
          }
          actionLabel={activeTab === 'active' ? 'Registrar Primeira Dívida' : undefined}
          onAction={activeTab === 'active' ? () => handleOpenForm() : undefined}
        />
      )}

      {/* CREATE/EDIT FORM MODAL */}
      <ModalShell isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingDebt ? 'Editar Dívida' : 'Nova Dívida'}>
        <ModalBody>
          <form id="debt-form" onSubmit={handleSubmitForm} className="space-y-3">
            <GlassInput
              label="Título da Dívida"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Empréstimo Pessoal, Financiamento..."
              required
            />
            <GlassInput
              label="Credor (Opcional)"
              value={formData.creditor}
              onChange={e => setFormData(prev => ({ ...prev, creditor: e.target.value }))}
              placeholder="Ex: Banco X, João..."
            />
            <div className="grid grid-cols-2 gap-3">
              <CurrencyInput
                label="Valor Total da Dívida"
                value={formData.totalAmount}
                onChange={val => setFormData(prev => ({ ...prev, totalAmount: val }))}
                required
              />
              <CurrencyInput
                label="Já Pago"
                value={formData.paidAmount}
                onChange={val => setFormData(prev => ({ ...prev, paidAmount: val }))}
              />
            </div>
            <CurrencyInput
              label="Parcela Mensal Estimada"
              value={formData.monthlyPayment}
              onChange={val => setFormData(prev => ({ ...prev, monthlyPayment: val }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="Data de Registro"
                type="date"
                value={formData.startDate}
                onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
              <GlassInput
                label="Vencimento (Opcional)"
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            <GlassInput
              label="Descrição (Opcional)"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Observações sobre a dívida..."
            />
          </form>
        </ModalBody>
        <ModalFooter>
          <GlassButton variant="ghost" onClick={() => setIsFormModalOpen(false)}>Cancelar</GlassButton>
          <GlassButton type="submit" form="debt-form">{editingDebt ? 'Salvar' : 'Registrar Dívida'}</GlassButton>
        </ModalFooter>
      </ModalShell>

      {/* PAY MODAL */}
      <ModalShell isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Registrar Pagamento">
        <ModalBody>
          {payTargetDebt && (
            <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/8 text-sm">
              <p className="text-slate-400">Dívida: <span className="text-white font-semibold">{payTargetDebt.title}</span></p>
              <p className="text-slate-400 mt-1">Restante: <span className="text-red-400 font-bold">{formatCurrency(payTargetDebt.totalAmount - payTargetDebt.paidAmount)}</span></p>
            </div>
          )}
          <form id="pay-form" onSubmit={handleSubmitPay} className="space-y-3">
            <CurrencyInput
              label="Valor do Pagamento"
              value={payAmount}
              onChange={val => setPayAmount(val)}
              required
            />
          </form>
        </ModalBody>
        <ModalFooter>
          <GlassButton variant="ghost" onClick={() => setIsPayModalOpen(false)}>Cancelar</GlassButton>
          <GlassButton type="submit" form="pay-form">Confirmar Pagamento</GlassButton>
        </ModalFooter>
      </ModalShell>

      {/* DELETE CONFIRMATION MODAL */}
      <ModalShell isOpen={!!deletingDebtId} onClose={() => setDeletingDebtId(null)} title="Excluir Dívida?">
        <ModalBody>
          <div className="text-center py-4">
            <div className="mx-auto w-14 h-14 flex items-center justify-center bg-red-500/10 rounded-2xl mb-3 border border-red-500/20">
              <AlertTriangle size={28} className="text-red-400" />
            </div>
            <p className="text-slate-300">Esta ação é irreversível. Todo o histórico de pagamentos desta dívida será removido.</p>
          </div>
        </ModalBody>
        <ModalFooter>
          <GlassButton variant="ghost" onClick={() => setDeletingDebtId(null)}>Cancelar</GlassButton>
          <GlassButton variant="danger" onClick={handleConfirmDelete}>Excluir</GlassButton>
        </ModalFooter>
      </ModalShell>

      <MobileFab visible={!isFormModalOpen && !isPayModalOpen && !deletingDebtId} actions={[{ id: 'add-debt', label: 'Nova Dívida', icon: <Plus size={24} />, onClick: () => handleOpenForm() }]} />
    </PageShell>
  );
};
