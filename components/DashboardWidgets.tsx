
import React from 'react';
import { ArrowUp, ArrowDown, CreditCard, Calendar, TrendingUp, AlertTriangle, Info, CheckCircle, ShoppingBag } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { MonthlySummary, ForecastSummary, DailyBalance, Insight } from '../selectors/dashboard';
import { CreditCard as CreditCardType } from '../types';
import { GlassCard } from './ui/GlassCard';

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

// --- 1. SALDO RESTANTE CARD ---
export const RemainingBalanceCard: React.FC<{ summary: MonthlySummary }> = ({ summary }) => {
  const isPositive = summary.remainingBalance >= 0;
  
  return (
    <GlassCard className="relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-400/5 opacity-50 group-hover:opacity-70 transition-opacity" />
      
      <div className={`absolute top-0 right-0 p-4 opacity-10 ${isPositive ? 'text-emerald-500' : 'text-red-500'} group-hover:scale-110 transition-transform duration-500`}>
        <ShoppingBag size={80} />
      </div>
      
      <div className="relative z-10">
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Saldo Restante no Mês</h3>
        <div className={`text-3xl font-bold mb-6 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {formatCurrency(summary.remainingBalance)}
        </div>
        
        <div className="flex gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-slate-300 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
            <ArrowUp size={12} className="text-emerald-400" />
            <span>Renda: {formatCurrency(summary.income)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
            <ArrowDown size={12} className="text-red-400" />
            <span>Gastos: {formatCurrency(summary.totalSpent)}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

// --- 2. FORECAST CARD ---
export const ForecastCard: React.FC<{ summary: ForecastSummary, totalCurrentBalance: number }> = ({ summary, totalCurrentBalance }) => {
  const predicted = totalCurrentBalance - summary.pendingRecurring - summary.pendingInvoices;
  const isPositive = predicted >= 0;

  return (
    <GlassCard className="relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-400/5 opacity-50 group-hover:opacity-70 transition-opacity" />

      <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-500 group-hover:scale-110 transition-transform duration-500">
        <TrendingUp size={80} />
      </div>

      <div className="relative z-10">
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Previsão (Fim do Mês)</h3>
        <div className={`text-3xl font-bold mb-6 ${isPositive ? 'text-blue-400' : 'text-amber-400'}`}>
          {formatCurrency(predicted)}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs bg-white/5 p-2 rounded-lg border border-white/5">
            <span className="text-slate-400">Saldo Atual</span>
            <span className="text-white font-medium">{formatCurrency(totalCurrentBalance)}</span>
          </div>
          <div className="flex justify-between text-xs bg-red-500/5 p-2 rounded-lg border border-red-500/10">
            <span className="text-slate-400">Compromissos Restantes</span>
            <span className="text-red-400 font-medium">- {formatCurrency(summary.pendingRecurring + summary.pendingInvoices)}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

// --- 3. RECENT ACTIVITY LIST ---
export const RecentActivityList: React.FC<{ activities: any[] }> = ({ activities }) => {
  return (
    <GlassCard className="h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-lg font-semibold text-white">Últimas Movimentações</h3>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
        {activities.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-slate-500 h-full">
             <Calendar size={32} className="mb-2 opacity-20" />
             <p className="text-sm">Nenhuma movimentação neste mês.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map(item => (
              <div key={`${item.source}-${item.id}`} className="p-3 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors group border border-transparent hover:border-white/5">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="text-xl bg-white/5 p-2.5 rounded-xl shrink-0 border border-white/5 group-hover:border-white/10 transition-colors">
                    {item.category?.emoji || (item.isCard ? '💳' : '💰')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">{item.description || item.category?.name || 'Sem descrição'}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{new Date(item.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        {item.color && (
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        )}
                        <span className={`${item.isCard ? 'text-violet-400' : 'text-blue-400'}`}>{item.source}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`text-sm font-bold whitespace-nowrap ${item.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
};

// --- 4. BALANCE CHART ---
export const BalanceChart: React.FC<{ data: DailyBalance[] }> = ({ data }) => {
  return (
    <GlassCard className="h-full flex flex-col">
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
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="day" 
              tick={{fontSize: 10, fill: '#64748b'}} 
              axisLine={false} 
              tickLine={false} 
              minTickGap={15}
            />
            <Tooltip 
              contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', backdropFilter: 'blur(8px)'}}
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
    </GlassCard>
  );
};

// --- 5. INSIGHTS LIST ---
export const InsightsList: React.FC<{ insights: Insight[] }> = ({ insights }) => {
  if (insights.length === 0) return null;

  return (
    <div className="space-y-3">
      {insights.map(insight => (
        <div key={insight.id} className={`p-4 rounded-xl border flex gap-3 backdrop-blur-sm transition-all hover:scale-[1.02] ${
          insight.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
          insight.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20' :
          'bg-blue-500/10 border-blue-500/20'
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
    <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer group">
      <div className="flex items-center gap-3">
        <div 
          className="p-2.5 rounded-lg text-white transition-colors shadow-sm"
          style={{ backgroundColor: card.color || '#1e293b' }}
        >
          <CreditCard size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{card.name}</p>
          <div className="flex gap-2 text-[10px] text-slate-500 uppercase font-medium mt-0.5">
            <span>Fecha: {card.closingDay}</span>
            <span>Vence: {card.dueDay}</span>
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-sm font-bold text-white">{formatCurrency(invoiceAmount)}</p>
        <div className="flex items-center justify-end gap-2">
          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${usedPercentage > 80 ? 'bg-red-500' : 'bg-blue-500'}`} 
              style={{ width: `${Math.min(usedPercentage, 100)}%` }}
            />
          </div>
          <p className={`text-[10px] ${usedPercentage > 80 ? 'text-red-400' : 'text-slate-400'}`}>
            {usedPercentage}%
          </p>
        </div>
      </div>
    </div>
  );
};
