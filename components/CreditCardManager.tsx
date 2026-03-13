

import React, { useState } from 'react';
import { CreditCard, CreditCardInvoice, Category, Account, CreditCardTransaction } from '../types';
import { GlassButton } from './ui/GlassButton';
import { ModalShell, ModalBody, ModalFooter } from './ui/ModalShell';
import { GlassInput } from './ui/GlassInput';
import { GlassSelect } from './ui/GlassSelect';
import { GlassCard } from './ui/GlassCard';
import { PageShell } from './ui/PageShell';
import { PageHeader } from './ui/PageHeader';
import { MobileFab } from './ui/MobileFab';
import { CreditCard as CardIcon, Plus, Trash2, ChevronLeft, ChevronRight, Edit2, RotateCcw, AlertTriangle, Banknote, Check } from 'lucide-react';
import { toast } from 'sonner';

const CARD_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // emerald
  '#14b8a6', // teal
  '#64748b', // slate
  '#1e293b', // slate-800
  '#0f172a', // slate-900
];

interface CreditCardManagerProps {
  cards: CreditCard[];
  categories: Category[];
  accounts: Account[];
  onAddCard: (card: any) => void;
  onDeleteCard: (id: string) => void;
  onAddTransaction: (tx: any, installments: number) => void;
  onEditTransaction?: (id: string, updates: any) => void;
  onDeleteTransaction?: (id: string) => void;
  onAddRefund?: (originalTx: CreditCardTransaction, amount: number, date: string, desc: string) => void;
  onPayInvoice: (invoice: CreditCardInvoice, accountId: string) => void;
  getInvoiceInfo: (cardId: string, month: number, year: number) => any;
  onEditCard?: (id: string, updates: any) => void;
}

export const CreditCardManager: React.FC<CreditCardManagerProps> = ({
  cards,
  categories,
  accounts,
  onAddCard,
  onDeleteCard,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onAddRefund,
  onPayInvoice,
  getInvoiceInfo,
  onEditCard
}) => {
  const [view, setView] = useState<'list' | 'details'>('list');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date()); 
  
  // Modals
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  // Edit/Add Logic
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [editingTx, setEditingTx] = useState<CreditCardTransaction | null>(null);
  const [refundingTx, setRefundingTx] = useState<CreditCardTransaction | null>(null);

  // Form States
  const [cardForm, setCardForm] = useState({ name: '', limit: '', closingDay: '1', dueDay: '10', defaultPaymentAccountId: '', color: '#3b82f6' });
  const [txForm, setTxForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], categoryId: '', description: '', installments: '1' });
  const [refundForm, setRefundForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], description: '' });
  const [payAccount, setPayAccount] = useState('');

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const openCardModal = (card?: CreditCard) => {
    if (card) {
      setEditingCard(card);
      setCardForm({
        name: card.name,
        limit: card.limit.toString(),
        closingDay: card.closingDay.toString(),
        dueDay: card.dueDay.toString(),
        defaultPaymentAccountId: card.defaultPaymentAccountId || '',
        color: card.color || '#3b82f6'
      });
    } else {
      setEditingCard(null);
      setCardForm({ name: '', limit: '', closingDay: '1', dueDay: '10', defaultPaymentAccountId: '', color: '#3b82f6' });
    }
    setIsCardModalOpen(true);
  };

  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: cardForm.name,
      limit: parseFloat(cardForm.limit),
      closingDay: parseInt(cardForm.closingDay),
      dueDay: parseInt(cardForm.dueDay),
      defaultPaymentAccountId: cardForm.defaultPaymentAccountId || undefined,
      color: cardForm.color
    };

    if (editingCard && onEditCard) {
      onEditCard(editingCard.id, payload);
    } else {
      onAddCard(payload);
    }
    setIsCardModalOpen(false);
  };

  const openTxModal = (tx?: CreditCardTransaction) => {
    if (tx) {
      setEditingTx(tx);
      setTxForm({
        amount: tx.amount.toString(),
        date: tx.date,
        categoryId: tx.categoryId,
        description: tx.description || '',
        installments: '1' // Editing always treats as single unit unless complex logic added
      });
    } else {
      setEditingTx(null);
      setTxForm({ amount: '', date: new Date().toISOString().split('T')[0], categoryId: '', description: '', installments: '1' });
    }
    setIsTxModalOpen(true);
  };

  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardId) return;

    if (editingTx && onEditTransaction) {
       // Edit Mode
       onEditTransaction(editingTx.id, {
          amount: parseFloat(txForm.amount),
          date: txForm.date,
          categoryId: txForm.categoryId,
          description: txForm.description
       });
    } else {
       // Add Mode
       onAddTransaction({
         cardId: selectedCardId,
         amount: parseFloat(txForm.amount),
         date: txForm.date,
         categoryId: txForm.categoryId,
         description: txForm.description
       }, parseInt(txForm.installments));
    }
    setIsTxModalOpen(false);
  };

  const handleDeleteTx = (id: string) => {
    setDeletingTxId(id);
  };

  const confirmDeleteTx = () => {
    if (deletingTxId && onDeleteTransaction) {
      onDeleteTransaction(deletingTxId);
    }
    setDeletingTxId(null);
  };

  const confirmDeleteCard = () => {
    if (deletingCardId) {
      onDeleteCard(deletingCardId);
      if (selectedCardId === deletingCardId) {
        setView('list');
        setSelectedCardId(null);
      }
      setDeletingCardId(null);
    }
  };

  const handleSelectCard = (cardId: string) => {
    let checkDate = new Date();
    let currentMonthInfo = getInvoiceInfo(cardId, checkDate.getMonth(), checkDate.getFullYear());
    
    let attempts = 0;
    while (currentMonthInfo?.isPaid && attempts < 12) {
      checkDate.setMonth(checkDate.getMonth() + 1);
      currentMonthInfo = getInvoiceInfo(cardId, checkDate.getMonth(), checkDate.getFullYear());
      attempts++;
    }
    
    setCurrentDate(checkDate);
    setSelectedCardId(cardId);
    setView('details');
  };

  const openRefundModal = (tx: CreditCardTransaction) => {
    setRefundingTx(tx);
    setRefundForm({
      amount: tx.amount.toString(), // Default to full amount
      date: new Date().toISOString().split('T')[0],
      description: `Estorno: ${tx.description}`
    });
    setIsRefundModalOpen(true);
  };

  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (refundingTx && onAddRefund) {
      const amt = parseFloat(refundForm.amount);
      if (amt > refundingTx.amount) {
        toast.error('O valor do estorno não pode ser maior que o valor da compra.');
        return;
      }
      onAddRefund(refundingTx, amt, refundForm.date, refundForm.description);
      setIsRefundModalOpen(false);
    }
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceInfo || !payAccount || !selectedCardId) return;
    onPayInvoice(invoiceInfo, payAccount);
    setIsPayModalOpen(false);
    
    // Advance to next unpaid month automatically after paying
    let checkDate = new Date(currentDate);
    checkDate.setMonth(checkDate.getMonth() + 1);
    let nextMonthInfo = getInvoiceInfo(selectedCardId, checkDate.getMonth(), checkDate.getFullYear());
    
    let attempts = 0;
    while (nextMonthInfo?.isPaid && attempts < 12) {
      checkDate.setMonth(checkDate.getMonth() + 1);
      nextMonthInfo = getInvoiceInfo(selectedCardId, checkDate.getMonth(), checkDate.getFullYear());
      attempts++;
    }
    
    setCurrentDate(checkDate);
  };

  const selectedCard = cards.find(c => c.id === selectedCardId);
  const invoiceInfo = selectedCard ? getInvoiceInfo(selectedCard.id, currentDate.getMonth(), currentDate.getFullYear()) : null;

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // DETAILS VIEW
  if (view === 'details' && selectedCard) {
    return (
      <PageShell>
        <button onClick={() => setView('list')} className="flex items-center text-slate-400 hover:text-white mb-4 transition-colors">
          <ChevronLeft size={16} className="mr-1" /> Voltar para Cartões
        </button>

        {/* Card Header */}
        <GlassCard className="mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {selectedCard.color && (
                  <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: selectedCard.color }} />
                )}
                <h2 className="text-3xl font-bold text-white">{selectedCard.name}</h2>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <p className="text-slate-400">Limite: <span className="text-slate-200 font-medium">{formatCurrency(selectedCard.limit)}</span></p>
                {selectedCard.defaultPaymentAccountId && (
                  <p className="text-slate-500">
                    Conta Padrão: {accounts.find(a => a.id === selectedCard.defaultPaymentAccountId)?.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <GlassButton onClick={() => openCardModal(selectedCard)} variant="ghost" icon={<Edit2 size={16}/>}>Editar</GlassButton>
              <GlassButton onClick={() => setDeletingCardId(selectedCard.id)} variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" icon={<Trash2 size={16}/>}>Excluir</GlassButton>
              <GlassButton onClick={() => openTxModal()} icon={<Plus size={16}/>} className="hidden md:flex">Nova Compra</GlassButton>
            </div>
          </div>
        </GlassCard>

        {/* Invoice Controls */}
        <div className="flex items-center justify-between glass-sm p-4 rounded-xl border border-white/5 mb-6">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white/5 rounded-lg text-slate-300 transition-colors"><ChevronLeft size={24} /></button>
          <div className="text-center">
            <span className="block text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Fatura de</span>
            <span className="block text-xl font-bold text-white capitalize">{monthName}</span>
          </div>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white/5 rounded-lg text-slate-300 transition-colors"><ChevronRight size={24} /></button>
        </div>

        {/* Invoice Summary */}
        <GlassCard className="p-0 overflow-hidden">
           <div className="p-6 border-b border-white/5 bg-white/5">
             <div className="flex flex-col md:flex-row justify-between items-end gap-6">
               <div>
                 <p className="text-slate-400 text-sm font-medium mb-2">Vencimento em {new Date(invoiceInfo?.dueDate).toLocaleDateString('pt-BR')}</p>
                 <div className="text-4xl font-bold text-white">
                   {formatCurrency(invoiceInfo?.amount || 0)}
                 </div>
                 <p className={`text-sm mt-2 font-bold uppercase tracking-wider ${invoiceInfo?.isPaid ? 'text-emerald-400' : 'text-blue-400'}`}>
                   {invoiceInfo?.isPaid ? 'Fatura Paga' : 'Fatura Aberta'}
                 </p>
               </div>
               {!invoiceInfo?.isPaid && (invoiceInfo?.amount || 0) > 0 && (
                 <GlassButton onClick={() => {
                   setPayAccount(selectedCard.defaultPaymentAccountId || '');
                   setIsPayModalOpen(true);
                 }} variant="primary" size="lg" className="hidden md:flex">Pagar Fatura</GlassButton>
               )}
             </div>
           </div>

           {/* Transaction List */}
           <div className="p-6 space-y-4">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transações da Fatura</h3>
             {invoiceInfo?.transactions && (invoiceInfo.transactions as any[]).length > 0 ? (
               (invoiceInfo.transactions as any[]).map((tx: CreditCardTransaction) => {
                 const isRefund = tx.type === 'refund';
                 return (
                  <div key={tx.id} className={`flex justify-between items-center py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-3 -mx-3 rounded-lg transition-colors group ${isRefund ? 'opacity-80' : ''}`}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`p-2.5 rounded-xl text-xl shadow-inner border border-white/5 shrink-0 ${isRefund ? 'bg-red-500/10 text-red-400' : 'bg-white/5'}`}>
                        {isRefund ? <RotateCcw size={20}/> : (categories.find(c => c.id === tx.categoryId)?.emoji || '🛒')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold truncate ${isRefund ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                           {tx.description || (isRefund ? 'Estorno' : 'Compra')}
                        </p>
                        <p className="text-slate-500 text-xs mt-0.5 truncate">
                          {new Date(tx.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
                          {!isRefund && tx.installment.total > 1 && ` • Parcela ${tx.installment.current}/${tx.installment.total}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-end md:items-center gap-2 shrink-0 ml-2">
                        <span className={`font-medium whitespace-nowrap ${isRefund ? 'text-emerald-400' : 'text-white'}`}>
                           {formatCurrency(tx.amount)}
                        </span>
                        
                        {/* Actions (Only for unpaid invoices and not already refunds) */}
                        {!invoiceInfo.isPaid && !isRefund && (
                           <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openRefundModal(tx)} className="p-1.5 text-amber-400 hover:bg-white/10 rounded-lg transition-colors" title="Estornar">
                                 <RotateCcw size={14} />
                              </button>
                              <button onClick={() => openTxModal(tx)} className="p-1.5 text-blue-400 hover:bg-white/10 rounded-lg transition-colors" title="Editar">
                                 <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleDeleteTx(tx.id)} className="p-1.5 text-red-400 hover:bg-white/10 rounded-lg transition-colors" title="Excluir">
                                 <Trash2 size={14} />
                              </button>
                           </div>
                        )}
                        {/* Delete action for manual refunds if mistake made */}
                        {!invoiceInfo.isPaid && isRefund && (
                           <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleDeleteTx(tx.id)} className="p-1.5 text-red-400 hover:bg-white/10 rounded-lg transition-colors" title="Excluir Estorno">
                                 <Trash2 size={14} />
                              </button>
                           </div>
                        )}
                    </div>
                  </div>
                 );
               })
             ) : (
               <div className="text-center py-10 bg-white/5 rounded-xl border border-white/5 border-dashed">
                 <p className="text-slate-500">Nenhuma compra nesta fatura.</p>
               </div>
             )}
           </div>
        </GlassCard>
        
        {/* Modals reused */}
        <ModalShell isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} title={editingTx ? "Editar Compra" : "Nova Compra"}>
          <ModalBody>
            <form id="tx-form" onSubmit={handleTxSubmit} className="space-y-4">
               {editingTx && (
                  <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2 mb-4">
                     <AlertTriangle size={14} />
                     <span>Editando apenas esta parcela. O limite total não será recalculado automaticamente para outras parcelas.</span>
                  </div>
               )}
               <GlassInput 
                  label="Valor"
                  type="number" 
                  step="0.01" 
                  value={txForm.amount} 
                  onChange={e => setTxForm({...txForm, amount: e.target.value})} 
                  required 
               />
               <GlassInput 
                  label="Data"
                  type="date" 
                  value={txForm.date} 
                  onChange={e => setTxForm({...txForm, date: e.target.value})} 
                  required 
               />
               <GlassSelect
                  label="Categoria"
                  value={txForm.categoryId}
                  onChange={e => setTxForm({...txForm, categoryId: e.target.value})}
                  options={[
                    { value: "", label: "Selecione..." },
                    ...categories.filter(c => c.kind === 'expense' && c.id !== 'cat_invoice_payment').map(c => ({ value: c.id, label: `${c.emoji} ${c.name}` }))
                  ]}
                  required
               />
               <GlassInput 
                  label="Descrição"
                  value={txForm.description} 
                  onChange={e => setTxForm({...txForm, description: e.target.value})} 
               />
               {!editingTx && (
                   <GlassSelect
                      label="Parcelas"
                      value={txForm.installments}
                      onChange={e => setTxForm({...txForm, installments: e.target.value})}
                      options={Array.from({length: 12}, (_, i) => i + 1).map(i => ({ value: i, label: `${i}x ${i === 1 ? '(À vista)' : ''}` }))}
                   />
               )}
            </form>
          </ModalBody>
          <ModalFooter>
             <GlassButton type="button" variant="ghost" onClick={() => setIsTxModalOpen(false)}>Cancelar</GlassButton>
             <GlassButton type="submit" form="tx-form">Salvar</GlassButton>
          </ModalFooter>
        </ModalShell>

        {/* Refund Modal */}
        <ModalShell isOpen={isRefundModalOpen} onClose={() => setIsRefundModalOpen(false)} title="Estornar Compra">
           <ModalBody>
              <form id="refund-form" onSubmit={handleRefundSubmit} className="space-y-4">
                 <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm text-slate-400 mb-2">
                    Compra original: <span className="text-white font-bold">{refundingTx?.description}</span> <br/>
                    Valor original: <span className="text-white font-bold">{formatCurrency(refundingTx?.amount || 0)}</span>
                 </div>
                 <div>
                    <GlassInput 
                       label="Valor do Estorno (R$)"
                       type="number" 
                       step="0.01" 
                       max={refundingTx?.amount} 
                       value={refundForm.amount} 
                       onChange={e => setRefundForm({...refundForm, amount: e.target.value})} 
                       required 
                    />
                    <p className="text-xs text-slate-500 mt-1 ml-1">O valor será subtraído da fatura.</p>
                 </div>
                 <GlassInput 
                    label="Data do Estorno"
                    type="date" 
                    value={refundForm.date} 
                    onChange={e => setRefundForm({...refundForm, date: e.target.value})} 
                    required 
                 />
                 <GlassInput 
                    label="Descrição"
                    value={refundForm.description} 
                    onChange={e => setRefundForm({...refundForm, description: e.target.value})} 
                 />
              </form>
           </ModalBody>
           <ModalFooter>
              <GlassButton type="button" variant="ghost" onClick={() => setIsRefundModalOpen(false)}>Cancelar</GlassButton>
              <GlassButton type="submit" form="refund-form">Confirmar Estorno</GlassButton>
           </ModalFooter>
        </ModalShell>

        <ModalShell isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Pagar Fatura">
          <ModalBody>
            <form id="pay-form" onSubmit={handlePaySubmit} className="space-y-4">
              <div className="bg-white/5 p-6 rounded-xl border border-white/5 text-center">
                <p className="text-slate-400 text-sm mb-1">Valor Total</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(invoiceInfo?.amount || 0)}</p>
              </div>
              <GlassSelect
                 label="Pagar com a conta:"
                 value={payAccount}
                 onChange={e => setPayAccount(e.target.value)}
                 options={[
                   { value: "", label: "Selecione..." },
                   ...accounts.map(a => ({ value: a.id, label: a.name }))
                 ]}
                 required
              />
            </form>
          </ModalBody>
          <ModalFooter>
             <GlassButton type="button" variant="ghost" onClick={() => setIsPayModalOpen(false)}>Cancelar</GlassButton>
             <GlassButton type="submit" form="pay-form">Confirmar Pagamento</GlassButton>
          </ModalFooter>
        </ModalShell>

        <ModalShell isOpen={!!deletingTxId} onClose={() => setDeletingTxId(null)} title="Excluir Compra">
          <ModalBody>
            <div className="text-center space-y-4 py-4">
              <div className="bg-red-500/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2 border border-red-500/20">
                 <AlertTriangle size={32} className="text-red-500" />
              </div>
              <div>
                <p className="text-lg text-slate-200">Tem certeza que deseja excluir esta compra?</p>
                <p className="text-sm text-slate-400 mt-2">
                  Se houver estornos vinculados, eles também serão removidos.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <GlassButton type="button" variant="ghost" onClick={() => setDeletingTxId(null)}>Cancelar</GlassButton>
            <GlassButton type="button" variant="danger" onClick={confirmDeleteTx}>Confirmar Exclusão</GlassButton>
          </ModalFooter>
        </ModalShell>

        <ModalShell isOpen={!!deletingCardId} onClose={() => setDeletingCardId(null)} title="Excluir Cartão">
          <ModalBody>
            <div className="text-center space-y-4 py-4">
              <div className="bg-red-500/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2 border border-red-500/20">
                 <AlertTriangle size={32} className="text-red-500" />
              </div>
              <div>
                <p className="text-lg text-slate-200">Tem certeza que deseja excluir este cartão?</p>
                <p className="text-sm text-slate-400 mt-2">
                  Todas as compras, estornos e faturas vinculadas a este cartão também serão removidas permanentemente.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <GlassButton type="button" variant="ghost" onClick={() => setDeletingCardId(null)}>Cancelar</GlassButton>
            <GlassButton type="button" variant="danger" onClick={confirmDeleteCard}>Confirmar Exclusão</GlassButton>
          </ModalFooter>
        </ModalShell>

        <ModalShell isOpen={isCardModalOpen} onClose={() => setIsCardModalOpen(false)} title={editingCard ? 'Editar Cartão' : 'Novo Cartão'}>
            <ModalBody>
               <form id="card-form-details" onSubmit={handleCardSubmit} className="space-y-4">
                  <GlassInput 
                     label="Nome do Cartão"
                     value={cardForm.name} 
                     onChange={e => setCardForm({...cardForm, name: e.target.value})} 
                     placeholder="Ex: Nubank, Inter..." 
                     required 
                  />
                  <GlassInput 
                     label="Limite Total"
                     type="number" 
                     value={cardForm.limit} 
                     onChange={e => setCardForm({...cardForm, limit: e.target.value})} 
                     required 
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <GlassInput 
                       label="Dia Fechamento"
                       type="number" 
                       min="1" 
                       max="31" 
                       value={cardForm.closingDay} 
                       onChange={e => setCardForm({...cardForm, closingDay: e.target.value})} 
                       required 
                    />
                    <GlassInput 
                       label="Dia Vencimento"
                       type="number" 
                       min="1" 
                       max="31" 
                       value={cardForm.dueDay} 
                       onChange={e => setCardForm({...cardForm, dueDay: e.target.value})} 
                       required 
                    />
                  </div>
                  <div>
                     <GlassSelect
                        label="Conta Padrão de Pagamento (Opcional)"
                        value={cardForm.defaultPaymentAccountId}
                        onChange={e => setCardForm({...cardForm, defaultPaymentAccountId: e.target.value})}
                        options={[
                          { value: "", label: "Selecionar..." },
                          ...accounts.map(a => ({ value: a.id, label: a.name }))
                        ]}
                     />
                     <p className="text-xs text-slate-500 mt-1 ml-1">Usado para estimar o saldo futuro.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-2 ml-1">Cor do Cartão</label>
                    <div className="flex flex-wrap gap-2 px-1">
                      {CARD_COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setCardForm({...cardForm, color})}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${cardForm.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
                          style={{ backgroundColor: color }}
                        >
                          {cardForm.color === color && <Check size={16} className="text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
               </form>
            </ModalBody>
            <ModalFooter>
              <GlassButton type="button" variant="ghost" onClick={() => setIsCardModalOpen(false)}>Cancelar</GlassButton>
              <GlassButton type="submit" form="card-form-details">Salvar Cartão</GlassButton>
            </ModalFooter>
        </ModalShell>

        <MobileFab
          visible={!isTxModalOpen && !isPayModalOpen && !isRefundModalOpen && !isCardModalOpen}
          actions={[
            { 
              id: 'new-purchase', 
              label: 'Nova Compra', 
              icon: <Plus size={24} />, 
              onClick: () => openTxModal() 
            },
            ...(!invoiceInfo?.isPaid && (invoiceInfo?.amount || 0) > 0 ? [{
              id: 'pay-invoice',
              label: 'Pagar Fatura',
              icon: <Banknote size={24} />,
              onClick: () => {
                setPayAccount(selectedCard.defaultPaymentAccountId || '');
                setIsPayModalOpen(true);
              },
              variant: 'success' as const
            }] : [])
          ]}
        />
      </PageShell>
    );
  }

  // LIST VIEW
  return (
    <PageShell>
      <PageHeader 
        title="Meus Cartões" 
        subtitle="Gerencie faturas e limites dos seus cartões de crédito."
        actions={
          <GlassButton onClick={() => openCardModal()} icon={<Plus size={18}/>} className="hidden md:flex">Novo Cartão</GlassButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(card => (
          <GlassCard key={card.id} onClick={() => handleSelectCard(card.id)} className="cursor-pointer group relative overflow-hidden flex flex-col justify-between h-56 hover:border-blue-500/30">
             {/* Decorative Background */}
             <div className="absolute top-0 right-0 p-6 opacity-[0.03] transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                <CardIcon size={160} />
             </div>
             
             <div className="relative z-10">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <div className="flex items-center gap-2">
                     {card.color && (
                       <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: card.color }} />
                     )}
                     <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">{card.name}</h3>
                   </div>
                   <div className="flex gap-2 text-xs text-slate-400 mt-1">
                      <span className="bg-white/5 border border-white/5 px-2 py-0.5 rounded">Fecha dia {card.closingDay}</span>
                      <span className="bg-white/5 border border-white/5 px-2 py-0.5 rounded">Vence dia {card.dueDay}</span>
                   </div>
                 </div>
                 <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl shadow-inner">
                   <CardIcon style={{ color: card.color || '#60a5fa' }} size={24} />
                 </div>
               </div>
               
               <div>
                 <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">Limite Total</p>
                 <p className="text-2xl font-bold text-slate-200">{formatCurrency(card.limit)}</p>
               </div>
             </div>
               
             <div className="relative z-10 mt-auto pt-4 border-t border-white/5">
                <span className="text-sm font-semibold text-blue-400 group-hover:text-blue-300 flex items-center gap-1 transition-colors">
                  Ver Fatura e Lançamentos <ChevronRight size={16}/>
                </span>
             </div>
          </GlassCard>
        ))}
        
        {cards.length === 0 && (
           <div className="col-span-full text-center py-16 text-slate-500 border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
             <CardIcon size={48} className="mx-auto mb-4 opacity-20" />
             <p className="text-lg font-medium">Nenhum cartão cadastrado.</p>
             <p className="text-sm opacity-70">Adicione um cartão para controlar seus gastos a crédito.</p>
           </div>
        )}
      </div>

      {/* Add/Edit Card Modal */}
      <ModalShell isOpen={isCardModalOpen} onClose={() => setIsCardModalOpen(false)} title={editingCard ? 'Editar Cartão' : 'Novo Cartão'}>
        <ModalBody>
           <form id="card-form-list" onSubmit={handleCardSubmit} className="space-y-4">
              <GlassInput 
                 label="Nome do Cartão"
                 value={cardForm.name} 
                 onChange={e => setCardForm({...cardForm, name: e.target.value})} 
                 placeholder="Ex: Nubank, Inter..." 
                 required 
              />
              <GlassInput 
                 label="Limite Total"
                 type="number" 
                 value={cardForm.limit} 
                 onChange={e => setCardForm({...cardForm, limit: e.target.value})} 
                 required 
              />
              <div className="grid grid-cols-2 gap-4">
                <GlassInput 
                   label="Dia Fechamento"
                   type="number" 
                   min="1" 
                   max="31" 
                   value={cardForm.closingDay} 
                   onChange={e => setCardForm({...cardForm, closingDay: e.target.value})} 
                   required 
                />
                <GlassInput 
                   label="Dia Vencimento"
                   type="number" 
                   min="1" 
                   max="31" 
                   value={cardForm.dueDay} 
                   onChange={e => setCardForm({...cardForm, dueDay: e.target.value})} 
                   required 
                />
              </div>
              <div>
                 <GlassSelect
                    label="Conta Padrão de Pagamento (Opcional)"
                    value={cardForm.defaultPaymentAccountId}
                    onChange={e => setCardForm({...cardForm, defaultPaymentAccountId: e.target.value})}
                    options={[
                      { value: "", label: "Selecionar..." },
                      ...accounts.map(a => ({ value: a.id, label: a.name }))
                    ]}
                 />
                 <p className="text-xs text-slate-500 mt-1 ml-1">Usado para estimar o saldo futuro.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 ml-1">Cor do Cartão</label>
                <div className="flex flex-wrap gap-2 px-1">
                  {CARD_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCardForm({...cardForm, color})}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${cardForm.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
                      style={{ backgroundColor: color }}
                    >
                      {cardForm.color === color && <Check size={16} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>
           </form>
        </ModalBody>
        <ModalFooter>
           <GlassButton type="button" variant="ghost" onClick={() => setIsCardModalOpen(false)}>Cancelar</GlassButton>
           <GlassButton type="submit" form="card-form-list">Salvar Cartão</GlassButton>
        </ModalFooter>
      </ModalShell>

      <MobileFab
        visible={!isCardModalOpen}
        actions={[
          { 
            id: 'new-card', 
            label: 'Novo Cartão', 
            icon: <Plus size={24} />, 
            onClick: () => openCardModal() 
          }
        ]}
      />
    </PageShell>
  );
};
