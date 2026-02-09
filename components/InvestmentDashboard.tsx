import React, { useState } from 'react';
import { InvestmentAccount, Asset, InvestmentMovement, Position, Account, InvestmentMovementKind, AssetType } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { PageShell } from './ui/PageShell';
import { PageHeader } from './ui/PageHeader';
import { TrendingUp, Plus, ArrowUpRight, ArrowDownLeft, Building2, Briefcase, DollarSign, Wallet } from 'lucide-react';

interface InvestmentDashboardProps {
  investmentAccounts: InvestmentAccount[];
  assets: Asset[];
  positions: Position[];
  movements: InvestmentMovement[];
  accounts: Account[]; // Normal accounts for linking
  onAddAccount: (acc: any) => void;
  onAddAsset: (asset: any) => void;
  onAddMovement: (mov: any) => void;
  getInvestmentAccountBalance: (id: string) => number;
  getPortfolioSummary: () => any;
}

export const InvestmentDashboard: React.FC<InvestmentDashboardProps> = ({
  investmentAccounts,
  assets,
  positions,
  movements,
  accounts,
  onAddAccount,
  onAddAsset,
  onAddMovement,
  getInvestmentAccountBalance,
  getPortfolioSummary
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'movements' | 'assets'>('overview');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  
  // Movement Form
  const [movForm, setMovForm] = useState({
     type: 'deposit' as InvestmentMovementKind,
     investmentAccountId: '',
     amount: '',
     date: new Date().toISOString().split('T')[0],
     linkedAccountId: '',
     assetId: '',
     quantity: ''
  });

  const [accForm, setAccForm] = useState({ name: '', institution: '' });
  const [assetForm, setAssetForm] = useState({ name: '', type: 'fixed_income' as AssetType, currency: 'BRL' });

  const summary = getPortfolioSummary();
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMovement({
       kind: movForm.type,
       investmentAccountId: movForm.investmentAccountId,
       amount: parseFloat(movForm.amount),
       date: movForm.date,
       linkedAccountId: (movForm.type === 'deposit' || movForm.type === 'withdraw') ? movForm.linkedAccountId : undefined,
       assetId: (movForm.type === 'buy' || movForm.type === 'sell') ? movForm.assetId : undefined,
       quantity: (movForm.type === 'buy' || movForm.type === 'sell') ? parseFloat(movForm.quantity) : undefined
    });
    setIsMovementModalOpen(false);
    // Reset basic form
    setMovForm(prev => ({ ...prev, amount: '', quantity: '' })); 
  };

  const getAssetName = (id: string) => assets.find(a => a.id === id)?.name || '-';
  const getInvAccountName = (id: string) => investmentAccounts.find(a => a.id === id)?.name || '-';

  return (
    <PageShell>
      <PageHeader 
        title="Investimentos" 
        subtitle="Monitore seu patrimônio, rentabilidade e alocação de ativos."
        actions={
          <>
            <Button onClick={() => { setMovForm(prev => ({...prev, type: 'deposit'})); setIsMovementModalOpen(true); }} icon={<ArrowUpRight size={16}/>}>Aportar</Button>
            <Button variant="secondary" onClick={() => { setMovForm(prev => ({...prev, type: 'buy'})); setIsMovementModalOpen(true); }} icon={<Briefcase size={16}/>}>Comprar Ativo</Button>
          </>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Patrimônio Total Estimado</p>
            <p className="text-3xl font-bold text-emerald-400">{formatCurrency(summary.totalPatrimony)}</p>
            <p className="text-xs text-slate-500 mt-2 font-medium">Soma de Posições + Caixa em Cta. Invest.</p>
         </div>
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Total em Ativos</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(summary.totalInvested)}</p>
         </div>
         <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Caixa Disponível</p>
            <p className="text-3xl font-bold text-blue-400">{formatCurrency(summary.totalCash)}</p>
         </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700">
         <div className="flex gap-4">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}>Visão Geral</button>
            <button onClick={() => setActiveTab('assets')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'assets' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}>Carteira de Ativos</button>
            <button onClick={() => setActiveTab('movements')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'movements' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-300'}`}>Histórico</button>
         </div>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'overview' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-white text-lg">Contas de Investimento</h3>
                  <Button size="sm" variant="ghost" onClick={() => setIsAccountModalOpen(true)} icon={<Plus size={16} />}>Nova Conta</Button>
               </div>
               <div className="space-y-3">
                  {investmentAccounts.length === 0 && <div className="p-6 text-center border border-dashed border-slate-700 rounded-lg text-slate-500">Nenhuma conta cadastrada.</div>}
                  {investmentAccounts.map(acc => (
                     <div key={acc.id} className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-slate-700 rounded-lg text-slate-300"><Building2 size={20}/></div>
                           <div>
                              <p className="text-sm font-bold text-slate-200">{acc.name}</p>
                              <p className="text-xs text-slate-500">{acc.institution}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-bold text-white">{formatCurrency(getInvestmentAccountBalance(acc.id))}</p>
                           <p className="text-xs text-slate-500">Saldo em caixa</p>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
            
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-white text-lg">Alocação por Tipo</h3>
               </div>
               <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
                  {Object.entries(summary.byAssetType).map(([type, val]: any) => (
                     <div key={type} className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                           <span className="text-slate-300 capitalize font-medium">{type.replace('_', ' ')}</span>
                           <span className="text-white font-bold">{formatCurrency(val)}</span>
                        </div>
                        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                           <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(val / summary.totalInvested) * 100}%` }}></div>
                        </div>
                     </div>
                  ))}
                  {Object.keys(summary.byAssetType).length === 0 && <p className="text-slate-500 text-sm text-center py-4">Nenhum ativo na carteira.</p>}
               </div>
            </div>
         </div>
      )}

      {activeTab === 'assets' && (
         <div className="space-y-4">
             <div className="flex justify-end">
                <Button size="sm" onClick={() => setIsAssetModalOpen(true)} icon={<Plus size={16}/>}>Novo Ativo</Button>
             </div>
             <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
                <table className="w-full text-left text-sm text-slate-400">
                   <thead className="bg-slate-900/50 text-xs uppercase font-medium">
                      <tr>
                         <th className="px-6 py-4">Ativo</th>
                         <th className="px-6 py-4">Tipo</th>
                         <th className="px-6 py-4 text-right">Qtd.</th>
                         <th className="px-6 py-4 text-right">Preço Médio</th>
                         <th className="px-6 py-4 text-right">Total Investido</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-700">
                      {positions.length === 0 && (
                         <tr><td colSpan={5} className="text-center py-10 text-slate-500">Nenhuma posição em aberto.</td></tr>
                      )}
                      {positions.map(pos => {
                         const asset = assets.find(a => a.id === pos.assetId);
                         return (
                            <tr key={pos.id} className="hover:bg-slate-700/30 transition-colors">
                               <td className="px-6 py-4 text-white font-medium">{asset?.name || 'Desconhecido'}</td>
                               <td className="px-6 py-4 capitalize">
                                  <span className="bg-slate-700 px-2 py-1 rounded text-xs">{asset?.type?.replace('_', ' ')}</span>
                               </td>
                               <td className="px-6 py-4 text-right font-mono text-slate-300">{pos.quantity}</td>
                               <td className="px-6 py-4 text-right font-mono text-slate-300">{formatCurrency(pos.averagePrice)}</td>
                               <td className="px-6 py-4 text-right text-emerald-400 font-bold">{formatCurrency(pos.quantity * pos.averagePrice)}</td>
                            </tr>
                         )
                      })}
                   </tbody>
                </table>
             </div>
         </div>
      )}

      {activeTab === 'movements' && (
         <div className="space-y-4">
             <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
                <table className="w-full text-left text-sm text-slate-400">
                   <thead className="bg-slate-900/50 text-xs uppercase font-medium">
                      <tr>
                         <th className="px-6 py-4">Data</th>
                         <th className="px-6 py-4">Tipo</th>
                         <th className="px-6 py-4">Conta / Ativo</th>
                         <th className="px-6 py-4 text-right">Valor</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-700">
                      {movements.length === 0 && (
                         <tr><td colSpan={4} className="text-center py-10 text-slate-500">Nenhuma movimentação registrada.</td></tr>
                      )}
                      {movements.map(mov => (
                         <tr key={mov.id} className="hover:bg-slate-700/30 transition-colors">
                            <td className="px-6 py-4">{new Date(mov.date).toLocaleDateString('pt-BR')}</td>
                            <td className="px-6 py-4">
                               <span className={`px-2 py-1 rounded text-xs uppercase font-bold tracking-wide
                                  ${mov.kind === 'deposit' || mov.kind === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 
                                    mov.kind === 'withdraw' ? 'bg-red-500/10 text-red-400' : 
                                    'bg-blue-500/10 text-blue-400'}`}>
                                  {mov.kind === 'deposit' ? 'Aporte' : mov.kind === 'withdraw' ? 'Resgate' : mov.kind === 'buy' ? 'Compra' : mov.kind === 'sell' ? 'Venda' : 'Provento'}
                               </span>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex flex-col">
                                  <span className="text-white font-medium">{getInvAccountName(mov.investmentAccountId)}</span>
                                  {mov.assetId && <span className="text-xs text-slate-500">{getAssetName(mov.assetId)} {mov.quantity && `(${mov.quantity}x)`}</span>}
                               </div>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-white">{formatCurrency(mov.amount)}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
         </div>
      )}

      {/* MODALS */}
      <Modal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} title="Nova Conta de Investimento">
         <form onSubmit={(e) => { e.preventDefault(); onAddAccount(accForm); setIsAccountModalOpen(false); setAccForm({name:'', institution:''}); }} className="space-y-4">
            <div>
               <label className="block text-sm text-slate-300 mb-1">Nome</label>
               <input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={accForm.name} onChange={e => setAccForm({...accForm, name: e.target.value})} required placeholder="Ex: Carteira XP" />
            </div>
            <div>
               <label className="block text-sm text-slate-300 mb-1">Instituição</label>
               <input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={accForm.institution} onChange={e => setAccForm({...accForm, institution: e.target.value})} placeholder="Ex: XP Investimentos" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
               <Button type="button" variant="ghost" onClick={() => setIsAccountModalOpen(false)}>Cancelar</Button>
               <Button type="submit">Salvar</Button>
            </div>
         </form>
      </Modal>

      <Modal isOpen={isAssetModalOpen} onClose={() => setIsAssetModalOpen(false)} title="Novo Ativo">
         <form onSubmit={(e) => { e.preventDefault(); onAddAsset(assetForm); setIsAssetModalOpen(false); setAssetForm({name:'', type:'fixed_income', currency: 'BRL'}); }} className="space-y-4">
            <div>
               <label className="block text-sm text-slate-300 mb-1">Ticker / Nome</label>
               <input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={assetForm.name} onChange={e => setAssetForm({...assetForm, name: e.target.value})} required placeholder="Ex: PETR4, CDB Banco X..." />
            </div>
            <div>
               <label className="block text-sm text-slate-300 mb-1">Tipo</label>
               <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={assetForm.type} onChange={e => setAssetForm({...assetForm, type: e.target.value as any})}>
                  <option value="fixed_income">Renda Fixa</option>
                  <option value="stock">Ação</option>
                  <option value="fii">FII</option>
                  <option value="etf">ETF</option>
                  <option value="crypto">Cripto</option>
                  <option value="fund">Fundo</option>
               </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
               <Button type="button" variant="ghost" onClick={() => setIsAssetModalOpen(false)}>Cancelar</Button>
               <Button type="submit">Salvar</Button>
            </div>
         </form>
      </Modal>

      <Modal isOpen={isMovementModalOpen} onClose={() => setIsMovementModalOpen(false)} title="Nova Movimentação">
         <form onSubmit={handleMovementSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-lg mb-4">
               {['deposit', 'withdraw', 'buy', 'sell'].map((type) => (
                  <button type="button" key={type} 
                     onClick={() => setMovForm({...movForm, type: type as any})}
                     className={`py-2 text-xs font-bold uppercase rounded ${movForm.type === type ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                     {type === 'deposit' ? 'Aporte' : type === 'withdraw' ? 'Resgate' : type === 'buy' ? 'Compra' : 'Venda'}
                  </button>
               ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm text-slate-300 mb-1">Data</label>
                  <input type="date" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={movForm.date} onChange={e => setMovForm({...movForm, date: e.target.value})} required />
               </div>
               <div>
                  <label className="block text-sm text-slate-300 mb-1">Valor (Total)</label>
                  <input type="number" step="0.01" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={movForm.amount} onChange={e => setMovForm({...movForm, amount: e.target.value})} required />
               </div>
            </div>

            <div>
               <label className="block text-sm text-slate-300 mb-1">Conta de Investimento</label>
               <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={movForm.investmentAccountId} onChange={e => setMovForm({...movForm, investmentAccountId: e.target.value})} required>
                  <option value="">Selecione...</option>
                  {investmentAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
               </select>
            </div>

            {(movForm.type === 'deposit' || movForm.type === 'withdraw') && (
               <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-700">
                  <label className="block text-sm text-slate-300 mb-1">
                     {movForm.type === 'deposit' ? 'Origem do dinheiro (Conta Comum)' : 'Destino do dinheiro (Conta Comum)'}
                  </label>
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={movForm.linkedAccountId} onChange={e => setMovForm({...movForm, linkedAccountId: e.target.value})} required>
                     <option value="">Selecione...</option>
                     {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Isso criará uma transação automática no seu extrato.</p>
               </div>
            )}

            {(movForm.type === 'buy' || movForm.type === 'sell') && (
               <div className="space-y-4">
                  <div>
                     <label className="block text-sm text-slate-300 mb-1">Ativo</label>
                     <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={movForm.assetId} onChange={e => setMovForm({...movForm, assetId: e.target.value})} required>
                        <option value="">Selecione...</option>
                        {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm text-slate-300 mb-1">Quantidade</label>
                     <input type="number" step="0.00000001" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" value={movForm.quantity} onChange={e => setMovForm({...movForm, quantity: e.target.value})} required />
                  </div>
               </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
               <Button type="button" variant="ghost" onClick={() => setIsMovementModalOpen(false)}>Cancelar</Button>
               <Button type="submit">Confirmar</Button>
            </div>
         </form>
      </Modal>
    </PageShell>
  );
};