
import React from 'react';
import { AppleEmoji } from './ui/AppleEmoji';
import { ArrowUp, ArrowDown, CreditCard, Calendar, TrendingUp, AlertTriangle, Info, CheckCircle, ShoppingBag } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { MonthlySummary, ForecastSummary, DailyBalance, Insight } from '../selectors/dashboard';
import { CreditCard as CreditCardType } from '../types';
import { GlassCard } from './ui/GlassCard';
import { AnimatedNumber } from './ui/AnimatedNumber';

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

// --- 1. SALDO RESTANTE CARD ---
export const RemainingBalanceCard: React.FC<{ summary: MonthlySummary }> = ({ summary }) => {
  const isPositive = summary.remainingBalance >= 0;
  
  return (
    <GlassCard 
      className="relative overflow-hidden group" 
      variant={isPositive ? 'success' : 'danger'}
    >
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isPositive ? 'from-emerald-500/15 via-transparent to-blue-500/5' : 'from-red-500/15 via-transparent to-orange-500/5'} opacity-70 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Decorative icon — higher opacity + hover stronger */}
      <div className={`absolute -top-2 -right-2 p-5 ${isPositive ? 'text-emerald-400' : 'text-red-400'} opacity-[0.13] group-hover:opacity-[0.22] group-hover:scale-105 group-hover:rotate-6 transition-all duration-700`}>
        <ShoppingBag size={100} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-1.5 h-4 rounded-full ${isPositive ? 'bg-emerald-400' : 'bg-red-400'} shadow-[0_0_6px_currentColor]`} />
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Saldo Restante no Mês</h3>
        </div>
        
        <AnimatedNumber 
          value={summary.remainingBalance} 
          format={formatCurrency} 
          className={`block text-3xl sm:text-4xl font-extrabold mb-5 ${isPositive ? 'value-text-positive' : 'value-text-negative'}`} 
        />
        
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-slate-200 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 backdrop-blur-sm">
            <ArrowUp size={11} className="text-emerald-400 shrink-0" />
            <span className="truncate">Renda: <span className="font-bold text-emerald-300">{formatCurrency(summary.income)}</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-200 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 backdrop-blur-sm">
            <ArrowDown size={11} className="text-red-400 shrink-0" />
            <span className="truncate">Gastos: <span className="font-bold text-red-300">{formatCurrency(summary.totalSpent)}</span></span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

// --- 2. FORECAST CARD ---
export const ForecastCard: React.FC<{ summary: ForecastSummary, totalCurrentBalance: number, creditCardUsedLimit: number, totalDebts?: number }> = ({ summary, totalCurrentBalance, creditCardUsedLimit, totalDebts = 0 }) => {
  const predicted = totalCurrentBalance - summary.pendingRecurring - creditCardUsedLimit - totalDebts;
  const isPositive = predicted >= 0;

  return (
    <GlassCard className="relative overflow-hidden group" variant="accent">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--c-primary-500)/0.12)] via-transparent to-[rgb(var(--c-primary-700)/0.06)] opacity-70 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Decorative icon */}
      <div className="absolute -top-2 -right-2 p-5 text-[rgb(var(--c-primary-400))] opacity-[0.13] group-hover:opacity-[0.22] group-hover:scale-105 group-hover:-rotate-6 transition-all duration-700">
        <TrendingUp size={100} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-4 rounded-full bg-[rgb(var(--c-primary-400))] shadow-[0_0_6px_currentColor]" />
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Disponível</h3>
        </div>

        <AnimatedNumber 
          value={predicted} 
          format={formatCurrency} 
          className={`block text-3xl sm:text-4xl font-extrabold mb-5 ${isPositive ? 'value-text-accent' : 'value-text-negative'}`} 
        />

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs bg-white/5 px-3 py-2 rounded-lg border border-white/8 backdrop-blur-sm">
            <span className="text-slate-400">Saldo Atual</span>
            <span className="text-white font-bold">{formatCurrency(totalCurrentBalance)}</span>
          </div>
          <div className="flex justify-between items-center text-xs bg-red-500/5 px-3 py-2 rounded-lg border border-red-500/15 backdrop-blur-sm">
            <span className="text-slate-400">Dívidas e Cartões</span>
            <span className="text-red-400 font-bold">- {formatCurrency(summary.pendingRecurring + creditCardUsedLimit + totalDebts)}</span>
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
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 rounded-full bg-gradient-to-b from-blue-400 to-indigo-500 shadow-sm" />
          <h3 className="text-base font-bold text-white">Últimas Movimentações</h3>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
        {activities.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-slate-500 h-full">
             <Calendar size={32} className="mb-2 opacity-20" />
             <p className="text-sm">Nenhuma movimentação neste mês.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {activities.map((item, idx) => (
              <div 
                key={`${item.source}-${item.id}`} 
                className="p-3 rounded-xl flex items-center justify-between hover:bg-white/5 transition-all duration-200 group border border-transparent hover:border-white/8"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
                  <div className="text-xl bg-white/5 p-2.5 rounded-xl shrink-0 border border-white/5 group-hover:border-white/12 group-hover:bg-white/8 transition-all duration-200">
                    <AppleEmoji emoji={item.category?.emoji || (item.isCard ? '💳' : '💰')} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                      {item.description || item.category?.name || 'Sem descrição'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="shrink-0">{new Date(item.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}</span>
                      <span className="shrink-0 opacity-50">•</span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        {item.color && (
                          <div className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }} />
                        )}
                        <span className={`truncate font-medium ${item.isCard ? 'text-violet-400' : 'text-[rgb(var(--c-primary-400))]'}`}>{item.source}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`text-sm font-bold whitespace-nowrap shrink-0 ${item.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
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
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-4 rounded-full bg-gradient-to-b from-[rgb(var(--c-primary-300))] to-[rgb(var(--c-primary-600))] shadow-[0_0_6px_rgb(var(--c-primary-500)/0.5)]" />
        <h3 className="text-sm font-bold text-slate-200">Evolução do Saldo (Mês Atual)</h3>
      </div>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="rgb(var(--c-primary-400))" stopOpacity={0.35}/>
                <stop offset="60%"  stopColor="rgb(var(--c-primary-500))" stopOpacity={0.08}/>
                <stop offset="100%" stopColor="rgb(var(--c-primary-600))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis 
              dataKey="day" 
              tick={{fontSize: 10, fill: 'rgb(var(--c-text-500))'}} 
              axisLine={false} 
              tickLine={false} 
              minTickGap={15}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgb(var(--c-bg-900) / 0.85)', 
                borderColor: 'rgb(var(--c-text-100) / 0.1)', 
                borderRadius: '12px', 
                fontSize: '12px', 
                backdropFilter: 'blur(16px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}
              itemStyle={{color: 'rgb(var(--c-text-100))'}}
              formatter={(val: number) => formatCurrency(val)}
              labelFormatter={(label) => `Dia ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="balance" 
              stroke="rgb(var(--c-primary-400))" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#colorBal)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: 'rgb(var(--c-primary-400))' }}
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
    <div className="space-y-2.5 pb-2">
      {insights.map((insight, idx) => (
        <div 
          key={insight.id} 
          className={`p-3.5 rounded-xl border flex gap-3 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 ${
            insight.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15 hover:border-emerald-500/30' :
            insight.type === 'warning' ? 'bg-amber-500/10  border-amber-500/20  hover:bg-amber-500/15  hover:border-amber-500/30' :
            'bg-[rgb(var(--c-primary-500)/0.1)]   border-[rgb(var(--c-primary-500)/0.2)]   hover:bg-[rgb(var(--c-primary-500)/0.15)]   hover:border-[rgb(var(--c-primary-500)/0.3)]'
          }`}
          style={{ animationDelay: `${idx * 60}ms` }}
        >
          <div className={`mt-0.5 shrink-0 ${ 
            insight.type === 'success' ? 'text-emerald-400' :
            insight.type === 'warning' ? 'text-amber-400'  :
            'text-blue-400'
          }`}>
            {insight.type === 'success' ? <CheckCircle size={16} /> :
             insight.type === 'warning' ? <AlertTriangle size={16} /> :
             <Info size={16} />}
          </div>
          <div>
            <h4 className={`text-xs font-bold tracking-wide ${
              insight.type === 'success' ? 'text-emerald-300' :
              insight.type === 'warning' ? 'text-amber-300'  :
              'text-blue-200'
            }`}>{insight.title}</h4>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{insight.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// --- 6. CREDIT CARD SUMMARY ITEM ---
export const CreditCardSummaryItem: React.FC<{ card: CreditCardType, usedAmount: number, usedPercentage: number, onClick?: () => void }> = ({ card, usedAmount, usedPercentage, onClick }) => {
  const isHigh = usedPercentage > 80;
  const isMed  = usedPercentage > 50 && !isHigh;
  
  return (
    <div 
      className="bg-white/4 border border-white/8 p-4 rounded-xl flex items-center justify-between hover:bg-white/8 hover:border-white/15 transition-all duration-200 cursor-pointer group hover:-translate-y-0.5"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div 
          className="p-2.5 rounded-xl text-white transition-all duration-200 shadow-md group-hover:scale-105 group-hover:shadow-lg"
          style={{ backgroundColor: card.color || '#1e293b', boxShadow: `0 4px 12px ${card.color || '#1e293b'}40` }}
        >
          <CreditCard size={18} />
        </div>
        <div>
          <p className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">{card.name}</p>
          <div className="flex gap-2 text-[10px] text-slate-500 uppercase font-semibold mt-0.5 tracking-wide">
            <span>Fecha: {card.closingDay}</span>
            <span className="opacity-40">•</span>
            <span>Vence: {card.dueDay}</span>
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5 tracking-wider">Utilizado</p>
        <p className={`text-sm font-bold ${isHigh ? 'text-red-400' : isMed ? 'text-amber-400' : 'text-white'}`}>
          {formatCurrency(usedAmount)}
        </p>
        <div className="flex items-center justify-end gap-1.5 mt-1.5">
          <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                isHigh ? 'bg-gradient-to-r from-red-500 to-red-400' : 
                isMed  ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 
                'bg-gradient-to-r from-blue-500 to-blue-400'
              }`}
              style={{ 
                width: `${Math.min(usedPercentage, 100)}%`,
                boxShadow: isHigh ? '0 0 6px rgba(239,68,68,0.6)' : isMed ? '0 0 6px rgba(245,158,11,0.6)' : '0 0 6px rgb(var(--c-primary-500)/0.6)'
              }}
            />
          </div>
          <p className={`text-[10px] font-bold ${isHigh ? 'text-red-400' : isMed ? 'text-amber-400' : 'text-slate-400'}`}>
            {usedPercentage}%
          </p>
        </div>
      </div>
    </div>
  );
};
