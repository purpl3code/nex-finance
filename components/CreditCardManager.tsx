

import React, { useState } from 'react';
import { AppleEmoji } from './ui/AppleEmoji';
import { CreditCard, CreditCardInvoice, Category, Account, CreditCardTransaction } from '../types';
import { GlassButton } from './ui/GlassButton';
import { ModalShell, ModalBody, ModalFooter } from './ui/ModalShell';
import { GlassInput } from './ui/GlassInput';
import { CurrencyInput } from './ui/CurrencyInput';
import { GlassSelect } from './ui/GlassSelect';
import { GlassCard } from './ui/GlassCard';
import { PageShell } from './ui/PageShell';
import { PageHeader } from './ui/PageHeader';
import { MobileFab } from './ui/MobileFab';
import { CreditCard as CardIcon, Plus, Trash2, ChevronLeft, ChevronRight, Edit2, RotateCcw, AlertTriangle, Banknote, Check, UploadCloud, FileDown, Sparkles, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from './ui/EmptyState';
import {
  parseInvoiceFile,
  parseBankTransactions,
  parseBankCsv,
  exportInvoiceAsCsv,
  ParsedTransaction,
  BankId,
  SUPPORTED_BANKS,
} from '../utils/pdfParser';

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
  onAddTransaction: (tx: any, installments: number, installmentStart?: number, installmentTotal?: number) => void;
  onEditTransaction?: (id: string, updates: any) => void;
  onDeleteTransaction?: (id: string) => void;
  onAddRefund?: (originalTx: CreditCardTransaction, amount: number, date: string, desc: string) => void;
  onPayInvoice: (invoice: CreditCardInvoice, accountId: string, amountFromAccount?: number, amountFromPositiveBalance?: number) => void;
  onAnticipatePayment: (cardId: string, amount: number, accountId: string, discount?: number, behavior?: 'credit' | 'discount') => void;
  getInvoiceInfo: (cardId: string, month: number, year: number) => any;
  onEditCard?: (id: string, updates: any) => void;
  initialCardId?: string | null;
  initialMonth?: number;
  initialYear?: number;
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
  onAnticipatePayment,
  getInvoiceInfo,
  onEditCard,
  initialCardId,
  initialMonth,
  initialYear
}) => {
  const [view, setView] = useState<'list' | 'details'>('list');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(() => {
    if (initialYear !== undefined && initialMonth !== undefined) {
      return new Date(initialYear, initialMonth, 1);
    }
    return new Date();
  }); 
  
  const getOpenInvoiceDate = (cardId: string, startDate?: Date) => {
    let checkDate = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), 1) : new Date();
    let currentMonthInfo = getInvoiceInfo(cardId, checkDate.getMonth(), checkDate.getFullYear());
    
    if (!currentMonthInfo || !currentMonthInfo.closingDate) return checkDate;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let closingDate = new Date(currentMonthInfo.closingDate + 'T12:00:00');
    closingDate.setHours(0, 0, 0, 0);

    // If today is strictly after the closing date, the current open invoice is the NEXT month's invoice
    // We use a while loop in case the due day is early in the month and the closing day is late in the previous month
    let loops = 0;
    while (today > closingDate && loops < 12) {
      checkDate = new Date(checkDate.getFullYear(), checkDate.getMonth() + 1, 1);
      currentMonthInfo = getInvoiceInfo(cardId, checkDate.getMonth(), checkDate.getFullYear());
      if (!currentMonthInfo || !currentMonthInfo.closingDate) break;
      closingDate = new Date(currentMonthInfo.closingDate + 'T12:00:00');
      closingDate.setHours(0, 0, 0, 0);
      loops++;
    }

    // If the invoice is already paid, skip to the next unpaid one
    let attempts = 0;
    while (currentMonthInfo?.isPaid && attempts < 12) {
      checkDate = new Date(checkDate.getFullYear(), checkDate.getMonth() + 1, 1);
      currentMonthInfo = getInvoiceInfo(cardId, checkDate.getMonth(), checkDate.getFullYear());
      attempts++;
    }
    
    return checkDate;
  };

  // Handle initialCardId
  React.useEffect(() => {
    if (initialCardId) {
      if (initialYear !== undefined && initialMonth !== undefined) {
        setCurrentDate(getOpenInvoiceDate(initialCardId, new Date(initialYear, initialMonth, 1)));
      } else {
        setCurrentDate(getOpenInvoiceDate(initialCardId));
      }
      setSelectedCardId(initialCardId);
      setView('details');
      setTimeout(() => {
        const scrollContainer = document.getElementById('main-scroll-container');
        if (scrollContainer) {
          scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCardId, initialMonth, initialYear]);
  
  // Modals
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isAnticipateModalOpen, setIsAnticipateModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);

  // Edit/Add Logic
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [editingTx, setEditingTx] = useState<CreditCardTransaction | null>(null);
  const [refundingTx, setRefundingTx] = useState<CreditCardTransaction | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importedTransactions, setImportedTransactions] = useState<(ParsedTransaction & { selected: boolean, categoryId: string })[]>([]);
  const [detectedBank, setDetectedBank] = useState<BankId>('generic');
  const [selectedBank, setSelectedBank] = useState<BankId>('generic');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [rawLines, setRawLines] = useState<string[]>([]);
  const [rawCsvText, setRawCsvText] = useState<string>('');
  const [isIEMenuOpen, setIsIEMenuOpen] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const result = await parseInvoiceFile(file, currentDate.getFullYear(), selectedBank === 'generic' ? undefined : selectedBank);
      // store raw data for re-parse
      if (result.format === 'csv') {
        const text = await file.text().catch(async () => new TextDecoder('iso-8859-1').decode(await file.arrayBuffer()));
        setRawCsvText(text);
        setRawLines([]);
      } else {
        setRawLines([]); // PDF lines not needed — re-read from file if needed
        setRawCsvText('');
      }
      setDetectedBank(result.bank);
      setSelectedBank(result.bank);
      if (result.transactions.length === 0) {
        toast.error('Nenhuma compra encontrada. Tente selecionar o banco manualmente ou outro arquivo.');
      } else {
        toast.success(`${result.transactions.length} compras encontradas — ${result.bankName}`);
        setImportedTransactions(result.transactions.map(p => ({ ...p, selected: true, categoryId: '' })));
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Erro ao ler o arquivo.', { duration: 6000 });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Re-parse with different bank
  const handleBankChange = (bankId: BankId) => {
    setSelectedBank(bankId);
    if (rawCsvText) {
      const result = parseBankCsv(rawCsvText, currentDate.getFullYear(), bankId);
      if (result.transactions.length === 0) {
        toast.warning('Nenhuma transação encontrada. Tente outro banco.');
        setImportedTransactions([]);
      } else {
        toast.success(`${result.transactions.length} compras com parser ${result.bankName}`);
        setImportedTransactions(result.transactions.map((p: ParsedTransaction) => ({ ...p, selected: true, categoryId: '' })));
      }
      return;
    }
    if (rawLines.length > 0) {
      const result = parseBankTransactions(rawLines, currentDate.getFullYear(), bankId);
      if (result.transactions.length === 0) {
        toast.warning('Nenhuma transação encontrada. Tente outro banco.');
        setImportedTransactions([]);
      } else {
        toast.success(`${result.transactions.length} compras com parser ${result.bankName}`);
        setImportedTransactions(result.transactions.map((p: ParsedTransaction) => ({ ...p, selected: true, categoryId: '' })));
      }
    }
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
    setImportedTransactions([]);
    setRawLines([]);
    setRawCsvText('');
    setDetectedBank('generic');
    setSelectedBank('generic');
  };

  const handleExportCsv = () => {
    if (!invoiceInfo || !selectedCard) return;
    const txs = (invoiceInfo.transactions as any[]) || [];
    if (txs.length === 0) {
      toast.error('Nenhuma transação para exportar.');
      return;
    }
    const mapped = txs.map((tx: any) => ({
      date: tx.date,
      description: tx.description || (tx.type === 'refund' ? 'Estorno' : 'Compra'),
      amount: tx.type === 'refund' ? -tx.amount : tx.amount,
      categoryName: categories.find(c => c.id === tx.categoryId)?.name || ''
    }));
    exportInvoiceAsCsv(selectedCard.name, monthName, mapped, invoiceInfo.amount || 0);
    toast.success('Fatura exportada como CSV!');
  };

  /** Extrai { current, total } de uma string como "2/6" ou "02/06" */
  const parseInstallmentStr = (str?: string): { current: number; total: number } | null => {
    if (!str) return null;
    const m = str.match(/(\d+)\/(\d+)/);
    if (!m) return null;
    const current = parseInt(m[1], 10);
    const total = parseInt(m[2], 10);
    if (isNaN(current) || isNaN(total) || total < 1 || current > total) return null;
    return { current, total };
  };

  const confirmImport = () => {
    if (!selectedCardId) return;
    const toImport = importedTransactions.filter(t => t.selected);
    if (toImport.length === 0) {
      toast.error('Selecione pelo menos uma compra para importar.');
      return;
    }

    let totalInstallmentsCreated = 0;

    toImport.forEach(tx => {
      const inst = parseInstallmentStr(tx.installments);

      if (inst && inst.total > 1) {
        // Cria TODAS as parcelas a partir da data original da compra no PDF.
        // Ex: 31/10/2025 Parcela 6/24 → cria 24 parcelas começando em 31/10/2025.
        const totalAmount = tx.amount * inst.total;
        onAddTransaction(
          {
            cardId: selectedCardId,
            amount: totalAmount,
            date: tx.date,     // data original da compra
            categoryId: tx.categoryId,
            description: tx.description,
          },
          inst.total,   // cria TODAS as parcelas
          1,            // sempre começa da parcela 1
          inst.total
        );
        totalInstallmentsCreated += inst.total;
      } else {
        // Compra à vista
        onAddTransaction({
          cardId: selectedCardId,
          amount: tx.amount,
          date: tx.date,
          categoryId: tx.categoryId,
          description: tx.description + (tx.installments ? ` (${tx.installments})` : ''),
        }, 1);
        totalInstallmentsCreated += 1;
      }
    });

    const extraMsg = totalInstallmentsCreated > toImport.length
      ? ` (+${totalInstallmentsCreated - toImport.length} parcelas futuras criadas)`
      : '';
    toast.success(`${toImport.length} compras importadas!${extraMsg}`);
    setIsImportModalOpen(false);
    setImportedTransactions([]);
  };

  const toggleImportRule = (id: string) => {
    setImportedTransactions(prev => prev.map(t => t.id === id ? { ...t, selected: !t.selected } : t));
  };
  
  const changeImportCategory = (id: string, catId: string) => {
    setImportedTransactions(prev => prev.map(t => t.id === id ? { ...t, categoryId: catId } : t));
  };

  // Form States
  const [cardForm, setCardForm] = useState<{
    name: string; limit: string; closingDay: string; dueDay: string; defaultPaymentAccountId: string; color: string; anticipationBehavior: 'credit' | 'discount';
  }>({ name: '', limit: '', closingDay: '1', dueDay: '10', defaultPaymentAccountId: '', color: '#3b82f6', anticipationBehavior: 'credit' });
  const [txForm, setTxForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], categoryId: '', description: '', installments: '1' });
  const [refundForm, setRefundForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], description: '' });
  const [anticipateForm, setAnticipateForm] = useState({ amount: '', discount: '0' });
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
        color: card.color || '#3b82f6',
        anticipationBehavior: card.anticipationBehavior || 'credit'
      });
    } else {
      setEditingCard(null);
      setCardForm({ name: '', limit: '', closingDay: '1', dueDay: '10', defaultPaymentAccountId: '', color: '#3b82f6', anticipationBehavior: 'credit' });
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
      color: cardForm.color,
      anticipationBehavior: cardForm.anticipationBehavior,
      positiveBalance: editingCard?.positiveBalance || 0
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
    const openDate = getOpenInvoiceDate(cardId);
    if (openDate) {
      setCurrentDate(openDate);
    }
    setSelectedCardId(cardId);
    setView('details');
    setTimeout(() => {
      const scrollContainer = document.getElementById('main-scroll-container');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
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

  const handleAnticipateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCardId || !payAccount || !selectedCard) return;
    const amount = parseFloat(anticipateForm.amount);
    const discount = parseFloat(anticipateForm.discount) || 0;
    if (isNaN(amount) || amount <= 0) return;

    onAnticipatePayment(selectedCardId, amount, payAccount, discount, selectedCard.anticipationBehavior || 'credit');
    setIsAnticipateModalOpen(false);
    setAnticipateForm({ amount: '', discount: '0' });
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceInfo || !selectedCardId || !selectedCard) return;
    
    const totalAmount = invoiceInfo.amount;
    const positiveBalance = selectedCard.positiveBalance || 0;
    
    let amountFromPositiveBalance = 0;
    let amountFromAccount = totalAmount;

    if (positiveBalance > 0) {
      amountFromPositiveBalance = Math.min(totalAmount, positiveBalance);
      amountFromAccount = totalAmount - amountFromPositiveBalance;
    }

    if (amountFromAccount > 0 && !payAccount) return;

    onPayInvoice(invoiceInfo, payAccount, amountFromAccount, amountFromPositiveBalance);
    setIsPayModalOpen(false);
    
    // Advance to next unpaid month automatically after paying
    let checkDate = new Date(currentDate);
    checkDate = new Date(checkDate.getFullYear(), checkDate.getMonth() + 1, 1);
    let nextMonthInfo = getInvoiceInfo(selectedCardId, checkDate.getMonth(), checkDate.getFullYear());
    
    let attempts = 0;
    while (nextMonthInfo?.isPaid && attempts < 12) {
      checkDate = new Date(checkDate.getFullYear(), checkDate.getMonth() + 1, 1);
      nextMonthInfo = getInvoiceInfo(selectedCardId, checkDate.getMonth(), checkDate.getFullYear());
      attempts++;
    }
    
    setCurrentDate(checkDate);
  };

  const selectedCard = cards.find(c => c.id === selectedCardId);
  const invoiceInfo = selectedCard ? getInvoiceInfo(selectedCard.id, currentDate.getMonth(), currentDate.getFullYear()) : null;

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1);
    setCurrentDate(newDate);
    
    // Scroll to top when changing month to see new invoice summary
    setTimeout(() => {
      const scrollContainer = document.getElementById('main-scroll-container');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  const handleBack = () => {
    setView('list');
    setSelectedCardId(null);
    setTimeout(() => {
      const scrollContainer = document.getElementById('main-scroll-container');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // DETAILS VIEW
  if (view === 'details' && selectedCard) {
    return (
      <PageShell>
        <button onClick={handleBack} className="flex items-center text-slate-400 hover:text-white mb-4 transition-colors">
          <ChevronLeft size={16} className="mr-1" /> Voltar para Cartões
        </button>

        {/* Card Header */}
        <GlassCard className="mb-4">
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
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <GlassButton onClick={() => openCardModal(selectedCard)} variant="ghost" icon={<Edit2 size={16}/>}>Editar</GlassButton>
              <GlassButton onClick={() => setDeletingCardId(selectedCard.id)} variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" icon={<Trash2 size={16}/>}>Excluir</GlassButton>
              <GlassButton variant="secondary" icon={<ArrowUpDown size={16}/>} onClick={() => setIsIEMenuOpen(true)}>Importar/Exportar</GlassButton>
              <GlassButton onClick={() => openTxModal()} icon={<Plus size={16}/>} className="hidden md:flex">Nova Compra</GlassButton>
            </div>
          </div>
        </GlassCard>

        {/* Invoice Controls */}
        <div className="flex items-center justify-between glass-sm p-4 rounded-xl border border-white/5 mb-4">
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
             <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6">
               <div className="text-center md:text-left">
                 <p className="text-slate-400 text-sm font-medium mb-2">Vencimento em {invoiceInfo?.dueDate ? new Date(invoiceInfo.dueDate).toLocaleDateString('pt-BR') : '---'}</p>
                 <div className="text-4xl font-bold text-white">
                   {formatCurrency(invoiceInfo?.amount || 0)}
                 </div>
                 <p className={`text-sm mt-2 font-bold uppercase tracking-wider ${invoiceInfo?.isPaid ? 'text-emerald-400' : 'text-[rgb(var(--c-primary-400))]'}`}>
                   {invoiceInfo?.isPaid ? 'Fatura Paga' : 'Fatura Aberta'}
                 </p>
               </div>
               <div className="flex flex-col md:flex-row gap-3 relative z-20 pointer-events-auto">
                 {!invoiceInfo?.isPaid && (invoiceInfo?.amount || 0) > 0 && (
                   <GlassButton onClick={() => {
                     setPayAccount(selectedCard.defaultPaymentAccountId || '');
                     setIsPayModalOpen(true);
                   }} variant="primary" size="lg" className="w-full md:w-auto">Pagar Fatura</GlassButton>
                 )}
                 <GlassButton onClick={() => {
                   setPayAccount(selectedCard.defaultPaymentAccountId || '');
                   setIsAnticipateModalOpen(true);
                 }} variant="secondary" size="lg" className="w-full md:w-auto">Antecipar</GlassButton>
               </div>
             </div>
             {(selectedCard?.positiveBalance || 0) > 0 && (
               <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg flex items-center justify-between">
                 <div>
                   <p className="text-xs font-bold uppercase tracking-wider">Saldo Positivo</p>
                   <p className="text-lg font-bold">{formatCurrency(selectedCard.positiveBalance || 0)}</p>
                 </div>
                 <p className="text-xs opacity-80 max-w-[200px] text-right">
                   Este valor será abatido automaticamente no pagamento da próxima fatura.
                 </p>
               </div>
             )}
           </div>

           {/* Transaction List */}
           <div className="p-6 space-y-4">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transações da Fatura</h3>
             {invoiceInfo?.transactions && (invoiceInfo.transactions as any[]).length > 0 ? (
               (invoiceInfo.transactions as any[]).map((tx: CreditCardTransaction) => {
                 const isRefund = tx.type === 'refund';
                 return (
                  <div key={tx.id} className={`flex justify-between items-center py-2 border-b border-white/5 last:border-0 hover:bg-white/5 px-3 -mx-3 rounded-lg transition-colors group ${isRefund ? 'opacity-80' : ''}`}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`p-2.5 rounded-xl text-xl shadow-inner border border-white/5 shrink-0 ${isRefund ? 'bg-red-500/10 text-red-400' : 'bg-white/5'}`}>
                        {isRefund ? <RotateCcw size={20}/> : <AppleEmoji emoji={categories.find(c => c.id === tx.categoryId)?.emoji || '🛒'} />}
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
                           <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity relative z-20">
                              <button onClick={() => openRefundModal(tx)} className="p-1.5 text-amber-400 hover:bg-white/10 rounded-lg transition-colors active:scale-95" title="Estornar">
                                 <RotateCcw size={14} className="md:w-3.5 md:h-3.5" />
                              </button>
                              <button onClick={() => openTxModal(tx)} className="p-1.5 text-blue-400 hover:bg-white/10 rounded-lg transition-colors active:scale-95" title="Editar">
                                 <Edit2 size={14} className="md:w-3.5 md:h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteTx(tx.id)} className="p-1.5 text-red-400 hover:bg-white/10 rounded-lg transition-colors active:scale-95" title="Excluir">
                                 <Trash2 size={14} className="md:w-3.5 md:h-3.5" />
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
        
         {/* Import Modal */}
         <ModalShell isOpen={isImportModalOpen} onClose={handleCloseImportModal} title="Importar Fatura do Banco">
           <ModalBody>
             {!importedTransactions.length ? (
               <div className="space-y-5">
                 
                 {/* Info banner */}
                 <div className="bg-[rgb(var(--c-primary-500)/0.08)] border border-[rgb(var(--c-primary-500)/0.2)] text-[rgb(var(--c-primary-300))] p-4 rounded-xl text-sm flex gap-3 items-start">
                   <Sparkles size={20} className="shrink-0 mt-0.5" />
                   <div>
                     <p className="font-bold mb-0.5">Leitura local — sem envio de dados</p>
                     <p className="opacity-80 text-xs leading-relaxed">
                       Importe a fatura do seu banco como <strong>PDF</strong> (fatura fechada) ou <strong>CSV</strong> (fatura aberta ou fechada).
                       Compatível com <strong>Nubank, Itaú, Bradesco, Santander, C6, Inter</strong> e outros.
                     </p>
                   </div>
                 </div>

                 {/* Bank selector */}
                 <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-0.5">
                     Banco do Cartão <span className="text-slate-600 font-normal">(opcional — detectado automaticamente)</span>
                   </label>
                   <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2">
                     {SUPPORTED_BANKS.map(bank => (
                       <button
                         key={bank.id}
                         type="button"
                         onClick={() => handleBankChange(bank.id)}
                         className={`
                           px-3 py-2 rounded-xl border text-xs font-semibold transition-all duration-150 text-center
                           ${selectedBank === bank.id
                             ? 'bg-[rgb(var(--c-primary-500)/0.2)] border-[rgb(var(--c-primary-500)/0.5)] text-[rgb(var(--c-primary-300))]'
                             : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/8 hover:text-slate-200'}
                         `}
                       >
                         {bank.label}
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* Drag & drop zone — mobile-safe */}
                 {/* Hidden real file input (works on all platforms) */}
                 <input
                   id="invoice-file-input"
                   type="file"
                   accept="application/pdf,.pdf,text/csv,.csv,.txt"
                   onChange={handleFileUpload}
                   ref={fileInputRef}
                   className="sr-only"
                   disabled={isImporting}
                 />

                 {isImporting ? (
                   <div className="flex flex-col items-center gap-2 py-8">
                     <div className="w-10 h-10 rounded-full border-2 border-[rgb(var(--c-primary-500))] border-t-transparent animate-spin mb-1" />
                     <p className="text-slate-200 font-semibold text-sm">Lendo o arquivo...</p>
                     <p className="text-slate-500 text-xs">Pode levar alguns segundos</p>
                   </div>
                 ) : (
                   /* Drop zone (desktop) + explicit button (mobile) */
                   <label
                     htmlFor="invoice-file-input"
                     className="border-2 border-dashed border-white/15 hover:border-[rgb(var(--c-primary-500)/0.5)] active:border-[rgb(var(--c-primary-500)/0.8)] transition-all duration-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-white/3 cursor-pointer group"
                   >
                     <div className="w-14 h-14 rounded-2xl bg-[rgb(var(--c-primary-500)/0.1)] border border-[rgb(var(--c-primary-500)/0.2)] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-200">
                       <UploadCloud size={26} className="text-[rgb(var(--c-primary-400))]" />
                     </div>
                     <p className="text-slate-200 font-semibold text-center">Toque aqui para selecionar o arquivo</p>
                     <p className="text-slate-500 text-xs mt-1 text-center">PDF ou CSV da fatura do banco</p>
                     <div className="mt-4 flex gap-2">
                       <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-500 text-[10px] font-bold uppercase tracking-wider">PDF</span>
                       <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-500 text-[10px] font-bold uppercase tracking-wider">CSV</span>
                       <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-500 text-[10px] font-bold uppercase tracking-wider">TXT</span>
                     </div>
                   </label>
                 )}
               </div>
             ) : (
               <div className="space-y-3">
                 
                 {/* Detected bank chip + action bar */}
                 <div className="flex items-center justify-between gap-3 sticky top-0 bg-[rgb(var(--c-bg-900))] py-2 z-10 border-b border-white/8 mb-1">
                   <div className="flex items-center gap-2 min-w-0">
                     <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgb(var(--c-primary-500)/0.15)] border border-[rgb(var(--c-primary-500)/0.3)] text-[rgb(var(--c-primary-300))] text-xs font-bold">
                       <Sparkles size={11} />
                       {SUPPORTED_BANKS.find(b => b.id === detectedBank)?.label ?? 'Auto'}
                       {detectedBank !== selectedBank && (
                         <span className="text-slate-500 font-normal">â†’ {SUPPORTED_BANKS.find(b => b.id === selectedBank)?.label}</span>
                       )}
                     </span>
                     <p className="text-xs text-slate-500 truncate">
                       {importedTransactions.filter(t => t.selected).length} / {importedTransactions.length} selecionadas
                     </p>
                   </div>
                   <div className="flex items-center gap-2 shrink-0">
                     {/* ReParse selector */}
                     <select
                       value={selectedBank}
                       onChange={e => handleBankChange(e.target.value as BankId)}
                       className="bg-white/5 border border-white/12 rounded-lg text-xs p-1.5 text-slate-300 focus:border-[rgb(var(--c-primary-400))] focus:outline-none"
                     >
                       {SUPPORTED_BANKS.map(b => (
                         <option key={b.id} value={b.id}>{b.label}</option>
                       ))}
                     </select>
                     <GlassButton size="sm" variant="ghost" onClick={() => { setImportedTransactions([]); setRawLines([]); }}>
                       Trocar PDF
                     </GlassButton>
                   </div>
                 </div>

                 {/* Transaction list */}
                 <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                   {importedTransactions.map(tx => (
                     <div
                       key={tx.id}
                       className={`flex flex-col gap-2.5 p-3 rounded-xl border transition-all duration-150 ${
                         tx.selected
                           ? 'border-[rgb(var(--c-primary-500)/0.25)] bg-[rgb(var(--c-primary-500)/0.05)]'
                           : 'border-white/5 bg-white/5 opacity-50'
                       }`}
                     >
                       <div className="flex items-start gap-3">
                         <input
                           type="checkbox"
                           checked={tx.selected}
                           onChange={() => toggleImportRule(tx.id)}
                           className="mt-0.5 w-4 h-4 rounded border-white/20 accent-[rgb(var(--c-primary-500))] shrink-0"
                         />
                         <div className="flex-1 min-w-0">
                           <input
                             type="text"
                             value={tx.description}
                             onChange={(e) => setImportedTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, description: e.target.value } : t))}
                             className="bg-transparent border-b border-dashed border-white/15 text-white font-medium text-sm focus:outline-none focus:border-[rgb(var(--c-primary-400))] w-full"
                           />
                            <p className="text-slate-600 text-xs mt-1 flex items-center flex-wrap gap-x-2">
                              <span>{new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                              {tx.installments && (() => {
                                const instMatch = tx.installments!.match(/(\d+)\/(\d+)/);
                                const cur = instMatch ? parseInt(instMatch[1], 10) : NaN;
                                const tot = instMatch ? parseInt(instMatch[2], 10) : NaN;
                                const validInst = !isNaN(cur) && !isNaN(tot) && tot > 1 && cur <= tot;
                                const remaining = validInst ? tot - cur : 0;
                                return (
                                  <span className="inline-flex items-center gap-1.5">
                                    <span className="text-[rgb(var(--c-primary-500)/0.7)]">Parc. {tx.installments}</span>
                                    {remaining > 0 && (
                                      <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[10px] font-bold whitespace-nowrap">
                                        +{remaining} futura{remaining > 1 ? 's' : ''}
                                      </span>
                                    )}
                                  </span>
                                );
                              })()}
                            </p>
                         </div>
                         <span className="font-bold text-white text-sm whitespace-nowrap shrink-0">{formatCurrency(tx.amount)}</span>
                       </div>
                       {tx.selected && (
                         <div className="pl-7">
                           <select
                             value={tx.categoryId}
                             onChange={e => changeImportCategory(tx.id, e.target.value)}
                             className="w-full bg-black/20 border border-white/10 rounded-lg text-xs p-1.5 text-slate-300 focus:border-[rgb(var(--c-primary-400))] focus:outline-none"
                           >
                             <option value="">Selecione a Categoria...</option>
                             {categories.filter(c => c.kind === 'expense' && c.id !== 'cat_invoice_payment').map(c => (
                               <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                             ))}
                           </select>
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
               </div>
             )}
           </ModalBody>
           <ModalFooter>
             <GlassButton type="button" variant="ghost" onClick={handleCloseImportModal}>Cancelar</GlassButton>
             {importedTransactions.length > 0 && (
               <GlassButton type="button" onClick={confirmImport}>
                 Salvar {importedTransactions.filter(t => t.selected).length} Compras
               </GlassButton>
             )}
           </ModalFooter>
         </ModalShell>

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
               <CurrencyInput 
                  label="Valor"
                  value={txForm.amount} 
                  onChange={val => setTxForm({...txForm, amount: val})} 
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
                    ...categories.filter(c => c.kind === 'expense' && c.id !== 'cat_invoice_payment').map(c => ({ value: c.id, label: <span className="flex items-center gap-1.5"><AppleEmoji emoji={c.emoji}/> {c.name}</span> }))
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
                      options={Array.from({length: 24}, (_, i) => i + 1).map(i => ({ value: i, label: `${i}x ${i === 1 ? '(À vista)' : ''}` }))}
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
                    <CurrencyInput 
                       label="Valor do Estorno (R$)"
                       value={refundForm.amount} 
                       onChange={val => setRefundForm({...refundForm, amount: val})} 
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

        <ModalShell isOpen={isAnticipateModalOpen} onClose={() => setIsAnticipateModalOpen(false)} title="Antecipar Pagamento">
          <ModalBody>
            <form id="anticipate-form" onSubmit={handleAnticipateSubmit} className="space-y-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <p className="text-sm text-slate-300 mb-2">
                  {selectedCard?.anticipationBehavior === 'discount' 
                    ? 'Ao antecipar, você pode receber um desconto. O valor pago + desconto será abatido da sua fatura atual.' 
                    : 'O valor pago será adicionado como Saldo Positivo no cartão e abaterá automaticamente as próximas faturas.'}
                </p>
              </div>
              <CurrencyInput 
                 label="Valor a Pagar"
                 value={anticipateForm.amount} 
                 onChange={val => setAnticipateForm({...anticipateForm, amount: val})} 
                 required 
              />
              {selectedCard?.anticipationBehavior === 'discount' && (
                <CurrencyInput 
                   label="Desconto Recebido (Opcional)"
                   value={anticipateForm.discount} 
                   onChange={val => setAnticipateForm({...anticipateForm, discount: val})} 
                />
              )}
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
             <GlassButton type="button" variant="ghost" onClick={() => setIsAnticipateModalOpen(false)}>Cancelar</GlassButton>
             <GlassButton type="submit" form="anticipate-form">Confirmar Antecipação</GlassButton>
          </ModalFooter>
        </ModalShell>

        <ModalShell isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Pagar Fatura">
          <ModalBody>
            <form id="pay-form" onSubmit={handlePaySubmit} className="space-y-4">
              <div className="bg-white/5 p-6 rounded-xl border border-white/5 text-center">
                <p className="text-slate-400 text-sm mb-1">Valor da Fatura</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(invoiceInfo?.amount || 0)}</p>
                
                {(selectedCard?.positiveBalance || 0) > 0 && (
                  <>
                    <div className="flex justify-between items-center mt-4 text-emerald-400">
                      <span className="text-sm">Saldo Positivo Utilizado</span>
                      <span className="font-bold">-{formatCurrency(Math.min(invoiceInfo?.amount || 0, selectedCard?.positiveBalance || 0))}</span>
                    </div>
                    <div className="border-t border-white/10 my-3"></div>
                    <div className="flex justify-between items-center text-white">
                      <span className="text-sm font-bold">Total a Pagar</span>
                      <span className="text-3xl font-bold">{formatCurrency(Math.max(0, (invoiceInfo?.amount || 0) - (selectedCard?.positiveBalance || 0)))}</span>
                    </div>
                  </>
                )}
              </div>
              
              {((invoiceInfo?.amount || 0) - (selectedCard?.positiveBalance || 0)) > 0 && (
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
              )}
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

        <ModalShell isOpen={isIEMenuOpen} onClose={() => setIsIEMenuOpen(false)} title="Importar/Exportar">
          <ModalBody>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => { setIsIEMenuOpen(false); setIsImportModalOpen(true); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:bg-white/15 transition-colors text-left"
              >
                <div className="p-3 rounded-xl bg-[rgb(var(--c-primary-500)/0.1)] border border-[rgb(var(--c-primary-500)/0.2)]">
                  <UploadCloud size={22} className="text-[rgb(var(--c-primary-400))]" />
                </div>
                <div>
                  <p className="text-white font-semibold">Importar PDF</p>
                  <p className="text-slate-400 text-xs mt-0.5">Importar fatura do banco como PDF ou CSV</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => { handleExportCsv(); setIsIEMenuOpen(false); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:bg-white/15 transition-colors text-left"
              >
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <FileDown size={22} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">Exportar CSV</p>
                  <p className="text-slate-400 text-xs mt-0.5">Baixar transações da fatura atual</p>
                </div>
              </button>
            </div>
          </ModalBody>
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
                  <CurrencyInput 
                      label="Limite Total"
                      value={cardForm.limit} 
                      onChange={val => setCardForm({...cardForm, limit: val})} 
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
                     <GlassSelect
                        label="Comportamento de Antecipação"
                        value={cardForm.anticipationBehavior}
                        onChange={e => setCardForm({...cardForm, anticipationBehavior: e.target.value as 'credit' | 'discount'})}
                        options={[
                          { value: "credit", label: "Gerar Saldo Positivo (Ex: Mercado Pago)" },
                          { value: "discount", label: "Desconto na Fatura (Ex: Nubank)" }
                        ]}
                     />
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
            {
              id: 'anticipate',
              label: 'Antecipar',
              icon: <Banknote size={24} />,
              onClick: () => {
                setPayAccount(selectedCard.defaultPaymentAccountId || '');
                setIsAnticipateModalOpen(true);
              },
              variant: 'secondary' as const
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => (
          <GlassCard key={card.id} onClick={() => handleSelectCard(card.id)} className="cursor-pointer group relative overflow-hidden flex flex-col justify-between h-56 hover:border-[rgb(var(--c-primary-500)/0.3)]">
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
                     <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-[rgb(var(--c-primary-400))] transition-colors">{card.name}</h3>
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
                <span className="text-sm font-semibold text-[rgb(var(--c-primary-400))] group-hover:text-[rgb(var(--c-primary-300))] flex items-center gap-1 transition-colors">
                  Ver Fatura e Lançamentos <ChevronRight size={16}/>
                </span>
             </div>
          </GlassCard>
        ))}
        
        {cards.length === 0 && (
           <div className="col-span-full">
              <EmptyState
                variant="cards"
                title="Nenhum cartão cadastrado."
                description="Adicione um cartão de crédito para acompanhar faturas, limites e compras parceladas."
                actionLabel="Adicionar Primeiro Cartão"
                onAction={() => openCardModal()}
              />
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
              <CurrencyInput 
                  label="Limite Total"
                  value={cardForm.limit} 
                  onChange={val => setCardForm({...cardForm, limit: val})} 
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
                 <GlassSelect
                    label="Comportamento de Antecipação"
                    value={cardForm.anticipationBehavior}
                    onChange={e => setCardForm({...cardForm, anticipationBehavior: e.target.value as 'credit' | 'discount'})}
                    options={[
                      { value: "credit", label: "Gerar Saldo Positivo (Ex: Mercado Pago)" },
                      { value: "discount", label: "Desconto na Fatura (Ex: Nubank)" }
                    ]}
                 />
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
