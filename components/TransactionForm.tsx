
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Category, Account, TransactionType, CategoryGroup, Transfer } from '../types';
import { Button } from './ui/Button';
import { ArrowDownCircle, ArrowUpCircle, ArrowRightLeft } from 'lucide-react';

interface TransactionFormProps {
  initialData?: Transaction | Transfer | any;
  categories: Category[];
  accounts: Account[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ 
  initialData, 
  categories, 
  accounts,
  onSubmit, 
  onCancel 
}) => {
  // Check if initial data is a transfer
  const initialIsTransfer = initialData && 'fromAccountId' in initialData;

  const [mode, setMode] = useState<TransactionType | 'transfer'>(
    initialIsTransfer ? 'transfer' : (initialData?.type || 'expense')
  );

  const [amount, setAmount] = useState<string>(initialData?.amount?.toString() || '');
  const [date, setDate] = useState<string>(initialData?.date || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>(initialData?.description || '');
  
  // Transaction State
  const [categoryId, setCategoryId] = useState<string>(initialData?.categoryId || '');
  const [accountId, setAccountId] = useState<string>(initialData?.accountId || (accounts[0]?.id || ''));

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
    if (mode === 'income' && !initialData) {
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
        setError('Selecione uma conta.');
        return;
      }
      
      // Validate category type match
      const cat = categories.find(c => c.id === categoryId);
      if (cat && cat.kind !== mode) {
        setError('A categoria selecionada não é compatível com o tipo da transação.');
        return;
      }

      onSubmit({
        isTransfer: false, // Internal flag
        type: mode,
        amount: numAmount,
        date,
        categoryId,
        accountId,
        description
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      </div>

      {/* Account Selection Logic */}
      {mode === 'transfer' ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
             <label className="block text-sm font-medium text-slate-300 mb-1">De (Origem)</label>
             <select 
               value={fromAccountId}
               onChange={(e) => setFromAccountId(e.target.value)}
               className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-2 text-white text-sm focus:border-blue-500 focus:ring-1 outline-none"
             >
               <option value="">Selecione...</option>
               {accounts.map(acc => (
                 <option key={acc.id} value={acc.id} disabled={acc.id === toAccountId}>{acc.name}</option>
               ))}
             </select>
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-300 mb-1">Para (Destino)</label>
             <select 
               value={toAccountId}
               onChange={(e) => setToAccountId(e.target.value)}
               className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-2 text-white text-sm focus:border-blue-500 focus:ring-1 outline-none"
             >
               <option value="">Selecione...</option>
               {accounts.map(acc => (
                 <option key={acc.id} value={acc.id} disabled={acc.id === fromAccountId}>{acc.name}</option>
               ))}
             </select>
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Conta / Carteira</label>
          <select 
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all appearance-none"
          >
            <option value="">Selecione a conta...</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Category (Only for Transaction) */}
      {mode !== 'transfer' && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Categoria</label>
          <select 
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={`w-full bg-slate-900 border rounded-lg py-2.5 px-4 text-white focus:ring-1 outline-none transition-all appearance-none ${
               categoryId && categories.find(c => c.id === categoryId)?.kind !== mode ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-700 focus:border-blue-500 focus:ring-blue-500'
            }`}
          >
            <option value="">Selecione...</option>
            {Object.entries(groupedCategories).map(([group, cats]) => (
              <optgroup key={group} label={group} className="bg-slate-900 text-slate-300">
                {(cats as Category[])?.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name} {cat.isArchived ? '(Arquivada)' : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
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

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary">
          {initialData ? 'Salvar Alterações' : (mode === 'transfer' ? 'Confirmar Transferência' : 'Adicionar Transação')}
        </Button>
      </div>
    </form>
  );
};