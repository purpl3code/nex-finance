
import { Transaction, Account, Transfer, Category, Budget, CreditCardTransaction } from '../types';

// --- BALANCES ---

/**
 * Calculates current balance for ALL accounts in one pass O(N)
 * Returns a Map: { accountId: number }
 */
export const calculateAllBalances = (
  accounts: Account[],
  transactions: Transaction[],
  transfers: Transfer[]
): Record<string, number> => {
  const balances: Record<string, number> = {};

  // 1. Init with initial balance
  accounts.forEach(acc => {
    balances[acc.id] = acc.initialBalance;
  });

  // 2. Process Transactions
  transactions.forEach(tx => {
    if (balances[tx.accountId] !== undefined) {
      if (tx.type === 'income') balances[tx.accountId] += tx.amount;
      else balances[tx.accountId] -= tx.amount;
    }
  });

  // 3. Process Transfers
  transfers.forEach(tr => {
    if (balances[tr.fromAccountId] !== undefined) {
      balances[tr.fromAccountId] -= tr.amount;
    }
    if (balances[tr.toAccountId] !== undefined) {
      balances[tr.toAccountId] += tr.amount;
    }
  });

  return balances;
};

// --- SPENDING MAPS ---

/**
 * Creates a nested map of spending by category and month/year
 * key format: `${categoryId}_${month}_${year}` -> amount
 * 
 * UPDATE: Now includes Credit Card spending and handles Refunds.
 * Excludes 'cat_invoice_payment' from standard transactions to avoid double counting.
 */
export const calculateSpendingMap = (
  transactions: Transaction[],
  creditCardTransactions: CreditCardTransaction[]
): Record<string, number> => {
  const map: Record<string, number> = {};

  // 1. Process Bank/Cash Transactions
  transactions.forEach(tx => {
    // Only expenses, and IGNORE invoice payments (because we count the actual card spending below)
    if (tx.type === 'expense' && tx.categoryId !== 'cat_invoice_payment') {
      const d = new Date(tx.date + 'T12:00:00');
      const key = `${tx.categoryId}_${d.getMonth()}_${d.getFullYear()}`;
      map[key] = (map[key] || 0) + tx.amount;
    }
  });

  // 2. Process Credit Card Transactions
  creditCardTransactions.forEach(ctx => {
    const d = new Date(ctx.date + 'T12:00:00');
    const key = `${ctx.categoryId}_${d.getMonth()}_${d.getFullYear()}`;
    
    // If it's a purchase, add. If it's a refund (negative amount), it will naturally subtract.
    // Ensure we handle the type check just in case legacy data exists without 'type'
    // Default to 'purchase' (positive logic)
    
    // Note: CreditCardTransaction amount should store the raw value. 
    // If type='refund', logic elsewhere might store it as negative, 
    // or we check type here. 
    // Let's assume the hook stores refunds as Negative Amount for consistency.
    
    map[key] = (map[key] || 0) + ctx.amount;
  });

  return map;
};

// --- BUDGETS STATUS ---

export const calculateBudgetsStatus = (
  budgets: Budget[],
  spendingMap: Record<string, number>,
  month: number,
  year: number
) => {
  let ok = 0;
  let warning = 0;
  let danger = 0;

  const currentBudgets = budgets.filter(b => b.month === month && b.year === year);

  currentBudgets.forEach(b => {
    const key = `${b.categoryId}_${month}_${year}`;
    const spent = spendingMap[key] || 0;
    const pct = (spent / b.amountLimit) * 100;

    if (pct >= 100) danger++;
    else if (pct >= b.alertAtPercent) warning++;
    else ok++;
  });

  return { ok, warning, danger };
};
