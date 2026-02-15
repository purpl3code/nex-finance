
import React, { useRef, useState, useEffect } from 'react';
import { BackupService } from '../services/backupService';
import { StorageService } from '../services/storageService';
import { DataHealthService } from '../services/dataHealthService';
import { ThemeService, AppTheme } from '../services/themeService';
import { SyncService } from '../services/syncService';
import { supabase, isDemoMode, disableDemoMode } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { BackupFile, DataHealthReport, FixLogEntry } from '../types';
import { useFinance } from '../hooks/useFinance';
import { useUserProfile } from '../hooks/useUserProfile';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Avatar } from './ui/Avatar';
import { PageShell } from './ui/PageShell';
import { PageHeader } from './ui/PageHeader';
import { ThemeSelector } from './ThemeSelector';
import { CategoryManager } from './CategoryManager';
import { 
  Download, Upload, HardDrive, AlertTriangle, FileText, 
  Trash2, Database, Server, RefreshCw, ShieldAlert, History,
  Activity, CheckCircle, Stethoscope, ChevronDown, ChevronUp, User, Camera, Palette, Cloud, LogOut, Tag
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { session } = useAuth();
  const { 
    transactions, accounts, creditCards, recurringRules, 
    investmentAccounts, assets, investmentMovements,
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

  // Data Health State
  const [healthReport, setHealthReport] = useState<DataHealthReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [fixLogs, setFixLogs] = useState<FixLogEntry[]>([]);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);

  useEffect(() => {
    const dateStr = BackupService.getLastBackupDate();
    setLastBackup(dateStr);
    setFixLogs(DataHealthService.getFixLogs());
    setProfileName(profile.displayName);
    setCurrentTheme(ThemeService.getTheme());
  }, [profile.displayName]);

  // Profile Handlers
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (profileName.trim()) {
      updateName(profileName.trim());
      alert('Perfil atualizado com sucesso!');
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
        window.location.reload();
      } else {
        await supabase.auth.signOut();
        window.location.reload();
      }
    }
  };

  // Sync Handlers
  const handlePushToCloud = async () => {
    if (isDemo) {
       alert("Sincronização na nuvem indisponível no Modo Demo.");
       return;
    }
    if(!session) return;
    setIsSyncing(true);
    const data = SyncService.getLocalData();
    await SyncService.pushToCloud(data, session.user.id);
    setIsSyncing(false);
    alert('Dados enviados para a nuvem com sucesso!');
  };

  const handlePullFromCloud = async () => {
    if (isDemo) {
       alert("Sincronização na nuvem indisponível no Modo Demo.");
       return;
    }
    if(!session) return;
    if(!confirm('Isso irá substituir os dados atuais do dispositivo pelos dados da nuvem. Continuar?')) return;
    
    setIsSyncing(true);
    const updated = await SyncService.initialize();
    setIsSyncing(false);
    
    if(updated) {
      alert('Dados baixados com sucesso! A página será recarregada.');
      window.location.reload();
    } else {
      alert('Nenhum dado encontrado na nuvem ou erro ao baixar.');
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

  // --- HEALTH ACTIONS ---
  const runHealthScan = () => {
     setIsScanning(true);
     setTimeout(() => {
        const fullData = StorageService.load();
        const report = DataHealthService.scan(fullData);
        setHealthReport(report);
        setIsScanning(false);
     }, 600);
  };

  const runAutoFix = () => {
     if (!healthReport) return;
     const fixableIssues = healthReport.issues.filter(i => i.canAutoFix);
     if (fixableIssues.length === 0) return;

     if (confirm(`Isso aplicará correções automáticas para ${fixableIssues.length} tipos de problemas. Deseja continuar?`)) {
        const fullData = StorageService.load();
        DataHealthService.applySafeFixes(fullData, healthReport);
     }
  };

  const exportOrphans = () => {
     if (!healthReport) return;
     const fullData = StorageService.load();
     DataHealthService.exportOrphans(healthReport, fullData);
  };

  const SectionCard = ({ title, description, icon, children, danger = false }: any) => (
    <div className={`bg-slate-800 rounded-xl border ${danger ? 'border-red-900/30' : 'border-slate-700'} overflow-hidden shadow-sm`}>
      <div className={`p-6 border-b ${danger ? 'border-red-900/30 bg-red-900/5' : 'border-slate-700/50 bg-slate-800'}`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${danger ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
            {icon}
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${danger ? 'text-red-400' : 'text-slate-200'}`}>{title}</h3>
            {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
          </div>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );

  return (
    <PageShell className="max-w-4xl">
      <PageHeader 
        title="Configurações" 
        subtitle="Gerencie seus dados, backups e preferências do sistema."
        actions={
          <Button variant="secondary" onClick={handleLogout} icon={<LogOut size={16} />}>Sair</Button>
        }
      />

      {/* ... [Rest of the file remains unchanged until CategoryManager Modal] ... */}
      
      {/* 5. DANGER ZONE (Kept for context location, no changes inside) */}
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
            <Button variant="danger" onClick={() => setIsClearModalOpen(true)}>
               Apagar Tudo
            </Button>
         </div>
      </SectionCard>

      {/* CATEGORY MANAGER MODAL */}
      <Modal 
        isOpen={isCatManagerOpen} 
        onClose={() => setIsCatManagerOpen(false)} 
        title="Gerenciar Categorias"
        className="w-[min(920px,92vw)]" // Added custom wide width
      >
         <CategoryManager 
            categories={categories}
            transactions={transactions}
            creditCardTransactions={creditCardTransactions}
            onAdd={addCategory}
            onEdit={editCategory}
            onArchive={archiveCategory}
            onReassign={reassignCategory}
         />
      </Modal>

      {/* ... [Rest of modals] ... */}
      
      {/* IMPORT PREVIEW MODAL */}
      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Restaurar Backup">
        <div className="space-y-4">
           {importError ? (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex items-center gap-3 text-red-400">
                 <AlertTriangle size={20} />
                 <p>{importError}</p>
              </div>
           ) : previewBackup && (
              <div className="space-y-4">
                 <div className="bg-slate-900/50 p-4 border rounded-lg border-slate-700">
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
                     <div className="bg-slate-700/30 p-2 rounded">
                        <span className="block text-lg font-bold text-white">{previewBackup.data.transactions?.length || 0}</span>
                        <span className="text-[10px] text-slate-400 uppercase">Transações</span>
                     </div>
                     <div className="bg-slate-700/30 p-2 rounded">
                        <span className="block text-lg font-bold text-white">{previewBackup.data.accounts?.length || 0}</span>
                        <span className="text-[10px] text-slate-400 uppercase">Contas</span>
                     </div>
                     <div className="bg-slate-700/30 p-2 rounded">
                        <span className="block text-lg font-bold text-white">{previewBackup.data.creditCards?.length || 0}</span>
                        <span className="text-[10px] text-slate-400 uppercase">Cartões</span>
                     </div>
                 </div>

                 <div className="pt-4 flex gap-3">
                     <div className="flex-1">
                        <Button onClick={handleMerge} className="w-full bg-blue-600 hover:bg-blue-700">Mesclar</Button>
                        <p className="text-[10px] text-slate-500 text-center mt-1">Mantém atuais, adiciona novos.</p>
                     </div>
                     <div className="flex-1">
                        <Button onClick={handleReplace} className="w-full bg-red-600 hover:bg-red-700">Substituir</Button>
                        <p className="text-[10px] text-slate-500 text-center mt-1">Apaga tudo e restaura.</p>
                     </div>
                 </div>
              </div>
           )}
        </div>
      </Modal>

      {/* CLEAR CONFIRM MODAL */}
      <Modal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} title="Apagar Tudo?">
         <div className="text-center space-y-4">
            <div className="bg-red-500/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-2">
               <Trash2 size={32} className="text-red-500" />
            </div>
            <div>
               <p className="text-lg text-slate-200 font-medium">Esta ação é irreversível.</p>
               <p className="text-sm text-slate-400 mt-2">
                  Todos as transações, contas, orçamentos e investimentos serão apagados deste navegador permanentemente.
               </p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
               <Button type="button" variant="ghost" onClick={() => setIsClearModalOpen(false)}>Cancelar</Button>
               <Button type="button" variant="danger" onClick={handleClearAllData}>Sim, Apagar Tudo</Button>
            </div>
         </div>
      </Modal>

    </PageShell>
  );
};
