import React from 'react';
import { Transaction, Category, Account, Transfer } from '../types';
import { Trash2, Edit2, Search, ArrowRightLeft, Repeat } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';

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
        <div className="bg-white/5 p-4 rounded-full mb-4 border border-white/5">
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
      <GlassCard className="hidden md:block p-0 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-white/5 text-xs uppercase font-medium text-slate-300">
            <tr>
              <th className="px-6 py-4 font-semibold tracking-wider">Data</th>
              <th className="px-6 py-4 font-semibold tracking-wider">Categoria / Tipo</th>
              <th className="px-6 py-4 font-semibold tracking-wider">Descrição</th>
              <th className="px-6 py-4 text-right font-semibold tracking-wider">Valor</th>
              <th className="px-6 py-4 text-center font-semibold tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions.map((item) => {
              const isTransfer = item.isTransfer;
              
              return (
                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                    {formatDate(item.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isTransfer ? (
                       <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-medium">
                         <ArrowRightLeft size={12} />
                         <span>Transferência</span>
                       </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 text-slate-200 border border-white/10 text-xs font-medium">
                        <span>{getCategory(item.categoryId)?.emoji}</span>
                        <span>{getCategory(item.categoryId)?.name}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-300 max-w-xs truncate">
                    {isTransfer ? (
                      <div className="flex flex-col text-xs">
                         <span className="text-slate-200 font-medium">{item.description || 'Sem descrição'}</span>
                         <span className="text-slate-500 flex items-center gap-1 mt-0.5">
                            {getAccountName(item.fromAccountId)} <ArrowRightLeft size={10} /> {getAccountName(item.toAccountId)}
                         </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {item.generatedByRuleId && (
                           <span title="Gerado automaticamente" className="text-blue-400"><Repeat size={12} /></span>
                        )}
                        <span title={item.description} className="text-slate-200">{item.description || '-'}</span>
                      </div>
                    )}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right font-bold 
                    ${isTransfer ? 'text-slate-300' : (item.type === 'income' ? 'text-emerald-400' : 'text-red-400')}`}>
                    {isTransfer ? '' : (item.type === 'expense' ? '- ' : '+ ')}
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onEdit(item)}
                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          const label = isTransfer ? 'transferência' : 'transação';
                          if(window.confirm(`Tem certeza que deseja excluir esta ${label}?`)) onDelete(item.id, isTransfer);
                        }}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
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
      </GlassCard>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {transactions.map((item) => {
          const isTransfer = item.isTransfer;
          const category = !isTransfer ? getCategory(item.categoryId) : null;
          
          return (
            <GlassCard key={item.id} className={`p-4 ${isTransfer ? 'border-blue-500/20 bg-blue-500/5' : ''}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl bg-white/5 p-2 rounded-xl border border-white/5">
                    {isTransfer ? '🔄' : category?.emoji}
                  </span>
                  <div>
                    <h4 className="font-medium text-white text-sm flex items-center gap-1">
                      {isTransfer ? 'Transferência' : category?.name}
                      {!isTransfer && item.generatedByRuleId && <Repeat size={12} className="text-blue-400" />}
                    </h4>
                    <span className="text-xs text-slate-500">{formatDate(item.date)}</span>
                  </div>
                </div>
                <div className={`font-bold ${isTransfer ? 'text-slate-300' : (item.type === 'income' ? 'text-emerald-400' : 'text-red-400')}`}>
                  {isTransfer ? '' : (item.type === 'expense' ? '- ' : '+ ')}
                  {formatCurrency(item.amount)}
                </div>
              </div>
              
              {isTransfer ? (
                <div className="text-xs bg-black/20 p-2.5 rounded-lg border border-white/5 mb-3">
                   <div className="flex justify-between items-center text-slate-400 mb-1">
                      <span>De: {getAccountName(item.fromAccountId)}</span>
                   </div>
                   <div className="flex justify-between items-center text-slate-200 font-medium">
                      <span>Para: {getAccountName(item.toAccountId)}</span>
                   </div>
                </div>
              ) : null}

              {item.description && (
                <p className="text-sm text-slate-300 mb-4 line-clamp-1 pl-1">{item.description}</p>
              )}
              
              <div className="flex justify-end gap-3 border-t border-white/5 pt-3">
                 <GlassButton 
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(item)}
                    className="text-blue-400 hover:text-blue-300 h-8 px-3"
                  >
                    <Edit2 size={14} className="mr-1.5" /> Editar
                  </GlassButton>
                  <GlassButton 
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                       const label = isTransfer ? 'transferência' : 'transação';
                       if(window.confirm(`Excluir ${label}?`)) onDelete(item.id, isTransfer);
                    }}
                    className="text-red-400 hover:text-red-300 h-8 px-3"
                  >
                    <Trash2 size={14} className="mr-1.5" /> Excluir
                  </GlassButton>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
});
