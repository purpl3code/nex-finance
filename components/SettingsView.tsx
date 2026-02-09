import React, { useRef, useState, useEffect } from 'react';
import { BackupService } from '../services/backupService';
import { StorageService } from '../services/storageService';
import { DataHealthService } from '../services/dataHealthService';
import { BackupFile, DataHealthReport, FixLogEntry } from '../types';
import { useFinance } from '../hooks/useFinance';
import { useUserProfile } from '../hooks/useUserProfile';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Avatar } from './ui/Avatar';
import { 
  Download, Upload, HardDrive, AlertTriangle, FileText, 
  Trash2, Database, Server, RefreshCw, ShieldAlert, History,
  Activity, CheckCircle, Stethoscope, ChevronDown, ChevronUp, User, Camera
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  // We use the hook to get live stats
  const { 
    transactions, accounts, creditCards, recurringRules, 
    investmentAccounts, assets, investmentMovements 
  } = useFinance();

  const { profile, updateName, updateAvatar, removeAvatar } = useUserProfile();

  const [lastBackup, setLastBackup] = useState<string | null>(null);
  
  // Profile State
  const [profileName, setProfileName] = useState(profile.displayName);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewBackup, setPreviewBackup] = useState<BackupFile | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importWarning, setImportWarning] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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
     // Simulate loading for UX
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
        // Reload happens inside service
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
    <div className="space-y-8 animate-in fade-in max-w-3xl mx-auto pb-10">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <HardDrive className="text-blue-500" />
          Configurações
        </h1>
        <p className="text-slate-400 mt-1">Gerencie seus dados, backups e preferências do sistema.</p>
      </div>

      {/* 0. USER PROFILE (NEW) */}
      <SectionCard 
        title="Meu Perfil" 
        description="Personalize seu nome e foto de exibição."
        icon={<User size={24} />}
      >
        <div className="flex flex-col md:flex-row gap-8 items-start">
           <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                 <Avatar src={profile.avatarDataUrl} name={profile.displayName} size="xl" />
                 <button 
                   onClick={() => avatarInputRef.current?.click()}
                   className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
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
                 <label className="block text-sm text-slate-300 mb-1">Nome de Exibição</label>
                 <input 
                    type="text" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:border-blue-500 outline-none" 
                    value={profileName} 
                    onChange={e => setProfileName(e.target.value)} 
                    maxLength={30}
                    placeholder="Seu nome"
                 />
              </div>
              <div className="pt-2">
                 <Button type="submit">Salvar Alterações</Button>
              </div>
           </form>
        </div>
      </SectionCard>

      {/* 1. DATA HEALTH */}
      <SectionCard
        title="Saúde dos Dados"
        description="Verifique inconsistências e corrija referências quebradas."
        icon={<Stethoscope size={24} />}
      >
        <div className="space-y-6">
           {/* Status Bar */}
           {!healthReport ? (
              <div className="text-center py-6 bg-slate-900/30 rounded-lg border border-slate-700 border-dashed">
                 <Activity size={40} className="mx-auto text-slate-600 mb-3" />
                 <p className="text-slate-400 mb-4">Execute uma verificação para detectar itens órfãos ou quebrados.</p>
                 <Button onClick={runHealthScan} disabled={isScanning} icon={isScanning ? <RefreshCw className="animate-spin" size={16}/> : <Activity size={16}/>}>
                    {isScanning ? 'Verificando...' : 'Executar Verificação'}
                 </Button>
              </div>
           ) : (
              <div className="space-y-4">
                 <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                    <div className={`p-3 rounded-full ${healthReport.summary.errorCount > 0 ? 'bg-red-500/20 text-red-400' : healthReport.summary.warningCount > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                       {healthReport.summary.errorCount > 0 || healthReport.summary.warningCount > 0 ? <AlertTriangle size={24}/> : <CheckCircle size={24}/>}
                    </div>
                    <div className="flex-1">
                       <h4 className="font-semibold text-white">
                          {healthReport.summary.errorCount === 0 && healthReport.summary.warningCount === 0 
                             ? 'Tudo certo com seus dados!' 
                             : 'Problemas encontrados'}
                       </h4>
                       <p className="text-xs text-slate-400">
                          {healthReport.summary.errorCount} erros críticos • {healthReport.summary.warningCount} avisos
                       </p>
                    </div>
                    <div className="flex gap-2">
                       <Button size="sm" variant="secondary" onClick={runHealthScan} disabled={isScanning}>Re-escanear</Button>
                       {healthReport.issues.some(i => i.canAutoFix) && (
                          <Button size="sm" onClick={runAutoFix} className="bg-emerald-600 hover:bg-emerald-700 text-white">Corrigir Automático</Button>
                       )}
                       {healthReport.issues.some(i => !i.canAutoFix) && (
                          <Button size="sm" variant="ghost" onClick={exportOrphans} icon={<Download size={14}/>}>Exportar Órfãos</Button>
                       )}
                    </div>
                 </div>

                 {/* Issues List */}
                 {healthReport.issues.length > 0 && (
                    <div className="space-y-2">
                       {healthReport.issues.map(issue => (
                          <div key={issue.id} className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800">
                             <button 
                                onClick={() => setExpandedIssue(expandedIssue === issue.id ? null : issue.id)}
                                className="w-full flex justify-between items-center p-3 hover:bg-slate-700/50 transition-colors"
                             >
                                <div className="flex items-center gap-3">
                                   <div className={`w-2 h-2 rounded-full ${issue.severity === 'error' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                   <span className="text-sm font-medium text-slate-200">{issue.title}</span>
                                   <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{issue.affectedCount} itens</span>
                                </div>
                                {expandedIssue === issue.id ? <ChevronUp size={16} className="text-slate-500"/> : <ChevronDown size={16} className="text-slate-500"/>}
                             </button>
                             
                             {expandedIssue === issue.id && (
                                <div className="p-3 bg-slate-900/30 border-t border-slate-700 text-sm">
                                   <p className="text-slate-400 mb-2">{issue.description}</p>
                                   <div className="space-y-1 mb-2">
                                      {issue.examples.map(ex => (
                                         <div key={ex.id} className="flex justify-between text-xs text-slate-500 bg-slate-900/50 p-1.5 rounded">
                                            <span>{ex.label}</span>
                                            <span>{ex.info}</span>
                                         </div>
                                      ))}
                                   </div>
                                   <div className="text-xs font-medium mt-2">
                                      {issue.canAutoFix ? (
                                         <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={12}/> Correção Segura Disponível</span>
                                      ) : (
                                         <span className="text-amber-400 flex items-center gap-1"><AlertTriangle size={12}/> Requer Revisão Manual (Exporte a lista)</span>
                                      )}
                                   </div>
                                </div>
                             )}
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           )}

           {/* Log History */}
           {fixLogs.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-700/50">
                 <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2"><History size={14}/> Histórico de Correções</h4>
                    <button onClick={() => { DataHealthService.clearLogs(); setFixLogs([]); }} className="text-xs text-red-400 hover:text-red-300">Limpar Histórico</button>
                 </div>
                 <div className="bg-slate-900 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                    {fixLogs.map(log => (
                       <div key={log.id} className="text-xs flex justify-between items-center border-b border-slate-800 last:border-0 pb-2 last:pb-0">
                          <div>
                             <p className="text-slate-300 font-medium">{log.action}</p>
                             <p className="text-slate-500">{log.details}</p>
                          </div>
                          <span className="text-slate-600 ml-2 whitespace-nowrap">{new Date(log.dateISO).toLocaleDateString()}</span>
                       </div>
                    ))}
                 </div>
              </div>
           )}
        </div>
      </SectionCard>

      {/* 2. BACKUP & RESTORE */}
      <SectionCard 
        title="Backup e Restauração" 
        description="Mantenha seus dados seguros exportando regularmente."
        icon={<Download size={24} />}
      >
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
           <div className="flex items-center gap-3 text-sm text-slate-400 bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-700/50 w-full md:w-auto">
              <History size={16} />
              {lastBackup ? (
                <span>Último export: <span className="text-slate-200 font-medium">{new Date(lastBackup).toLocaleDateString()} às {new Date(lastBackup).toLocaleTimeString().slice(0,5)}</span></span>
              ) : (
                <span>Nenhum backup exportado ainda.</span>
              )}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <Button onClick={handleExport} className="w-full flex items-center justify-center gap-2 h-12">
              <Download size={18} /> Exportar Dados (.json)
           </Button>
           
           <div className="relative">
             <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json"
                onChange={handleFileSelect}
             />
             <Button 
                onClick={() => fileInputRef.current?.click()} 
                variant="secondary" 
                className="w-full flex items-center justify-center gap-2 h-12"
             >
                <Upload size={18} /> Importar Backup
             </Button>
           </div>
        </div>
      </SectionCard>

      {/* 3. APP DATA STATS */}
      <SectionCard 
        title="Dados do Aplicativo" 
        description="Resumo dos registros armazenados no seu navegador."
        icon={<Database size={24} />}
      >
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 p-3 rounded-lg text-center border border-slate-700/50">
               <p className="text-2xl font-bold text-white">{transactions.length}</p>
               <p className="text-xs text-slate-500 uppercase font-medium">Transações</p>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg text-center border border-slate-700/50">
               <p className="text-2xl font-bold text-white">{accounts.length}</p>
               <p className="text-xs text-slate-500 uppercase font-medium">Contas</p>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg text-center border border-slate-700/50">
               <p className="text-2xl font-bold text-white">{creditCards.length}</p>
               <p className="text-xs text-slate-500 uppercase font-medium">Cartões</p>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg text-center border border-slate-700/50">
               <p className="text-2xl font-bold text-white">{recurringRules.length}</p>
               <p className="text-xs text-slate-500 uppercase font-medium">Recorrências</p>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg text-center border border-slate-700/50">
               <p className="text-2xl font-bold text-white">{investmentAccounts.length}</p>
               <p className="text-xs text-slate-500 uppercase font-medium">Inv. Contas</p>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg text-center border border-slate-700/50">
               <p className="text-2xl font-bold text-white">{assets.length}</p>
               <p className="text-xs text-slate-500 uppercase font-medium">Inv. Ativos</p>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg text-center border border-slate-700/50">
               <p className="text-2xl font-bold text-white">{investmentMovements.length}</p>
               <p className="text-xs text-slate-500 uppercase font-medium">Inv. Movs</p>
            </div>
         </div>
         <div className="mt-4 flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => window.location.reload()} icon={<RefreshCw size={14}/>}>Recalcular Dados</Button>
         </div>
      </SectionCard>

      {/* 4. SYSTEM INFO */}
      <SectionCard 
        title="Sistema" 
        icon={<Server size={24} />}
      >
         <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
               <span className="text-slate-400 text-sm">Versão do Schema (Banco de Dados)</span>
               <span className="text-slate-200 font-mono text-sm bg-slate-900 px-2 py-1 rounded">v{StorageService.load().version}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
               <span className="text-slate-400 text-sm">Armazenamento</span>
               <span className="text-emerald-400 text-sm font-medium flex items-center gap-1"><HardDrive size={14}/> LocalStorage (Browser)</span>
            </div>
            <div className="flex justify-between items-center py-2">
               <span className="text-slate-400 text-sm">Status</span>
               <span className="text-emerald-400 text-sm font-medium">Online (Offline-first)</span>
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
            <Button variant="danger" onClick={() => setIsClearModalOpen(true)}>
               Apagar Tudo
            </Button>
         </div>
      </SectionCard>

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

    </div>
  );
};
