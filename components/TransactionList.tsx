import React from 'react';
import { Transaction, Category, Account, Transfer } from '../types';
import { Trash2, Edit2, Search, ArrowRightLeft, Repeat } from 'lucide-react';

interface TransactionListProps {
  transactions: (Transaction | Transfer | any)[]; // Unified list
  categories: Category[];
  accounts: Account[]; // Needed for resolving Transfer names
  onEdit: (item: any) => void;
  onDelete: (id: string, isTransfer: boolean) => void;
}

export const TransactionList: React.FC<TransactionListProps> = React.memo(({ 
  transactions, 
  categories,
  accounts,
  onEdit, 
  onDelete 
}) => {
  const getCategory = (id: string) => categories.find(c => c.id === id);
  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Conta desconhecida';

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
  };

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
        <div className="bg-slate-800 p-4 rounded-full mb-4">
          <Search size={32} className="opacity-50" />
        </div>
        <h3 className="text-lg font-medium text-slate-300 mb-1">Nenhuma movimentação encontrada</h3>
        <p className="max-w-xs mx-auto">Tente ajustar os filtros ou adicione uma nova transação.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-sm">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-900/50 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Categoria / Tipo</th>
              <th className="px-6 py-4">Descrição</th>
              <th className="px-6 py-4 text-right">Valor</th>
              <th className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {transactions.map((item) => {
              const isTransfer = item.isTransfer;
              
              return (
                <tr key={item.id} className="hover:bg-slate-700/30 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                    {formatDate(item.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isTransfer ? (
                       <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs">
                         <ArrowRightLeft size={12} />
                         <span>Transferência</span>
                       </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-700 text-slate-200 text-xs">
                        <span>{getCategory(item.categoryId)?.emoji}</span>
                        <span>{getCategory(item.categoryId)?.name}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-300 max-w-xs truncate">
                    {isTransfer ? (
                      <div className="flex flex-col text-xs">
                         <span className="text-slate-200">{item.description || 'Sem descrição'}</span>
                         <span className="text-slate-500">{getAccountName(item.fromAccountId)} ➔ {getAccountName(item.toAccountId)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {item.generatedByRuleId && (
                           <span title="Gerado automaticamente" className="text-blue-400"><Repeat size={12} /></span>
                        )}
                        <span title={item.description}>{item.description || '-'}</span>
                      </div>
                    )}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right font-medium 
                    ${isTransfer ? 'text-slate-300' : (item.type === 'income' ? 'text-emerald-400' : 'text-red-400')}`}>
                    {isTransfer ? '' : (item.type === 'expense' ? '- ' : '+ ')}
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onEdit(item)}
                        className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          const label = isTransfer ? 'transferência' : 'transação';
                          if(window.confirm(`Tem certeza que deseja excluir esta ${label}?`)) onDelete(item.id, isTransfer);
                        }}
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {transactions.map((item) => {
          const isTransfer = item.isTransfer;
          const category = !isTransfer ? getCategory(item.categoryId) : null;
          
          return (
            <div key={item.id} className={`p-4 rounded-xl border shadow-sm ${isTransfer ? 'bg-slate-800/60 border-blue-500/20' : 'bg-slate-800 border-slate-700'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {isTransfer ? '🔄' : category?.emoji}
                  </span>
                  <div>
                    <h4 className="font-medium text-slate-200 text-sm flex items-center gap-1">
                      {isTransfer ? 'Transferência' : category?.name}
                      {!isTransfer && item.generatedByRuleId && <Repeat size={12} className="text-blue-400" />}
                    </h4>
                    <span className="text-xs text-slate-500">{formatDate(item.date)}</span>
                  </div>
                </div>
                <div className={`font-semibold ${isTransfer ? 'text-slate-300' : (item.type === 'income' ? 'text-emerald-400' : 'text-red-400')}`}>
                  {isTransfer ? '' : (item.type === 'expense' ? '- ' : '+ ')}
                  {formatCurrency(item.amount)}
                </div>
              </div>
              
              {isTransfer ? (
                <div className="text-xs bg-slate-900/50 p-2 rounded border border-slate-700 mb-2">
                   <div className="flex justify-between items-center text-slate-400 mb-1">
                      <span>De: {getAccountName(item.fromAccountId)}</span>
                   </div>
                   <div className="flex justify-between items-center text-slate-200 font-medium">
                      <span>Para: {getAccountName(item.toAccountId)}</span>
                   </div>
                </div>
              ) : null}

              {item.description && (
                <p className="text-sm text-slate-400 mb-3 line-clamp-1">{item.description}</p>
              )}
              
              <div className="flex justify-end gap-3 border-t border-slate-700/50 pt-3 mt-1">
                 <button 
                    onClick={() => onEdit(item)}
                    className="text-xs text-blue-400 font-medium flex items-center gap-1"
                  >
                    <Edit2 size={14} /> Editar
                  </button>
                  <button 
                    onClick={() => {
                       const label = isTransfer ? 'transferência' : 'transação';
                       if(window.confirm(`Excluir ${label}?`)) onDelete(item.id, isTransfer);
                    }}
                    className="text-xs text-red-400 font-medium flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Excluir
                  </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
