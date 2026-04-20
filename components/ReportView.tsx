
import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  AreaChart, Area 
} from 'recharts';
import { 
  Transaction, Category, Account, FilterState, CreditCardTransaction, Transfer 
} from '../types';
import { COLORS } from '../constants';
import { GlassCard } from './ui/GlassCard';
import { GlassSelect } from './ui/GlassSelect';
import { GlassButton } from './ui/GlassButton';
import { PageShell } from './ui/PageShell';
import { PageHeader } from './ui/PageHeader';
import { 
  TrendingUp, TrendingDown, Wallet, PieChart as PieChartIcon, 
  BarChart3, Calendar, ArrowUpRight, ArrowDownRight, 
  DollarSign, Activity, Target, Printer
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportViewProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  creditCardTransactions: CreditCardTransaction[];
  transfers: Transfer[];
  filters: FilterState;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  transactions,
  categories,
  accounts,
  creditCardTransactions,
  transfers,
  filters,
  onMonthChange,
  onYearChange
}) => {
  const { month, year } = filters;
  
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // --- DATA PROCESSING ---

  const monthData = useMemo(() => {
    const start = startOfMonth(new Date(year, month));
    const end = endOfMonth(new Date(year, month));

    const filteredTransactions = transactions.filter(t => {
      const d = parseISO(t.date);
      return d >= start && d <= end;
    });

    const filteredCCTransactions = creditCardTransactions.filter(t => {
      const d = parseISO(t.date);
      return d >= start && d <= end;
    });

    return {
      transactions: filteredTransactions,
      ccTransactions: filteredCCTransactions
    };
  }, [transactions, creditCardTransactions, month, year]);

  const stats = useMemo(() => {
    const income = monthData.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = monthData.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0) +
      monthData.ccTransactions
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expense,
      balance: income - expense
    };
  }, [monthData]);

  // Final Balance Calculation (All accounts up to end of month)
  const finalBalance = useMemo(() => {
    const endOfSelectedMonth = endOfMonth(new Date(year, month));
    const endOfSelectedMonthStr = format(endOfSelectedMonth, 'yyyy-MM-dd');

    let total = 0;
    accounts.forEach(acc => {
      let bal = acc.initialBalance;
      
      // Past transactions
      const pastTxs = transactions.filter(t => t.accountId === acc.id && t.date <= endOfSelectedMonthStr);
      bal += pastTxs.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0);
      
      // Past transfers
      const pastTransfersOut = transfers.filter(t => t.fromAccountId === acc.id && t.date <= endOfSelectedMonthStr);
      const pastTransfersIn = transfers.filter(t => t.toAccountId === acc.id && t.date <= endOfSelectedMonthStr);
      bal -= pastTransfersOut.reduce((sum, t) => sum + t.amount, 0);
      bal += pastTransfersIn.reduce((sum, t) => sum + t.amount, 0);
      
      total += bal;
    });

    return total;
  }, [accounts, transactions, transfers, month, year]);

  // Category Breakdown
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    
    // Regular expenses
    monthData.transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
      });

    // CC expenses
    monthData.ccTransactions.forEach(t => {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
    });

    return Object.entries(map)
      .map(([id, value]) => {
        const cat = categories.find(c => c.id === id);
        return {
          name: cat ? `${cat.emoji} ${cat.name}` : 'Outros',
          value,
          color: cat?.color || '' // Temporary empty color
        };
      })
      .sort((a, b) => b.value - a.value)
      .map((item, idx) => ({
        ...item,
        color: item.color || COLORS[idx % COLORS.length]
      }));
  }, [monthData, categories]);

  // Daily Trend
  const dailyTrendData = useMemo(() => {
    const start = startOfMonth(new Date(year, month));
    const end = endOfMonth(new Date(year, month));
    const days = eachDayOfInterval({ start, end });

    let cumulative = 0;
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayExpense = monthData.transactions
        .filter(t => t.type === 'expense' && t.date === dayStr)
        .reduce((sum, t) => sum + t.amount, 0) +
        monthData.ccTransactions
        .filter(t => t.date === dayStr)
        .reduce((sum, t) => sum + t.amount, 0);
      
      cumulative += dayExpense;
      return {
        day: format(day, 'dd'),
        expense: dayExpense,
        cumulative: Number(cumulative.toFixed(2))
      };
    });
  }, [monthData, month, year]);

  // Comparison with previous month
  const prevMonthStats = useMemo(() => {
    const prevDate = subMonths(new Date(year, month), 1);
    const start = startOfMonth(prevDate);
    const end = endOfMonth(prevDate);

    const pTxs = transactions.filter(t => {
      const d = parseISO(t.date);
      return d >= start && d <= end;
    });

    const pCCTxs = creditCardTransactions.filter(t => {
      const d = parseISO(t.date);
      return d >= start && d <= end;
    });

    const income = pTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = pTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) +
                    pCCTxs.reduce((sum, t) => sum + t.amount, 0);

    return { income, expense };
  }, [transactions, creditCardTransactions, month, year]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getPercentageChange = (current: number, prev: number) => {
    if (prev === 0) return 0;
    return ((current - prev) / prev) * 100;
  };

  const incomeChange = getPercentageChange(stats.income, prevMonthStats.income);
  const expenseChange = getPercentageChange(stats.expense, prevMonthStats.expense);

  const daysInMonth = dailyTrendData.length;
  const avgDailySpending = stats.expense / daysInMonth;

  const topIncomes = useMemo(() => {
    return monthData.transactions
      .filter(t => t.type === 'income')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [monthData]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageShell>
      <PageHeader 
        title="Relatório Mensal" 
        subtitle={`Visão geral de ${format(new Date(year, month), 'MMMM yyyy', { locale: ptBR })}`}
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <GlassButton 
              onClick={handlePrint}
              icon={<Printer size={18} />}
              variant="secondary"
              className="hidden sm:flex"
            >
              Imprimir
            </GlassButton>
          </div>
        }
        controls={
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <div className="w-40">
              <GlassSelect 
                value={month}
                onChange={(e) => onMonthChange(parseInt(e.target.value))}
                options={months.map((m, i) => ({ value: i, label: m }))}
              />
            </div>
            <div className="w-28">
              <GlassSelect 
                value={year}
                onChange={(e) => onYearChange(parseInt(e.target.value))}
                options={Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => ({ value: y, label: y.toString() }))}
              />
            </div>
          </div>
        }
      />

      <div className="space-y-3 sm:space-y-8 pb-20 print:p-0">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <GlassCard className="p-4 border-l-4 border-emerald-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Entradas</p>
                <h3 className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(stats.income)}</h3>
                <div className={`flex items-center gap-1 mt-2 text-xs ${incomeChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {incomeChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  <span>{Math.abs(incomeChange).toFixed(1)}% vs mês ant.</span>
                </div>
              </div>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <TrendingUp size={20} className="text-emerald-500" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4 border-l-4 border-red-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Saídas</p>
                <h3 className="text-2xl font-bold text-red-400 mt-1">{formatCurrency(stats.expense)}</h3>
                <div className={`flex items-center gap-1 mt-2 text-xs ${expenseChange <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {expenseChange <= 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                  <span>{Math.abs(expenseChange).toFixed(1)}% vs mês ant.</span>
                </div>
              </div>
              <div className="p-2 bg-red-500/10 rounded-lg">
                <TrendingDown size={20} className="text-red-500" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4 border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Resultado</p>
                <h3 className={`text-2xl font-bold mt-1 ${stats.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                  {formatCurrency(stats.balance)}
                </h3>
                <p className="text-[10px] text-slate-500 mt-2">Diferença entre entrada e saída</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Activity size={20} className="text-blue-500" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4 border-l-4 border-amber-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Saldo Final</p>
                <h3 className="text-2xl font-bold text-amber-400 mt-1">{formatCurrency(finalBalance)}</h3>
                <p className="text-[10px] text-slate-500 mt-2">Total em contas no fim do mês</p>
              </div>
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Wallet size={20} className="text-amber-500" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
          <GlassCard className="p-4 flex items-center gap-4">
            <div className="p-3 bg-slate-500/10 rounded-xl">
              <Calendar size={20} className="text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-500 uppercase">Gasto Médio Diário</p>
              <p className="text-lg font-bold text-white">{formatCurrency(avgDailySpending)}</p>
            </div>
          </GlassCard>
          
          <GlassCard className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <ArrowUpRight size={20} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-500 uppercase">Maior Entrada</p>
              <p className="text-lg font-bold text-white">
                {topIncomes.length > 0 ? formatCurrency(topIncomes[0].amount) : 'R$ 0,00'}
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-xl">
              <ArrowDownRight size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-500 uppercase">Maior Saída</p>
              <p className="text-lg font-bold text-white">
                {monthData.transactions.filter(t => t.type === 'expense').length > 0 || monthData.ccTransactions.length > 0 
                  ? formatCurrency(Math.max(...[...monthData.transactions.filter(t => t.type === 'expense'), ...monthData.ccTransactions].map(t => t.amount))) 
                  : 'R$ 0,00'}
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
          {/* Expenses by Category */}
          <GlassCard className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChartIcon size={20} className="text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Gastos por Categoria</h3>
            </div>
            {categoryData.length > 0 ? (
              <div className="h-[300px] sm:h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
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
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgb(var(--c-bg-900))', border: '1px solid rgb(var(--c-text-100) / 0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: 'rgb(var(--c-text-100))' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      align="center"
                      iconType="circle"
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] sm:h-[400px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-xl">
                <Wallet size={48} className="mb-2 opacity-20" />
                <p>Nenhum gasto registrado.</p>
              </div>
            )}
          </GlassCard>

          {/* Income vs Expense Bar Chart */}
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 size={20} className="text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Entradas vs Saídas</h3>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Entradas', value: stats.income, color: '#10b981' },
                    { name: 'Saídas', value: stats.expense, color: '#ef4444' }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgb(var(--c-text-400))" fontSize={12} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgb(var(--c-text-500))" fontSize={12} tickFormatter={(value) => `R$ ${value}`} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgb(var(--c-text-100) / 0.05)' }}
                    contentStyle={{ backgroundColor: 'rgb(var(--c-bg-900))', border: '1px solid rgb(var(--c-text-100) / 0.1)', borderRadius: '12px', backdropFilter: 'blur(16px)' }}
                    itemStyle={{ color: 'rgb(var(--c-text-100))' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {[
                      { name: 'Entradas', value: stats.income, color: '#10b981' },
                      { name: 'Saídas', value: stats.expense, color: '#ef4444' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0 0 8px ${entry.color}50)` }} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* Daily Spending Trend */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar size={20} className="text-[rgb(var(--c-primary-400))]" />
            <h3 className="text-lg font-semibold text-white">Evolução de Gastos (Acumulado)</h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrendData}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(var(--c-primary-400))" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="rgb(var(--c-primary-500))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="rgb(var(--c-text-500))" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="rgb(var(--c-text-500))" fontSize={10} tickFormatter={(value) => `R$ ${value}`} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgb(var(--c-bg-900))', border: '1px solid rgb(var(--c-text-100) / 0.1)', borderRadius: '12px', backdropFilter: 'blur(16px)' }}
                  itemStyle={{ color: 'rgb(var(--c-text-100))' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="rgb(var(--c-primary-400))" 
                  fillOpacity={1} 
                  fill="url(#colorCumulative)" 
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: 'rgb(var(--c-primary-400))' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Top Lists Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top 5 Categories */}
          <GlassCard className="p-8">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <PieChartIcon size={20} className="text-blue-400" />
              Maiores Gastos por Categoria
            </h3>
            <div className="space-y-4">
              {categoryData.slice(0, 5).map((cat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-slate-200 font-medium">{cat.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{formatCurrency(cat.value)}</p>
                    <p className="text-[10px] text-slate-500">
                      {((cat.value / stats.expense) * 100).toFixed(1)}% do total
                    </p>
                  </div>
                </div>
              ))}
              {categoryData.length === 0 && (
                <p className="text-center text-slate-500 py-4">Nenhum gasto registrado.</p>
              )}
            </div>
          </GlassCard>

          {/* Top 5 Transactions */}
          <GlassCard className="p-8">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Activity size={20} className="text-amber-400" />
              Maiores Transações do Mês
            </h3>
            <div className="space-y-4">
              {[...monthData.transactions.filter(t => t.type === 'expense'), ...monthData.ccTransactions]
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 5)
                .map((tx, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-white/5 rounded-lg shrink-0">
                        <DollarSign size={16} className="text-slate-400" />
                      </div>
                      <div className="truncate">
                        <p className="text-slate-200 font-medium truncate">{tx.description || 'Sem descrição'}</p>
                        <p className="text-[10px] text-slate-500">{format(parseISO(tx.date), 'dd/MM/yyyy')}</p>
                      </div>
                    </div>
                    <p className="text-red-400 font-bold shrink-0">{formatCurrency(tx.amount)}</p>
                  </div>
                ))}
              {monthData.transactions.length === 0 && monthData.ccTransactions.length === 0 && (
                <p className="text-center text-slate-500 py-4">Nenhuma transação registrada.</p>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Financial Health Tip */}
        <GlassCard className="p-6 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-2xl">
              <Target size={32} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Saúde Financeira</h3>
              <p className="text-slate-300 mt-1">
                {stats.balance > 0 
                  ? `Parabéns! Você fechou o mês no azul com um saldo de ${formatCurrency(stats.balance)}. Considere investir esse valor para acelerar suas metas.`
                  : `Atenção! Suas despesas superaram suas receitas em ${formatCurrency(Math.abs(stats.balance))}. Revise seus gastos essenciais e tente reduzir custos supérfluos.`
                }
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
};
