import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Account, AccountType } from '../types';
import { GlassButton } from './ui/GlassButton';
import { ModalShell, ModalBody, ModalFooter } from './ui/ModalShell';
import { GlassCard } from './ui/GlassCard';
import { GlassInput } from './ui/GlassInput';
import { CurrencyInput } from './ui/CurrencyInput';
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
      case 'bank': return <Building2 size={22} className="text-blue-400" />;
      case 'cash': return <Banknote size={22} className="text-emerald-400" />;
      default: return <Wallet size={22} className="text-violet-400" />;
    }
  };

  const getAccentGlow = (type: AccountType) => {
    switch (type) {
      case 'bank': return 'from-blue-500/15 via-blue-500/5 to-transparent';
      case 'cash': return 'from-emerald-500/15 via-emerald-500/5 to-transparent';
      default: return 'from-violet-500/15 via-violet-500/5 to-transparent';
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

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-4" 
        initial="hidden" 
        animate="visible" 
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
      >
        {accounts.map(acc => {
          const balance = getBalance(acc.id);
          return (
            <motion.div 
              key={acc.id} 
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } } }}
            >
              <GlassCard className="relative overflow-hidden flex flex-col justify-between group p-5 sm:p-6">
                {/* Ambient glow mesh */}
                <div className={`absolute inset-0 bg-gradient-to-br ${getAccentGlow(acc.type)} opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 bg-white/[0.06] rounded-2xl shadow-sm border border-white/[0.08] group-hover:scale-105 transition-transform duration-200">
                        {getIcon(acc.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white tracking-tight">{acc.name}</h3>
                          {acc.isDefault && (
                            <span title="Conta padrão do sistema" className="p-1 rounded-md bg-white/[0.06] border border-white/10">
                              <Lock size={12} className="text-slate-400" />
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5 block">
                          {acc.type === 'bank' ? 'Banco' : acc.type === 'cash' ? 'Dinheiro' : 'Carteira Digital'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                       <button 
                         type="button"
                         onClick={(e) => { e.stopPropagation(); openModal(acc); }} 
                         className="p-2 text-slate-400 hover:text-[rgb(var(--c-primary-300))] hover:bg-white/[0.08] rounded-xl transition-colors"
                         title="Editar"
                       >
                         <Edit2 size={16} />
                       </button>
                       <button 
                         type="button"
                         onClick={(e) => { e.stopPropagation(); setDeletingAcc(acc); }}
                         className={`p-2 rounded-xl transition-colors ${
                           acc.isDefault 
                             ? 'text-slate-600 cursor-not-allowed' 
                             : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/15'
                         }`}
                         disabled={!!acc.isDefault}
                         title={acc.isDefault ? "Conta padrão não pode ser excluída" : "Excluir conta"}
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/6">
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Saldo Atual</p>
                    <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${balance >= 0 ? 'text-white' : 'text-rose-400'}`}>
                      {formatCurrency(balance)}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )
        })}
      </motion.div>

      <ModalShell isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingAcc ? 'Editar Conta' : 'Nova Conta'}>
        <ModalBody>
          <form id="account-form" onSubmit={handleSubmit} className="space-y-4">
             <GlassInput
               label="Nome da Conta"
               value={name}
               onChange={e => setName(e.target.value)}
               placeholder="Ex: Nubank, Carteira..."
               required
             />
             <GlassSelect
               label="Tipo de Conta"
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
                <CurrencyInput
                  label="Saldo Inicial"
                  value={initialBalance}
                  onChange={val => setInitialBalance(val)}
                />
                <p className="text-[11px] text-slate-400 mt-1 pl-1">O saldo atual será calculado a partir deste valor somado às movimentações.</p>
              </div>
          </form>
        </ModalBody>
        <ModalFooter>
           <GlassButton type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</GlassButton>
           <GlassButton type="submit" form="account-form" variant="primary">{editingAcc ? 'Salvar Alterações' : 'Criar Conta'}</GlassButton>
        </ModalFooter>
      </ModalShell>

      <ModalShell isOpen={!!deletingAcc} onClose={() => setDeletingAcc(null)} title="Excluir Conta">
        <ModalBody>
          <div className="text-center space-y-4 py-3">
            <div className="bg-rose-500/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2 border border-rose-500/25">
               <AlertTriangle size={32} className="text-rose-400" />
            </div>
            <div>
              <p className="text-lg text-slate-100 font-bold">Tem certeza que deseja excluir?</p>
              <p className="text-xl font-extrabold text-white mt-1">{deletingAcc?.name}</p>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
              Esta ação removerá a conta permanentemente. Caso haja transações vinculadas, a exclusão será bloqueada para proteger o histórico.
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