import React, { useMemo } from 'react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
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
import { Wallet, Sparkles, CreditCard as CardIcon } from 'lucide-react';
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
  totalDebts?: number;
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
  creditCardStats,
  totalDebts = 0
}) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // --- MEMOIZED CALCULATIONS ---
  const monthlySummary = useMemo(() => 
    getMonthlySummary(transactions, creditCardTransactions, month, year, totalBalance),
  [transactions, creditCardTransactions, month, year, totalBalance]);

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

  const recentActivity = useMemo(() => 
    getRecentActivity(transactions, creditCardTransactions, categories, month, year, 8, creditCards),
  [transactions, creditCardTransactions, categories, month, year, creditCards]);

  const balanceHistory = useMemo(() => 
    getBalanceHistory(accounts, transactions, month, year),
  [accounts, transactions, month, year]);

  const insights = useMemo(() => 
    generateInsights(monthlySummary, transactions, creditCardTransactions, categories, creditCards, month, year),
  [monthlySummary, transactions, creditCardTransactions, categories, creditCards, month, year]);

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

  // --- ANIMATION VARIANTS (Apple Spring Easing) ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.08 } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.45, ease: "easeOut" as const } 
    }
  };

  return (
    <motion.div 
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      
      {/* 1. PREMIUM HEADER: MAIN METRIC CARDS */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RemainingBalanceCard summary={monthlySummary} />
        <ForecastCard 
          summary={forecast} 
          totalCurrentBalance={totalBalance} 
          creditCardUsedLimit={creditCardStats.usedLimit} 
          totalDebts={totalDebts} 
        />
      </motion.div>

      {/* 2. MIDDLE SECTION: BALANCE CHART & SMART INSIGHTS */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-auto lg:h-84">
        <div className="lg:col-span-2 h-full">
          <BalanceChart data={balanceHistory} />
        </div>
        <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar h-full">
          <div className="flex items-center gap-2 mb-1 px-1">
            <Sparkles size={16} className="text-amber-400" />
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Insights Inteligentes</h3>
          </div>
          <InsightsList insights={insights} />
          {insights.length === 0 && (
            <div className="p-6 border border-dashed border-white/10 rounded-2xl text-center text-slate-500 text-sm bg-white/[0.02]">
              Nenhum insight disponível para este período.
            </div>
          )}
        </div>
      </motion.div>

      {/* 3. BOTTOM SECTION: CATEGORY DONUT & RECENT TRANSACTIONS */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Left: Expenses & Credit Card mini-cards */}
        <div className="space-y-4">
          <GlassCard className="h-auto p-5 sm:p-6">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-4.5 rounded-full bg-gradient-to-b from-amber-400 to-orange-500 shadow-sm" />
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Despesas por Categoria</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Total gasto: <span className="font-semibold text-slate-200 tabular-nums">{formatCurrency(monthlySummary.totalSpent)}</span></p>
                </div>
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
                      innerRadius="58%"
                      outerRadius="78%"
                      paddingAngle={4}
                      minAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {comprehensiveChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'rgb(var(--c-bg-900) / 0.9)', 
                        borderColor: 'rgb(var(--c-text-100) / 0.12)', 
                        color: 'rgb(var(--c-text-100))', 
                        borderRadius: '14px', 
                        backdropFilter: 'blur(20px) saturate(180%)',
                        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
                        padding: '8px 12px',
                        fontWeight: 'bold'
                      }}
                      itemStyle={{ color: 'rgb(var(--c-text-100))' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center"
                      iconType="circle"
                      wrapperStyle={{ 
                        color: 'rgb(var(--c-text-400))', 
                        fontSize: '11px',
                        paddingTop: '12px'
                      }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-[260px] sm:h-[300px] flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]"
              >
                <div className="relative w-20 h-20 mb-3 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[rgb(var(--c-primary-500)/0.15)] rounded-full animate-soft-pulse" />
                  <Wallet size={40} className="relative z-10 text-[rgb(var(--c-primary-400))] opacity-80" />
                </div>
                <p className="font-semibold text-slate-200 text-sm">Nenhuma despesa ainda</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[220px] text-center">Cadastre suas movimentações para ver a distribuição de gastos.</p>
              </motion.div>
            )}
          </GlassCard>

          {/* Mini Card List */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 px-1">
              <CardIcon size={14} className="text-slate-400" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resumo dos Cartões</h3>
            </div>
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
              <p className="text-xs text-slate-500 italic px-1">Nenhum cartão cadastrado.</p>
            )}
          </div>
        </div>

        {/* Right: Recent Activity */}
        <div>
          <RecentActivityList activities={recentActivity} />
        </div>

      </motion.div>
    </motion.div>
  );
});
