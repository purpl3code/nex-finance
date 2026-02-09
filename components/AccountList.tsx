import React, { useState } from 'react';
import { Account, AccountType } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { PageShell } from './ui/PageShell';
import { PageHeader } from './ui/PageHeader';
import { Building2, Wallet, Banknote, Edit2, Trash2, Plus, Lock, AlertTriangle } from 'lucide-react';

interface AccountListProps {
  accounts: Account[];
  getBalance: (id: string) => number;
  onAdd: (acc: any) => void;
  onEdit: (id: string, acc: any) => void;
  onDelete: (id: string) => void;
}

export const AccountList: React.FC<AccountListProps> = ({ accounts, getBalance, onAdd, onEdit, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Account | undefined>(undefined);
  const [deletingAcc, setDeletingAcc] = useState<Account | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('cash');
  const [initialBalance, setInitialBalance] = useState('0');

  const openModal = (acc?: Account) => {
    if (acc) {
      setEditingAcc(acc);
      setName(acc.name);
      setType(acc.type);
      setInitialBalance(acc.initialBalance.toString());
    } else {
      setEditingAcc(undefined);
      setName('');
      setType('cash');
      setInitialBalance('0');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const payload = {
      name,
      type,
      initialBalance: parseFloat(initialBalance) || 0,
    };

    if (editingAcc) {
      onEdit(editingAcc.id, payload);
    } else {
      onAdd(payload);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = () => {
    if (deletingAcc) {
      onDelete(deletingAcc.id);
      setDeletingAcc(null);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getIcon = (type: AccountType) => {
    switch (type) {
      case 'bank': return <Building2 size={24} className="text-blue-400" />;
      case 'cash': return <Banknote size={24} className="text-emerald-400" />;
      default: return <Wallet size={24} className="text-violet-400" />;
    }
  };

  return (
    <PageShell>
      <PageHeader 
        title="Minhas Contas" 
        subtitle="Gerencie suas contas bancárias, carteiras e dinheiro físico."
        actions={
          <Button onClick={() => openModal()} icon={<Plus size={18}/>}>Nova Conta</Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map(acc => {
          const balance = getBalance(acc.id);
          return (
            <div key={acc.id} className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-sm flex flex-col justify-between group hover:border-slate-600 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-700/50 rounded-lg shadow-inner">
                    {getIcon(acc.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{acc.name}</h3>
                      {acc.isDefault && (
                        <span title="Conta padrão do sistema">
                          <Lock size={14} className="text-slate-500" />
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">{acc.type === 'bank' ? 'Banco' : acc.type === 'cash' ? 'Dinheiro' : 'Carteira'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button 
                     type="button"
                     onClick={(e) => { e.stopPropagation(); openModal(acc); }} 
                     className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
                     title="Editar"
                   >
                     <Edit2 size={16} />
                   </button>
                   <button 
                     type="button"
                     onClick={(e) => { e.stopPropagation(); setDeletingAcc(acc); }}
                     className={`p-2 rounded-lg transition-colors ${
                       acc.isDefault 
                         ? 'text-slate-600 cursor-not-allowed' 
                         : 'text-slate-400 hover:text-red-400 hover:bg-slate-700'
                     }`}
                     disabled={!!acc.isDefault}
                     title={acc.isDefault ? "Conta padrão não pode ser excluída" : "Excluir conta"}
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">Saldo Atual</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAcc ? 'Editar Conta' : 'Nova Conta'}>
        <form onSubmit={handleSubmit} className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-slate-300 mb-1">Nome da Conta</label>
             <input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none" 
               value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Nubank, Carteira..." required />
           </div>
           <div>
             <label className="block text-sm font-medium text-slate-300 mb-1">Tipo</label>
             <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none"
               value={type} onChange={e => setType(e.target.value as AccountType)}>
               <option value="cash">Dinheiro Físico</option>
               <option value="bank">Conta Bancária</option>
               <option value="wallet">Carteira Digital</option>
               <option value="other">Outro</option>
             </select>
           </div>
           <div>
             <label className="block text-sm font-medium text-slate-300 mb-1">Saldo Inicial</label>
             <input type="number" step="0.01" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" 
               value={initialBalance} onChange={e => setInitialBalance(e.target.value)} />
             <p className="text-xs text-slate-500 mt-1">O saldo atual será calculado a partir deste valor + transações.</p>
           </div>
           <div className="flex justify-end gap-2 pt-2">
             <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
             <Button type="submit">{editingAcc ? 'Salvar' : 'Criar Conta'}</Button>
           </div>
        </form>
      </Modal>

      <Modal isOpen={!!deletingAcc} onClose={() => setDeletingAcc(null)} title="Excluir Conta">
        <div className="text-center space-y-4">
          <div className="bg-red-500/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
             <AlertTriangle size={32} className="text-red-500" />
          </div>
          <div>
            <p className="text-lg text-slate-200">Tem certeza que deseja excluir?</p>
            <p className="text-xl font-bold text-white mt-1">{deletingAcc?.name}</p>
          </div>
          <p className="text-sm text-slate-400">
            Esta ação removerá a conta permanentemente. <br/>
            Se houver transações vinculadas, a exclusão será bloqueada.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setDeletingAcc(null)}>Cancelar</Button>
            <Button type="button" variant="danger" onClick={confirmDelete}>Confirmar Exclusão</Button>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
};