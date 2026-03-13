import React, { useState } from 'react';
import { Account, AccountType } from '../types';
import { GlassButton } from './ui/GlassButton';
import { ModalShell, ModalBody, ModalFooter } from './ui/ModalShell';
import { GlassCard } from './ui/GlassCard';
import { GlassInput } from './ui/GlassInput';
import { GlassSelect } from './ui/GlassSelect';
import { PageShell } from './ui/PageShell';
import { PageHeader } from './ui/PageHeader';
import { MobileFab } from './ui/MobileFab';
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
          <GlassButton onClick={() => openModal()} icon={<Plus size={18}/>} className="hidden md:flex">Nova Conta</GlassButton>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map(acc => {
          const balance = getBalance(acc.id);
          return (
            <GlassCard key={acc.id} className="flex flex-col justify-between group hover:border-white/20 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-xl shadow-inner border border-white/5">
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
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                     type="button"
                     onClick={(e) => { e.stopPropagation(); openModal(acc); }} 
                     className="p-2 text-slate-400 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-colors"
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
                         : 'text-slate-400 hover:text-red-400 hover:bg-white/5'
                     }`}
                     disabled={!!acc.isDefault}
                     title={acc.isDefault ? "Conta padrão não pode ser excluída" : "Excluir conta"}
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-0.5">Saldo Atual</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                  {formatCurrency(balance)}
                </p>
              </div>
            </GlassCard>
          )
        })}
      </div>

      <ModalShell isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAcc ? 'Editar Conta' : 'Nova Conta'}>
        <ModalBody>
          <form id="account-form" onSubmit={handleSubmit} className="space-y-3">
             <GlassInput
               label="Nome da Conta"
               value={name}
               onChange={e => setName(e.target.value)}
               placeholder="Ex: Nubank, Carteira..."
               required
             />
             <GlassSelect
               label="Tipo"
               value={type}
               onChange={e => setType(e.target.value as AccountType)}
               options={[
                 { value: 'cash', label: 'Dinheiro Físico' },
                 { value: 'bank', label: 'Conta Bancária' },
                 { value: 'wallet', label: 'Carteira Digital' },
                 { value: 'other', label: 'Outro' }
               ]}
             />
             <div>
               <GlassInput
                 label="Saldo Inicial"
                 type="number"
                 step="0.01"
                 value={initialBalance}
                 onChange={e => setInitialBalance(e.target.value)}
               />
               <p className="text-xs text-slate-500 mt-1 pl-1">O saldo atual será calculado a partir deste valor + transações.</p>
             </div>
          </form>
        </ModalBody>
        <ModalFooter>
           <GlassButton type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</GlassButton>
           <GlassButton type="submit" form="account-form" variant="primary">{editingAcc ? 'Salvar' : 'Criar Conta'}</GlassButton>
        </ModalFooter>
      </ModalShell>

      <ModalShell isOpen={!!deletingAcc} onClose={() => setDeletingAcc(null)} title="Excluir Conta">
        <ModalBody>
          <div className="text-center space-y-4">
            <div className="bg-red-500/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2 border border-red-500/20">
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
          </div>
        </ModalBody>
        <ModalFooter>
          <GlassButton type="button" variant="ghost" onClick={() => setDeletingAcc(null)}>Cancelar</GlassButton>
          <GlassButton type="button" variant="danger" onClick={confirmDelete}>Confirmar Exclusão</GlassButton>
        </ModalFooter>
      </ModalShell>

      <MobileFab
        visible={!isModalOpen && !deletingAcc}
        actions={[
          { 
            id: 'add-account', 
            label: 'Nova Conta', 
            icon: <Plus size={24} />, 
            onClick: () => openModal() 
          }
        ]}
      />
    </PageShell>
  );
};