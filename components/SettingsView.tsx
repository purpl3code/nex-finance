
import React, { useRef, useState, useEffect } from 'react';
import { BackupService } from '../services/backupService';
import { StorageService } from '../services/storageService';
import { ThemeService, AppTheme } from '../services/themeService';
import { SyncService } from '../services/syncService';
import { supabase, isDemoMode, disableDemoMode } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { BackupFile } from '../types';
import { useFinance } from '../hooks/useFinance';
import { useUserProfile } from '../hooks/useUserProfile';
import { GlassButton } from './ui/GlassButton';
import { ModalShell, ModalBody, ModalFooter } from './ui/ModalShell';
import { GlassAvatar } from './ui/GlassAvatar';
import { GlassCard } from './ui/GlassCard';
import { GlassInput } from './ui/GlassInput';
import { PageShell } from './ui/PageShell';
import { PageHeader } from './ui/PageHeader';
import { ThemeSelector } from './ThemeSelector';
import { CategoryManager } from './CategoryManager';
import { 
  Download, Upload, AlertTriangle, 
  Trash2, ShieldAlert, History,
  User, Camera, Palette, Cloud, LogOut, Tag
} from 'lucide-react';
import { toast } from 'sonner';

const SectionCard = ({ title, description, icon, children, danger = false }: any) => (
  <GlassCard 
    className={`overflow-hidden ${danger ? 'border-red-500/30 shadow-red-900/10' : ''}`}
  >
    <div className="flex items-start gap-4 mb-4">
      <div className={`p-3 rounded-xl backdrop-blur-md ${danger ? 'bg-red-500/20 text-red-400 shadow-lg shadow-red-500/10' : 'bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10'}`}>
        {icon}
      </div>
      <div>
        <h3 className={`text-lg font-semibold ${danger ? 'text-red-400' : 'text-white'}`}>{title}</h3>
        {description && <p className="text-sm text-white/50 mt-1">{description}</p>}
      </div>
    </div>
    <div>
      {children}
    </div>
  </GlassCard>
);

export const SettingsView: React.FC = () => {
  const { session } = useAuth();
  const { 
    transactions,
    categories, creditCardTransactions,
    addCategory, editCategory, archiveCategory, reassignCategory
  } = useFinance();

  const { profile, updateName, updateAvatar, removeAvatar } = useUserProfile();
  const isDemo = isDemoMode();

  const [lastBackup, setLastBackup] = useState<string | null>(null);
  
  // Theme State
  const [currentTheme, setCurrentTheme] = useState<AppTheme>('dark');

  // Profile State
  const [profileName, setProfileName] = useState(profile.displayName);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewBackup, setPreviewBackup] = useState<BackupFile | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importWarning, setImportWarning] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Category Manager State
  const [isCatManagerOpen, setIsCatManagerOpen] = useState(false);

  // Danger Zone State
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  useEffect(() => {
    const dateStr = BackupService.getLastBackupDate();
    setLastBackup(dateStr);
    setProfileName(profile.displayName);
    setCurrentTheme(ThemeService.getTheme());
  }, [profile.displayName]);

  // Profile Handlers
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (profileName.trim()) {
      updateName(profileName.trim());
      toast.success('Perfil atualizado com sucesso!');
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateAvatar(file);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleLogout = async () => {
    if(confirm('Tem certeza que deseja sair?')) {
      if (isDemoMode()) {
        disableDemoMode();
        StorageService.clear();
        window.location.reload();
      } else {
        await supabase.auth.signOut();
        StorageService.clear();
        window.location.reload();
      }
    }
  };

  // Sync Handlers
  const handlePushToCloud = async () => {
    if (isDemo) {
       toast.error("Sincronização na nuvem indisponível no Modo Demo.");
       return;
    }
    if(!session) return;
    setIsSyncing(true);
    const data = SyncService.getLocalData();
    const result = await SyncService.pushToCloud(data, session.user.id);
    setIsSyncing(false);
    
    if (result && !result.success) {
      toast.error(`Erro ao enviar para a nuvem: ${result.error?.message || result.error || 'Erro desconhecido'}. Verifique se a tabela 'user_data' foi criada no Supabase.`);
    } else {
      toast.success('Dados enviados para a nuvem com sucesso!');
    }
  };

  const handlePullFromCloud = async () => {
    if (isDemo) {
       toast.error("Sincronização na nuvem indisponível no Modo Demo.");
       return;
    }
    if(!session) return;
    if(!confirm('Isso irá substituir os dados atuais do dispositivo pelos dados da nuvem. Continuar?')) return;
    
    setIsSyncing(true);
    const updated = await SyncService.initialize();
    setIsSyncing(false);
    
    if(updated) {
      toast.success('Dados baixados com sucesso! A página será recarregada.');
      setTimeout(() => window.location.reload(), 2000);
    } else {
      toast.error('Nenhum dado encontrado na nuvem ou erro ao baixar.');
    }
  };

  const handleExport = () => {
    const backup = BackupService.createBackup();
    BackupService.downloadBackup(backup);
    setLastBackup(new Date().toISOString());
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportWarning(null);
    setPreviewBackup(null);

    const result = await BackupService.parseBackupFile(file);
    if (!result.isValid) {
       setImportError(result.error || 'Erro desconhecido');
    } else {
       if (result.warning) setImportWarning(result.warning);
       setPreviewBackup(result.backup || null);
    }
    
    setIsImportModalOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMerge = () => {
    if (!previewBackup) return;
    if (confirm('Isso irá mesclar os dados. Registros com mesmo ID serão mantidos (preferência local). Continuar?')) {
       BackupService.applyBackupMerge(previewBackup);
       setIsImportModalOpen(false);
    }
  };

  const handleReplace = () => {
    if (!previewBackup) return;
    if (confirm('ATENÇÃO: Isso APAGARÁ todos os dados atuais. Deseja continuar?')) {
       BackupService.applyBackupReplace(previewBackup);
    }
  };

  const handleClearAllData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <PageShell className="max-w-4xl">
      <PageHeader 
        title="Configurações" 
        subtitle="Gerencie seus dados, backups e preferências do sistema."
        actions={
          <GlassButton variant="secondary" onClick={handleLogout} icon={<LogOut size={16} />}>Sair</GlassButton>
        }
      />

      {/* 0. USER PROFILE */}
      <SectionCard 
        title="Meu Perfil" 
        description={`Logado como: ${session?.user.email || 'Usuário Local'}`}
        icon={<User size={24} />}
      >
        <div className="flex flex-col md:flex-row gap-8 items-start">
           <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                 <GlassAvatar src={profile.avatarDataUrl} name={profile.displayName} size="xl" />
                 <button 
                   onClick={() => avatarInputRef.current?.click()}
                   className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
                 >
                   <Camera size={24} className="text-white" />
                 </button>
                 <input 
                   type="file" 
                   ref={avatarInputRef} 
                   className="hidden" 
                   accept="image/png, image/jpeg, image/webp" 
                   onChange={handleAvatarSelect}
                 />
              </div>
              {profile.avatarDataUrl && (
                 <button onClick={removeAvatar} className="text-xs text-red-400 hover:text-red-300 underline">
                   Remover foto
                 </button>
              )}
           </div>
           
           <form onSubmit={handleSaveProfile} className="flex-1 w-full space-y-4">
              <div>
                 <GlassInput 
                    label="Nome de Exibição" 
                    value={profileName} 
                    onChange={e => setProfileName(e.target.value)} 
                    maxLength={30}
                    placeholder="Seu nome"
                 />
              </div>
              <div className="pt-2">
                 <GlassButton type="submit">Salvar Alterações</GlassButton>
              </div>
           </form>
        </div>
      </SectionCard>

      {/* 0.5 CLOUD SYNC */}
      <SectionCard
        title="Sincronização na Nuvem"
        description="Mantenha seus dados salvos e sincronizados entre dispositivos."
        icon={<Cloud size={24} />}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-white/50 bg-white/5 px-4 py-3 rounded-xl border border-white/10">
             <div className={`w-2 h-2 rounded-full shadow-lg ${navigator.onLine ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50'}`}></div>
             <span>Status da conexão: <span className="text-white/80 font-medium">{navigator.onLine ? 'Online' : 'Offline'}</span></span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <GlassButton onClick={handlePushToCloud} disabled={isSyncing || isDemo} className="w-full flex justify-center">
                {isSyncing ? 'Enviando...' : 'Enviar Dados para Nuvem'}
             </GlassButton>
             <GlassButton onClick={handlePullFromCloud} variant="secondary" disabled={isSyncing || isDemo} className="w-full flex justify-center">
                {isSyncing ? 'Baixando...' : 'Baixar Dados da Nuvem'}
             </GlassButton>
          </div>
          <p className="text-xs text-white/40 text-center">
            {isDemo ? 'Recurso desativado no modo demo.' : 'Seus dados são salvos automaticamente na nuvem ao fazer alterações.'}
          </p>
        </div>
      </SectionCard>

      {/* 0.6. THEME SELECTOR */}
      <SectionCard
        title="Aparência"
        description="Escolha o tema que mais combina com você."
        icon={<Palette size={24} />}
      >
        <ThemeSelector currentTheme={currentTheme} onThemeChange={setCurrentTheme} />
      </SectionCard>

      {/* 0.7 CATEGORY MANAGER */}
      <SectionCard
        title="Categorias"
        description="Personalize, crie ou arquive categorias de entradas e saídas."
        icon={<Tag size={24} />}
      >
        <div className="flex items-center justify-between">
           <div>
              <p className="text-slate-300 font-medium">{categories.length} categorias cadastradas</p>
              <p className="text-xs text-slate-500 mt-1">Gerencie ícones, cores e grupos.</p>
           </div>
           <GlassButton onClick={() => setIsCatManagerOpen(true)}>Gerenciar Categorias</GlassButton>
        </div>
      </SectionCard>

      {/* 2. BACKUP & RESTORE */}
      <SectionCard 
        title="Backup e Restauração" 
        description="Mantenha seus dados seguros exportando regularmente."
        icon={<Download size={24} />}
      >
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
           <div className="flex items-center gap-3 text-sm text-slate-400 bg-white/5 px-4 py-3 rounded-xl border border-white/10 w-full md:w-auto">
              <History size={16} />
              {lastBackup ? (
                <span>Último export: <span className="text-slate-200 font-medium">{new Date(lastBackup).toLocaleDateString()} às {new Date(lastBackup).toLocaleTimeString().slice(0,5)}</span></span>
              ) : (
                <span>Nenhum backup exportado ainda.</span>
              )}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <GlassButton onClick={handleExport} className="w-full flex items-center justify-center gap-2 h-12 text-base">
              <Download size={18} /> Exportar Dados (.json)
           </GlassButton>
           
           <div className="relative">
             <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json"
                onChange={handleFileSelect}
             />
             <GlassButton 
                onClick={() => fileInputRef.current?.click()} 
                variant="secondary" 
                className="w-full flex items-center justify-center gap-2 h-12 text-base"
             >
                <Upload size={18} /> Importar Backup
             </GlassButton>
           </div>
        </div>
      </SectionCard>

      {/* 5. DANGER ZONE */}
      <SectionCard 
        title="Zona de Perigo" 
        description="Ações irreversíveis que afetam seus dados."
        icon={<ShieldAlert size={24} />}
        danger={true}
      >
         <div className="flex items-center justify-between">
            <div>
               <p className="text-slate-300 font-medium">Limpar todos os dados</p>
               <p className="text-xs text-slate-500 mt-1">Remove todas as transações, contas e configurações.</p>
            </div>
            <GlassButton variant="danger" onClick={() => setIsClearModalOpen(true)}>
               Apagar Tudo
            </GlassButton>
         </div>
      </SectionCard>

      {/* CATEGORY MANAGER MODAL */}
      <ModalShell 
        isOpen={isCatManagerOpen} 
        onClose={() => setIsCatManagerOpen(false)} 
        title="Gerenciar Categorias"
        className="w-full max-w-lg md:max-w-none md:w-[min(980px,92vw)]" // Added responsive width override
      >
         <ModalBody>
            <CategoryManager 
               categories={categories}
               transactions={transactions}
               creditCardTransactions={creditCardTransactions}
               onAdd={addCategory}
               onEdit={editCategory}
               onArchive={archiveCategory}
               onReassign={reassignCategory}
            />
         </ModalBody>
      </ModalShell>

      {/* ... [Rest of modals] ... */}
      
      {/* IMPORT PREVIEW MODAL */}
      <ModalShell isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Restaurar Backup">
        <ModalBody>
           <div className="space-y-4">
              {importError ? (
                 <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex items-center gap-3 text-red-400">
                    <AlertTriangle size={20} />
                    <p>{importError}</p>
                 </div>
              ) : previewBackup && (
                 <div className="space-y-4">
                    <div className="bg-white/5 p-4 border rounded-xl border-white/10">
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-slate-400 text-xs">Arquivo</span>
                          <span className="text-slate-200 text-xs font-mono">{previewBackup.appName} v{previewBackup.schemaVersion}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-slate-400 text-xs">Data Exportação</span>
                          <span className="text-slate-200 text-xs">{new Date(previewBackup.exportedAt).toLocaleString()}</span>
                       </div>
                    </div>

                    {importWarning && (
                       <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-amber-400 text-sm">
                          ⚠️ {importWarning}
                       </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-white/5 p-2 rounded border border-white/5">
                           <span className="block text-lg font-bold text-white">{previewBackup.data.transactions?.length || 0}</span>
                           <span className="text-[10px] text-slate-400 uppercase">Transações</span>
                        </div>
                        <div className="bg-white/5 p-2 rounded border border-white/5">
                           <span className="block text-lg font-bold text-white">{previewBackup.data.accounts?.length || 0}</span>
                           <span className="text-[10px] text-slate-400 uppercase">Contas</span>
                        </div>
                        <div className="bg-white/5 p-2 rounded border border-white/5">
                           <span className="block text-lg font-bold text-white">{previewBackup.data.creditCards?.length || 0}</span>
                           <span className="text-[10px] text-slate-400 uppercase">Cartões</span>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <div className="flex-1">
                           <GlassButton onClick={handleMerge} className="w-full bg-blue-600 hover:bg-blue-700">Mesclar</GlassButton>
                           <p className="text-[10px] text-slate-500 text-center mt-1">Mantém atuais, adiciona novos.</p>
                        </div>
                        <div className="flex-1">
                           <GlassButton onClick={handleReplace} variant="danger" className="w-full">Substituir</GlassButton>
                           <p className="text-[10px] text-slate-500 text-center mt-1">Apaga tudo e restaura.</p>
                        </div>
                    </div>
                 </div>
              )}
           </div>
        </ModalBody>
      </ModalShell>

      {/* CLEAR CONFIRM MODAL */}
      <ModalShell isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} title="Apagar Tudo?">
         <ModalBody>
            <div className="text-center space-y-3">
               <div className="bg-red-500/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <Trash2 size={32} className="text-red-500" />
               </div>
               <div>
                  <p className="text-lg text-slate-200 font-medium">Esta ação é irreversível.</p>
                  <p className="text-sm text-slate-400 mt-2">
                     Todos as transações, contas, orçamentos e investimentos serão apagados deste navegador permanentemente.
                  </p>
               </div>
            </div>
         </ModalBody>
         <ModalFooter>
            <GlassButton type="button" variant="ghost" onClick={() => setIsClearModalOpen(false)}>Cancelar</GlassButton>
            <GlassButton type="button" variant="danger" onClick={handleClearAllData}>Sim, Apagar Tudo</GlassButton>
         </ModalFooter>
      </ModalShell>

    </PageShell>
  );
};
