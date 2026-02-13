
import React, { useMemo } from 'react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DashboardStats, ChartDataPoint, Account, Budget, CreditCard, Transaction, CreditCardTransaction, RecurringRule, Category } from '../types';
import { COLORS } from '../constants';
import { 
  getMonthlySummary, 
  getFinancialForecast, 
  getRecentActivity, 
  getBalanceHistory, 
  generateInsights 
} from '../selectors/dashboard';
import { 
  RemainingBalanceCard, 
  ForecastCard, 
  RecentActivityList, 
  BalanceChart, 
  InsightsList,
  CreditCardSummaryItem
} from './DashboardWidgets';
import { Wallet, Sparkles } from 'lucide-react';

interface DashboardProps {
  stats: DashboardStats;
  chartData: ChartDataPoint[]; 
  currentMonthName: string;
  totalBalance: number;
  accounts: Account[];
  getAccountBalance: (id: string) => number;
  creditCardStats: { totalLimit: number; usedLimit: number; availableLimit: number };
  budgets?: Budget[]; 
  getCategorySpending?: (catId: string, m: number, y: number) => number;
  onNavigateToBudgets?: () => void;
  // Raw Data Access for Selectors
  categories?: Category[]; 
  transactions?: Transaction[];
  creditCardTransactions?: CreditCardTransaction[];
  creditCards?: CreditCard[];
  recurringRules?: RecurringRule[];
  getCardInvoiceInfo?: (cardId: string, month: number, year: number) => any;
  month: number;
  year: number;
}

export const Dashboard: React.FC<DashboardProps> = React.memo(({ 
  currentMonthName,
  totalBalance,
  accounts,
  getAccountBalance,
  getCategorySpending,
  categories = [],
  transactions = [],
  creditCardTransactions = [],
  creditCards = [],
  recurringRules = [],
  getCardInvoiceInfo,
  month,
  year
}) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // --- MEMOIZED CALCULATIONS (PREMIUM FEATURES) ---

  const monthlySummary = useMemo(() => 
    getMonthlySummary(transactions, creditCardTransactions, month, year),
  [transactions, creditCardTransactions, month, year]);

  const invoicesForForecast = useMemo(() => {
    if (!getCardInvoiceInfo) return [];
    return creditCards.map(card => {
      const info = getCardInvoiceInfo(card.id, month, year);
      return { 
        amount: info?.amount || 0, 
        isPaid: info?.isPaid || false, 
        dueDate: info?.dueDate || '' 
      };
    });
  }, [creditCards, getCardInvoiceInfo, month, year]);

  const forecast = useMemo(() => 
    getFinancialForecast(accounts, recurringRules, invoicesForForecast, month, year),
  [accounts, recurringRules, invoicesForForecast, month, year]);

  const recentActivity = useMemo(() => 
    getRecentActivity(transactions, creditCardTransactions, categories, 6),
  [transactions, creditCardTransactions, categories]);

  const balanceHistory = useMemo(() => 
    getBalanceHistory(accounts, transactions, month, year),
  [accounts, transactions, month, year]);

  const insights = useMemo(() => 
    generateInsights(monthlySummary, transactions, creditCardTransactions, categories, creditCards, month, year),
  [monthlySummary, transactions, creditCardTransactions, categories, creditCards, month, year]);

  // Chart Data (Existing Logic)
  const comprehensiveChartData = useMemo(() => {
    if (!getCategorySpending) return [];
    
    const data: ChartDataPoint[] = [];
    categories.forEach((cat) => {
       if (cat.kind === 'expense') {
          const val = getCategorySpending(cat.id, month, year);
          if (val > 0) {
             data.push({
                name: cat.name,
                value: val,
                color: '' 
             });
          }
       }
    });
    
    return data
      .sort((a, b) => b.value - a.value)
      .map((item, idx) => ({ ...item, color: COLORS[idx % COLORS.length] }));

  }, [getCategorySpending, categories, month, year]);

  return (
    <div className="space-y-6">
      
      {/* 1. PREMIUM HEADER: MAIN CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RemainingBalanceCard summary={monthlySummary} />
        <ForecastCard summary={forecast} totalCurrentBalance={totalBalance} />
      </div>

      {/* 2. MIDDLE SECTION: GRAPH & INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-80">
        <div className="lg:col-span-2 h-full">
          <BalanceChart data={balanceHistory} />
        </div>
        <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar h-full">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-amber-400" />
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Insights</h3>
          </div>
          <InsightsList insights={insights} />
          {insights.length === 0 && (
            <div className="p-4 border border-slate-700 border-dashed rounded-xl text-center text-slate-500 text-sm">
              Nenhum insight disponível no momento.
            </div>
          )}
        </div>
      </div>

      {/* 3. BOTTOM SECTION: SPENDING & ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Expenses & Cards */}
        <div className="space-y-6">
          {/* Chart */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Despesas por Categoria</h3>
                  <p className="text-xs text-slate-400">Total gasto: {formatCurrency(monthlySummary.totalSpent)}</p>
                </div>
            </div>
            
            {comprehensiveChartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={comprehensiveChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {comprehensiveChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#1e293b" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                    <Legend 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right"
                      iconType="circle"
                      wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-lg">
                <Wallet size={48} className="mb-2 opacity-20" />
                <p>Nenhuma despesa registrada.</p>
              </div>
            )}
          </div>

          {/* Mini Card List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resumo dos Cartões</h3>
            {creditCards.length > 0 ? (
              creditCards.map(card => {
                const info = getCardInvoiceInfo ? getCardInvoiceInfo(card.id, month, year) : null;
                const usedPct = Math.round(((info?.amount || 0) / card.limit) * 100);
                return (
                  <CreditCardSummaryItem 
                    key={card.id} 
                    card={card} 
                    invoiceAmount={info?.amount || 0} 
                    usedPercentage={usedPct} 
                  />
                );
              })
            ) : (
              <p className="text-sm text-slate-500 italic">Nenhum cartão cadastrado.</p>
            )}
          </div>
        </div>

        {/* Right: Recent Activity */}
        <div>
          <RecentActivityList activities={recentActivity} />
        </div>

      </div>
    </div>
  );
});
