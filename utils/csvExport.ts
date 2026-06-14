import { Category, Account } from '../types';

interface ExportableTransaction {
  date: string;
  type?: 'income' | 'expense' | 'transfer' | string;
  categoryId?: string;
  description?: string;
  amount: number;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  isTransfer?: boolean;
}

/**
 * Exports a list of transactions as a UTF-8 CSV file with BOM
 * (so Excel opens it correctly with accented characters).
 */
export function exportTransactionsToCSV(
  transactions: ExportableTransaction[],
  categories: Category[],
  accounts: Account[],
  filename?: string
): void {
  const getCategoryName = (id?: string) => {
    if (!id) return '';
    return categories.find(c => c.id === id)?.name || '';
  };

  const getAccountName = (id?: string) => {
    if (!id) return '';
    return accounts.find(a => a.id === id)?.name || '';
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (val: number) => {
    return val.toFixed(2).replace('.', ',');
  };

  const getType = (tx: ExportableTransaction) => {
    if (tx.isTransfer) return 'Transferência';
    return tx.type === 'income' ? 'Entrada' : 'Saída';
  };

  const getAccount = (tx: ExportableTransaction) => {
    if (tx.isTransfer) {
      return `${getAccountName(tx.fromAccountId)} → ${getAccountName(tx.toAccountId)}`;
    }
    return getAccountName(tx.accountId);
  };

  // CSV Header
  const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Conta'];
  
  // CSV Rows
  const rows = transactions.map(tx => [
    formatDate(tx.date),
    getType(tx),
    tx.isTransfer ? 'Transferência' : getCategoryName(tx.categoryId),
    (tx.description || '').replace(/"/g, '""'), // Escape quotes
    formatCurrency(tx.amount),
    getAccount(tx),
  ]);

  // Build CSV string
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
  ].join('\n');

  // Add UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Generate filename
  const now = new Date();
  const defaultFilename = `nex-finance-extrato-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.csv`;

  // Trigger download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename || defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
