
import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from './hooks/useFinance';
import { useAuth } from './hooks/useAuth';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { TransactionForm } from './components/TransactionForm';
import { AccountList } from './components/AccountList';
import { CreditCardManager } from './components/CreditCardManager';
import { RecurringManager } from './components/RecurringManager';
import { ForecastView } from './components/ForecastView';
import { BudgetManager } from './components/BudgetManager';
import { SettingsView } from './components/SettingsView';
import { InvestmentDashboard } from './components/InvestmentDashboard';
import { GoalManager } from './components/GoalManager';
import { Sidebar } from './components/Sidebar';
import { ModalShell, ModalBody, ModalFooter } from './components/ui/ModalShell';
import { GlassButton } from './components/ui/GlassButton';
import { GlassSelect } from './components/ui/GlassSelect';
import { PageShell } from './components/ui/PageShell';
import { PageHeader } from './components/ui/PageHeader';
import { ThemeService } from './services/themeService';
import { FilterState } from './types';
import { Plus, Search, Menu, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft } from 'lucide-react';
import { LoginScreen } from './components/auth/LoginScreen';
import { MobileFab } from './components/ui/MobileFab';

// Define valid tabs for type safety
type AppTab = 'dashboard' | 'list' | 'accounts' | 'cards' | 'recurring' | 'forecast' | 'budgets' | 'settings' | 'investments' | 'goals';

const VALID_TABS: AppTab[] = [
  'dashboard', 'list', 'accounts', 'cards', 'recurring', 'forecast', 'budgets', 'settings', 'investments', 'goals'
];

const App: React.FC = () => {
  const { session, loading: authLoading } = useAuth();

  const { 
    transactions, // Added to props
    categories, 
    accounts,
    creditCards,
    creditCardTransactions, // Added to props
    recurringRules,
    budgets,
    investmentAccounts,
    assets,
    positions,
    investmentMovements,
    goals,
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
    addRecurringRule,
    editRecurringRule,
    deleteRecurringRule,
    toggleRecurringRule,
    addBudget,
    editBudget,
    deleteBudget,
    addInvestmentAccount,
    deleteInvestmentAccount,
    addAsset,
    addInvestmentMovement,
    getCategorySpending,
    getRecurringPreview,
    commitRecurringTransactions,
    getAccountBalance,
    getTotalBalance,
    getCardInvoiceInfo,
    getCreditCardStats,
    getUnifiedList, 
    getStats,
    getChartData,
    getForecast,
    getInvestmentAccountBalance,
    getPortfolioSummary,
    addGoal,
    editGoal,
    toggleArchiveGoal,
    addValueToGoal,
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

  useEffect(() => {
    const handleHashChange = () => {
      const newTab = getTabFromHash();
      setActiveTabState(newTab);
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
    window.scrollTo(0,0);
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
    getChartData(unifiedList),
    [getChartData, unifiedList]
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
      } else {
        editTransaction(editingItem.id, data);
      }
    } else {
      if (data.isTransfer) {
        addTransfer(data);
      } else {
        addTransaction(data);
      }
    }
    handleCloseModal();
  };

  const handleDeleteItem = (id: string, isTransfer: boolean) => {
    if (isTransfer) {
      deleteTransfer(id);
    } else {
      deleteTransaction(id);
    }
  };

  // --- AUTH LOADING STATE ---
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
        case 'investments': return 'Investimentos';
        case 'goals': return 'Metas';
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
        <header className="md:hidden flex items-center justify-between p-4 glass-sm border-b border-white/5 z-20">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 -ml-2 text-slate-400 hover:text-white">
                <Menu size={24} />
             </button>
             <h1 className="font-bold text-lg">{getPageTitle()}</h1>
          </div>
          {activeTab === 'dashboard' && (
            <GlassButton 
              onClick={() => handleOpenModal()} 
              icon={<Plus size={18} />}
              size="sm"
              className="hidden md:flex"
            >
              Novo
            </GlassButton>
          )}
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-transparent">
           <div className="animate-in fade-in duration-300 min-h-full">
              
              {/* DASHBOARD TAB */}
              {activeTab === 'dashboard' && (
                <PageShell>
                  <PageHeader 
                    title="Dashboard" 
                    subtitle="Visão geral das suas finanças neste mês."
                    actions={
                      <GlassButton onClick={() => handleOpenModal()} icon={<Plus size={18} />} className="hidden md:flex">
                        Nova Movimentação
                      </GlassButton>
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
                    month={filters.month}
                    year={filters.year}
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
                              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none placeholder-slate-500 hover:border-slate-600/50 transition-all"
                            />
                          </div>
                        </>
                      }
                   />
                  <TransactionList 
                    transactions={unifiedList} 
                    categories={categories}
                    accounts={accounts}
                    onEdit={handleOpenModal}
                    onDelete={handleDeleteItem}
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
                  getInvoiceInfo={getCardInvoiceInfo}
                />
              )}

              {activeTab === 'recurring' && (
                <RecurringManager 
                  rules={recurringRules}
                  categories={categories}
                  accounts={accounts}
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
                />
              )}

              {activeTab === 'investments' && (
                <InvestmentDashboard 
                    investmentAccounts={investmentAccounts}
                    assets={assets}
                    positions={positions}
                    movements={investmentMovements}
                    accounts={accounts}
                    onAddAccount={addInvestmentAccount}
                    onAddAsset={addAsset}
                    onAddMovement={addInvestmentMovement}
                    getInvestmentAccountBalance={getInvestmentAccountBalance}
                    getPortfolioSummary={getPortfolioSummary}
                />
              )}

              {activeTab === 'goals' && (
                <GoalManager
                  goals={goals}
                  onAddGoal={addGoal}
                  onEditGoal={editGoal}
                  onArchiveGoal={toggleArchiveGoal}
                  onAddValueToGoal={addValueToGoal}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView />
              )}

           </div>
        </div>
      </div>

      {/* Modals */}
      <ModalShell 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingItem?.id ? "Editar Movimentação" : "Nova Movimentação"}
      >
        <ModalBody>
          <TransactionForm 
            initialData={editingItem} 
            categories={categories} 
            accounts={accounts}
            onSubmit={handleSubmitForm}
            onCancel={handleCloseModal}
            currentMonth={filters.month}
            currentYear={filters.year}
          />
        </ModalBody>
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
