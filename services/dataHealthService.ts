import { AppData, DataHealthReport, HealthIssue, FixLogEntry, Transaction, Category, Account } from '../types';
import { StorageService } from './storageService';
import { INITIAL_CATEGORIES } from '../constants';

const LOG_STORAGE_KEY = 'nex-finance-health-log';

export const DataHealthService = {
  
  getFixLogs: (): FixLogEntry[] => {
    try {
      const stored = localStorage.getItem(LOG_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  addFixLog: (entry: Omit<FixLogEntry, 'id' | 'dateISO'>) => {
    const logs = DataHealthService.getFixLogs();
    const newEntry: FixLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      dateISO: new Date().toISOString()
    };
    // Keep last 50 logs
    const updatedLogs = [newEntry, ...logs].slice(0, 50);
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(updatedLogs));
  },

  clearLogs: () => {
    localStorage.removeItem(LOG_STORAGE_KEY);
  },

  scan: (data: AppData): DataHealthReport => {
    const issues: HealthIssue[] = [];
    let okCount = 0; // Conceptual counter for "checked entities"
    
    const accountIds = new Set(data.accounts.map(a => a.id));
    const categoryIds = new Set(data.categories.map(c => c.id));
    const cardIds = new Set(data.creditCards.map(c => c.id));
    const investAccountIds = new Set(data.investmentAccounts.map(a => a.id));
    const assetIds = new Set(data.assets.map(a => a.id));

    // 1. SCAN TRANSACTIONS
    const txNoAccount = data.transactions.filter(t => !accountIds.has(t.accountId));
    if (txNoAccount.length > 0) {
      issues.push({
        id: 'tx_no_acc',
        severity: 'error',
        type: 'TX_MISSING_ACCOUNT',
        title: 'Transações sem conta vinculada',
        description: 'Transações apontando para uma conta que não existe mais.',
        canAutoFix: true,
        affectedCount: txNoAccount.length,
        affectedIds: txNoAccount.map(t => t.id),
        examples: txNoAccount.slice(0, 3).map(t => ({ id: t.id, label: t.description || 'Sem descrição', info: `Valor: ${t.amount}` }))
      });
    }

    const txNoCategory = data.transactions.filter(t => !categoryIds.has(t.categoryId));
    if (txNoCategory.length > 0) {
      issues.push({
        id: 'tx_no_cat',
        severity: 'warning',
        type: 'TX_MISSING_CATEGORY',
        title: 'Transações sem categoria',
        description: 'Transações apontando para uma categoria excluída.',
        canAutoFix: true,
        affectedCount: txNoCategory.length,
        affectedIds: txNoCategory.map(t => t.id),
        examples: txNoCategory.slice(0, 3).map(t => ({ id: t.id, label: t.description || 'Sem descrição', info: t.date }))
      });
    }

    // 2. SCAN TRANSFERS
    const trBroken = data.transfers.filter(t => !accountIds.has(t.fromAccountId) || !accountIds.has(t.toAccountId));
    if (trBroken.length > 0) {
      issues.push({
        id: 'tr_broken',
        severity: 'error',
        type: 'TRANSFER_BROKEN',
        title: 'Transferências quebradas',
        description: 'Transferências onde a conta de origem ou destino foi apagada.',
        canAutoFix: false,
        affectedCount: trBroken.length,
        affectedIds: trBroken.map(t => t.id),
        examples: trBroken.slice(0, 3).map(t => ({ id: t.id, label: `Transferência de ${t.amount}`, info: t.date }))
      });
    }

    // 3. SCAN RECURRING RULES
    const ruleNoAccount = data.recurringRules.filter(r => r.isActive && !accountIds.has(r.accountId));
    if (ruleNoAccount.length > 0) {
       issues.push({
        id: 'rule_no_acc',
        severity: 'error',
        type: 'RULE_MISSING_ACCOUNT',
        title: 'Regras recorrentes inválidas (Conta)',
        description: 'Regras ativas apontando para conta inexistente.',
        canAutoFix: true, // We can disable them
        affectedCount: ruleNoAccount.length,
        affectedIds: ruleNoAccount.map(r => r.id),
        examples: ruleNoAccount.slice(0, 3).map(r => ({ id: r.id, label: r.description || 'Regra', info: `Valor: ${r.amount}` }))
       });
    }

    const ruleNoCategory = data.recurringRules.filter(r => r.isActive && !categoryIds.has(r.categoryId));
    if (ruleNoCategory.length > 0) {
       issues.push({
        id: 'rule_no_cat',
        severity: 'warning',
        type: 'RULE_MISSING_CATEGORY',
        title: 'Regras recorrentes inválidas (Categoria)',
        description: 'Regras ativas apontando para categoria inexistente.',
        canAutoFix: true, // We can disable them
        affectedCount: ruleNoCategory.length,
        affectedIds: ruleNoCategory.map(r => r.id),
        examples: ruleNoCategory.slice(0, 3).map(r => ({ id: r.id, label: r.description || 'Regra', info: `Valor: ${r.amount}` }))
       });
    }

    // 4. SCAN CREDIT CARDS
    const orphanedCardTxs = data.creditCardTransactions.filter(t => !cardIds.has(t.cardId));
    if (orphanedCardTxs.length > 0) {
       issues.push({
          id: 'card_tx_orphan',
          severity: 'warning',
          type: 'ORPHAN_CARD_TX',
          title: 'Compras de cartão órfãs',
          description: 'Compras vinculadas a um cartão excluído.',
          canAutoFix: false,
          affectedCount: orphanedCardTxs.length,
          affectedIds: orphanedCardTxs.map(t => t.id),
          examples: orphanedCardTxs.slice(0,3).map(t => ({ id: t.id, label: t.description || 'Compra', info: t.date }))
       });
    }

    // 5. SCAN BUDGETS
    const budgetNoCategory = data.budgets.filter(b => !categoryIds.has(b.categoryId));
    if (budgetNoCategory.length > 0) {
       issues.push({
          id: 'budget_broken',
          severity: 'warning',
          type: 'BUDGET_MISSING_CATEGORY',
          title: 'Orçamentos órfãos',
          description: 'Orçamentos definidos para categorias que não existem mais.',
          canAutoFix: true, // We will delete them
          affectedCount: budgetNoCategory.length,
          affectedIds: budgetNoCategory.map(b => b.id),
          examples: budgetNoCategory.slice(0,3).map(b => ({ id: b.id, label: `Orçamento de ${b.amountLimit}`, info: `${b.month}/${b.year}` }))
       });
    }

    // 6. SCAN INVESTMENTS
    const brokenPositions = data.positions.filter(p => !investAccountIds.has(p.investmentAccountId) || !assetIds.has(p.assetId));
    if (brokenPositions.length > 0) {
       issues.push({
          id: 'inv_pos_broken',
          severity: 'error',
          type: 'INV_POS_BROKEN',
          title: 'Posições de investimento quebradas',
          description: 'Posições referenciando contas ou ativos inexistentes.',
          canAutoFix: false,
          affectedCount: brokenPositions.length,
          affectedIds: brokenPositions.map(p => p.id),
          examples: brokenPositions.slice(0,3).map(p => ({ id: p.id, label: `Posição Qtd: ${p.quantity}`, info: '' }))
       });
    }

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        okCount,
        warningCount: issues.filter(i => i.severity === 'warning').length,
        errorCount: issues.filter(i => i.severity === 'error').length
      },
      issues
    };
  },

  applySafeFixes: (currentData: AppData, report: DataHealthReport) => {
    let data = { ...currentData };
    const fixesApplied: string[] = [];

    // 1. Fix Transactions with Missing Accounts -> Move to System Wallet
    const txIssue = report.issues.find(i => i.type === 'TX_MISSING_ACCOUNT');
    if (txIssue && txIssue.canAutoFix) {
       // Ensure System Account exists
       let sysAccount = data.accounts.find(a => a.id === 'acc_system_fix');
       if (!sysAccount) {
         sysAccount = {
           id: 'acc_system_fix',
           name: '💵 Carteira (Recuperada)',
           type: 'cash',
           initialBalance: 0,
           isDefault: true,
           createdAt: Date.now()
         };
         data.accounts = [...data.accounts, sysAccount];
         DataHealthService.addFixLog({
           action: 'CREATE_SYSTEM_ACCOUNT',
           details: 'Conta "Carteira (Recuperada)" criada para receber órfãos.',
           affectedCount: 1
         });
       }

       const affectedSet = new Set(txIssue.affectedIds);
       data.transactions = data.transactions.map(t => {
          if (affectedSet.has(t.id)) {
            return { ...t, accountId: sysAccount!.id, description: `(Recuperado) ${t.description || ''}` };
          }
          return t;
       });

       DataHealthService.addFixLog({
         action: 'FIX_TX_ACCOUNT',
         details: `Movidas ${txIssue.affectedCount} transações órfãs para a conta de recuperação.`,
         affectedCount: txIssue.affectedCount
       });
       fixesApplied.push('TX_ACCOUNT');
    }

    // 2. Fix Transactions with Missing Categories -> Move to System Category
    const catIssue = report.issues.find(i => i.type === 'TX_MISSING_CATEGORY');
    if (catIssue && catIssue.canAutoFix) {
       // Ensure System Categories Exist
       const sysCatExpenseId = 'cat_system_fix_exp';
       const sysCatIncomeId = 'cat_system_fix_inc';
       
       const ensureCat = (id: string, name: string, kind: 'income' | 'expense') => {
          if (!data.categories.find(c => c.id === id)) {
             data.categories = [...data.categories, {
                id,
                name,
                emoji: '⚠️',
                group: 'Essencial',
                kind
             }];
          }
       };

       ensureCat(sysCatExpenseId, 'Sem Categoria (Fix)', 'expense');
       ensureCat(sysCatIncomeId, 'Sem Categoria (Fix)', 'income');

       const affectedSet = new Set(catIssue.affectedIds);
       data.transactions = data.transactions.map(t => {
          if (affectedSet.has(t.id)) {
             const targetCat = t.type === 'income' ? sysCatIncomeId : sysCatExpenseId;
             return { ...t, categoryId: targetCat };
          }
          return t;
       });

       DataHealthService.addFixLog({
         action: 'FIX_TX_CATEGORY',
         details: `Categorizadas ${catIssue.affectedCount} transações órfãs.`,
         affectedCount: catIssue.affectedCount
       });
       fixesApplied.push('TX_CATEGORY');
    }

    // 3. Disable Broken Recurring Rules
    const ruleIssues = report.issues.filter(i => (i.type === 'RULE_MISSING_ACCOUNT' || i.type === 'RULE_MISSING_CATEGORY') && i.canAutoFix);
    if (ruleIssues.length > 0) {
       const idsToDisable = new Set(ruleIssues.flatMap(i => i.affectedIds));
       data.recurringRules = data.recurringRules.map(r => {
          if (idsToDisable.has(r.id)) {
             return { ...r, isActive: false, description: `(Desativado pelo Sistema) ${r.description || ''}` };
          }
          return r;
       });

       DataHealthService.addFixLog({
         action: 'DISABLE_BROKEN_RULES',
         details: `Desativadas ${idsToDisable.size} regras recorrentes quebradas.`,
         affectedCount: idsToDisable.size
       });
       fixesApplied.push('RULES');
    }

    // 4. Delete Broken Budgets
    const budgetIssue = report.issues.find(i => i.type === 'BUDGET_MISSING_CATEGORY');
    if (budgetIssue && budgetIssue.canAutoFix) {
       const idsToDelete = new Set(budgetIssue.affectedIds);
       data.budgets = data.budgets.filter(b => !idsToDelete.has(b.id));

       DataHealthService.addFixLog({
         action: 'DELETE_BROKEN_BUDGETS',
         details: `Removidos ${idsToDelete.size} orçamentos inválidos.`,
         affectedCount: idsToDelete.size
       });
       fixesApplied.push('BUDGETS');
    }

    // Save and Reload
    if (fixesApplied.length > 0) {
       StorageService.save(data);
       window.location.reload();
    }
  },

  exportOrphans: (report: DataHealthReport, data: AppData) => {
     const orphans: any = {};
     report.issues.filter(i => !i.canAutoFix).forEach(issue => {
        if (issue.type === 'ORPHAN_CARD_TX') {
           orphans[issue.type] = data.creditCardTransactions.filter(t => issue.affectedIds.includes(t.id));
        } else if (issue.type === 'TRANSFER_BROKEN') {
           orphans[issue.type] = data.transfers.filter(t => issue.affectedIds.includes(t.id));
        } else if (issue.type === 'INV_POS_BROKEN') {
           orphans[issue.type] = data.positions.filter(p => issue.affectedIds.includes(p.id));
        }
     });

     const json = JSON.stringify(orphans, null, 2);
     const blob = new Blob([json], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `nex-finance-orphans-${new Date().toISOString().split('T')[0]}.json`;
     document.body.appendChild(a);
     a.click();
     document.body.removeChild(a);
     URL.revokeObjectURL(url);
  }
};
