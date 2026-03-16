
import { Transaction, CreditCardTransaction, RecurringRule, Account, Category, CreditCard } from '../types';
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';

// --- TYPES ---

export interface MonthlySummary {
  income: number;
  expenses: number; // Direct expenses (excluding invoice payments)
  cardExpenses: number; // Credit card purchases - refunds
  totalSpent: number;
  remainingBalance: number; // Income - Total Spent
}

export interface ForecastSummary {
  currentBalance: number;
  pendingRecurring: number;
  pendingInvoices: number;
  forecastedBalance: number;
}

export interface DailyBalance {
  date: string;
  day: string;
  balance: number;
}

export interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
}

// --- SELECTORS ---

export const getMonthlySummary = (
  transactions: Transaction[],
  cardTransactions: CreditCardTransaction[],
  month: number,
  year: number
): MonthlySummary => {
  // 1. Calculate Income
  const income = transactions
    .filter(t => {
      const d = new Date(t.date + 'T12:00:00');
      return t.type === 'income' && d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // 2. Calculate Direct Expenses (Excluding 'cat_invoice_payment')
  const expenses = transactions
    .filter(t => {
      const d = new Date(t.date + 'T12:00:00');
      return (
        t.type === 'expense' && 
        t.categoryId !== 'cat_invoice_payment' && 
        d.getMonth() === month && 
        d.getFullYear() === year
      );
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // 3. Calculate Card Expenses (Purchases + Refunds)
  const cardExpenses = cardTransactions
    .filter(t => {
      const d = new Date(t.date + 'T12:00:00');
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, t) => sum + t.amount, 0); // Refunds are already negative in the model, so simple sum works

  const totalSpent = expenses + cardExpenses;

  return {
    income,
    expenses,
    cardExpenses,
    totalSpent,
    remainingBalance: income - totalSpent
  };
};

export const getFinancialForecast = (
  recurringRules: RecurringRule[],
  cardInvoices: { amount: number, isPaid: boolean, dueDate: string }[], // Pre-calculated invoice objects
  month: number,
  year: number
): ForecastSummary => {
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

  // 1. Current Balance (Real time)
  // Note: Ideally we should use calculateAllBalances here, but we'll assume the caller passes the sum or we recalculate.
  // For simplicity, let's assume the caller passes the *current calculated balance* of all accounts.
  // We will refine this signature to take `totalCurrentBalance` directly.

  // However, since we need to be pure, let's just process pending items.
  // We will return the *adjustments* needed, and the UI adds them to the live balance.
  
  // 2. Pending Recurring Expenses (For the rest of the month)
  let pendingRecurring = 0;
  if (isCurrentMonth) {
    const endOfMonthDate = endOfMonth(today);
    
    pendingRecurring = recurringRules
      .filter(r => r.isActive && r.type === 'expense')
      .reduce((sum, r) => {
        // Simplified Logic: Check if rule day is after today
        // A robust recurring logic is in useFinance, we are approximating for the "Quick Forecast" card
        const ruleDay = r.dayOfMonth || 1;
        if (ruleDay > today.getDate() && ruleDay <= endOfMonthDate.getDate()) {
          return sum + r.amount;
        }
        return sum;
      }, 0);
  }

  // 3. Pending Invoices (Open and Due this month)
  // We look for invoices that belong to this month/year and are NOT paid
  const pendingInvoices = cardInvoices
    .filter(inv => !inv.isPaid)
    .reduce((sum, inv) => sum + inv.amount, 0);

  // Note: Forecasted balance calculation requires the absolute current balance which we'll handle in the component
  // to avoid re-fetching all transactions here. 
  
  return {
    currentBalance: 0, // Placeholder
    pendingRecurring,
    pendingInvoices,
    forecastedBalance: 0 // Placeholder
  };
};

export const getRecentActivity = (
  transactions: Transaction[],
  cardTransactions: CreditCardTransaction[],
  categories: Category[],
  month: number, // Added: Filter by month
  year: number,  // Added: Filter by year
  limit: number = 5,
  creditCards: CreditCard[] = []
) => {
  const unified = [
    ...transactions.map(t => ({
      id: t.id,
      date: t.date,
      description: t.description,
      amount: t.amount,
      type: t.type, // income | expense
      categoryId: t.categoryId,
      isCard: false,
      source: 'Conta',
      color: undefined
    })),
    ...cardTransactions.map(t => {
      const card = creditCards.find(c => c.id === t.cardId);
      return {
        id: t.id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type === 'refund' ? 'income' : 'expense', // Map refund to income for color logic
        categoryId: t.categoryId,
        isCard: true,
        source: card ? card.name : 'Cartão',
        color: card?.color
      };
    })
  ];

  return unified
    .filter(item => {
      // Use T12:00:00 to prevent timezone shifts
      const d = new Date(item.date + 'T12:00:00');
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
    .map(item => ({
      ...item,
      category: categories.find(c => c.id === item.categoryId)
    }));
};

export const getBalanceHistory = (
  accounts: Account[],
  transactions: Transaction[],
  month: number,
  year: number
): DailyBalance[] => {
  const startDate = startOfMonth(new Date(year, month));
  const endDate = endOfMonth(startDate);
  const today = new Date();
  
  // We only show graph up to "today" if it's the current month, or full month if past
  const effectiveEnd = (month === today.getMonth() && year === today.getFullYear()) ? today : endDate;
  const days = eachDayOfInterval({ start: startDate, end: effectiveEnd });

  // 1. Calculate Starting Balance of the Month
  // Sum of all transactions BEFORE start of month + initial balances
  let runningBalance = accounts.reduce((sum, acc) => sum + acc.initialBalance, 0);
  
  const startStr = startDate.toISOString().split('T')[0];
  
  transactions.forEach(t => {
    if (t.date < startStr) {
      if (t.type === 'income') runningBalance += t.amount;
      else runningBalance -= t.amount;
    }
  });

  // 2. Build Daily Series
  return days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    
    // Process transactions for this day
    transactions
      .filter(t => t.date === dateStr)
      .forEach(t => {
        if (t.type === 'income') runningBalance += t.amount;
        else runningBalance -= t.amount;
      });

    return {
      date: dateStr,
      day: format(day, 'dd'),
      balance: runningBalance
    };
  });
};

export const generateInsights = (
  summaryCurrent: MonthlySummary,
  transactions: Transaction[],
  cardTransactions: CreditCardTransaction[],
  categories: Category[],
  cards: CreditCard[],
  month: number
): Insight[] => {
  const insights: Insight[] = [];

  // 1. Top Category
  const categoryTotals: Record<string, number> = {};
  
  // Sum direct expenses
  transactions
    .filter(t => t.type === 'expense' && t.categoryId !== 'cat_invoice_payment' && new Date(t.date).getMonth() === month)
    .forEach(t => categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount);
    
  // Sum card expenses
  cardTransactions
    .filter(t => new Date(t.date).getMonth() === month)
    .forEach(t => categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount);

  let topCatId = '';
  let topCatAmount = 0;
  Object.entries(categoryTotals).forEach(([id, amt]) => {
    if (amt > topCatAmount) {
      topCatAmount = amt;
      topCatId = id;
    }
  });

  if (topCatId) {
    const catName = categories.find(c => c.id === topCatId)?.name || 'Desconhecida';
    insights.push({
      id: 'top_cat',
      type: 'info',
      title: 'Maior Despesa',
      message: `${catName} representa sua maior despesa este mês (R$ ${topCatAmount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}).`
    });
  }

  // 2. Card Limit Warning
  // We need to estimate current card usage (roughly sum of unpaid transactions)
  // This is complex without full history, but we can check if totalSpent on cards > 70% of total limits
  // (Simplified for this scope)
  const totalLimit = cards.reduce((sum, c) => sum + c.limit, 0);
  if (totalLimit > 0 && summaryCurrent.cardExpenses > (totalLimit * 0.7)) {
    const pct = Math.round((summaryCurrent.cardExpenses / totalLimit) * 100);
    insights.push({
      id: 'card_limit',
      type: 'warning',
      title: 'Atenção ao Limite',
      message: `Você já utilizou aproximadamente ${pct}% do limite total dos seus cartões neste mês.`
    });
  }

  // 3. Economy (Income vs Expense)
  if (summaryCurrent.income > 0) {
    const saveRate = ((summaryCurrent.income - summaryCurrent.totalSpent) / summaryCurrent.income) * 100;
    if (saveRate > 20) {
      insights.push({
        id: 'save_rate',
        type: 'success',
        title: 'Boa Economia!',
        message: `Você poupou ${saveRate.toFixed(0)}% da sua renda este mês.`
      });
    } else if (saveRate < 0) {
      insights.push({
        id: 'negative_balance',
        type: 'warning',
        title: 'Gastos Excessivos',
        message: `Seus gastos superaram sua renda em ${Math.abs(saveRate).toFixed(0)}%.`
      });
    }
  }

  return insights;
};
