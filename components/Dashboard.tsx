
import React, { useMemo } from 'react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DashboardStats, ChartDataPoint, Account, Budget } from '../types';
import { TrendingUp, TrendingDown, Wallet, Building2, Banknote, CreditCard, PieChart } from 'lucide-react';
import { COLORS, INITIAL_CATEGORIES } from '../constants';

interface DashboardProps {
  stats: DashboardStats;
  chartData: ChartDataPoint[]; // Deprecated, we calculate locally now
  currentMonthName: string;
  totalBalance: number;
  accounts: Account[];
  getAccountBalance: (id: string) => number;
  creditCardStats: { totalLimit: number; usedLimit: number; availableLimit: number };
  budgets?: Budget[]; 
  getCategorySpending?: (catId: string, m: number, y: number) => number;
  onNavigateToBudgets?: () => void;
  // Context props for calculating chart
  categories?: any[]; // Passed via useFinance but implicit here if we just use the getter
  month: number;
  year: number;
}

export const Dashboard: React.FC<DashboardProps> = React.memo(({ 
  stats, 
  // chartData, // Ignored, we rebuild it to include credit cards
  currentMonthName,
  totalBalance,
  accounts,
  getAccountBalance,
  creditCardStats,
  budgets = [],
  getCategorySpending,
  onNavigateToBudgets,
  categories = INITIAL_CATEGORIES,
  month,
  year
}) => {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Re-calculate Chart Data using the robust selector that includes Credit Cards
  const comprehensiveChartData = useMemo(() => {
    if (!getCategorySpending) return [];
    
    const data: ChartDataPoint[] = [];
    categories.forEach((cat: any) => {
       if (cat.kind === 'expense') {
          const val = getCategorySpending(cat.id, month, year);
          if (val > 0) {
             data.push({
                name: cat.name,
                value: val,
                color: '' // Assigned later
             });
          }
       }
    });
    
    return data
      .sort((a, b) => b.value - a.value)
      .map((item, idx) => ({ ...item, color: COLORS[idx % COLORS.length] }));

  }, [getCategorySpending, categories, month, year]);

  // Budget Calc
  const currentBudgets = budgets.filter(b => b.month === month && b.year === year);
  let budgetsOk = 0;
  let budgetsWarning = 0;
  let budgetsDanger = 0;

  if (getCategorySpending) {
     currentBudgets.forEach(b => {
        const spent = getCategorySpending(b.categoryId, b.month, b.year);
        const pct = (spent / b.amountLimit) * 100;
        if (pct >= 100) budgetsDanger++;
        else if (pct >= b.alertAtPercent) budgetsWarning++;
        else budgetsOk++;
     });
  }

  const StatCard = ({ title, value, type }: { title: string, value: number, type: 'income' | 'expense' | 'balance' }) => {
    let colorClass = 'text-white';
    let Icon = Wallet;
    let bgIcon = 'bg-blue-500/10 text-blue-400';

    if (type === 'income') {
      colorClass = 'text-emerald-400';
      Icon = TrendingUp;
      bgIcon = 'bg-emerald-500/10 text-emerald-400';
    } else if (type === 'expense') {
      colorClass = 'text-red-400';
      Icon = TrendingDown;
      bgIcon = 'bg-red-500/10 text-red-400';
    }

    return (
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-400 font-medium text-sm">{title}</span>
          <div className={`p-2 rounded-full ${bgIcon}`}>
            <Icon size={20} />
          </div>
        </div>
        <div className={`text-2xl font-bold ${colorClass}`}>
          {formatCurrency(value)}
        </div>
        <div className="text-xs text-slate-500 mt-1">no mês de {currentMonthName}</div>
      </div>
    );
  };

  const currentMonthlyBalance = stats.income - stats.expense;

  return (
    <div className="space-y-6">
      {/* Hero Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Balance Hero */}
        <div className="bg-gradient-to-br from-blue-900 via-slate-800 to-slate-900 p-8 rounded-2xl border border-slate-700 shadow-lg flex flex-col justify-center">
          <h2 className="text-blue-200 text-sm font-medium mb-1 tracking-wide uppercase">Saldo Geral Acumulado</h2>
          <div className="text-4xl font-bold text-white mb-6">
            {formatCurrency(totalBalance)}
          </div>
          
          {/* Account Balances Mini-List */}
          <div className="grid grid-cols-2 gap-3 mt-auto">
            {accounts.map(acc => {
               const bal = getAccountBalance(acc.id);
               return (
                 <div key={acc.id} className="bg-slate-900/40 backdrop-blur-sm p-3 rounded-lg border border-slate-700/50 flex flex-col">
                   <div className="flex items-center gap-2 mb-1">
                     {acc.type === 'bank' ? <Building2 size={14} className="text-slate-400"/> : <Banknote size={14} className="text-slate-400"/>}
                     <span className="text-xs text-slate-300 truncate font-medium">{acc.name}</span>
                   </div>
                   <div className={`text-sm font-semibold ${bal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                     {formatCurrency(bal)}
                   </div>
                 </div>
               );
            })}
          </div>
        </div>

        <div className="space-y-6">
            {/* Credit Card Summary Card */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-slate-700 rounded text-slate-300">
                  <CreditCard size={18} />
                </div>
                <h2 className="text-slate-200 font-semibold">Cartões de Crédito</h2>
              </div>
              
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Limite em uso (Estimado)</p>
                  <p className="text-2xl font-bold text-slate-200">{formatCurrency(creditCardStats.usedLimit)}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400 mb-1">Disponível</p>
                    <p className="text-lg font-semibold text-emerald-400">{formatCurrency(creditCardStats.availableLimit)}</p>
                </div>
              </div>
              
              <div className="w-full bg-slate-700 rounded-full h-2.5 mt-4 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min((creditCardStats.usedLimit / creditCardStats.totalLimit) * 100, 100)}%` }}
                  ></div>
              </div>
            </div>

            {/* Budgets Summary Card */}
            {currentBudgets.length > 0 && (
                <div onClick={onNavigateToBudgets} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-sm cursor-pointer hover:border-slate-500 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <PieChart size={18} className="text-blue-400"/>
                            <h2 className="text-slate-300 font-medium">Orçamentos ({currentMonthName})</h2>
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold text-emerald-400">{budgetsOk}</span>
                            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">OK</span>
                        </div>
                        {(budgetsWarning > 0 || budgetsDanger > 0) && <div className="w-px bg-slate-700"></div>}
                        {budgetsWarning > 0 && (
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold text-amber-400">{budgetsWarning}</span>
                                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Atenção</span>
                            </div>
                        )}
                        {budgetsDanger > 0 && (
                             <div className="flex flex-col">
                                <span className="text-2xl font-bold text-red-400">{budgetsDanger}</span>
                                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Estourado</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Monthly Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Entradas (Caixa)" value={stats.income} type="income" />
        <StatCard title="Saídas (Caixa)" value={stats.expense} type="expense" />
        <StatCard title="Saldo (Caixa)" value={currentMonthlyBalance} type="balance" />
      </div>

      {/* Charts Section */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-sm">
        <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-semibold text-white">Despesas por Categoria ({currentMonthName})</h3>
            <span className="text-xs text-slate-500 max-w-[150px] text-right">Inclui compras no cartão. Pagamento de fatura ignorado para evitar duplicidade.</span>
        </div>
        
        {comprehensiveChartData.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={comprehensiveChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
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
                  wrapperStyle={{ color: '#94a3b8' }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-lg">
            <Wallet size={48} className="mb-2 opacity-20" />
            <p>Nenhuma despesa registrada neste mês.</p>
          </div>
        )}
      </div>
    </div>
  );
});
