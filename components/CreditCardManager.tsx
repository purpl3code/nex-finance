import React, { useState } from 'react';
import { CreditCard, CreditCardInvoice, Category, Account } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { PageShell } from './ui/PageShell';
import { PageHeader } from './ui/PageHeader';
import { CreditCard as CardIcon, Plus, Trash2, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';

interface CreditCardManagerProps {
  cards: CreditCard[];
  categories: Category[];
  accounts: Account[];
  onAddCard: (card: any) => void;
  onDeleteCard: (id: string) => void;
  onAddTransaction: (tx: any, installments: number) => void;
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
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  // Form States
  const [cardForm, setCardForm] = useState({ name: '', limit: '', closingDay: '1', dueDay: '10', defaultPaymentAccountId: '' });
  const [txForm, setTxForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], categoryId: '', description: '', installments: '1' });
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
        defaultPaymentAccountId: card.defaultPaymentAccountId || ''
      });
    } else {
      setEditingCard(null);
      setCardForm({ name: '', limit: '', closingDay: '1', dueDay: '10', defaultPaymentAccountId: '' });
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
      defaultPaymentAccountId: cardForm.defaultPaymentAccountId || undefined
    };

    if (editingCard && onEditCard) {
      onEditCard(editingCard.id, payload);
    } else {
      onAddCard(payload);
    }
    setIsCardModalOpen(false);
  };

  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardId) return;
    onAddTransaction({
      cardId: selectedCardId,
      amount: parseFloat(txForm.amount),
      date: txForm.date,
      categoryId: txForm.categoryId,
      description: txForm.description
    }, parseInt(txForm.installments));
    setIsTxModalOpen(false);
    setTxForm({ amount: '', date: new Date().toISOString().split('T')[0], categoryId: '', description: '', installments: '1' });
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceInfo || !payAccount) return;
    onPayInvoice(invoiceInfo, payAccount);
    setIsPayModalOpen(false);
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
        <button onClick={() => setView('list')} className="flex items-center text-slate-400 hover:text-white mb-2 transition-colors">
          <ChevronLeft size={16} /> Voltar para Cartões
        </button>

        {/* Card Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 p-6 rounded-xl shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{selectedCard.name}</h2>
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
              <Button onClick={() => openCardModal(selectedCard)} variant="ghost" icon={<Edit2 size={16}/>}>Editar</Button>
              <Button onClick={() => setIsTxModalOpen(true)} icon={<Plus size={16}/>}>Nova Compra</Button>
            </div>
          </div>
        </div>

        {/* Invoice Controls */}
        <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
          <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"><ChevronLeft size={24} /></button>
          <div className="text-center">
            <span className="block text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Fatura de</span>
            <span className="block text-xl font-bold text-white capitalize">{monthName}</span>
          </div>
          <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"><ChevronRight size={24} /></button>
        </div>

        {/* Invoice Summary */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
           <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8 pb-6 border-b border-slate-700/50">
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
               <Button onClick={() => {
                 setPayAccount(selectedCard.defaultPaymentAccountId || '');
                 setIsPayModalOpen(true);
               }} variant="primary" size="lg">Pagar Fatura</Button>
             )}
           </div>

           {/* Transaction List */}
           <div className="space-y-4">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transações da Fatura</h3>
             {invoiceInfo?.transactions && (invoiceInfo.transactions as any[]).length > 0 ? (
               (invoiceInfo.transactions as any[]).map((tx: any) => (
                 <div key={tx.id} className="flex justify-between items-center py-3 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/20 px-2 -mx-2 rounded transition-colors">
                   <div className="flex items-center gap-4">
                     <div className="bg-slate-700/50 p-2.5 rounded-lg text-xl shadow-inner">
                       {categories.find(c => c.id === tx.categoryId)?.emoji || '🛒'}
                     </div>
                     <div>
                       <p className="text-slate-200 text-sm font-semibold">{tx.description || 'Compra'}</p>
                       <p className="text-slate-500 text-xs mt-0.5">
                         {new Date(tx.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
                         {tx.installment.total > 1 && ` • Parcela ${tx.installment.current}/${tx.installment.total}`}
                       </p>
                     </div>
                   </div>
                   <span className="text-white font-medium">{formatCurrency(tx.amount)}</span>
                 </div>
               ))
             ) : (
               <div className="text-center py-10 bg-slate-800/50 rounded-lg border border-slate-700 border-dashed">
                 <p className="text-slate-500">Nenhuma compra nesta fatura.</p>
               </div>
             )}
           </div>
        </div>
        
        {/* Modals reused */}
        <Modal isOpen={isTxModalOpen} onClose={() => setIsTxModalOpen(false)} title="Nova Compra no Cartão">
          <form onSubmit={handleTxSubmit} className="space-y-4">
             <div>
               <label className="block text-sm text-slate-300 mb-1">Valor</label>
               <input type="number" step="0.01" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={txForm.amount} onChange={e => setTxForm({...txForm, amount: e.target.value})} required />
             </div>
             <div>
               <label className="block text-sm text-slate-300 mb-1">Data</label>
               <input type="date" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={txForm.date} onChange={e => setTxForm({...txForm, date: e.target.value})} required />
             </div>
             <div>
               <label className="block text-sm text-slate-300 mb-1">Categoria</label>
               <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={txForm.categoryId} onChange={e => setTxForm({...txForm, categoryId: e.target.value})} required>
                 <option value="">Selecione...</option>
                 {categories.filter(c => c.kind === 'expense' && c.id !== 'cat_invoice_payment').map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
               </select>
             </div>
             <div>
               <label className="block text-sm text-slate-300 mb-1">Descrição</label>
               <input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={txForm.description} onChange={e => setTxForm({...txForm, description: e.target.value})} />
             </div>
             <div>
               <label className="block text-sm text-slate-300 mb-1">Parcelas</label>
               <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={txForm.installments} onChange={e => setTxForm({...txForm, installments: e.target.value})}>
                 {Array.from({length: 12}, (_, i) => i + 1).map(i => <option key={i} value={i}>{i}x {i === 1 ? '(À vista)' : ''}</option>)}
               </select>
             </div>
             <div className="flex justify-end gap-2 pt-2">
               <Button type="button" variant="ghost" onClick={() => setIsTxModalOpen(false)}>Cancelar</Button>
               <Button type="submit">Adicionar</Button>
             </div>
          </form>
        </Modal>

        <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Pagar Fatura">
          <form onSubmit={handlePaySubmit} className="space-y-4">
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 text-center">
              <p className="text-slate-400 text-sm">Valor Total</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(invoiceInfo?.amount || 0)}</p>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Pagar com a conta:</label>
              <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={payAccount} onChange={e => setPayAccount(e.target.value)} required>
                <option value="">Selecione...</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
               <Button type="button" variant="ghost" onClick={() => setIsPayModalOpen(false)}>Cancelar</Button>
               <Button type="submit">Confirmar Pagamento</Button>
             </div>
          </form>
        </Modal>

        <Modal isOpen={isCardModalOpen} onClose={() => setIsCardModalOpen(false)} title={editingCard ? 'Editar Cartão' : 'Novo Cartão'}>
            <form onSubmit={handleCardSubmit} className="space-y-4">
               <div>
                 <label className="block text-sm text-slate-300 mb-1">Nome do Cartão</label>
                 <input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={cardForm.name} onChange={e => setCardForm({...cardForm, name: e.target.value})} placeholder="Ex: Nubank, Inter..." required />
               </div>
               <div>
                 <label className="block text-sm text-slate-300 mb-1">Limite Total</label>
                 <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={cardForm.limit} onChange={e => setCardForm({...cardForm, limit: e.target.value})} required />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm text-slate-300 mb-1">Dia Fechamento</label>
                   <input type="number" min="1" max="31" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={cardForm.closingDay} onChange={e => setCardForm({...cardForm, closingDay: e.target.value})} required />
                 </div>
                 <div>
                   <label className="block text-sm text-slate-300 mb-1">Dia Vencimento</label>
                   <input type="number" min="1" max="31" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={cardForm.dueDay} onChange={e => setCardForm({...cardForm, dueDay: e.target.value})} required />
                 </div>
               </div>
               <div>
                  <label className="block text-sm text-slate-300 mb-1">Conta Padrão de Pagamento (Opcional)</label>
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={cardForm.defaultPaymentAccountId} onChange={e => setCardForm({...cardForm, defaultPaymentAccountId: e.target.value})}>
                     <option value="">Selecionar...</option>
                     {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Usado para estimar o saldo futuro.</p>
               </div>
               <div className="flex justify-end gap-2 pt-2">
                 <Button type="button" variant="ghost" onClick={() => setIsCardModalOpen(false)}>Cancelar</Button>
                 <Button type="submit">Salvar Cartão</Button>
               </div>
            </form>
        </Modal>
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
          <Button onClick={() => openCardModal()} icon={<Plus size={18}/>}>Novo Cartão</Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map(card => (
          <div key={card.id} onClick={() => { setSelectedCardId(card.id); setView('details'); }} className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-sm hover:border-slate-500 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between h-56">
             {/* Decorative Background */}
             <div className="absolute top-0 right-0 p-6 opacity-[0.03] transform translate-x-4 -translate-y-4">
                <CardIcon size={160} />
             </div>
             
             <div className="relative z-10">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <h3 className="text-xl font-bold text-white tracking-tight">{card.name}</h3>
                   <div className="flex gap-2 text-xs text-slate-400 mt-1">
                      <span className="bg-slate-700/50 px-2 py-0.5 rounded">Fecha dia {card.closingDay}</span>
                      <span className="bg-slate-700/50 px-2 py-0.5 rounded">Vence dia {card.dueDay}</span>
                   </div>
                 </div>
                 <div className="bg-slate-700 p-2.5 rounded-lg shadow-inner">
                   <CardIcon className="text-blue-400" size={24} />
                 </div>
               </div>
               
               <div>
                 <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">Limite Total</p>
                 <p className="text-2xl font-bold text-slate-200">{formatCurrency(card.limit)}</p>
               </div>
             </div>
               
             <div className="relative z-10 mt-auto pt-4 border-t border-slate-700/50">
                <span className="text-sm font-semibold text-blue-400 group-hover:text-blue-300 flex items-center gap-1 transition-colors">
                  Ver Fatura e Lançamentos <ChevronRight size={16}/>
                </span>
             </div>
          </div>
        ))}
        
        {cards.length === 0 && (
           <div className="col-span-full text-center py-16 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
             <CardIcon size={48} className="mx-auto mb-4 opacity-20" />
             <p className="text-lg font-medium">Nenhum cartão cadastrado.</p>
             <p className="text-sm opacity-70">Adicione um cartão para controlar seus gastos a crédito.</p>
           </div>
        )}
      </div>

      {/* Add/Edit Card Modal */}
      <Modal isOpen={isCardModalOpen} onClose={() => setIsCardModalOpen(false)} title={editingCard ? 'Editar Cartão' : 'Novo Cartão'}>
        <form onSubmit={handleCardSubmit} className="space-y-4">
           <div>
             <label className="block text-sm text-slate-300 mb-1">Nome do Cartão</label>
             <input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={cardForm.name} onChange={e => setCardForm({...cardForm, name: e.target.value})} placeholder="Ex: Nubank, Inter..." required />
           </div>
           <div>
             <label className="block text-sm text-slate-300 mb-1">Limite Total</label>
             <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={cardForm.limit} onChange={e => setCardForm({...cardForm, limit: e.target.value})} required />
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-sm text-slate-300 mb-1">Dia Fechamento</label>
               <input type="number" min="1" max="31" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={cardForm.closingDay} onChange={e => setCardForm({...cardForm, closingDay: e.target.value})} required />
             </div>
             <div>
               <label className="block text-sm text-slate-300 mb-1">Dia Vencimento</label>
               <input type="number" min="1" max="31" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={cardForm.dueDay} onChange={e => setCardForm({...cardForm, dueDay: e.target.value})} required />
             </div>
           </div>
           <div>
              <label className="block text-sm text-slate-300 mb-1">Conta Padrão de Pagamento (Opcional)</label>
              <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={cardForm.defaultPaymentAccountId} onChange={e => setCardForm({...cardForm, defaultPaymentAccountId: e.target.value})}>
                 <option value="">Selecionar...</option>
                 {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <p className="text-xs text-slate-500 mt-1">Usado para estimar o saldo futuro.</p>
           </div>
           <div className="flex justify-end gap-2 pt-2">
             <Button type="button" variant="ghost" onClick={() => setIsCardModalOpen(false)}>Cancelar</Button>
             <Button type="submit">Salvar Cartão</Button>
           </div>
        </form>
      </Modal>
    </PageShell>
  );
};