import { Category, Account } from './types';

export const STORAGE_KEY = 'nex-finance-db-v1';

export const INITIAL_ACCOUNTS: Account[] = [
  { 
    id: 'acc_wallet', 
    name: 'Carteira', 
    type: 'cash', 
    initialBalance: 0, 
    color: '#10b981', // emerald
    isDefault: true,
    createdAt: Date.now() 
  },
  { 
    id: 'acc_bank', 
    name: 'Conta Corrente', 
    type: 'bank', 
    initialBalance: 0, 
    color: '#3b82f6', // blue
    isDefault: true,
    createdAt: Date.now() 
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  // --- EXPENSES (SAÍDAS) ---
  // Essencial
  { id: 'cat_rent', name: 'Aluguel', emoji: '🏠', group: 'Essencial', kind: 'expense' },
  { id: 'cat_condo', name: 'Condomínio', emoji: '🏢', group: 'Essencial', kind: 'expense' },
  { id: 'cat_gas', name: 'Gasolina', emoji: '⛽', group: 'Essencial', kind: 'expense' },
  { id: 'cat_loan', name: 'Financiamento', emoji: '🧾', group: 'Essencial', kind: 'expense' },
  { id: 'cat_food', name: 'Alimentação', emoji: '🛒', group: 'Essencial', kind: 'expense' },
  { id: 'cat_energy', name: 'Energia', emoji: '💡', group: 'Essencial', kind: 'expense' },
  { id: 'cat_water', name: 'Água', emoji: '🚰', group: 'Essencial', kind: 'expense' },
  { id: 'cat_internet', name: 'Internet', emoji: '🌐', group: 'Essencial', kind: 'expense' },
  { id: 'cat_phone', name: 'Celular', emoji: '📞', group: 'Essencial', kind: 'expense' },
  { id: 'cat_health', name: 'Saúde', emoji: '🏨', group: 'Essencial', kind: 'expense' },
  { id: 'cat_pharmacy', name: 'Farmácia', emoji: '💊', group: 'Essencial', kind: 'expense' },
  { id: 'cat_needs', name: 'Necessidades', emoji: '⚠️', group: 'Essencial', kind: 'expense' },
  { id: 'cat_cleaner', name: 'Diarista', emoji: '🧹', group: 'Essencial', kind: 'expense' },
  { id: 'cat_invoice_payment', name: 'Pagamento de Fatura', emoji: '💳', group: 'Essencial', kind: 'expense' }, 
  { id: 'cat_investment_deposit', name: 'Aporte/Investimento', emoji: '📈', group: 'Investimentos e Dívidas', kind: 'expense' }, // New
  
  // Estilo de Vida
  { id: 'cat_gym', name: 'Academia', emoji: '🏋️‍♀️', group: 'Estilo de Vida', kind: 'expense' },
  { id: 'cat_beauty', name: 'Salão/Barbearia', emoji: '✨', group: 'Estilo de Vida', kind: 'expense' },
  { id: 'cat_edu', name: 'Educação', emoji: '🎓', group: 'Estilo de Vida', kind: 'expense' },
  { id: 'cat_leisure', name: 'Lazer', emoji: '🏖️', group: 'Estilo de Vida', kind: 'expense' },
  { id: 'cat_subs', name: 'Assinaturas', emoji: '📺', group: 'Estilo de Vida', kind: 'expense' },
  { id: 'cat_shopping', name: 'Compras', emoji: '🛍️', group: 'Estilo de Vida', kind: 'expense' },

  // Investimentos e Dívidas
  { id: 'cat_invest', name: 'Investimento (Geral)', emoji: '📉', group: 'Investimentos e Dívidas', kind: 'expense' },
  { id: 'cat_debt', name: 'Dívida', emoji: '🤝', group: 'Investimentos e Dívidas', kind: 'expense' },

  // --- INCOME (ENTRADAS) ---
  { id: 'inc_salary', name: 'Salário', emoji: '💼', group: 'Renda', kind: 'income' },
  { id: 'inc_freelance', name: 'Freelance / Serviços', emoji: '🧾', group: 'Renda', kind: 'income' },
  { id: 'inc_gift', name: 'Presente', emoji: '🎁', group: 'Renda', kind: 'income' },
  { id: 'inc_refund', name: 'Reembolso', emoji: '💰', group: 'Renda', kind: 'income' },
  { id: 'inc_yield', name: 'Rendimentos', emoji: '🏦', group: 'Renda', kind: 'income' },
  { id: 'inc_sales', name: 'Venda (OLX/Mkt)', emoji: '📦', group: 'Renda', kind: 'income' },
  { id: 'inc_transfer', name: 'Transferência Recebida', emoji: '🔁', group: 'Renda', kind: 'income' },
  { id: 'inc_investment_withdraw', name: 'Resgate/Investimento', emoji: '🏦', group: 'Renda', kind: 'income' }, // New
  { id: 'inc_other', name: 'Outros', emoji: '➕', group: 'Renda', kind: 'income' },
];

export const COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];