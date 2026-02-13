
import React from 'react';
import { ArrowUp, ArrowDown, CreditCard, Calendar, TrendingUp, AlertTriangle, Info, CheckCircle, ShoppingBag } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } from 'recharts';
import { MonthlySummary, ForecastSummary, DailyBalance, Insight } from '../selectors/dashboard';
import { Category, CreditCard as CreditCardType } from '../types';

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

// --- 1. SALDO RESTANTE CARD ---
export const RemainingBalanceCard: React.FC<{ summary: MonthlySummary }> = ({ summary }) => {
  const isPositive = summary.remainingBalance >= 0;
  
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-sm relative overflow-hidden">
      <div className={`absolute top-0 right-0 p-4 opacity-10 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
        <ShoppingBag size={80} />
      </div>
      
      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Saldo Restante no Mês</h3>
      <div className={`text-3xl font-bold mb-4 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        {formatCurrency(summary.remainingBalance)}
      </div>
      
      <div className="flex gap-4 text-xs font-medium">
        <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50">
          <ArrowUp size={12} className="text-emerald-500" />
          <span>Renda: {formatCurrency(summary.income)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/50 px-2 py-1 rounded border border-slate-700/50">
          <ArrowDown size={12} className="text-red-500" />
          <span>Gastos: {formatCurrency(summary.totalSpent)}</span>
        </div>
      </div>
    </div>
  );
};

// --- 2. FORECAST CARD ---
export const ForecastCard: React.FC<{ summary: ForecastSummary, totalCurrentBalance: number }> = ({ summary, totalCurrentBalance }) => {
  const predicted = totalCurrentBalance - summary.pendingRecurring - summary.pendingInvoices;
  const isPositive = predicted >= 0;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-500">
        <TrendingUp size={80} />
      </div>

      <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Previsão (Fim do Mês)</h3>
      <div className={`text-3xl font-bold mb-4 ${isPositive ? 'text-blue-400' : 'text-amber-400'}`}>
        {formatCurrency(predicted)}
      </div>

      <div className="space-y-1">
        <p className="text-xs text-slate-400 flex justify-between">
          <span>Saldo Atual:</span>
          <span className="text-white">{formatCurrency(totalCurrentBalance)}</span>
        </p>
        <p className="text-xs text-slate-400 flex justify-between">
          <span>Compromissos Restantes:</span>
          <span className="text-red-400">- {formatCurrency(summary.pendingRecurring + summary.pendingInvoices)}</span>
        </p>
      </div>
    </div>
  );
};

// --- 3. RECENT ACTIVITY LIST ---
export const RecentActivityList: React.FC<{ activities: any[] }> = ({ activities }) => {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-sm h-full">
      <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/50">
        <h3 className="text-sm font-bold text-slate-200">Últimas Movimentações</h3>
      </div>
      <div className="divide-y divide-slate-700/50">
        {activities.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-slate-500">
             <Calendar size={32} className="mb-2 opacity-20" />
             <p className="text-sm">Nenhuma movimentação neste mês.</p>
          </div>
        ) : (
          activities.map(item => (
            <div key={`${item.source}-${item.id}`} className="px-6 py-3 flex items-center justify-between hover:bg-slate-700/20 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="text-xl bg-slate-700/30 p-2 rounded-lg shrink-0">
                  {item.category?.emoji || (item.isCard ? '💳' : '💰')}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{item.description || item.category?.name || 'Sem descrição'}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{new Date(item.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}</span>
                    <span>•</span>
                    <span className={`${item.isCard ? 'text-purple-400' : 'text-slate-400'}`}>{item.source}</span>
                  </div>
                </div>
              </div>
              <div className={`text-sm font-bold whitespace-nowrap ${item.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- 4. BALANCE CHART ---
export const BalanceChart: React.FC<{ data: DailyBalance[] }> = ({ data }) => {
  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm h-full flex flex-col">
      <h3 className="text-sm font-bold text-slate-200 mb-6">Evolução do Saldo (Mês Atual)</h3>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="day" 
              tick={{fontSize: 10, fill: '#64748b'}} 
              axisLine={false} 
              tickLine={false} 
              minTickGap={15}
            />
            <Tooltip 
              contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px'}}
              itemStyle={{color: '#fff'}}
              formatter={(val: number) => formatCurrency(val)}
              labelFormatter={(label) => `Dia ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="balance" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorBal)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- 5. INSIGHTS LIST ---
export const InsightsList: React.FC<{ insights: Insight[] }> = ({ insights }) => {
  if (insights.length === 0) return null;

  return (
    <div className="space-y-3">
      {insights.map(insight => (
        <div key={insight.id} className={`p-4 rounded-xl border flex gap-3 ${
          insight.type === 'success' ? 'bg-emerald-900/10 border-emerald-900/30' :
          insight.type === 'warning' ? 'bg-amber-900/10 border-amber-900/30' :
          'bg-blue-900/10 border-blue-900/30'
        }`}>
          <div className={`mt-0.5 ${
            insight.type === 'success' ? 'text-emerald-400' :
            insight.type === 'warning' ? 'text-amber-400' :
            'text-blue-400'
          }`}>
            {insight.type === 'success' ? <CheckCircle size={18} /> :
             insight.type === 'warning' ? <AlertTriangle size={18} /> :
             <Info size={18} />}
          </div>
          <div>
            <h4 className={`text-sm font-bold ${
              insight.type === 'success' ? 'text-emerald-400' :
              insight.type === 'warning' ? 'text-amber-400' :
              'text-blue-200'
            }`}>{insight.title}</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{insight.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- 6. ENHANCED CARD ITEM ---
export const CreditCardSummaryItem: React.FC<{ card: CreditCardType, invoiceAmount: number, usedPercentage: number }> = ({ card, invoiceAmount, usedPercentage }) => {
  return (
    <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-slate-700/50 rounded-lg text-slate-300">
          <CreditCard size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-white">{card.name}</p>
          <div className="flex gap-2 text-[10px] text-slate-500 uppercase font-medium mt-0.5">
            <span>Fecha: {card.closingDay}</span>
            <span>Vence: {card.dueDay}</span>
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-sm font-bold text-white">{formatCurrency(invoiceAmount)}</p>
        <p className={`text-xs ${usedPercentage > 80 ? 'text-red-400' : 'text-slate-400'}`}>
          {usedPercentage}% do limite
        </p>
      </div>
    </div>
  );
};
