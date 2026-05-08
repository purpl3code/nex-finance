
import { AppData } from '../types';
import { STORAGE_KEY, INITIAL_CATEGORIES, INITIAL_ACCOUNTS } from '../constants';
import { LocalStorageAdapter } from './storageAdapter';

const CURRENT_VERSION = 12;

const DEFAULT_DATA: AppData = {
  version: CURRENT_VERSION,
  transactions: [],
  categories: INITIAL_CATEGORIES,
  accounts: INITIAL_ACCOUNTS,
  creditCards: [],
  creditCardTransactions: [],
  creditCardInvoices: [],
  transfers: [],
  recurringRules: [],
  budgets: [],
  investmentAccounts: [],
  assets: [],
  positions: [],
  investmentMovements: [],
  goals: [],
  debts: [],
};

// We use the adapter instead of direct localStorage calls
const adapter = LocalStorageAdapter;

export const StorageService = {
  load: (): AppData => {
    try {
      const stored = adapter.getItem(STORAGE_KEY);
      if (!stored) {
        return DEFAULT_DATA;
      }

      const parsed: any = JSON.parse(stored);

      // Migration Logic
      if (parsed.version < CURRENT_VERSION) {
        console.log('Migrating data from version', parsed.version, 'to', CURRENT_VERSION);
        
        // V1 -> V2 Migration (Category Kinds)
        if (parsed.version < 2) {
          parsed.categories = parsed.categories.map((c: any) => ({
            ...c,
            kind: c.kind || 'expense'
          }));
          const incomeCategories = INITIAL_CATEGORIES.filter(c => c.kind === 'income');
          const existingIds = new Set(parsed.categories.map((c: any) => c.id));
          incomeCategories.forEach(incCat => {
            if (!existingIds.has(incCat.id)) parsed.categories.push(incCat);
          });
        }

        // V2 -> V3 Migration (Accounts)
        if (parsed.version < 3) {
          if (!parsed.accounts || parsed.accounts.length === 0) {
            parsed.accounts = INITIAL_ACCOUNTS;
          }
          const defaultAccountId = parsed.accounts[0].id;
          parsed.transactions = parsed.transactions.map((t: any) => ({
            ...t,
            accountId: t.accountId || defaultAccountId
          }));
        }

        // V3 -> V4 Migration (Credit Cards)
        if (parsed.version < 4) {
          parsed.creditCards = [];
          parsed.creditCardTransactions = [];
          parsed.creditCardInvoices = [];

          // Ensure Invoice Payment Category exists
          const invoiceCat = INITIAL_CATEGORIES.find(c => c.id === 'cat_invoice_payment');
          const hasInvoiceCat = parsed.categories.some((c: any) => c.id === 'cat_invoice_payment');
          if (invoiceCat && !hasInvoiceCat) {
            parsed.categories.push(invoiceCat);
          }
        }

        // V4 -> V5 Migration (Protect Default Accounts)
        if (parsed.version < 5) {
          if (parsed.accounts) {
            parsed.accounts = parsed.accounts.map((acc: any) => ({
              ...acc,
              isDefault: (acc.id === 'acc_wallet' || acc.id === 'acc_bank')
            }));
          } else {
             parsed.accounts = INITIAL_ACCOUNTS;
          }
        }

        // V5 -> V6 Migration (Transfers)
        if (parsed.version < 6) {
          parsed.transfers = [];
        }

        // V6 -> V7 Migration (Recurring Rules)
        if (parsed.version < 7) {
          parsed.recurringRules = [];
        }

        // V7 -> V8 Migration (Budgets)
        if (parsed.version < 8) {
          parsed.budgets = [];
        }

        // V8 -> V9 Migration (Investments)
        if (parsed.version < 9) {
          parsed.investmentAccounts = [];
          parsed.assets = [];
          parsed.positions = [];
          parsed.investmentMovements = [];

          // Add Investment Categories if missing
          const investmentCats = [
             { id: 'cat_investment_deposit', name: 'Aporte/Investimento', emoji: '📈', group: 'Investimentos e Dívidas', kind: 'expense' },
             { id: 'inc_investment_withdraw', name: 'Resgate/Investimento', emoji: '🏦', group: 'Renda', kind: 'income' }
          ];

          const existingIds = new Set(parsed.categories.map((c: any) => c.id));
          investmentCats.forEach((cat: any) => {
             if (!existingIds.has(cat.id)) {
                parsed.categories.push(cat);
             }
          });
        }

        // V9 -> V10 Migration (Goals)
        if (parsed.version < 10) {
          parsed.goals = [];
        }

        // V10 -> V11 Migration (Categories System Flags)
        if (parsed.version < 11) {
          const systemIds = new Set(['cat_invoice_payment', 'cat_investment_deposit', 'inc_investment_withdraw']);
          parsed.categories = parsed.categories.map((c: any) => ({
            ...c,
            isArchived: c.isArchived || false,
            isSystem: c.isSystem || systemIds.has(c.id),
            color: c.color || undefined
          }));
        }

        // V11 -> V12 Migration (Debts)
        if (parsed.version < 12) {
          parsed.debts = [];
        }

        parsed.version = CURRENT_VERSION;
        StorageService.save(parsed);
        return parsed;
      }

      return parsed;
    } catch (error) {
      console.error('Failed to load data', error);
      return DEFAULT_DATA;
    }
  },

  save: (data: AppData): void => {
    try {
      adapter.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save data', error);
    }
  },

  clear: (): void => {
    try {
      adapter.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear data', error);
    }
  }
};