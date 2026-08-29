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
      className="relative overflow-hidden group p-5 sm:p-6" 
      variant={isPositive ? 'success' : 'danger'}
    >
      {/* Dynamic ambient mesh gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isPositive ? 'from-emerald-500/15 via-emerald-500/5 to-transparent' : 'from-rose-500/15 via-rose-500/5 to-transparent'} opacity-80 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Decorative holographic watermark icon */}
      <div className={`absolute -top-3 -right-3 p-4 ${isPositive ? 'text-emerald-400' : 'text-rose-400'} opacity-[0.09] group-hover:opacity-[0.18] group-hover:scale-105 group-hover:rotate-6 transition-all duration-700 pointer-events-none`}>
        <ShoppingBag size={110} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-4.5 rounded-full ${isPositive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]'}`} />
            <h3 className="text-slate-300 text-xs font-bold uppercase tracking-wider">Saldo Restante no Mês</h3>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm ${
            isPositive 
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
          }`}>
            {isPositive ? 'Positivo' : 'Atenção'}
          </span>
        </div>
        
        <AnimatedNumber 
          value={summary.remainingBalance} 
          format={formatCurrency} 
          className={`block text-3xl sm:text-4xl font-extrabold mb-5 tracking-tight tabular-nums ${isPositive ? 'value-text-positive' : 'value-text-negative'}`} 
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
          <div className="flex items-center justify-between sm:justify-start gap-2 text-slate-200 bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-emerald-500/20 backdrop-blur-md">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
                <ArrowUp size={12} strokeWidth={2.5} />
              </div>
              <span className="text-slate-300 text-xs truncate">Entradas</span>
            </div>
            <span className="font-bold text-emerald-300 tabular-nums ml-auto">{formatCurrency(summary.income)}</span>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-2 text-slate-200 bg-rose-500/10 px-3.5 py-2 rounded-xl border border-rose-500/20 backdrop-blur-md">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-5 h-5 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0 text-rose-400">
                <ArrowDown size={12} strokeWidth={2.5} />
              </div>
              <span className="text-slate-300 text-xs truncate">Gastos</span>
            </div>
            <span className="font-bold text-rose-300 tabular-nums ml-auto">{formatCurrency(summary.totalSpent)}</span>
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
    <GlassCard className="relative overflow-hidden group p-5 sm:p-6" variant="accent">
      {/* Ambient background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--c-primary-500)/0.15)] via-[rgb(var(--c-primary-600)/0.05)] to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Decorative icon */}
      <div className="absolute -top-3 -right-3 p-4 text-[rgb(var(--c-primary-400))] opacity-[0.09] group-hover:opacity-[0.18] group-hover:scale-105 group-hover:-rotate-6 transition-all duration-700 pointer-events-none">
        <TrendingUp size={110} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-4.5 rounded-full bg-[rgb(var(--c-primary-400))] shadow-[0_0_8px_rgb(var(--c-primary-500)/0.8)]" />
            <h3 className="text-slate-300 text-xs font-bold uppercase tracking-wider">Total Disponível Projetado</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-[rgb(var(--c-primary-500)/0.15)] text-[rgb(var(--c-primary-300))] border-[rgb(var(--c-primary-500)/0.3)] backdrop-blur-sm">
            Projeção
          </span>
        </div>

        <AnimatedNumber 
          value={predicted} 
          format={formatCurrency} 
          className={`block text-3xl sm:text-4xl font-extrabold mb-5 tracking-tight tabular-nums ${isPositive ? 'value-text-accent' : 'value-text-negative'}`} 
        />

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs bg-white/[0.04] px-3.5 py-2 rounded-xl border border-white/[0.08] backdrop-blur-md">
            <span className="text-slate-400 font-medium">Saldo Líquido em Contas</span>
            <span className="text-white font-bold tabular-nums">{formatCurrency(totalCurrentBalance)}</span>
          </div>
          <div className="flex justify-between items-center text-xs bg-rose-500/8 px-3.5 py-2 rounded-xl border border-rose-500/15 backdrop-blur-md">
            <span className="text-slate-400 font-medium">Compromissos Futuros (Cartões + Dívidas)</span>
            <span className="text-rose-400 font-bold tabular-nums">- {formatCurrency(summary.pendingRecurring + creditCardUsedLimit + totalDebts)}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

// --- 3. RECENT ACTIVITY LIST ---
export const RecentActivityList: React.FC<{ activities: any[] }> = ({ activities }) => {
  return (
    <GlassCard className="h-full flex flex-col p-5 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-4.5 rounded-full bg-gradient-to-b from-[rgb(var(--c-primary-300))] to-[rgb(var(--c-primary-600))] shadow-sm" />
          <h3 className="text-base font-bold text-white tracking-tight">Últimas Movimentações</h3>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
        {activities.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-slate-500 h-full">
             <Calendar size={32} className="mb-2 opacity-20" />
             <p className="text-sm font-medium">Nenhuma movimentação neste mês.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {activities.map((item, idx) => (
              <div 
                key={`${item.source}-${item.id}`} 
                className="p-3 rounded-2xl flex items-center justify-between hover:bg-white/[0.06] active:bg-white/[0.04] transition-all duration-200 group border border-transparent hover:border-white/[0.08]"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
                  <div className="text-xl bg-white/[0.06] p-2.5 rounded-2xl shrink-0 border border-white/[0.08] group-hover:border-white/[0.15] group-hover:bg-white/[0.09] transition-all duration-200 shadow-sm">
                    <AppleEmoji emoji={item.category?.emoji || (item.isCard ? '💳' : '💰')} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-100 truncate group-hover:text-white transition-colors">
                      {item.description || item.category?.name || 'Sem descrição'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="shrink-0 font-medium">{new Date(item.date).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}</span>
                      <span className="shrink-0 opacity-40">•</span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        {item.color && (
                          <div className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }} />
                        )}
                        <span className={`truncate font-semibold ${item.isCard ? 'text-violet-300' : 'text-[rgb(var(--c-primary-300))]'}`}>{item.source}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`text-sm font-extrabold whitespace-nowrap shrink-0 tabular-nums ${item.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
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
    <GlassCard className="h-full flex flex-col p-5 sm:p-6">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-1.5 h-4.5 rounded-full bg-gradient-to-b from-[rgb(var(--c-primary-300))] to-[rgb(var(--c-primary-600))] shadow-[0_0_8px_rgb(var(--c-primary-500)/0.6)]" />
        <h3 className="text-sm font-bold text-slate-100 tracking-tight">Evolução do Saldo (Mês Atual)</h3>
      </div>
      <div className="flex-1 min-h-[210px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="rgb(var(--c-primary-400))" stopOpacity={0.4}/>
                <stop offset="65%"  stopColor="rgb(var(--c-primary-500))" stopOpacity={0.1}/>
                <stop offset="100%" stopColor="rgb(var(--c-primary-600))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="day" 
              tick={{fontSize: 11, fill: 'rgb(var(--c-text-400))', fontWeight: 500}} 
              axisLine={false} 
              tickLine={false} 
              minTickGap={15}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgb(var(--c-bg-900) / 0.9)', 
                borderColor: 'rgb(var(--c-text-100) / 0.12)', 
                borderRadius: '14px', 
                fontSize: '12px', 
                backdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
                padding: '8px 12px'
              }}
              itemStyle={{color: 'rgb(var(--c-text-100))', fontWeight: 'bold'}}
              formatter={(val: number) => formatCurrency(val)}
              labelFormatter={(label) => `Dia ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="balance" 
              stroke="rgb(var(--c-primary-400))" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorBal)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: 'rgb(var(--c-primary-500))' }}
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
          className={`p-4 rounded-2xl border flex gap-3 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 shadow-sm ${
            insight.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-500/15 hover:border-emerald-500/35' :
            insight.type === 'warning' ? 'bg-amber-500/10  border-amber-500/25  hover:bg-amber-500/15  hover:border-amber-500/35' :
            'bg-[rgb(var(--c-primary-500)/0.1)]   border-[rgb(var(--c-primary-500)/0.25)]   hover:bg-[rgb(var(--c-primary-500)/0.15)]   hover:border-[rgb(var(--c-primary-500)/0.35)]'
          }`}
          style={{ animationDelay: `${idx * 60}ms` }}
        >
          <div className={`mt-0.5 shrink-0 p-1.5 rounded-xl ${ 
            insight.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
            insight.type === 'warning' ? 'bg-amber-500/20 text-amber-400'  :
            'bg-blue-500/20 text-blue-400'
          }`}>
            {insight.type === 'success' ? <CheckCircle size={16} /> :
             insight.type === 'warning' ? <AlertTriangle size={16} /> :
             <Info size={16} />}
          </div>
          <div>
            <h4 className={`text-xs font-bold tracking-tight ${
              insight.type === 'success' ? 'text-emerald-300' :
              insight.type === 'warning' ? 'text-amber-300'  :
              'text-blue-200'
            }`}>{insight.title}</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{insight.message}</p>
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
      className="bg-white/[0.04] border border-[var(--glass-border)] p-4 rounded-2xl flex items-center justify-between hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-200 cursor-pointer group hover:-translate-y-0.5 active:scale-[0.99] shadow-sm hover:shadow-md"
      onClick={onClick}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div 
          className="p-3 rounded-2xl text-white transition-all duration-200 shadow-md group-hover:scale-105 group-hover:shadow-lg shrink-0"
          style={{ backgroundColor: card.color || '#1e293b', boxShadow: `0 4px 14px ${card.color || '#1e293b'}50` }}
        >
          <CreditCard size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white group-hover:text-[rgb(var(--c-primary-300))] transition-colors truncate">{card.name}</p>
          <div className="flex gap-2 text-[10px] text-slate-400 font-semibold mt-0.5 tracking-wide">
            <span>Fecha dia {card.closingDay}</span>
            <span className="opacity-40">•</span>
            <span>Vence dia {card.dueDay}</span>
          </div>
        </div>
      </div>
      
      <div className="text-right shrink-0 ml-3">
        <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5 tracking-wider">Utilizado</p>
        <p className={`text-sm font-bold tabular-nums ${isHigh ? 'text-rose-400' : isMed ? 'text-amber-400' : 'text-white'}`}>
          {formatCurrency(usedAmount)}
        </p>
        <div className="flex items-center justify-end gap-1.5 mt-1.5">
          <div className="w-20 sm:w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                isHigh ? 'bg-gradient-to-r from-rose-500 to-rose-400' : 
                isMed  ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 
                'bg-gradient-to-r from-[rgb(var(--c-primary-500))] to-[rgb(var(--c-primary-300))]'
              }`}
              style={{ 
                width: `${Math.min(usedPercentage, 100)}%`,
                boxShadow: isHigh ? '0 0 8px rgba(244,63,94,0.8)' : isMed ? '0 0 8px rgba(245,158,11,0.8)' : '0 0 8px rgb(var(--c-primary-500)/0.8)'
              }}
            />
          </div>
          <p className={`text-[10px] font-bold tabular-nums ${isHigh ? 'text-rose-400' : isMed ? 'text-amber-400' : 'text-slate-400'}`}>
            {usedPercentage}%
          </p>
        </div>
      </div>
    </div>
  );
};
