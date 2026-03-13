
export type TransactionType = 'income' | 'expense';

export type CategoryGroup = 'Essencial' | 'Estilo de Vida' | 'Investimentos e Dívidas' | 'Renda' | 'Personalizado';

export type AccountType = 'cash' | 'bank' | 'wallet' | 'other';

export type RecurringFrequency = 'monthly' | 'weekly';

export interface Category {
  id: string;
  name: string;
  emoji: string;
  group: CategoryGroup;
  kind: TransactionType;
  color?: string; // Hex color for UI badges
  isSystem?: boolean; // If true, cannot be renamed or deleted (critical for app logic)
  isArchived?: boolean; // If true, hides from selection but keeps history
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  color?: string;
  isDefault?: boolean; // New flag to protect system accounts
  createdAt: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // YYYY-MM-DD
  categoryId: string;
  accountId: string;
  description?: string;
  createdAt: number; // timestamp
  
  // Recurring Tracking
  generatedByRuleId?: string; // Links back to the rule
  generatedKey?: string; // Idempotency key (e.g., ruleId_2023-10-05)
  
  // Credit Card Invoice Tracking
  linkedInvoiceId?: string;
}

export interface RecurringRule {
  id: string;
  isActive: boolean;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  description?: string;
  
  frequency: RecurringFrequency;
  interval: number; // e.g. every 1 month
  dayOfMonth?: number; // 1-31 (for monthly)
  dayOfWeek?: number; // 0-6 (0=Sunday, for weekly)
  
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  
  lastGeneratedAt?: number;
  createdAt: number;
}

export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  description?: string;
  createdAt: number;
}

export interface Budget {
  id: string;
  month: number; // 0-11
  year: number;
  categoryId: string;
  amountLimit: number;
  alertAtPercent: number; // default 80
  createdAt: number;
}

// --- Credit Card Types ---

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  closingDay: number; // 1-31
  dueDay: number; // 1-31
  color?: string;
  defaultPaymentAccountId?: string; // Account used for forecast deduction
  createdAt: number;
}

export interface CreditCardTransaction {
  id: string;
  cardId: string;
  amount: number; // Negative if refund
  date: string; // YYYY-MM-DD
  categoryId: string;
  description?: string;
  installment: {
    current: number;
    total: number;
  };
  invoiceId?: string; // Link to a paid invoice (optional)
  
  // New fields for Refund Logic
  type?: 'purchase' | 'refund';
  originalTransactionId?: string; // If type is refund, points to the purchase

  createdAt: number;
  generatedByRuleId?: string;
  generatedKey?: string;
}

export interface CreditCardInvoice {
  id: string; // usually cardId_YYYY_MM
  cardId: string;
  month: number; // 0-11 (Invoice reference month)
  year: number;
  dueDate: string; // YYYY-MM-DD
  closingDate: string; // YYYY-MM-DD
  amount: number;
  isPaid: boolean;
  paidAt?: number;
}

// --- Investment Types ---

export type AssetType = 'fixed_income' | 'stock' | 'etf' | 'fii' | 'crypto' | 'fund' | 'other';
export type InvestmentMovementKind = 'deposit' | 'withdraw' | 'buy' | 'sell' | 'income';

export interface InvestmentAccount {
  id: string;
  name: string;
  institution?: string;
  createdAt: number;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  currency: 'BRL' | 'USD' | 'OTHER';
  createdAt: number;
}

export interface Position {
  id: string;
  investmentAccountId: string;
  assetId: string;
  quantity: number;
  averagePrice: number;
  createdAt: number;
}

export interface InvestmentMovement {
  id: string;
  date: string; // YYYY-MM-DD
  kind: InvestmentMovementKind;
  investmentAccountId: string;
  assetId?: string; // Required for buy/sell
  quantity?: number;
  amount: number; // BRL Value
  linkedAccountId?: string; // Normal account for deposit/withdraw
  description?: string;
  createdAt: number;
}

// --- Goal Types (New) ---

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  startDate: string; // YYYY-MM-DD
  deadline?: string; // YYYY-MM-DD
  color?: string; // UI Color
  isArchived: boolean;
  createdAt: number;
}

// -------------------------

export interface AppData {
  version: number;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  creditCards: CreditCard[];
  creditCardTransactions: CreditCardTransaction[];
  creditCardInvoices: CreditCardInvoice[];
  transfers: Transfer[];
  recurringRules: RecurringRule[];
  budgets: Budget[];
  
  // Investments
  investmentAccounts: InvestmentAccount[];
  assets: Asset[];
  positions: Position[];
  investmentMovements: InvestmentMovement[];

  // Goals
  goals: Goal[];
}

export interface BackupFile {
  appName: 'Nex Finance';
  schemaVersion: number;
  exportedAt: string; // ISO Date
  data: AppData;
}

export interface DashboardStats {
  income: number;
  expense: number;
  balance: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface FilterState {
  month: number; // 0-11
  year: number;
  type: TransactionType | 'transfer' | 'all'; // Updated to include transfer in filters
  search: string;
  categoryId: string | 'all';
  accountId: string | 'all';
}

// --- DATA HEALTH TYPES ---

export interface HealthIssue {
  id: string;
  severity: 'warning' | 'error';
  type: string; // e.g., 'TX_MISSING_ACCOUNT'
  title: string;
  description: string;
  canAutoFix: boolean;
  affectedCount: number;
  affectedIds: string[]; // Store IDs for processing
  examples: {
    id: string;
    label: string;
    info?: string;
  }[];
}

export interface DataHealthReport {
  generatedAt: string;
  summary: {
    okCount: number;
    warningCount: number;
    errorCount: number;
  };
  issues: HealthIssue[];
}

export interface FixLogEntry {
  id: string;
  dateISO: string;
  action: string;
  details: string;
  affectedCount: number;
}