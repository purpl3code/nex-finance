
import React, { lazy, Suspense, useState, useMemo, useEffect } from 'react';
import { useFinance } from './hooks/useFinance';
import { useAuth } from './hooks/useAuth';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { format } from 'date-fns';
import { Dashboard } from './components/Dashboard';
import { DashboardGroup, DashboardLayoutMenu, DashboardLayoutMode, DashboardSection } from './components/DashboardLayoutMenu';
import { UpdateNotificationMenu } from './components/UpdateNotificationMenu';
import { TransactionList } from './components/TransactionList';
import { TransactionForm } from './components/TransactionForm';
import { AccountList } from './components/AccountList';
import { Sidebar } from './components/Sidebar';
import { ModalShell } from './components/ui/ModalShell';
import { GlassButton } from './components/ui/GlassButton';
import { GlassSelect } from './components/ui/GlassSelect';
import { PageShell } from './components/ui/PageShell';
import { PageHeader } from './components/ui/PageHeader';
import { ThemeService } from './services/themeService';
import { FilterState } from './types';
import { Plus, Search, Menu, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, Wallet, Download } from 'lucide-react';
import { LoginScreen } from './components/auth/LoginScreen';
import { MobileFab } from './components/ui/MobileFab';
import { Toaster } from 'sonner';
import { exportTransactionsToCSV } from './utils/csvExport';
import { useUserProfile } from './hooks/useUserProfile';
import { UpdateService, AppUpdate, UpdateDownloadProgress } from './services/updateService';
import { APP_VERSION } from './constants';
const CreditCardManager = lazy(() => import('./components/CreditCardManager').then((module) => ({ default: module.CreditCardManager })));
const RecurringManager = lazy(() => import('./components/RecurringManager').then((module) => ({ default: module.RecurringManager })));
const ForecastView = lazy(() => import('./components/ForecastView').then((module) => ({ default: module.ForecastView })));
const BudgetManager = lazy(() => import('./components/BudgetManager').then((module) => ({ default: module.BudgetManager })));
const SettingsView = lazy(() => import('./components/SettingsView').then((module) => ({ default: module.SettingsView })));
const GoalManager = lazy(() => import('./components/GoalManager').then((module) => ({ default: module.GoalManager })));
const DebtManager = lazy(() => import('./components/DebtManager').then((module) => ({ default: module.DebtManager })));
const ReportView = lazy(() => import('./components/ReportView').then((module) => ({ default: module.ReportView })));

// Define valid tabs for type safety
type AppTab = 'dashboard' | 'list' | 'accounts' | 'cards' | 'recurring' | 'forecast' | 'budgets' | 'settings' | 'goals' | 'reports' | 'debts';

const VALID_TABS: AppTab[] = [
  'dashboard', 'list', 'accounts', 'cards', 'recurring', 'forecast', 'budgets', 'settings', 'goals', 'reports', 'debts'
];

const App: React.FC = () => {
  const [dashboardLayoutMode, setDashboardLayoutMode] = useState<DashboardLayoutMode>(() => {
    try { return localStorage.getItem('nex-dashboard-layout-mode') === 'custom' ? 'custom' : 'default'; } catch { return 'default'; }
  });
  const [dashboardSections, setDashboardSections] = useState<DashboardSection[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('nex-dashboard-layout-sections') || 'null');
      const valid: DashboardSection[] = ['monthlyBalance', 'availableBalance', 'balanceChart', 'insights', 'categorySpending', 'creditCards', 'recentActivity'];
      if (!Array.isArray(saved) || saved.some(item => ['overview', 'activity'].includes(item))) return valid;
      const selected = saved.filter((item): item is DashboardSection => valid.includes(item));
      return selected.length ? selected : valid;
    } catch { return ['monthlyBalance', 'availableBalance', 'balanceChart', 'insights', 'categorySpending', 'creditCards', 'recentActivity']; }
  });
  const [dashboardGroupOrder, setDashboardGroupOrder] = useState<DashboardGroup[]>(() => {
    const valid: DashboardGroup[] = ['overview', 'charts', 'details'];
    try {
      const saved = JSON.parse(localStorage.getItem('nex-dashboard-layout-order') || 'null');
      if (!Array.isArray(saved)) return valid;
      const order = saved.filter((item): item is DashboardGroup => valid.includes(item));
      return valid.every(group => order.includes(group)) ? order : valid;
    } catch { return valid; }
  });
  const [dashboardWidgetOrder, setDashboardWidgetOrder] = useState<DashboardSection[]>(() => {
    const valid: DashboardSection[] = ['monthlyBalance', 'availableBalance', 'balanceChart', 'insights', 'categorySpending', 'creditCards', 'recentActivity'];
    try {
      const saved = JSON.parse(localStorage.getItem('nex-dashboard-widget-order') || 'null');
      if (!Array.isArray(saved)) return valid;
      const order = saved.filter((item): item is DashboardSection => valid.includes(item));
      return valid.every(section => order.includes(section)) ? order : valid;
    } catch { return valid; }
  });

  const updateDashboardMode = (mode: DashboardLayoutMode) => {
    setDashboardLayoutMode(mode);
    try { localStorage.setItem('nex-dashboard-layout-mode', mode); } catch { /* Storage may be unavailable. */ }
  };
  const updateDashboardSections = (sections: DashboardSection[]) => {
    setDashboardSections(sections);
    try { localStorage.setItem('nex-dashboard-layout-sections', JSON.stringify(sections)); } catch { /* Storage may be unavailable. */ }
  };
  const updateDashboardGroupOrder = (groups: DashboardGroup[]) => {
    setDashboardGroupOrder(groups);
    try { localStorage.setItem('nex-dashboard-layout-order', JSON.stringify(groups)); } catch { /* Storage may be unavailable. */ }
  };
  const updateDashboardWidgetOrder = (sections: DashboardSection[]) => {
    setDashboardWidgetOrder(sections);
    try { localStorage.setItem('nex-dashboard-widget-order', JSON.stringify(sections)); } catch { /* Storage may be unavailable. */ }
  };

  const { session, loading: authLoading } = useAuth();
  const { profile } = useUserProfile();

  const { 
    transactions, // Added to props
    categories, 
    accounts,
    creditCards,
    creditCardTransactions, // Added to props
    transfers,
    recurringRules,
    budgets,
    goals,
    investmentAccounts,
    getInvestmentAccountBalance,
    addTransaction, 
    editTransaction, 
    deleteTransaction, 
    addTransfer,
    editTransfer,
    deleteTransfer,
    addAccount,
    editAccount,
    deleteAccount,
    addCreditCard,
    editCreditCard,
    deleteCreditCard,
    addCreditCardTransaction,
    editCreditCardTransaction,
    deleteCreditCardTransaction,
    addCreditCardRefund,
    payInvoice,
    anticipatePayment,
    addRecurringRule,
    editRecurringRule,
    deleteRecurringRule,
    toggleRecurringRule,
    addBudget,
    editBudget,
    deleteBudget,
    getCategorySpending,
    getRecurringPreview,
    commitRecurringTransactions,
    getAccountBalance,
    getTotalBalance,
    getCardInvoiceInfo,
    getCardTotalUsedLimit,
    getCreditCardStats,
    getUnifiedList, 
    getStats,
    getChartData,
    getForecast,
    addGoal,
    editGoal,
    toggleArchiveGoal,
    addValueToGoal,
    deleteGoal,
    // Debts
    debts,
    addDebt,
    editDebt,
    payDebt,
    settleDebt,
    deleteDebt,
    getTotalActiveDebts,
    loading: dataLoading
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(undefined);
  
  // --- NAVIGATION & ROUTING LOGIC ---
  const getTabFromHash = (): AppTab => {
    if (typeof window === 'undefined') return 'dashboard';
    const hash = window.location.hash.replace('#', '');
    return VALID_TABS.includes(hash as AppTab) ? (hash as AppTab) : 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState<AppTab>(getTabFromHash());
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [update, setUpdate] = useState<AppUpdate | null>(null);
  const [isInstallingUpdate, setIsInstallingUpdate] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [updateStatusIsError, setUpdateStatusIsError] = useState(false);

  // Check for updates
  useEffect(() => {
    // Only check after a slight delay to let the app load smoothly
    const timer = setTimeout(() => {
      UpdateService.checkForUpdates().then(setUpdate);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const newTab = getTabFromHash();
      setActiveTabState(newTab);
      if (newTab !== 'cards') {
        setSelectedCardId(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Initialize Theme
  useEffect(() => {
    ThemeService.initialize();
  }, []);

  const setActiveTab = (tab: AppTab) => {
    window.location.hash = tab;
    setActiveTabState(tab);
    if (tab !== 'cards') {
      setSelectedCardId(null);
    }
    setTimeout(() => {
      const scrollContainer = document.getElementById('main-scroll-container');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  const handleCardClick = (cardId: string) => {
    setSelectedCardId(cardId);
    setActiveTab('cards');
  };

  const currentDate = new Date();
  const [filters, setFilters] = useState<FilterState>({
    month: currentDate.getMonth(),
    year: currentDate.getFullYear(),
    type: 'all',
    search: '',
    categoryId: 'all',
    accountId: 'all'
  });

  const unifiedList = useMemo(() => 
    getUnifiedList(filters), 
    [getUnifiedList, filters]
  );

  const stats = useMemo(() => {
    return getStats(unifiedList);
  }, [getStats, unifiedList]);

  // chartData from hook is now deprecated/empty as Dashboard builds it via selector
  const chartData = useMemo(() => 
    getChartData(),
    [getChartData]
  );

  const totalBalance = getTotalBalance();
  const creditCardStats = getCreditCardStats();

  const handleOpenModal = (item?: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingItem(undefined);
    setIsModalOpen(false);
  };

  const handleSubmitForm = (data: any) => {
    if (editingItem && editingItem.id) {
      if (data.isTransfer) {
        editTransfer(editingItem.id, data);
      } else if (data.isCreditCard || ('cardId' in editingItem)) {
        editCreditCardTransaction(editingItem.id, {
          cardId: data.accountId,
          amount: data.amount,
          date: data.date,
          categoryId: data.categoryId,
          description: data.description,
        });
      } else {
        editTransaction(editingItem.id, data);
      }
    } else {
      if (data.isTransfer) {
        addTransfer(data);
      } else if (data.isCreditCard) {
        addCreditCardTransaction({
          cardId: data.accountId,
          amount: data.amount,
          date: data.date,
          categoryId: data.categoryId,
          description: data.description,
        }, data.installments || 1);
      } else {
        addTransaction(data);
      }
    }
    handleCloseModal();
  };

  const handleDuplicate = (item: any) => {
    // Copy all fields but strip identifying info so a new transaction is created
    const { id, createdAt, generatedByRuleId, generatedKey, linkedInvoiceId, ...rest } = item;
    const duplicated = {
      ...rest,
      date: format(new Date(), 'yyyy-MM-dd'), // Reset date to today (local date)
      description: rest.description ? `${rest.description} (cópia)` : '(cópia)',
    };
    handleOpenModal(duplicated);
  };

  const handleExportCSV = () => {
    exportTransactionsToCSV(unifiedList, categories, accounts);
  };

  const handleDeleteItem = (id: string, isTransfer: boolean) => {
    if (isTransfer) {
      deleteTransfer(id);
    } else {
      deleteTransaction(id);
    }
  };

  const handleInstallUpdate = async () => {
    if (!update || isInstallingUpdate) return;

    setIsInstallingUpdate(true);
    setUpdateProgress(0);
    setUpdateStatus(null);
    setUpdateStatusIsError(false);

    try {
      const result = await UpdateService.installUpdate(update, (progress: UpdateDownloadProgress) => {
        setUpdateProgress(progress.totalBytes > 0 ? progress.progress : -1);
        setUpdateStatus('Baixando a atualização com segurança…');
      });

      if (result.status === 'permission_required') {
        setUpdateStatus('Permita que o Nex Finance instale apps nas configurações do Android e toque em “Tentar novamente”.');
      } else if (result.status === 'installer_opened') {
        setUpdateStatus('O instalador do Android foi aberto. Confirme a instalação para concluir a atualização.');
      } else {
        setUpdate(null);
      }
    } catch (error) {
      console.error('Erro ao instalar atualização:', error);
      setUpdateStatus(error instanceof Error ? error.message : 'Não foi possível baixar a atualização. Tente novamente.');
      setUpdateStatusIsError(true);
    } finally {
      setIsInstallingUpdate(false);
    }
  };

  // --- KEYBOARD SHORTCUTS ---
  useKeyboardShortcuts({
    onNewTransaction: () => handleOpenModal(),
    onNavigate: setActiveTab,
    onCloseModal: handleCloseModal,
    isModalOpen,
  });

  // --- AUTH LOADING STATE ---
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center" style={{ backgroundImage: 'var(--gradient-bg)', backgroundAttachment: 'fixed' }}>
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl animate-glow-pulse" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-2xl shadow-blue-500/30 relative z-10">
              <Wallet size={32} className="text-white" strokeWidth={2} />
            </div>
            <div className="absolute -inset-2 rounded-3xl border border-blue-500/20 animate-ping opacity-30" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-300">Nex Finance</p>
            <p className="text-xs text-slate-500 mt-0.5">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  // --- SHOW LOGIN SCREEN IF NOT AUTHENTICATED ---
  if (!session) {
    return <LoginScreen />;
  }

  // --- DATA LOADING STATE ---
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center" style={{ backgroundImage: 'var(--gradient-bg)', backgroundAttachment: 'fixed' }}>
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl animate-glow-pulse" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-2xl shadow-blue-500/30 relative z-10">
              <Wallet size={32} className="text-white" strokeWidth={2} />
            </div>
            <div className="absolute -inset-2 rounded-3xl border border-blue-500/20 animate-ping opacity-30" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-300">Nex Finance</p>
            <p className="text-xs text-slate-500 mt-0.5">Sincronizando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const getPageTitle = () => {
     switch(activeTab) {
        case 'dashboard': return 'Dashboard';
        case 'list': return 'Extrato';
        case 'accounts': return 'Minhas Contas';
        case 'cards': return 'Cartões de Crédito';
        case 'recurring': return 'Recorrências';
        case 'forecast': return 'Previsão Financeira';
        case 'budgets': return 'Orçamentos';
        case 'settings': return 'Configurações';
        case 'goals': return 'Metas';
        case 'debts': return 'Dívidas';
        case 'reports': return 'Relatórios';
        default: return 'Nex Finance';
     }
  };

  // --- COMMON CONTROLS ---
  const MonthSelector = () => (
    <div className="w-32">
      <GlassSelect 
        value={filters.month}
        onChange={(e) => setFilters(prev => ({ ...prev, month: parseInt(e.target.value) }))}
        options={months.map((m, i) => ({ value: i, label: m }))}
      />
    </div>
  );

  const YearSelector = () => (
    <div className="w-24">
      <GlassSelect 
        value={filters.year}
        onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value) }))}
        options={Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(y => ({ value: y, label: y.toString() }))}
      />
    </div>
  );

  return (
    <div className="flex h-screen bg-transparent text-slate-100 font-sans overflow-hidden">
      <Toaster theme="dark" position="bottom-right" />
      
      {/* SIDEBAR */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="md:hidden flex items-center justify-between py-3 px-4 glass-lg border-b border-white/8 z-20 relative overflow-visible">
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsMobileSidebarOpen(true)} 
               className="p-2 -ml-1 text-slate-400 hover:text-white hover:bg-white/8 rounded-xl transition-all duration-200"
             >
               <Menu size={22} />
             </button>
             <h1 className="font-bold text-sm tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">{getPageTitle()}</h1>
          </div>
          {activeTab === 'dashboard' && (
            <div className="flex items-center gap-2">
              <DashboardLayoutMenu mode={dashboardLayoutMode} visibleSections={dashboardSections} groupOrder={dashboardGroupOrder} widgetOrder={dashboardWidgetOrder} onModeChange={updateDashboardMode} onSectionsChange={updateDashboardSections} onGroupOrderChange={updateDashboardGroupOrder} onWidgetOrderChange={updateDashboardWidgetOrder} className="shrink-0" />
              <UpdateNotificationMenu update={update} currentVersion={APP_VERSION} isInstalling={isInstallingUpdate} progress={updateProgress} status={updateStatus} statusIsError={updateStatusIsError} onInstall={handleInstallUpdate} className="shrink-0" />
            </div>
          )}
        </header>

        {/* Scrollable Content */}
        <div id="main-scroll-container" className="flex-1 overflow-y-auto bg-transparent">
           <Suspense fallback={<div className="p-8 text-center text-slate-400">Carregando tela...</div>}>
           <div className="animate-in fade-in duration-300 min-h-full">
              
              {/* DASHBOARD TAB */}
              {activeTab === 'dashboard' && (
                <PageShell>
                  <PageHeader 
                    title={(() => { const h = new Date().getHours(); const g = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; return profile.displayName && profile.displayName !== 'Usuário' ? `${g}, ${profile.displayName.split(' ')[0]}` : g; })()}
                    subtitle="Visão geral das suas finanças neste mês."
                    actions={
                      <>
                        <DashboardLayoutMenu
                          mode={dashboardLayoutMode}
                          visibleSections={dashboardSections}
                          groupOrder={dashboardGroupOrder}
                          widgetOrder={dashboardWidgetOrder}
                          onModeChange={updateDashboardMode}
                          onSectionsChange={updateDashboardSections}
                          onGroupOrderChange={updateDashboardGroupOrder}
                          onWidgetOrderChange={updateDashboardWidgetOrder}
                          className="hidden md:block"
                        />
                        <UpdateNotificationMenu
                          update={update}
                          currentVersion={APP_VERSION}
                          isInstalling={isInstallingUpdate}
                          progress={updateProgress}
                          status={updateStatus}
                          statusIsError={updateStatusIsError}
                          onInstall={handleInstallUpdate}
                          className="hidden md:block"
                        />
                        <GlassButton onClick={() => handleOpenModal()} icon={<Plus size={18} />} className="hidden md:flex">
                          Nova Movimentação
                        </GlassButton>
                      </>
                    }
                    controls={
                      <>
                        <MonthSelector />
                        <YearSelector />
                      </>
                    }
                  />
                  <Dashboard 
                    stats={stats} 
                    chartData={chartData} 
                    currentMonthName={months[filters.month]}
                    totalBalance={totalBalance}
                    accounts={accounts}
                    getAccountBalance={getAccountBalance}
                    creditCardStats={creditCardStats}
                    totalDebts={getTotalActiveDebts()}
                    budgets={budgets}
                    getCategorySpending={getCategorySpending}
                    onNavigateToBudgets={() => setActiveTab('budgets')}
                    
                    // --- NEW PROPS FOR PREMIUM DASHBOARD ---
                    categories={categories}
                    transactions={transactions}
                    creditCardTransactions={creditCardTransactions}
                    creditCards={creditCards}
                    recurringRules={recurringRules}
                    getCardInvoiceInfo={getCardInvoiceInfo}
                    getCardTotalUsedLimit={getCardTotalUsedLimit}
                    month={filters.month}
                    year={filters.year}
                    onCardClick={handleCardClick}
                    layoutMode={dashboardLayoutMode}
                    visibleSections={dashboardSections}
                    groupOrder={dashboardGroupOrder}
                    widgetOrder={dashboardWidgetOrder}
                  />
                </PageShell>
              )}
              
              {/* LIST TAB */}
              {activeTab === 'list' && (
                <PageShell>
                   <PageHeader 
                      title="Extrato" 
                      subtitle="Histórico completo de transações e transferências."
                      controls={
                        <>
                          <MonthSelector />
                          <YearSelector />
                          <div className="h-6 w-px bg-white/10 mx-1 hidden md:block"></div>
                          <div className="w-40">
                            <GlassSelect 
                              value={filters.accountId}
                              onChange={(e) => setFilters(prev => ({ ...prev, accountId: e.target.value }))}
                              options={[
                                { value: "all", label: "Todas as Contas" },
                                ...accounts.map(acc => ({ value: acc.id, label: acc.name }))
                              ]}
                            />
                          </div>

                          <div className="w-32">
                            <GlassSelect 
                              value={filters.type}
                              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                              options={[
                                { value: "all", label: "Todos Tipos" },
                                { value: "income", label: "Entradas" },
                                { value: "expense", label: "Saídas" },
                                { value: "transfer", label: "Transferências" },
                              ]}
                            />
                          </div>

                          <div className="relative flex-1 min-w-[200px]">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input 
                              type="text" 
                              placeholder="Buscar transação..." 
                              value={filters.search}
                              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none placeholder-slate-500 hover:border-white/20 transition-all"
                            />
                          </div>
                          <div className="h-6 w-px bg-white/10 mx-1 hidden md:block"></div>
                          <GlassButton 
                            onClick={handleExportCSV}
                            icon={<Download size={16} />}
                            variant="secondary"
                            size="sm"
                            className="hidden md:flex"
                          >
                            CSV
                          </GlassButton>
                        </>
                      }
                   />
                  <TransactionList 
                    transactions={unifiedList} 
                    categories={categories}
                    accounts={accounts}
                    onEdit={handleOpenModal}
                    onDelete={handleDeleteItem}
                    onDuplicate={handleDuplicate}
                  />
                </PageShell>
              )}

              {/* OTHER TABS (Components manage their own shells/headers) */}
              {activeTab === 'accounts' && (
                <AccountList 
                  accounts={accounts}
                  getBalance={getAccountBalance}
                  onAdd={addAccount}
                  onEdit={editAccount}
                  onDelete={deleteAccount}
                />
              )}

              {activeTab === 'cards' && (
                <CreditCardManager 
                  cards={creditCards}
                  categories={categories}
                  accounts={accounts}
                  onAddCard={addCreditCard}
                  onEditCard={editCreditCard}
                  onDeleteCard={deleteCreditCard}
                  onAddTransaction={addCreditCardTransaction}
                  onEditTransaction={editCreditCardTransaction}
                  onDeleteTransaction={deleteCreditCardTransaction}
                  onAddRefund={addCreditCardRefund}
                  onPayInvoice={payInvoice}
                  onAnticipatePayment={anticipatePayment}
                  getInvoiceInfo={getCardInvoiceInfo}
                  initialCardId={selectedCardId}
                  initialMonth={filters.month}
                  initialYear={filters.year}
                />
              )}

              {activeTab === 'recurring' && (
                <RecurringManager 
                  rules={recurringRules}
                  categories={categories}
                  accounts={accounts}
                  creditCards={creditCards}
                  onAddRule={addRecurringRule}
                  onEditRule={editRecurringRule}
                  onDeleteRule={deleteRecurringRule}
                  onToggleRule={toggleRecurringRule}
                  onGeneratePreview={getRecurringPreview}
                  onCommitGeneration={commitRecurringTransactions}
                />
              )}

              {activeTab === 'forecast' && (
                <ForecastView 
                  accounts={accounts}
                  onGetForecast={getForecast}
                />
              )}

              {activeTab === 'budgets' && (
                <BudgetManager
                  budgets={budgets}
                  categories={categories}
                  currentMonth={currentDate.getMonth()}
                  currentYear={currentDate.getFullYear()}
                  onAddBudget={addBudget}
                  onEditBudget={editBudget}
                  onDeleteBudget={deleteBudget}
                  getCategorySpending={getCategorySpending}
                  transactions={transactions}
                  creditCardTransactions={creditCardTransactions}
                />
              )}

              {activeTab === 'goals' && (
                <GoalManager
                  goals={goals}
                  accounts={accounts}
                  investmentAccounts={investmentAccounts}
                  getAccountBalance={getAccountBalance}
                  getInvestmentAccountBalance={getInvestmentAccountBalance}
                  onAddGoal={addGoal}
                  onEditGoal={editGoal}
                  onArchiveGoal={toggleArchiveGoal}
                  onAddValueToGoal={addValueToGoal}
                  onDeleteGoal={deleteGoal}
                />
              )}

              {activeTab === 'debts' && (
                <DebtManager
                  debts={debts}
                  accounts={accounts}
                  onAddDebt={addDebt}
                  onEditDebt={editDebt}
                  onPayDebt={payDebt}
                  onSettleDebt={settleDebt}
                  onDeleteDebt={deleteDebt}
                />
              )}

              {activeTab === 'reports' && (
                <ReportView 
                  transactions={transactions}
                  categories={categories}
                  accounts={accounts}
                  creditCardTransactions={creditCardTransactions}
                  transfers={transfers}
                  filters={filters}
                  onMonthChange={(m) => setFilters(prev => ({ ...prev, month: m }))}
                  onYearChange={(y) => setFilters(prev => ({ ...prev, year: y }))}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView />
              )}

           </div>
           </Suspense>
        </div>
      </div>

      {/* Modals */}
      <ModalShell 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingItem?.id ? "Editar Movimentação" : "Nova Movimentação"}
      >
        <TransactionForm 
          initialData={editingItem} 
          categories={categories} 
          accounts={accounts}
          creditCards={creditCards}
          onSubmit={handleSubmitForm}
          onCancel={handleCloseModal}
          currentMonth={filters.month}
          currentYear={filters.year}
        />
      </ModalShell>

      <MobileFab
        visible={activeTab === 'dashboard' && !isModalOpen}
        actions={[
          { 
            id: 'expense', 
            label: 'Despesa', 
            icon: <ArrowDownCircle size={20} />, 
            onClick: () => handleOpenModal({ type: 'expense' }), 
            variant: 'danger' 
          },
          { 
            id: 'income', 
            label: 'Entrada', 
            icon: <ArrowUpCircle size={20} />, 
            onClick: () => handleOpenModal({ type: 'income' }), 
            variant: 'success' 
          },
          { 
            id: 'transfer', 
            label: 'Transferência', 
            icon: <ArrowRightLeft size={20} />, 
            onClick: () => handleOpenModal({ fromAccountId: '' }), 
            variant: 'primary' 
          }
        ]}
      />
    </div>
  );
};

export default App;
