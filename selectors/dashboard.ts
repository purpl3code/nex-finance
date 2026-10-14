
import { Transaction, CreditCardTransaction, RecurringRule, Account, Category, CreditCard, Budget } from '../types';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDaysInMonth } from 'date-fns';

// --- TYPES ---

export interface MonthlySummary {
  income: number;
  expenses: number; // Direct expenses (excluding invoice payments)
  cardExpenses: number; // Credit card purchases - refunds
  totalSpent: number;
  totalBalance: number; // Total balance across all accounts
  remainingBalance: number; // Net balance for the month (Income - Total Spent)
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
  action?: { label: string; target: 'budgets' } | { label: string; target: 'card'; cardId: string };
}

// --- SELECTORS ---

export const getMonthlySummary = (
  transactions: Transaction[],
  cardTransactions: CreditCardTransaction[],
  month: number,
  year: number,
  totalBalance: number = 0
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
    totalBalance,
    remainingBalance: totalBalance - totalSpent
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
  
  const startStr = format(startDate, 'yyyy-MM-dd');
  
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
  transactions: Transaction[],
  cardTransactions: CreditCardTransaction[],
  categories: Category[],
  cards: CreditCard[],
  month: number,
  year: number,
  budgets: Budget[] = [],
  cardUsage: { cardId: string; used: number }[] = []
): Insight[] => {
  const insights: Insight[] = [];
  const selectedMonth = new Date(year, month, 1);
  const now = new Date();
  const isCurrentMonth = now.getMonth() === month && now.getFullYear() === year;
  const throughDay = isCurrentMonth ? now.getDate() : getDaysInMonth(selectedMonth);
  const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const isInSelectedPeriod = (date: string) => {
    const d = new Date(`${date}T12:00:00`);
    return d.getMonth() === month && d.getFullYear() === year && d.getDate() <= throughDay;
  };
  const isExpenseTransaction = (t: Transaction) =>
    t.type === 'expense' && t.categoryId !== 'cat_invoice_payment' && isInSelectedPeriod(t.date);
  const isCardTransactionInPeriod = (t: CreditCardTransaction) => isInSelectedPeriod(t.date);
  const periodIncome = transactions
    .filter(t => t.type === 'income' && isInSelectedPeriod(t.date))
    .reduce((sum, t) => sum + t.amount, 0);
  const periodSpent = transactions
    .filter(isExpenseTransaction)
    .reduce((sum, t) => sum + t.amount, 0)
    + cardTransactions.filter(isCardTransactionInPeriod).reduce((sum, t) => sum + t.amount, 0);
  const categoryTotals: Record<string, number> = {};
  transactions
    .filter(isExpenseTransaction)
    .forEach(t => categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount);
  cardTransactions
    .filter(isCardTransactionInPeriod)
    .forEach(t => categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount);

  // Compare the selected month with the same number of elapsed days in the previous month.
  const previousMonth = new Date(year, month - 1, 1);
  const previousMonthIndex = previousMonth.getMonth();
  const previousMonthYear = previousMonth.getFullYear();
  const previousThroughDay = Math.min(throughDay, getDaysInMonth(previousMonth));
  const sumPeriodExpenses = (targetMonth: number, targetYear: number, cutoffDay: number) => {
    const inPeriod = (date: string) => {
      const d = new Date(`${date}T12:00:00`);
      return d.getMonth() === targetMonth && d.getFullYear() === targetYear && d.getDate() <= cutoffDay;
    };
    return transactions
      .filter(t => t.type === 'expense' && t.categoryId !== 'cat_invoice_payment' && inPeriod(t.date))
      .reduce((sum, t) => sum + t.amount, 0)
      + cardTransactions.filter(t => inPeriod(t.date)).reduce((sum, t) => sum + t.amount, 0);
  };
  const previousSpent = sumPeriodExpenses(previousMonthIndex, previousMonthYear, previousThroughDay);
  if (periodSpent > 0 && previousSpent > 0) {
    const changePercent = ((periodSpent - previousSpent) / previousSpent) * 100;
    if (Math.abs(changePercent) >= 10) {
      const increased = changePercent > 0;
      const throughLabel = isCurrentMonth ? `até o dia ${throughDay}` : 'no mês';
      insights.push({
        id: 'spending_trend',
        type: increased ? 'warning' : 'success',
        title: increased ? 'Gastos acima do mês passado' : 'Gastos abaixo do mês passado',
        message: `Você gastou ${currency(periodSpent)} ${throughLabel}, ${Math.abs(changePercent).toFixed(0)}% ${increased ? 'a mais' : 'a menos'} que no mesmo período anterior (${currency(previousSpent)}).`
      });
    }
  }

  // Budget progress is calculated from actual category spending for the selected month.
  const monthBudgets = budgets.filter(b => b.month === month && b.year === year && b.amountLimit > 0);
  const budgetProgress = monthBudgets
    .map(budget => {
      const spent = categoryTotals[budget.categoryId] || 0;
      return { budget, spent, percent: (spent / budget.amountLimit) * 100 };
    })
    .filter(item => item.spent > 0)
    .sort((a, b) => b.percent - a.percent)[0];

  if (budgetProgress && budgetProgress.percent >= budgetProgress.budget.alertAtPercent) {
    const categoryName = categories.find(c => c.id === budgetProgress.budget.categoryId)?.name || 'uma categoria';
    const exceeded = budgetProgress.spent - budgetProgress.budget.amountLimit;
    insights.push({
      id: 'budget_progress',
      type: budgetProgress.percent >= 100 ? 'warning' : 'info',
      title: budgetProgress.percent >= 100 ? 'Orçamento ultrapassado' : 'Orçamento perto do limite',
      message: budgetProgress.percent >= 100
        ? `Você usou ${Math.round(budgetProgress.percent)}% do orçamento de ${categoryName} e passou ${currency(exceeded)} do limite.`
        : `${categoryName} já consumiu ${Math.round(budgetProgress.percent)}% do limite (${currency(budgetProgress.spent)} de ${currency(budgetProgress.budget.amountLimit)}).`,
      action: { label: 'Ver orçamentos', target: 'budgets' }
    });
  }

  // Actual outstanding card limit usage, rather than this month's purchases, indicates utilization.
  const cardUtilization = cards
    .filter(card => card.limit > 0)
    .map(card => ({ card, used: Math.max(0, cardUsage.find(item => item.cardId === card.id)?.used ?? 0) }))
    .map(item => ({ ...item, percent: (item.used / item.card.limit) * 100 }))
    .sort((a, b) => b.percent - a.percent)[0];
  if (cardUtilization && cardUtilization.percent >= 70) {
    insights.push({
      id: 'card_limit',
      type: cardUtilization.percent >= 90 ? 'warning' : 'info',
      title: cardUtilization.percent >= 90 ? 'Cartão perto do limite' : 'Uso do cartão',
      message: `${cardUtilization.card.name}: ${currency(cardUtilization.used)} utilizados de ${currency(cardUtilization.card.limit)} (${Math.round(cardUtilization.percent)}%).`,
      action: { label: 'Ver cartão', target: 'card', cardId: cardUtilization.card.id }
    });
  }

  // 1. Top category, with its share of all expenses for better context.
  const positiveCategoryTotals = Object.entries(categoryTotals).filter(([, amount]) => amount > 0);
  const [topCatId, topCatAmount] = positiveCategoryTotals.sort((a, b) => b[1] - a[1])[0] || ['', 0];
  if (topCatId && periodSpent > 0) {
    const catName = categories.find(c => c.id === topCatId)?.name || 'Sem categoria';
    const share = Math.min(100, (topCatAmount / periodSpent) * 100);
    insights.push({
      id: 'top_cat',
      type: 'info',
      title: 'Maior Despesa',
      message: `${catName} concentra ${Math.round(share)}% dos gastos registrados (${currency(topCatAmount)} de ${currency(periodSpent)}).`
    });
  }

  // Describe current cash flow as recorded so far, without presenting it as a closed-month result.
  if (periodIncome > 0) {
    const remaining = periodIncome - periodSpent;
    const cashFlowRate = (remaining / periodIncome) * 100;
    if (cashFlowRate >= 20) {
      insights.push({
        id: 'cash_flow_positive',
        type: 'success',
        title: 'Entradas acima dos gastos',
        message: `Dos ${currency(periodIncome)} em entradas registradas, ${currency(remaining)} ainda não foram consumidos pelos gastos deste período (${Math.round(cashFlowRate)}%).`
      });
    } else if (remaining < 0) {
      insights.push({
        id: 'cash_flow_negative',
        type: 'warning',
        title: 'Gastos acima das entradas',
        message: `Os gastos registrados superam as entradas em ${currency(Math.abs(remaining))} neste período.`
      });
    }
  }

  return insights.slice(0, 4);
};
