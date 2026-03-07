
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Transaction, Category, Account, DashboardStats, FilterState, ChartDataPoint, CreditCard, CreditCardTransaction, CreditCardInvoice, Transfer, RecurringRule, Budget, InvestmentAccount, Asset, Position, InvestmentMovement, Goal } from '../types';
import { StorageService } from '../services/storageService';
import { SyncService } from '../services/syncService';
import { useAuth } from './useAuth';
import { COLORS } from '../constants';
import { calculateAllBalances, calculateSpendingMap } from '../selectors';
import { addMonths, isAfter, endOfMonth, eachDayOfInterval, format, lastDayOfMonth, getDay, getDaysInMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const useFinance = () => {
  const { session } = useAuth();
  // --- STATE ---
  const [dataVersion, setDataVersion] = useState(0); // Incremented on every write
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [creditCardTransactions, setCreditCardTransactions] = useState<CreditCardTransaction[]>([]);
  const [creditCardInvoices, setCreditCardInvoices] = useState<CreditCardInvoice[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  
  // Investments State
  const [investmentAccounts, setInvestmentAccounts] = useState<InvestmentAccount[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [investmentMovements, setInvestmentMovements] = useState<InvestmentMovement[]>([]);

  // Goals State
  const [goals, setGoals] = useState<Goal[]>([]);

  const [loading, setLoading] = useState(true);

  // --- PERSISTENCE ---

  // Initial Load & Auth Sync
  useEffect(() => {
    // Try to load local data first
    const data = StorageService.load();
    setTransactions(data.transactions);
    setCategories(data.categories);
    setAccounts(data.accounts);
    setCreditCards(data.creditCards);
    setCreditCardTransactions(data.creditCardTransactions);
    setCreditCardInvoices(data.creditCardInvoices);
    setTransfers(data.transfers || []); 
    setRecurringRules(data.recurringRules || []);
    setBudgets(data.budgets || []);
    setInvestmentAccounts(data.investmentAccounts || []);
    setAssets(data.assets || []);
    setPositions(data.positions || []);
    setInvestmentMovements(data.investmentMovements || []);
    setGoals(data.goals || []);
    setLoading(false);

    // Then try to sync with cloud (if logged in)
    // We re-run this if the user logs in (session changes)
    SyncService.initialize().then((updated) => {
      if (updated) {
        // If updated, reload from local storage
        const newData = StorageService.load();
        setTransactions(newData.transactions);
        setCategories(newData.categories);
        setAccounts(newData.accounts);
        setCreditCards(newData.creditCards);
        setCreditCardTransactions(newData.creditCardTransactions);
        setCreditCardInvoices(newData.creditCardInvoices);
        setTransfers(newData.transfers || []); 
        setRecurringRules(newData.recurringRules || []);
        setBudgets(newData.budgets || []);
        setInvestmentAccounts(newData.investmentAccounts || []);
        setAssets(newData.assets || []);
        setPositions(newData.positions || []);
        setInvestmentMovements(newData.investmentMovements || []);
        setGoals(newData.goals || []);
      }
    });
  }, [session]);

  // Save on change (Debounced slightly by React batching, but explicit here)
  useEffect(() => {
    if (!loading && dataVersion > 0) {
      const data = {
        version: 11, // Current version from StorageService logic
        transactions,
        categories,
        accounts,
        creditCards,
        creditCardTransactions,
        creditCardInvoices,
        transfers,
        recurringRules,
        budgets,
        investmentAccounts,
        assets,
        positions,
        investmentMovements,
        goals
      };
      
      // Use SyncService to save locally AND trigger cloud sync
      SyncService.saveAndSync(data);
    }
  }, [dataVersion, loading]); // Dependent only on version bump

  // Helper to bump version
  const touchData = useCallback(() => setDataVersion(v => v + 1), []);

  // --- MEMOIZED CALCULATIONS (SELECTORS) ---

  // 1. Account Balances Map (O(N) instead of O(N*A))
  // Re-calculates only when transactions/transfers/accounts change
  const balancesMap = useMemo(() => {
    return calculateAllBalances(accounts, transactions, transfers);
  }, [dataVersion, accounts, transactions, transfers]);

  const getAccountBalance = useCallback((accountId: string) => {
    return balancesMap[accountId] || 0;
  }, [balancesMap]);

  const getTotalBalance = useCallback(() => {
    return Object.values(balancesMap).reduce((acc: number, val: number) => acc + val, 0);
  }, [balancesMap]);

  // 2. Category Spending Map (Now includes Credit Card Data)
  const spendingMap = useMemo(() => {
    return calculateSpendingMap(transactions, creditCardTransactions);
  }, [dataVersion, transactions, creditCardTransactions]);

  const getCategorySpending = useCallback((categoryId: string, month: number, year: number) => {
    const key = `${categoryId}_${month}_${year}`;
    return spendingMap[key] || 0;
  }, [spendingMap]);


  // --- ACTIONS (WRITERS) ---

  // --- CATEGORIES (NEW) ---
  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    const newCat: Category = { 
      ...cat, 
      id: `cat_${Date.now()}`,
      isArchived: false,
      isSystem: false
    };
    setCategories(prev => [...prev, newCat]);
    touchData();
  }, [touchData]);

  const editCategory = useCallback((id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    touchData();
  }, [touchData]);

  const archiveCategory = useCallback((id: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, isArchived: true } : c));
    touchData();
  }, [touchData]);

  const reassignCategory = useCallback((oldId: string, newId: string) => {
    // 1. Update Standard Transactions
    setTransactions(prev => prev.map(t => t.categoryId === oldId ? { ...t, categoryId: newId } : t));
    
    // 2. Update Credit Card Transactions
    setCreditCardTransactions(prev => prev.map(t => t.categoryId === oldId ? { ...t, categoryId: newId } : t));
    
    // 3. Update Recurring Rules
    setRecurringRules(prev => prev.map(r => r.categoryId === oldId ? { ...r, categoryId: newId } : r));
    
    // 4. Update Budgets
    setBudgets(prev => prev.map(b => b.categoryId === oldId ? { ...b, categoryId: newId } : b));

    // 5. Finally Archive the old category
    setCategories(prev => prev.map(c => c.id === oldId ? { ...c, isArchived: true } : c));
    
    touchData();
  }, [touchData]);

  // --- Transactions ---
  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = { ...tx, id: crypto.randomUUID(), createdAt: Date.now() };
    setTransactions(prev => [newTx, ...prev]);
    touchData();
  }, [touchData]);

  const editTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    touchData();
  }, [touchData]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => {
      const txToDelete = prev.find(t => t.id === id);
      
      if (txToDelete) {
        if (txToDelete.linkedInvoiceId) {
          setCreditCardInvoices(invoices => invoices.filter(inv => inv.id !== txToDelete.linkedInvoiceId));
        } else if (txToDelete.categoryId === 'cat_invoice_payment') {
          setCreditCardInvoices(invoices => {
            const matchingInvoice = invoices.find(inv => inv.isPaid && inv.amount === txToDelete.amount);
            if (matchingInvoice) {
              return invoices.filter(inv => inv.id !== matchingInvoice.id);
            }
            return invoices;
          });
        }
      }
      
      return prev.filter(t => t.id !== id);
    });
    touchData();
  }, [touchData]);

  // --- Transfers ---
  const addTransfer = useCallback((tr: Omit<Transfer, 'id' | 'createdAt'>) => {
    const newTr: Transfer = { ...tr, id: crypto.randomUUID(), createdAt: Date.now() };
    setTransfers(prev => [newTr, ...prev]);
    touchData();
  }, [touchData]);

  const editTransfer = useCallback((id: string, updates: Partial<Transfer>) => {
    setTransfers(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    touchData();
  }, [touchData]);

  const deleteTransfer = useCallback((id: string) => {
    setTransfers(prev => prev.filter(t => t.id !== id));
    touchData();
  }, [touchData]);

  // --- Recurring Rules ---
  const addRecurringRule = useCallback((rule: Omit<RecurringRule, 'id' | 'createdAt' | 'isActive'>) => {
    const newRule: RecurringRule = { ...rule, id: crypto.randomUUID(), isActive: true, createdAt: Date.now() };
    setRecurringRules(prev => [newRule, ...prev]);
    touchData();
  }, [touchData]);

  const editRecurringRule = useCallback((id: string, updates: Partial<RecurringRule>) => {
    setRecurringRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    touchData();
  }, [touchData]);

  const deleteRecurringRule = useCallback((id: string) => {
    setRecurringRules(prev => prev.filter(r => r.id !== id));
    touchData();
  }, [touchData]);

  const toggleRecurringRule = useCallback((id: string) => {
    setRecurringRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
    touchData();
  }, [touchData]);

  // --- Budgets ---
  const addBudget = useCallback((budget: Omit<Budget, 'id' | 'createdAt'>) => {
    const newBudget: Budget = { ...budget, id: crypto.randomUUID(), createdAt: Date.now() };
    setBudgets(prev => {
      const filtered = prev.filter(b => !(b.categoryId === budget.categoryId && b.month === budget.month && b.year === budget.year));
      return [...filtered, newBudget];
    });
    touchData();
  }, [touchData]);

  const editBudget = useCallback((id: string, updates: Partial<Budget>) => {
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    touchData();
  }, [touchData]);

  const deleteBudget = useCallback((id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
    touchData();
  }, [touchData]);

  // --- Accounts ---
  const addAccount = useCallback((acc: Omit<Account, 'id' | 'createdAt'>) => {
    const newAcc: Account = { ...acc, id: crypto.randomUUID(), isDefault: false, createdAt: Date.now() };
    setAccounts(prev => [...prev, newAcc]);
    touchData();
  }, [touchData]);

  const editAccount = useCallback((id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    touchData();
  }, [touchData]);

  const deleteAccount = useCallback((id: string) => {
    const accountToCheck = accounts.find(a => a.id === id);
    if (accountToCheck?.isDefault) {
      alert("Esta é uma conta padrão do sistema e não pode ser excluída.");
      return;
    }
    const hasTransactions = transactions.some(t => t.accountId === id);
    const hasTransfers = transfers.some(t => t.fromAccountId === id || t.toAccountId === id);
    const hasRules = recurringRules.some(r => r.accountId === id);

    if (hasTransactions || hasTransfers || hasRules) {
      alert("Não é possível excluir esta conta porque existem movimentações ou regras vinculadas a ela.");
      return;
    }
    setAccounts(prev => prev.filter(a => a.id !== id));
    touchData();
  }, [transactions, transfers, recurringRules, accounts, touchData]);

  // --- Credit Cards ---
  const addCreditCard = useCallback((card: Omit<CreditCard, 'id' | 'createdAt'>) => {
    const newCard: CreditCard = { ...card, id: crypto.randomUUID(), createdAt: Date.now() };
    setCreditCards(prev => [...prev, newCard]);
    touchData();
  }, [touchData]);

  const editCreditCard = useCallback((id: string, updates: Partial<CreditCard>) => {
    setCreditCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    touchData();
  }, [touchData]);

  const deleteCreditCard = useCallback((id: string) => {
    setCreditCards(prev => prev.filter(c => c.id !== id));
    setCreditCardTransactions(prev => prev.filter(t => t.cardId !== id));
    setCreditCardInvoices(prev => prev.filter(i => i.cardId !== id));
    touchData();
  }, [touchData]);

  const addCreditCardTransaction = useCallback((
    tx: Omit<CreditCardTransaction, 'id' | 'createdAt' | 'installment' | 'type'>, 
    installments: number
  ) => {
    const baseDate = new Date(tx.date + 'T12:00:00');
    const newTxs: CreditCardTransaction[] = [];

    for (let i = 0; i < installments; i++) {
      const txDate = addMonths(baseDate, i);
      const dateStr = format(txDate, 'yyyy-MM-dd');
      newTxs.push({
        ...tx,
        type: 'purchase',
        date: dateStr,
        amount: tx.amount / installments, 
        installment: { current: i + 1, total: installments },
        id: crypto.randomUUID(),
        createdAt: Date.now() + i,
      });
    }
    setCreditCardTransactions(prev => [...newTxs, ...prev]);
    touchData();
  }, [touchData]);

  // New: Edit Credit Card Transaction
  const editCreditCardTransaction = useCallback((id: string, updates: Partial<CreditCardTransaction>) => {
    setCreditCardTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    touchData();
  }, [touchData]);

  // New: Delete Credit Card Transaction
  const deleteCreditCardTransaction = useCallback((id: string) => {
    setCreditCardTransactions(prev => {
       // Also delete any refunds attached to this transaction to prevent orphans
       return prev.filter(t => t.id !== id && t.originalTransactionId !== id);
    });
    touchData();
  }, [touchData]);

  // New: Add Refund
  const addCreditCardRefund = useCallback((
    originalTx: CreditCardTransaction,
    amountToRefund: number,
    date: string,
    description: string
  ) => {
    const refundTx: CreditCardTransaction = {
      id: crypto.randomUUID(),
      cardId: originalTx.cardId,
      amount: -Math.abs(amountToRefund), // Always negative
      date: date,
      categoryId: originalTx.categoryId, // Keep same category for dashboard math
      description: description || `Estorno: ${originalTx.description}`,
      installment: { current: 1, total: 1 },
      type: 'refund',
      originalTransactionId: originalTx.id,
      createdAt: Date.now()
    };
    setCreditCardTransactions(prev => [refundTx, ...prev]);
    touchData();
  }, [touchData]);

  const payInvoice = useCallback((invoice: CreditCardInvoice, accountId: string) => {
    const newTx: Transaction = {
      id: crypto.randomUUID(),
      type: 'expense',
      amount: invoice.amount,
      date: format(new Date(), 'yyyy-MM-dd'),
      categoryId: 'cat_invoice_payment', 
      accountId: accountId,
      description: `Fatura Cartão - Venc ${format(parseISO(invoice.dueDate), 'dd/MM/yyyy')}`,
      createdAt: Date.now(),
      linkedInvoiceId: invoice.id
    };
    const paidInvoice: CreditCardInvoice = { ...invoice, isPaid: true, paidAt: Date.now() };
    
    setTransactions(prev => [newTx, ...prev]);
    setCreditCardInvoices(prev => {
      const filtered = prev.filter(i => i.id !== invoice.id);
      return [...filtered, paidInvoice];
    });
    touchData();
  }, [touchData]);

  // --- Investments ---
  const addInvestmentAccount = useCallback((acc: Omit<InvestmentAccount, 'id' | 'createdAt'>) => {
    const newAcc: InvestmentAccount = { ...acc, id: crypto.randomUUID(), createdAt: Date.now() };
    setInvestmentAccounts(prev => [...prev, newAcc]);
    touchData();
  }, [touchData]);

  const deleteInvestmentAccount = useCallback((id: string) => {
    const hasMovements = investmentMovements.some(m => m.investmentAccountId === id);
    if (hasMovements) {
      alert("Não é possível excluir conta de investimento com movimentações.");
      return;
    }
    setInvestmentAccounts(prev => prev.filter(a => a.id !== id));
    touchData();
  }, [investmentMovements, touchData]);

  const addAsset = useCallback((asset: Omit<Asset, 'id' | 'createdAt'>) => {
     const newAsset: Asset = { ...asset, id: crypto.randomUUID(), createdAt: Date.now() };
     setAssets(prev => [...prev, newAsset]);
     touchData();
  }, [touchData]);

  const addInvestmentMovement = useCallback((movement: Omit<InvestmentMovement, 'id' | 'createdAt'>) => {
     const newMovement: InvestmentMovement = { ...movement, id: crypto.randomUUID(), createdAt: Date.now() };

     if (movement.kind === 'deposit' && movement.linkedAccountId) {
        addTransaction({
           type: 'expense',
           amount: movement.amount,
           date: movement.date,
           categoryId: 'cat_investment_deposit',
           accountId: movement.linkedAccountId,
           description: `Aporte: ${movement.description || 'Investimento'}`
        });
     } else if (movement.kind === 'withdraw' && movement.linkedAccountId) {
        addTransaction({
           type: 'income',
           amount: movement.amount,
           date: movement.date,
           categoryId: 'inc_investment_withdraw',
           accountId: movement.linkedAccountId,
           description: `Resgate: ${movement.description || 'Investimento'}`
        });
     }

     if ((movement.kind === 'buy' || movement.kind === 'sell') && movement.assetId && movement.quantity) {
        setPositions(prev => {
           const existingPos = prev.find(p => p.investmentAccountId === movement.investmentAccountId && p.assetId === movement.assetId);
           if (existingPos) {
              let newQty = existingPos.quantity;
              let newAvgPrice = existingPos.averagePrice;
              if (movement.kind === 'buy') {
                 const totalValue = (existingPos.quantity * existingPos.averagePrice) + (movement.quantity! * (movement.amount / movement.quantity!));
                 newQty += movement.quantity!;
                 newAvgPrice = totalValue / newQty;
              } else {
                 newQty -= movement.quantity!;
              }
              if (newQty <= 0) return prev.filter(p => p.id !== existingPos.id);
              return prev.map(p => p.id === existingPos.id ? { ...p, quantity: newQty, averagePrice: newAvgPrice } : p);
           } else if (movement.kind === 'buy') {
              return [...prev, {
                 id: crypto.randomUUID(),
                 investmentAccountId: movement.investmentAccountId,
                 assetId: movement.assetId,
                 quantity: movement.quantity!,
                 averagePrice: movement.amount / movement.quantity!,
                 createdAt: Date.now()
              }];
           }
           return prev;
        });
     }
     setInvestmentMovements(prev => [newMovement, ...prev]);
     touchData();
  }, [addTransaction, touchData]);

  // --- GOALS (New) ---
  const addGoal = useCallback((goal: Omit<Goal, 'id' | 'createdAt' | 'isArchived'>) => {
    const newGoal: Goal = { 
      ...goal, 
      id: crypto.randomUUID(), 
      isArchived: false, 
      createdAt: Date.now() 
    };
    setGoals(prev => [newGoal, ...prev]);
    touchData();
  }, [touchData]);

  const editGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
    touchData();
  }, [touchData]);

  const toggleArchiveGoal = useCallback((id: string) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, isArchived: !g.isArchived } : g));
    touchData();
  }, [touchData]);

  const addValueToGoal = useCallback((id: string, amount: number) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g));
    touchData();
  }, [touchData]);

  const deleteGoal = useCallback((id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    touchData();
  }, [touchData]);

  // --- HEAVY CALCULATORS (Memoized) ---

  const getInvestmentAccountBalance = useCallback((accountId: string) => {
     return investmentMovements
       .filter(m => m.investmentAccountId === accountId)
       .reduce((acc, m) => {
          if (m.kind === 'deposit' || m.kind === 'sell' || m.kind === 'income') return acc + m.amount;
          if (m.kind === 'withdraw' || m.kind === 'buy') return acc - m.amount;
          return acc;
       }, 0);
  }, [investmentMovements]);

  const getPortfolioSummary = useCallback(() => {
     let totalInvested = 0;
     const byAssetType: Record<string, number> = {};
     positions.forEach(pos => {
        const invested = pos.quantity * pos.averagePrice;
        totalInvested += invested;
        const asset = assets.find(a => a.id === pos.assetId);
        if (asset) byAssetType[asset.type] = (byAssetType[asset.type] || 0) + invested;
     });
     const totalCash = investmentAccounts.reduce((sum, acc) => sum + getInvestmentAccountBalance(acc.id), 0);
     return { totalInvested, totalCash, totalPatrimony: totalInvested + totalCash, byAssetType };
  }, [positions, assets, investmentAccounts, getInvestmentAccountBalance]);

  // Generators (Generator functions don't need heavy memoization unless called frequently)
  const getRecurringPreview = useCallback((month: number, year: number) => {
    const generated: any[] = [];
    const targetMonthStart = new Date(year, month, 1);
    const targetMonthEnd = lastDayOfMonth(targetMonthStart);

    recurringRules.filter(r => r.isActive).forEach(rule => {
       const datesToGenerate: Date[] = [];
       const startDate = new Date(rule.startDate + 'T12:00:00');
       const endDate = rule.endDate ? new Date(rule.endDate + 'T12:00:00') : null;

       if (endDate && endDate < targetMonthStart) return; 
       if (startDate > targetMonthEnd) return; 

       if (rule.frequency === 'monthly') {
          const daysInTargetMonth = getDaysInMonth(targetMonthStart);
          const targetDay = Math.min(rule.dayOfMonth || 1, daysInTargetMonth);
          const potentialDate = new Date(year, month, targetDay, 12, 0, 0);
          if (potentialDate >= startDate && (!endDate || potentialDate <= endDate)) datesToGenerate.push(potentialDate);
       } else if (rule.frequency === 'weekly') {
          let d = new Date(targetMonthStart);
          d.setHours(12, 0, 0, 0);
          while (d <= targetMonthEnd) {
            if (getDay(d) === (rule.dayOfWeek || 0)) {
               if (d >= startDate && (!endDate || d <= endDate)) datesToGenerate.push(new Date(d));
            }
            d.setDate(d.getDate() + 1);
          }
       }

       datesToGenerate.forEach(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const generatedKey = `${rule.id}_${dateStr}`;
          const exists = transactions.some(t => t.generatedKey === generatedKey);
          generated.push({
            ruleName: rule.description || (categories.find(c => c.id === rule.categoryId)?.name || 'Recorrência'),
            isDuplicate: exists,
            transaction: {
              id: crypto.randomUUID(),
              type: rule.type,
              amount: rule.amount,
              date: dateStr,
              categoryId: rule.categoryId,
              accountId: rule.accountId,
              description: rule.description || 'Lançamento recorrente',
              createdAt: Date.now(),
              generatedByRuleId: rule.id,
              generatedKey: generatedKey
            }
          });
       });
    });
    return generated.sort((a, b) => new Date(a.transaction.date).getTime() - new Date(b.transaction.date).getTime());
  }, [recurringRules, transactions, categories]);

  const commitRecurringTransactions = useCallback((txs: Transaction[]) => {
    setTransactions(prev => [...txs, ...prev]);
    touchData();
  }, [touchData]);

  // Invoice Logic (Optimization: Memoize result if inputs same)
  const getCardInvoiceInfo = useCallback((cardId: string, month: number, year: number) => {
    const card = creditCards.find(c => c.id === cardId);
    if (!card) return null;
    const storedInvoice = creditCardInvoices.find(i => i.cardId === cardId && i.month === month && i.year === year);
    if (storedInvoice) return storedInvoice;

    const daysInMonth = getDaysInMonth(new Date(year, month, 1));
    const actualDueDay = Math.min(card.dueDay, daysInMonth);
    const dueDate = new Date(year, month, actualDueDay);
    
    let closingMonth = month;
    if (card.dueDay < card.closingDay) {
      closingMonth = month - 1;
    }
    
    const daysInClosingMonth = getDaysInMonth(new Date(year, closingMonth, 1));
    const actualClosingDay = Math.min(card.closingDay, daysInClosingMonth);
    const closingDate = new Date(year, closingMonth, actualClosingDay);
    
    const daysInPrevClosingMonth = getDaysInMonth(new Date(year, closingMonth - 1, 1));
    const actualPrevClosingDay = Math.min(card.closingDay, daysInPrevClosingMonth);
    const prevMonthClosing = new Date(year, closingMonth - 1, actualPrevClosingDay);
    
    // Updated: Now includes refunds and purchases
    const invoiceTxs = creditCardTransactions.filter(t => {
      if (t.cardId !== cardId) return false;
      const tDate = new Date(t.date + 'T12:00:00');
      return isAfter(tDate, prevMonthClosing) && (tDate <= closingDate);
    });

    return {
      id: `${cardId}_${year}_${month}`,
      cardId,
      month,
      year,
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      closingDate: format(closingDate, 'yyyy-MM-dd'),
      // Amount automatically subtracts negative values from refunds
      amount: invoiceTxs.reduce((sum, t) => sum + t.amount, 0),
      isPaid: false,
      transactions: invoiceTxs
    };
  }, [creditCards, creditCardTransactions, creditCardInvoices]);

  const getCreditCardStats = useCallback(() => {
    const totalLimit = creditCards.reduce((sum, c) => sum + c.limit, 0);
    const totalTxAmount = creditCardTransactions.reduce((sum, t) => sum + t.amount, 0); // Refunds reduce this naturally
    const totalPaidAmount = creditCardInvoices.filter(i => i.isPaid).reduce((sum, i) => sum + i.amount, 0);
    const usedLimit = totalTxAmount - totalPaidAmount;
    return { totalLimit, usedLimit, availableLimit: totalLimit - usedLimit };
  }, [creditCards, creditCardTransactions, creditCardInvoices]);

  // --- FORECAST (CACHED) ---
  const forecastCache = useRef<Record<string, any>>({});
  
  const getForecast = useCallback((month: number, year: number) => {
    const cacheKey = `${dataVersion}_${month}_${year}`;
    if (forecastCache.current[cacheKey]) {
      return forecastCache.current[cacheKey];
    }

    const startOfForecastMonth = new Date(year, month, 1);
    const endOfForecastMonth = endOfMonth(startOfForecastMonth);
    const startOfForecastStr = format(startOfForecastMonth, 'yyyy-MM-dd');
    const endOfForecastStr = format(endOfForecastMonth, 'yyyy-MM-dd');
    
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const currentMonthStart = format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd');
    
    const isPastMonth = startOfForecastStr < currentMonthStart;
    const shiftDate = isPastMonth ? startOfForecastStr : todayStr;

    const allEvents: any[] = [];

    // 1a. Real Transactions
    transactions.forEach(t => {
       if (t.date <= endOfForecastStr) {
          let effectiveDate = t.date;
          let isOverdue = false;
          if (!t.isPaid && t.date < shiftDate) {
             effectiveDate = shiftDate;
             isOverdue = true;
          }
          allEvents.push({
             date: effectiveDate,
             originalDate: t.date,
             type: 'transaction',
             amount: t.type === 'income' ? t.amount : -t.amount,
             accountId: t.accountId,
             description: isOverdue ? `(Atrasado) ${t.description}` : t.description,
             isReal: true,
             raw: t,
             isOverdue
          });
       }
    });

    // 1b. Transfers
    transfers.forEach(t => {
       if (t.date <= endOfForecastStr) {
          allEvents.push({ date: t.date, type: 'transfer_out', amount: -t.amount, accountId: t.fromAccountId, isReal: true });
          allEvents.push({ date: t.date, type: 'transfer_in', amount: t.amount, accountId: t.toAccountId, isReal: true });
       }
    });

    // 1c. Recurring Rules
    recurringRules.forEach(rule => {
       const startDate = new Date(rule.startDate + 'T12:00:00');
       const endDate = rule.endDate ? new Date(rule.endDate + 'T12:00:00') : null;
       
       let d = new Date(rule.startDate + 'T12:00:00');
       const endD = new Date(endOfForecastStr + 'T12:00:00');
       
       while (d <= endD) {
          let shouldAdd = false;
          if (rule.frequency === 'monthly') {
             const daysInMonth = getDaysInMonth(d);
             const targetDay = Math.min(rule.dayOfMonth || 1, daysInMonth);
             if (d.getDate() === targetDay) shouldAdd = true;
          } else if (rule.frequency === 'weekly') {
             if (getDay(d) === (rule.dayOfWeek || 0)) shouldAdd = true;
          }
          
          if (shouldAdd && d >= startDate && (!endDate || d <= endDate)) {
             const dateStr = format(d, 'yyyy-MM-dd');
             const isDuplicate = transactions.some(t => t.ruleId === rule.id && t.date === dateStr);
             if (!isDuplicate) {
                let effectiveDate = dateStr;
                let isOverdue = false;
                if (dateStr < shiftDate) {
                   effectiveDate = shiftDate;
                   isOverdue = true;
                }
                allEvents.push({
                   date: effectiveDate,
                   originalDate: dateStr,
                   type: 'recurring',
                   amount: rule.type === 'income' ? rule.amount : -rule.amount,
                   accountId: rule.accountId,
                   description: isOverdue ? `(Atrasado) ${rule.description}` : `(Previsto) ${rule.description}`,
                   isReal: false,
                   isOverdue
                });
             }
          }
          d.setDate(d.getDate() + 1);
       }
    });

    // 1d. Credit Card Invoices
    if (creditCards.length > 0 && creditCardTransactions.length > 0) {
       const earliestTxDate = creditCardTransactions.reduce((min, t) => t.date < min ? t.date : min, endOfForecastStr);
       const earliestDate = new Date(earliestTxDate + 'T12:00:00');
       let m = earliestDate.getMonth();
       let y = earliestDate.getFullYear();
       
       let iterations = 0;
       while ((y < year || (y === year && m <= month)) && iterations < 120) {
          creditCards.forEach(card => {
             const invoice = getCardInvoiceInfo(card.id, m, y);
             if (invoice && invoice.amount > 0 && !invoice.isPaid) {
                const isPaidByTx = transactions.some(t => t.linkedInvoiceId === invoice.id);
                if (!isPaidByTx && invoice.dueDate <= endOfForecastStr) {
                   let effectiveDate = invoice.dueDate;
                   let isOverdue = false;
                   if (invoice.dueDate < shiftDate) {
                      effectiveDate = shiftDate;
                      isOverdue = true;
                   }
                   const targetAccount = card.defaultPaymentAccountId || accounts[0]?.id;
                   allEvents.push({
                      date: effectiveDate,
                      originalDate: invoice.dueDate,
                      type: 'invoice',
                      amount: -invoice.amount,
                      accountId: targetAccount,
                      description: isOverdue ? `(Fatura Atrasada) ${card.name} - ${m+1}/${y}` : `Fatura Prevista - ${card.name}`,
                      isReal: false,
                      isOverdue,
                      cardId: card.id
                   });
                }
             }
          });
          m++;
          if (m > 11) { m = 0; y++; }
          iterations++;
       }
    }

    // 2. Sort all events by date
    allEvents.sort((a, b) => a.date.localeCompare(b.date));

    // 3. Simulate balances
    const runningBalances: Record<string, number> = {};
    accounts.forEach(acc => runningBalances[acc.id] = acc.initialBalance);
    
    let totalInitialBalance = 0;
    const initialBalances: Record<string, number> = {};
    
    let capturedInitial = false;
    const eventsForForecastMonth: any[] = [];

    for (const ev of allEvents) {
       if (ev.date >= startOfForecastStr && !capturedInitial) {
          accounts.forEach(acc => {
             initialBalances[acc.id] = runningBalances[acc.id];
             totalInitialBalance += runningBalances[acc.id];
          });
          capturedInitial = true;
       }
       
       runningBalances[ev.accountId] = (runningBalances[ev.accountId] || 0) + ev.amount;
       
       if (ev.date >= startOfForecastStr && ev.date <= endOfForecastStr) {
          eventsForForecastMonth.push(ev);
       }
    }
    
    if (!capturedInitial) {
       accounts.forEach(acc => {
          initialBalances[acc.id] = runningBalances[acc.id];
          totalInitialBalance += runningBalances[acc.id];
       });
    }

    // 4. Build Daily Data
    const dailyData: any[] = [];
    let currentTotalBalance = totalInitialBalance;
    const currentAccountBalances = { ...initialBalances };
    const eventsByDay: Record<string, any[]> = {};
    
    let minBalance = currentTotalBalance;
    let riskDate: string | null = null;

    const daysInMonth = eachDayOfInterval({ start: startOfForecastMonth, end: endOfForecastMonth });

    daysInMonth.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayEvents = eventsForForecastMonth.filter(e => e.date === dateStr);
      
      if (dayEvents.length > 0) {
        eventsByDay[dateStr] = dayEvents;
        dayEvents.forEach(ev => {
          currentAccountBalances[ev.accountId] = (currentAccountBalances[ev.accountId] || 0) + ev.amount;
        });
        currentTotalBalance = Object.values(currentAccountBalances).reduce((a, b) => a + b, 0);
      }

      if (currentTotalBalance < minBalance) {
        minBalance = currentTotalBalance;
        if (currentTotalBalance < 0 && !riskDate) {
          riskDate = dateStr;
        }
      }

      dailyData.push({
        date: dateStr,
        formattedDate: format(day, 'dd/MM'),
        balance: currentTotalBalance,
        events: dayEvents.length
      });
    });

    const result = {
      initialBalance: totalInitialBalance,
      endBalance: currentTotalBalance,
      minBalance,
      riskDate,
      dailyData,
      eventsByDay
    };

    if (Object.keys(forecastCache.current).length > 20) forecastCache.current = {};
    forecastCache.current[cacheKey] = result;
    
    return result;
  }, [dataVersion, accounts, transactions, transfers, creditCards, creditCardTransactions, recurringRules, getCardInvoiceInfo]);

  // --- FILTERING (Memoized) ---
  const getUnifiedList = useCallback((filters: FilterState) => {
    const filteredTxs = transactions.filter(t => {
      const txDate = new Date(t.date + 'T12:00:00'); 
      const matchMonth = txDate.getMonth() === filters.month;
      const matchYear = txDate.getFullYear() === filters.year;
      const matchType = filters.type === 'all' || t.type === filters.type;
      const matchCategory = filters.categoryId === 'all' || t.categoryId === filters.categoryId;
      const matchAccount = filters.accountId === 'all' || t.accountId === filters.accountId;
      
      const matchSearch = !filters.search || 
        t.description?.toLowerCase().includes(filters.search.toLowerCase()) || 
        categories.find(c => c.id === t.categoryId)?.name.toLowerCase().includes(filters.search.toLowerCase());

      return matchMonth && matchYear && matchType && matchCategory && matchAccount && matchSearch;
    });

    const filteredTransfers = transfers.filter(t => {
      if (filters.type === 'income' || filters.type === 'expense') return false;

      const tDate = new Date(t.date + 'T12:00:00'); 
      const matchMonth = tDate.getMonth() === filters.month;
      const matchYear = tDate.getFullYear() === filters.year;
      const matchAccount = filters.accountId === 'all' || 
                           t.fromAccountId === filters.accountId || 
                           t.toAccountId === filters.accountId;
      const matchSearch = !filters.search || 
        t.description?.toLowerCase().includes(filters.search.toLowerCase()) || 
        'transferência'.includes(filters.search.toLowerCase());

      return matchMonth && matchYear && matchAccount && matchSearch;
    });

    const combined = [
      ...filteredTxs.map(t => ({ ...t, isTransfer: false })),
      ...filteredTransfers.map(t => ({ ...t, isTransfer: true, type: 'transfer' as const, categoryId: '' }))
    ];

    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, transfers, categories]);

  const getStats = useCallback((unifiedList: any[]): DashboardStats => {
    return unifiedList.reduce((acc, item) => {
      if (item.isTransfer) return acc; 
      if (item.type === 'income') acc.income += item.amount;
      else if (item.type === 'expense') acc.expense += item.amount;
      return acc;
    }, { income: 0, expense: 0, balance: 0 });
  }, []);

  const getChartData = useCallback((unifiedList: any[]): ChartDataPoint[] => {
    return []; // Deprecated in favor of Dashboard building it from spendingMap
  }, []);

  return {
    // Data
    transactions, transfers, recurringRules, budgets, categories, accounts,
    creditCards, creditCardTransactions, investmentAccounts, assets, positions, investmentMovements,
    goals,
    loading,
    
    // Actions
    addTransaction, editTransaction, deleteTransaction,
    addTransfer, editTransfer, deleteTransfer,
    addRecurringRule, editRecurringRule, deleteRecurringRule, toggleRecurringRule,
    addBudget, editBudget, deleteBudget,
    addAccount, editAccount, deleteAccount,
    addCreditCard, editCreditCard, deleteCreditCard,
    addCreditCardTransaction, editCreditCardTransaction, deleteCreditCardTransaction, addCreditCardRefund,
    payInvoice,
    addInvestmentAccount, deleteInvestmentAccount, addAsset, addInvestmentMovement,
    commitRecurringTransactions,
    
    // Category Actions (NEW)
    addCategory, editCategory, archiveCategory, reassignCategory,
    
    // Goal Actions
    addGoal, editGoal, toggleArchiveGoal, addValueToGoal, deleteGoal,

    // Selectors / Calculators
    getAccountBalance,
    getTotalBalance,
    getCategorySpending,
    getRecurringPreview,
    getCardInvoiceInfo,
    getCreditCardStats,
    getUnifiedList,
    getStats,
    getChartData,
    getForecast,
    getInvestmentAccountBalance,
    getPortfolioSummary
  };
};