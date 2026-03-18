
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
import { GlassCard } from './ui/GlassCard';

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
  getCardTotalUsedLimit?: (cardId: string) => number;
  month: number;
  year: number;
  onCardClick?: (cardId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = React.memo(({ 
  totalBalance,
  accounts,
  getCategorySpending,
  categories = [],
  transactions = [],
  creditCardTransactions = [],
  creditCards = [],
  recurringRules = [],
  getCardInvoiceInfo,
  getCardTotalUsedLimit,
  month,
  year,
  onCardClick,
  creditCardStats
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
    getFinancialForecast(recurringRules, invoicesForForecast, month, year),
  [recurringRules, invoicesForForecast, month, year]);

  // Updated to pass month/year filter
  const recentActivity = useMemo(() => 
    getRecentActivity(transactions, creditCardTransactions, categories, month, year, 8, creditCards),
  [transactions, creditCardTransactions, categories, month, year, creditCards]);

  const balanceHistory = useMemo(() => 
    getBalanceHistory(accounts, transactions, month, year),
  [accounts, transactions, month, year]);

  const insights = useMemo(() => 
    generateInsights(monthlySummary, transactions, creditCardTransactions, categories, creditCards, month),
  [monthlySummary, transactions, creditCardTransactions, categories, creditCards, month]);

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
                color: cat.color || '' 
             });
          }
       }
    });
    
    return data
      .sort((a, b) => b.value - a.value)
      .map((item, idx) => ({ 
        ...item, 
        color: item.color || COLORS[idx % COLORS.length] 
      }));

  }, [getCategorySpending, categories, month, year]);

  return (
    <div className="space-y-4">
      
      {/* 1. PREMIUM HEADER: MAIN CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RemainingBalanceCard summary={monthlySummary} />
        <ForecastCard summary={forecast} totalCurrentBalance={totalBalance} creditCardUsedLimit={creditCardStats.usedLimit} />
      </div>

      {/* 2. MIDDLE SECTION: GRAPH & INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-auto lg:h-80">
        <div className="lg:col-span-2 h-full">
          <BalanceChart data={balanceHistory} />
        </div>
        <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar h-full">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-amber-400" />
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Insights</h3>
          </div>
          <InsightsList insights={insights} />
          {insights.length === 0 && (
            <div className="p-4 border border-white/10 border-dashed rounded-xl text-center text-slate-500 text-sm">
              Nenhum insight disponível no momento.
            </div>
          )}
        </div>
      </div>

      {/* 3. BOTTOM SECTION: SPENDING & ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Left: Expenses & Cards */}
        <div className="space-y-4">
          {/* Chart */}
          <GlassCard className="h-auto">
            <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Despesas por Categoria</h3>
                  <p className="text-xs text-slate-400">Total gasto: {formatCurrency(monthlySummary.totalSpent)}</p>
                </div>
            </div>
            
            {comprehensiveChartData.length > 0 ? (
              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={comprehensiveChartData}
                      cx="50%"
                      cy="45%"
                      innerRadius="55%"
                      outerRadius="75%"
                      paddingAngle={5}
                      minAngle={5}
                      dataKey="value"
                      stroke="none"
                      activeShape={false}
                    >
                      {comprehensiveChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', color: '#f8fafc', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center"
                      iconType="circle"
                      wrapperStyle={{ 
                        color: '#94a3b8', 
                        fontSize: '11px',
                        paddingTop: '10px'
                      }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] sm:h-[350px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-xl">
                <Wallet size={48} className="mb-2 opacity-20" />
                <p>Nenhuma despesa registrada.</p>
              </div>
            )}
          </GlassCard>

          {/* Mini Card List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resumo dos Cartões</h3>
            {creditCards.length > 0 ? (
              creditCards.map(card => {
                const totalUsed = getCardTotalUsedLimit ? getCardTotalUsedLimit(card.id) : 0;
                const usedPct = Math.round((totalUsed / card.limit) * 100);
                return (
                  <CreditCardSummaryItem 
                    key={card.id} 
                    card={card} 
                    usedAmount={totalUsed} 
                    usedPercentage={usedPct} 
                    onClick={() => onCardClick?.(card.id)}
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
