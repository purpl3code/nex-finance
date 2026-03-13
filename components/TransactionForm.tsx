
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Category, Account, TransactionType, CategoryGroup, Transfer, CreditCard } from '../types';
import { Button } from './ui/Button';
import { ModalFooter } from './ui/ModalShell';
import { GlassSelect } from './ui/GlassSelect';
import { ArrowDownCircle, ArrowUpCircle, ArrowRightLeft } from 'lucide-react';

interface TransactionFormProps {
  initialData?: Transaction | Transfer | any;
  categories: Category[];
  accounts: Account[];
  creditCards?: CreditCard[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  currentMonth?: number;
  currentYear?: number;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ 
  initialData, 
  categories, 
  accounts,
  creditCards,
  onSubmit, 
  onCancel,
  currentMonth,
  currentYear
}) => {
  // Check if initial data is a transfer
  const initialIsTransfer = initialData && 'fromAccountId' in initialData;
  const isEditingCreditCard = initialData?.id && 'cardId' in initialData;
  const isEditingRegular = initialData?.id && 'accountId' in initialData;

  const [mode, setMode] = useState<TransactionType | 'transfer'>(
    initialIsTransfer ? 'transfer' : (isEditingCreditCard ? 'expense' : (initialData?.type || 'expense'))
  );

  const [amount, setAmount] = useState<string>(initialData?.amount?.toString() || '');
  const [date, setDate] = useState<string>(() => {
    if (initialData?.date) return initialData.date;
    
    // If we have a currentMonth/Year, and it's not the actual current month,
    // default to the 1st of that selected month. Otherwise, use today.
    const today = new Date();
    if (currentMonth !== undefined && currentYear !== undefined) {
      if (currentMonth !== today.getMonth() || currentYear !== today.getFullYear()) {
        return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
      }
    }
    return today.toISOString().split('T')[0];
  });
  const [description, setDescription] = useState<string>(initialData?.description || '');
  
  // Transaction State
  const [categoryId, setCategoryId] = useState<string>(initialData?.categoryId || '');
  const [accountId, setAccountId] = useState<string>(initialData?.accountId || initialData?.cardId || (accounts[0]?.id || ''));
  const [installments, setInstallments] = useState<number>(1);

  // Transfer State
  const [fromAccountId, setFromAccountId] = useState<string>(initialData?.fromAccountId || (accounts[0]?.id || ''));
  const [toAccountId, setToAccountId] = useState<string>(initialData?.toAccountId || (accounts.length > 1 ? accounts[1].id : ''));

  const [error, setError] = useState('');

  // Filter categories based on selected type
  const availableCategories = useMemo(() => {
    if (mode === 'transfer') return [];
    
    // Filter categories by type
    // AND check if archived.
    // However, if we are editing an existing transaction (initialData) that uses an archived category,
    // we MUST include it so the user can see/save it without changing category involuntarily.
    return categories.filter(c => {
      const isCorrectType = c.kind === mode;
      const isNotArchived = !c.isArchived;
      const isCurrentSelected = c.id === initialData?.categoryId;
      
      return isCorrectType && (isNotArchived || isCurrentSelected);
    });
  }, [categories, mode, initialData]);

  // Group filtered categories
  const groupedCategories = useMemo(() => {
    const groups: Partial<Record<CategoryGroup, Category[]>> = {};
    availableCategories.forEach(cat => {
      if (!groups[cat.group]) {
        groups[cat.group] = [];
      }
      groups[cat.group]?.push(cat);
    });
    return groups;
  }, [availableCategories]);

  // Auto-select salary category for income
  useEffect(() => {
    if (mode === 'income' && !initialData?.id) {
      const salaryCat = categories.find(c => c.kind === 'income' && c.name.toLowerCase().includes('salário'));
      if(salaryCat) setCategoryId(salaryCat.id);
    } else if (mode === 'transfer') {
      setCategoryId('');
    }
  }, [mode, categories, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('O valor deve ser maior que zero.');
      return;
    }
    if (!date) {
      setError('Selecione uma data.');
      return;
    }

    if (mode === 'transfer') {
      if (!fromAccountId || !toAccountId) {
        setError('Selecione as contas de origem e destino.');
        return;
      }
      if (fromAccountId === toAccountId) {
        setError('A conta de destino deve ser diferente da origem.');
        return;
      }
      
      onSubmit({
        isTransfer: true, // Internal flag
        amount: numAmount,
        date,
        description,
        fromAccountId,
        toAccountId
      });
    } else {
      // Transaction Logic
      if (!categoryId) {
        setError('Selecione uma categoria.');
        return;
      }
      if (!accountId) {
        setError('Selecione uma conta ou cartão.');
        return;
      }
      
      // Validate category type match
      const cat = categories.find(c => c.id === categoryId);
      if (cat && cat.kind !== mode) {
        setError('A categoria selecionada não é compatível com o tipo da transação.');
        return;
      }

      const isCreditCard = creditCards?.some(c => c.id === accountId);

      onSubmit({
        isTransfer: false, // Internal flag
        isCreditCard,
        type: mode,
        amount: numAmount,
        date,
        categoryId,
        accountId,
        description,
        installments: isCreditCard ? installments : 1
      });
    }
  };

  return (
    <>
      <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900 rounded-lg">
        <button
          type="button"
          onClick={() => setMode('income')}
          className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-2 rounded-md font-medium text-xs md:text-sm transition-all ${
            mode === 'income' 
              ? 'bg-emerald-600 text-white shadow-lg' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowUpCircle size={16} />
          Entrada
        </button>
        <button
          type="button"
          onClick={() => setMode('expense')}
          className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-2 rounded-md font-medium text-xs md:text-sm transition-all ${
            mode === 'expense' 
              ? 'bg-red-600 text-white shadow-lg' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowDownCircle size={16} />
          Saída
        </button>
        <button
          type="button"
          onClick={() => setMode('transfer')}
          className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 py-2 rounded-md font-medium text-xs md:text-sm transition-all ${
            mode === 'transfer' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowRightLeft size={16} />
          Transferência
        </button>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Valor</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
          <input 
            type="number" 
            step="0.01" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            placeholder="0,00"
          />
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Data</label>
        <input 
          type="date" 
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all [color-scheme:dark]"
        />
        {date && currentMonth !== undefined && currentYear !== undefined && (
          (new Date(date + 'T12:00:00').getMonth() !== currentMonth || new Date(date + 'T12:00:00').getFullYear() !== currentYear)
        ) && (
          <p className="text-xs text-amber-400 mt-1">
            Aviso: Esta data está fora do mês selecionado no filtro ({currentMonth + 1}/{currentYear}).
          </p>
        )}
      </div>

      {/* Account Selection Logic */}
      {mode === 'transfer' ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
             <GlassSelect 
               label="De (Origem)"
               value={fromAccountId}
               onChange={(e) => setFromAccountId(e.target.value)}
               options={[
                 { value: '', label: 'Selecione...' },
                 ...accounts.map(acc => ({ value: acc.id, label: acc.name, disabled: acc.id === toAccountId }))
               ]}
             />
          </div>
          <div>
             <GlassSelect 
               label="Para (Destino)"
               value={toAccountId}
               onChange={(e) => setToAccountId(e.target.value)}
               options={[
                 { value: '', label: 'Selecione...' },
                 ...accounts.map(acc => ({ value: acc.id, label: acc.name, disabled: acc.id === fromAccountId }))
               ]}
             />
          </div>
        </div>
      ) : (
        <div>
          <GlassSelect 
            label="Conta / Cartão"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            groups={[
              ...((!isEditingCreditCard) ? [{
                label: 'Contas',
                options: accounts.map(acc => ({ value: acc.id, label: acc.name }))
              }] : []),
              ...((mode === 'expense' && creditCards && creditCards.length > 0 && !isEditingRegular) ? [{
                label: 'Cartões de Crédito',
                options: creditCards.map(card => ({ value: card.id, label: card.name, color: card.color }))
              }] : [])
            ]}
            options={(!isEditingCreditCard && !(mode === 'expense' && creditCards && creditCards.length > 0 && !isEditingRegular)) ? [
              { value: '', label: 'Selecione...' },
              ...accounts.map(acc => ({ value: acc.id, label: acc.name }))
            ] : undefined}
          />
        </div>
      )}

      {/* Category (Only for Transaction) */}
      {mode !== 'transfer' && (
        <div>
          <GlassSelect 
            label="Categoria"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            error={categoryId && categories.find(c => c.id === categoryId)?.kind !== mode ? 'Categoria incompatível com o tipo' : undefined}
            groups={Object.entries(groupedCategories).map(([group, cats]) => ({
              label: group,
              options: (cats as Category[]).map(cat => ({
                value: cat.id,
                label: `${cat.emoji} ${cat.name} ${cat.isArchived ? '(Arquivada)' : ''}`
              }))
            }))}
          />
        </div>
      )}

      {/* Installments (Only for Credit Card) */}
      {mode === 'expense' && creditCards?.some(c => c.id === accountId) && !initialData?.id && (
        <div>
          <GlassSelect
            label="Parcelas"
            value={installments}
            onChange={(e) => setInstallments(parseInt(e.target.value))}
            options={Array.from({ length: 24 }, (_, i) => i + 1).map(num => ({
              value: num,
              label: `${num}x ${num > 1 ? `(R$ ${(parseFloat(amount || '0') / num).toFixed(2)})` : ''}`
            }))}
          />
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Descrição (Opcional)</label>
        <input 
          type="text" 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-4 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
          placeholder={mode === 'transfer' ? "Ex: Reserva de emergência" : "Ex: Supermercado semanal"}
        />
      </div>

      {error && <p className="text-red-400 text-sm animate-pulse">{error}</p>}
      </form>

      <ModalFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" form="transaction-form" variant="primary">
          {initialData?.id ? 'Salvar Alterações' : (mode === 'transfer' ? 'Confirmar Transferência' : 'Adicionar Transação')}
        </Button>
      </ModalFooter>
    </>
  );
};