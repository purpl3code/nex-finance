import { AppData, BackupFile } from '../types';
import { StorageService } from './storageService';

export const BackupService = {
  createBackup: (): BackupFile => {
    const data = StorageService.load();
    return {
      appName: 'Nex Finance',
      schemaVersion: data.version,
      exportedAt: new Date().toISOString(),
      data: data
    };
  },

  downloadBackup: (backup: BackupFile) => {
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const date = new Date().toISOString().split('T')[0];
    const a = document.createElement('a');
    a.href = url;
    a.download = `nex-finance-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Save timestamp
    localStorage.setItem('nex-finance-last-backup', new Date().toISOString());
  },

  getLastBackupDate: (): string | null => {
    return localStorage.getItem('nex-finance-last-backup');
  },

  parseBackupFile: async (file: File): Promise<{ isValid: boolean, backup?: BackupFile, error?: string, warning?: string }> => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);

      // 1. Basic Validation
      if (!json || typeof json !== 'object') {
        return { isValid: false, error: 'Arquivo inválido ou corrompido.' };
      }
      if (json.appName !== 'Nex Finance') {
        return { isValid: false, error: 'Este arquivo não é um backup do Nex Finance.' };
      }
      if (!json.data || !Array.isArray(json.data.accounts)) {
         return { isValid: false, error: 'Estrutura de dados incompleta.' };
      }

      const currentVersion = StorageService.load().version;
      let warning = undefined;

      // 2. Version Check
      if (json.schemaVersion > currentVersion) {
        warning = `O backup é de uma versão mais nova (${json.schemaVersion}) que o app atual (${currentVersion}). Alguns dados podem não ser lidos corretamente.`;
      }

      return { isValid: true, backup: json as BackupFile, warning };

    } catch (e) {
      return { isValid: false, error: 'Erro ao ler o arquivo JSON.' };
    }
  },

  applyBackupReplace: (backup: BackupFile) => {
    // Force version to match backup, so migration runs next time if needed, 
    // or if backup is older, migration runs immediately on reload.
    StorageService.save(backup.data);
    window.location.reload();
  },

  applyBackupMerge: (backup: BackupFile) => {
    const currentData = StorageService.load();
    const newData = backup.data;

    const stats = {
      imported: 0,
      ignored: 0,
      conflicts: 0
    };

    // Helper to merge arrays by ID (prefer local)
    const mergeCollection = <T extends { id: string }>(localList: T[], newList: T[]) => {
       const localMap = new Map(localList.map(item => [item.id, item]));
       
       newList.forEach(item => {
          if (localMap.has(item.id)) {
             stats.conflicts++;
             stats.ignored++;
             // Keep local, do nothing
          } else {
             localMap.set(item.id, item);
             stats.imported++;
          }
       });
       
       return Array.from(localMap.values());
    };

    // Merge all collections
    const mergedData: AppData = {
      ...currentData,
      accounts: mergeCollection(currentData.accounts, newData.accounts || []),
      categories: mergeCollection(currentData.categories, newData.categories || []),
      transactions: mergeCollection(currentData.transactions, newData.transactions || []),
      creditCards: mergeCollection(currentData.creditCards, newData.creditCards || []),
      creditCardTransactions: mergeCollection(currentData.creditCardTransactions, newData.creditCardTransactions || []),
      creditCardInvoices: mergeCollection(currentData.creditCardInvoices, newData.creditCardInvoices || []),
      transfers: mergeCollection(currentData.transfers, newData.transfers || []),
      recurringRules: mergeCollection(currentData.recurringRules, newData.recurringRules || []),
      budgets: mergeCollection(currentData.budgets, newData.budgets || []),
      // New V9 Collections
      investmentAccounts: mergeCollection(currentData.investmentAccounts || [], newData.investmentAccounts || []),
      assets: mergeCollection(currentData.assets || [], newData.assets || []),
      positions: mergeCollection(currentData.positions || [], newData.positions || []),
      investmentMovements: mergeCollection(currentData.investmentMovements || [], newData.investmentMovements || [])
    };

    StorageService.save(mergedData);
    
    // We don't force reload here to show the stats, but we should eventually refresh state
    // For simplicity and safety, we reload to ensure all hooks get new data fresh
    setTimeout(() => {
       alert(`Importação concluída!\nImportados: ${stats.imported}\nIgnorados (Já existiam): ${stats.ignored}`);
       window.location.reload();
    }, 100);
  }
};