import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from './hooks/useFinance';
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
import { Sidebar } from './components/Sidebar';
import { Modal } from './components/ui/Modal';
import { Button } from './components/ui/Button';
import { FilterState } from './types';
import { Plus, Search, Menu } from 'lucide-react';

// Define valid tabs for type safety
type AppTab = 'dashboard' | 'list' | 'accounts' | 'cards' | 'recurring' | 'forecast' | 'budgets' | 'settings' | 'investments';

const VALID_TABS: AppTab[] = [
  'dashboard', 'list', 'accounts', 'cards', 'recurring', 'forecast', 'budgets', 'settings', 'investments'
];

const App: React.FC = () => {
  const { 
    categories, 
    accounts,
    creditCards,
    recurringRules,
    budgets,
    investmentAccounts,
    assets,
    positions,
    investmentMovements,
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
    loading
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(undefined);
  
  // --- NAVIGATION & ROUTING LOGIC ---
  
  // 1. Helper to get tab from hash
  const getTabFromHash = (): AppTab => {
    if (typeof window === 'undefined') return 'dashboard';
    const hash = window.location.hash.replace('#', '');
    return VALID_TABS.includes(hash as AppTab) ? (hash as AppTab) : 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState<AppTab>(getTabFromHash());
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // 2. Sync Hash -> State (Handle Back/Forward buttons)
  useEffect(() => {
    const handleHashChange = () => {
      const newTab = getTabFromHash();
      setActiveTabState(newTab);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 3. Wrapper to update Hash when UI changes
  const setActiveTab = (tab: AppTab) => {
    window.location.hash = tab;
    setActiveTabState(tab);
    window.scrollTo(0,0);
  };

  // ----------------------------------

  const currentDate = new Date();
  const [filters, setFilters] = useState<FilterState>({
    month: currentDate.getMonth(),
    year: currentDate.getFullYear(),
    type: 'all',
    search: '',
    categoryId: 'all',
    accountId: 'all'
  });

  // Combine transactions and transfers
  const unifiedList = useMemo(() => 
    getUnifiedList(filters), 
    [getUnifiedList, filters]
  );

  const stats = useMemo(() => {
    return getStats(unifiedList);
  }, [getStats, unifiedList]);

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
    if (editingItem) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
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
        default: return 'Nex Finance';
     }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      
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
        <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 z-20">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 -ml-2 text-slate-400 hover:text-white">
                <Menu size={24} />
             </button>
             <h1 className="font-bold text-lg">{getPageTitle()}</h1>
          </div>
          {activeTab === 'dashboard' && (
            <Button 
              onClick={() => handleOpenModal()} 
              icon={<Plus size={18} />}
              size="sm"
            >
              Novo
            </Button>
          )}
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide bg-slate-900/50">
           <main className="max-w-5xl mx-auto px-4 py-6 space-y-6 pb-24 md:pb-10">
              
              {/* Desktop Header / Title Area */}
              <div className="hidden md:flex items-center justify-between mb-2">
                 <h1 className="text-2xl font-bold text-white">{getPageTitle()}</h1>
                 {activeTab === 'dashboard' && (
                   <Button 
                     onClick={() => handleOpenModal()} 
                     icon={<Plus size={18} />}
                   >
                     Nova Movimentação
                   </Button>
                 )}
              </div>

              {/* Filters Section (Only for specific tabs) */}
              {['dashboard', 'list'].includes(activeTab) && (
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-4 shadow-sm">
                  <div className="flex flex-col lg:flex-row gap-4 justify-between">
                    <div className="flex gap-2">
                      <select 
                        value={filters.month}
                        onChange={(e) => setFilters(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                        className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                      </select>
                      <select 
                        value={filters.year}
                        onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                        className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i).map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col md:flex-row flex-1 gap-2 lg:justify-end">
                      <select 
                        value={filters.accountId}
                        onChange={(e) => setFilters(prev => ({ ...prev, accountId: e.target.value }))}
                        className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="all">Todas as Contas</option>
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                      </select>

                      <select 
                        value={filters.type}
                        onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                        className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="all">Todos Tipos</option>
                        <option value="income">Entradas</option>
                        <option value="expense">Saídas</option>
                        <option value="transfer">Transferências</option>
                      </select>

                      <div className="relative flex-1 lg:flex-none lg:w-48">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                          type="text" 
                          placeholder="Buscar..." 
                          value={filters.search}
                          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                          className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content */}
              <div className="animate-in fade-in duration-300">
                {activeTab === 'dashboard' && (
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
                  />
                )}
                
                {activeTab === 'list' && (
                  <TransactionList 
                    transactions={unifiedList} 
                    categories={categories}
                    accounts={accounts}
                    onEdit={handleOpenModal}
                    onDelete={handleDeleteItem}
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
                    onPayInvoice={payInvoice}
                    getInvoiceInfo={getCardInvoiceInfo}
                  />
                )}

                {activeTab === 'settings' && (
                  <SettingsView />
                )}
              </div>
           </main>
        </div>
      </div>

      {/* Modals */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingItem ? "Editar Movimentação" : "Nova Movimentação"}
      >
        <TransactionForm 
          initialData={editingItem} 
          categories={categories} 
          accounts={accounts}
          onSubmit={handleSubmitForm}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default App;