import React, { useState, useMemo } from 'react';
import { Account } from '../types';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine
} from 'recharts';
import { motion } from 'framer-motion';
import { PageShell } from './ui/PageShell';
import { PageHeader } from './ui/PageHeader';
import { GlassSelect } from './ui/GlassSelect';
import { GlassCard } from './ui/GlassCard';
import {
  Calendar, CreditCard, Repeat, ArrowRight,
  Wallet, TrendingUp, TrendingDown, ShieldCheck, ShieldAlert,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/* ════════════════════════════════════════════════════════════
   Types
   ════════════════════════════════════════════════════════════ */

interface ForecastViewProps {
  accounts: Account[];
  onGetForecast: (month: number, year: number) => any;
}

/* ════════════════════════════════════════════════════════════
   Mini Sparkline (lightweight SVG)
   ════════════════════════════════════════════════════════════ */

const MiniSparkline = ({ data, color = 'currentColor' }: { data: number[]; color?: string }) => {
  if (data.length < 3) return null;
  const step = Math.max(1, Math.floor(data.length / 15));
  const sampled = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  const min = Math.min(...sampled);
  const max = Math.max(...sampled);
  const range = max - min || 1;
  const h = 28;
  const w = 72;

  const points = sampled
    .map((v, i) => {
      const x = (i / (sampled.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} className="opacity-50 flex-shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

/* ════════════════════════════════════════════════════════════
   Animation Variants
   ════════════════════════════════════════════════════════════ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

/* ════════════════════════════════════════════════════════════
   Main Component
   ════════════════════════════════════════════════════════════ */

export const ForecastView: React.FC<ForecastViewProps> = ({ accounts, onGetForecast }) => {
  const [currentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const forecastData = useMemo(
    () => onGetForecast(selectedMonth, selectedYear),
    [selectedMonth, selectedYear, onGetForecast],
  );

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  /* ── Derived Calculations ── */

  const balanceDelta = forecastData.endBalance - forecastData.initialBalance;
  const balanceChangePercent =
    forecastData.initialBalance !== 0
      ? ((forecastData.endBalance - forecastData.initialBalance) / Math.abs(forecastData.initialBalance)) * 100
      : 0;

  const cashFlowSummary = useMemo(() => {
    const allEvents = Object.values(forecastData.eventsByDay).flat() as any[];
    let totalIncome = 0;
    let totalExpense = 0;
    let invoiceTotal = 0;

    allEvents.forEach((ev: any) => {
      if (ev.type === 'transfer_in' || ev.type === 'transfer_out') return;
      if (ev.amount > 0) {
        totalIncome += ev.amount;
      } else {
        totalExpense += Math.abs(ev.amount);
        if (ev.type === 'invoice') invoiceTotal += Math.abs(ev.amount);
      }
    });

    return { totalIncome, totalExpense, netFlow: totalIncome - totalExpense, invoiceTotal };
  }, [forecastData.eventsByDay]);

  const gradientOffset = useMemo(() => {
    const data = forecastData.dailyData;
    if (!data.length) return 1;
    const max = Math.max(...data.map((d: any) => d.balance));
    const min = Math.min(...data.map((d: any) => d.balance));
    if (max <= 0) return 0;
    if (min >= 0) return 1;
    return max / (max - min);
  }, [forecastData.dailyData]);

  const sparklineData = useMemo(
    () => forecastData.dailyData.map((d: any) => d.balance),
    [forecastData.dailyData],
  );

  const daysWithEvents = useMemo(
    () =>
      forecastData.dailyData.filter((day: any) => {
        const events = forecastData.eventsByDay[day.date] || [];
        return events.some((e: any) => e.amount !== 0);
      }),
    [forecastData],
  );

  const worstDay = useMemo(() => {
    if (!forecastData.dailyData.length) return null;
    let worst = forecastData.dailyData[0];
    forecastData.dailyData.forEach((d: any) => {
      if (d.balance < worst.balance) worst = d;
    });
    return worst;
  }, [forecastData.dailyData]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  /* ── Event Icon Helper ── */

  const getEventIcon = (type: string) => {
    const base = 'p-2 rounded-xl flex-shrink-0';
    switch (type) {
      case 'transaction':
        return <div className={`${base} bg-white/[0.06] text-slate-300`}><Calendar size={15} /></div>;
      case 'recurring':
        return <div className={`${base} bg-[rgb(var(--c-primary-500)/0.1)] text-[rgb(var(--c-primary-400))]`}><Repeat size={15} /></div>;
      case 'invoice':
        return <div className={`${base} bg-red-500/10 text-red-400`}><CreditCard size={15} /></div>;
      case 'transfer_out':
        return <div className={`${base} bg-white/[0.06] text-slate-400`}><ArrowRight size={15} /></div>;
      case 'transfer_in':
        return <div className={`${base} bg-white/[0.06] text-slate-400`}><ArrowRight size={15} className="rotate-180" /></div>;
      default:
        return <div className={`${base} bg-white/[0.06] text-slate-300`}><Calendar size={15} /></div>;
    }
  };

  /* ══════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════ */

  return (
    <PageShell>
      <PageHeader
        title="Previsão Financeira"
        subtitle="Simulação futura baseada em lançamentos, recorrências e faturas."
        controls={
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="w-32">
              <GlassSelect
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                options={Array.from({ length: 12 }, (_, i) => i).map((m) => ({
                  value: m,
                  label: new Date(2000, m, 1).toLocaleDateString('pt-BR', { month: 'long' }),
                }))}
              />
            </div>
            <div className="w-24">
              <GlassSelect
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                options={Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 1 + i).map((y) => ({
                  value: y,
                  label: String(y),
                }))}
              />
            </div>
          </div>
        }
      />

      <motion.div
        className="space-y-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        key={`${selectedMonth}_${selectedYear}`}
      >

        {/* ═══════════════ STAT CARDS ═══════════════ */}
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" variants={itemVariants}>

          {/* Saldo Inicial */}
          <GlassCard className="p-4 sm:p-5 relative overflow-hidden">
            <div className="absolute -right-3 -bottom-3 opacity-[0.03]"><Wallet size={72} /></div>
            <div className="flex items-start justify-between relative z-10">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 font-bold mb-1.5">Saldo Inicial</p>
                <p className="text-xl sm:text-2xl font-bold text-white truncate" title={formatCurrency(forecastData.initialBalance)}>
                  {formatCurrency(forecastData.initialBalance)}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.06] border border-white/10 flex-shrink-0 ml-2">
                <Wallet size={16} className="text-slate-400" />
              </div>
            </div>
          </GlassCard>

          {/* Saldo Final Previsto */}
          <GlassCard
            className={`p-4 sm:p-5 relative overflow-hidden ${
              forecastData.endBalance >= 0
                ? 'border-[rgb(var(--c-primary-500)/0.2)] shadow-[0_0_20px_rgb(var(--c-primary-500)/0.08)]'
                : 'border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.08)]'
            }`}
          >
            <div className="absolute -right-3 -bottom-3 opacity-[0.03]">
              {forecastData.endBalance >= 0 ? <TrendingUp size={72} /> : <TrendingDown size={72} />}
            </div>
            <div className="flex items-start justify-between relative z-10">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 font-bold mb-1.5">Saldo Final</p>
                <p
                  className={`text-xl sm:text-2xl font-bold truncate ${forecastData.endBalance >= 0 ? 'value-text-accent' : 'value-text-negative'}`}
                  title={formatCurrency(forecastData.endBalance)}
                >
                  {formatCurrency(forecastData.endBalance)}
                </p>
                {forecastData.initialBalance !== 0 && (
                  <div className="flex items-center gap-1 mt-1.5">
                    {balanceDelta >= 0
                      ? <ArrowUpRight size={12} className="text-emerald-400" />
                      : <ArrowDownRight size={12} className="text-red-400" />}
                    <span className={`text-[10px] font-semibold ${balanceDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {Math.abs(balanceChangePercent).toFixed(1)}% no mês
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
                <div
                  className={`p-2 rounded-xl border ${
                    forecastData.endBalance >= 0
                      ? 'bg-[rgb(var(--c-primary-500)/0.1)] border-[rgb(var(--c-primary-500)/0.2)]'
                      : 'bg-red-500/10 border-red-500/20'
                  }`}
                >
                  {forecastData.endBalance >= 0
                    ? <TrendingUp size={16} className="text-[rgb(var(--c-primary-400))]" />
                    : <TrendingDown size={16} className="text-red-400" />}
                </div>
                <div className="hidden sm:block">
                  <MiniSparkline data={sparklineData} color={forecastData.endBalance >= 0 ? 'rgb(var(--c-primary-400))' : '#f87171'} />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Pior Cenário */}
          <GlassCard
            className={`p-4 sm:p-5 relative overflow-hidden ${
              forecastData.minBalance < 0 ? 'border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.06)]' : ''
            }`}
          >
            <div className="absolute -right-3 -bottom-3 opacity-[0.03]"><ShieldAlert size={72} /></div>
            <div className="flex items-start justify-between relative z-10">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 font-bold mb-1.5">Pior Cenário</p>
                <p
                  className={`text-xl sm:text-2xl font-bold truncate ${forecastData.minBalance >= 0 ? 'text-white' : 'text-amber-400'}`}
                  title={formatCurrency(forecastData.minBalance)}
                >
                  {formatCurrency(forecastData.minBalance)}
                </p>
                {worstDay && (
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    em {format(parseISO(worstDay.date), 'dd/MM')}
                  </p>
                )}
              </div>
              <div className={`p-2 rounded-xl border flex-shrink-0 ml-2 ${
                forecastData.minBalance >= 0
                  ? 'bg-white/[0.06] border-white/10'
                  : 'bg-amber-500/10 border-amber-500/20'
              }`}>
                <ShieldAlert size={16} className={forecastData.minBalance >= 0 ? 'text-slate-400' : 'text-amber-400'} />
              </div>
            </div>
          </GlassCard>

          {/* Risco de Negativo */}
          <GlassCard
            className={`p-4 sm:p-5 relative overflow-hidden ${
              forecastData.riskDate
                ? 'border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.08)]'
                : 'border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.06)]'
            }`}
          >
            <div className="absolute -right-3 -bottom-3 opacity-[0.03]">
              {forecastData.riskDate ? <ShieldAlert size={72} /> : <ShieldCheck size={72} />}
            </div>
            <div className="flex items-start justify-between relative z-10">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 font-bold mb-1.5">Risco de Negativo</p>
                {forecastData.riskDate ? (
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-red-400">
                      {format(parseISO(forecastData.riskDate), 'dd/MM')}
                    </p>
                    <p className="text-[10px] text-red-400/70 mt-0.5">Saldo pode ficar negativo</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-lg sm:text-xl font-bold text-emerald-400">Sem Risco</p>
                  </div>
                )}
              </div>
              <div className={`p-2 rounded-xl border flex-shrink-0 ml-2 ${
                forecastData.riskDate
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/20'
              }`}>
                {forecastData.riskDate
                  ? <ShieldAlert size={16} className="text-red-400" />
                  : <ShieldCheck size={16} className="text-emerald-400" />}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* ═══════════════ CASH FLOW BAR ═══════════════ */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Fluxo de Caixa do Mês</h3>
              <span
                className={`text-sm font-bold px-3 py-1 rounded-full ${
                  cashFlowSummary.netFlow >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}
              >
                {cashFlowSummary.netFlow >= 0 ? '+' : ''}
                {formatCurrency(cashFlowSummary.netFlow)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-3 rounded-full bg-white/[0.04] overflow-hidden flex mb-5">
              {cashFlowSummary.totalIncome + cashFlowSummary.totalExpense > 0 && (
                <>
                  <motion.div
                    className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full"
                    style={{ borderRadius: cashFlowSummary.totalExpense === 0 ? '9999px' : '9999px 0 0 9999px' }}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(cashFlowSummary.totalIncome / (cashFlowSummary.totalIncome + cashFlowSummary.totalExpense)) * 100}%`,
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                  />
                  <motion.div
                    className="bg-gradient-to-r from-red-500 to-red-400 h-full"
                    style={{ borderRadius: cashFlowSummary.totalIncome === 0 ? '9999px' : '0 9999px 9999px 0' }}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(cashFlowSummary.totalExpense / (cashFlowSummary.totalIncome + cashFlowSummary.totalExpense)) * 100}%`,
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
                  />
                </>
              )}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  Entradas
                </div>
                <span className="text-sm font-bold text-emerald-400">{formatCurrency(cashFlowSummary.totalIncome)}</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-1">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  Saídas
                </div>
                <span className="text-sm font-bold text-red-400">{formatCurrency(cashFlowSummary.totalExpense)}</span>
              </div>
              {cashFlowSummary.invoiceTotal > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-1">
                    <CreditCard size={8} className="text-slate-500" />
                    Faturas
                  </div>
                  <span className="text-sm font-bold text-red-400">{formatCurrency(cashFlowSummary.invoiceTotal)}</span>
                </div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* ═══════════════ CHART ═══════════════ */}
        <motion.div variants={itemVariants}>
          <GlassCard className="p-5 sm:p-6">
            <h3 className="text-sm font-bold text-slate-300 mb-6 uppercase tracking-wider">Projeção de Saldo Diário</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData.dailyData}>
                  <defs>
                    {/* Split fill: theme above zero, red below */}
                    <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(var(--c-primary-400))" stopOpacity={0.25} />
                      <stop offset={`${gradientOffset * 100}%`} stopColor="rgb(var(--c-primary-400))" stopOpacity={0.03} />
                      <stop offset={`${gradientOffset * 100}%`} stopColor="#ef4444" stopOpacity={0.03} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.2} />
                    </linearGradient>
                    {/* Split stroke: theme above zero, red below */}
                    <linearGradient id="forecastStroke" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(var(--c-primary-400))" stopOpacity={1} />
                      <stop offset={`${gradientOffset * 100}%`} stopColor="rgb(var(--c-primary-400))" stopOpacity={1} />
                      <stop offset={`${gradientOffset * 100}%`} stopColor="#ef4444" stopOpacity={1} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={1} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />

                  <XAxis
                    dataKey="formattedDate"
                    tick={{ fontSize: 11, fill: 'rgb(var(--c-text-500))' }}
                    axisLine={false}
                    tickLine={false}
                    minTickGap={30}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'rgb(var(--c-text-500))' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) =>
                      val === 0 ? 'R$ 0' : Math.abs(val) >= 1000 ? `R$ ${(val / 1000).toFixed(0)}k` : `R$ ${val}`
                    }
                  />

                  {/* Zero reference line (only when there's negative territory) */}
                  {forecastData.minBalance < 0 && (
                    <ReferenceLine
                      y={0}
                      stroke="rgba(255,255,255,0.15)"
                      strokeDasharray="6 4"
                      label={{
                        value: 'Zero',
                        position: 'insideTopLeft',
                        fill: 'rgba(255,255,255,0.25)',
                        fontSize: 10,
                      }}
                    />
                  )}

                  <Tooltip
                    cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }}
                    content={({ active, payload }: any) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      const balance = data.balance;
                      const events = (forecastData.eventsByDay[data.date] || []).filter(
                        (e: any) => e.amount !== 0,
                      );

                      return (
                        <div className="glass-lg rounded-xl p-3.5 min-w-[200px] border border-white/10 shadow-2xl">
                          <p className="text-[11px] text-slate-400 font-medium mb-1 capitalize">
                            {format(parseISO(data.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                          </p>
                          <p className={`text-lg font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {formatCurrency(balance)}
                          </p>
                          {events.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-white/10 space-y-1.5">
                              {events.slice(0, 4).map((e: any, i: number) => (
                                <div key={i} className="flex justify-between gap-3">
                                  <span className="text-[10px] text-slate-500 truncate max-w-[130px]">
                                    {e.description}
                                  </span>
                                  <span
                                    className={`text-[10px] font-semibold whitespace-nowrap ${
                                      e.amount >= 0 ? 'text-emerald-400' : 'text-red-400'
                                    }`}
                                  >
                                    {e.amount > 0 ? '+' : ''}
                                    {formatCurrency(e.amount)}
                                  </span>
                                </div>
                              ))}
                              {events.length > 4 && (
                                <p className="text-[9px] text-slate-600">+{events.length - 4} mais...</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="url(#forecastStroke)"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#forecastFill)"
                    activeDot={{
                      r: 5,
                      stroke: 'rgb(var(--c-primary-400))',
                      strokeWidth: 2,
                      fill: 'rgb(var(--c-bg-900))',
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>

        {/* ═══════════════ TIMELINE ═══════════════ */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-200">Linha do Tempo Detalhada</h3>
            <span className="text-xs text-slate-500">
              {daysWithEvents.length} {daysWithEvents.length === 1 ? 'dia' : 'dias'} com movimentação
            </span>
          </div>

          {daysWithEvents.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Calendar size={32} className="mx-auto text-slate-600 mb-3" />
              <p className="text-sm text-slate-400">Nenhuma movimentação prevista para este mês.</p>
            </GlassCard>
          ) : (
            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute left-[19px] top-3 bottom-3 w-[2px] bg-gradient-to-b from-white/15 via-white/8 to-transparent rounded-full hidden sm:block" />

              <div className="space-y-3 sm:space-y-0">
                {daysWithEvents.map((day: any, dayIdx: number) => {
                  const events = (forecastData.eventsByDay[day.date] || []).filter((e: any) => e.amount !== 0);
                  const isToday = day.date === todayStr;

                  return (
                    <motion.div
                      key={day.date}
                      className="relative sm:pl-12 pb-4"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: dayIdx * 0.03, duration: 0.4 }}
                    >
                      {/* Timeline dot */}
                      <div
                        className={`hidden sm:flex absolute left-[11px] top-[6px] w-[18px] h-[18px] rounded-full border-2 items-center justify-center z-10 ${
                          isToday
                            ? 'border-[rgb(var(--c-primary-400))] bg-[rgb(var(--c-primary-500)/0.2)]'
                            : day.balance < 0
                              ? 'border-red-400/60 bg-red-500/10'
                              : 'border-white/20 bg-white/[0.06]'
                        }`}
                      >
                        <div
                          className={`w-[6px] h-[6px] rounded-full ${
                            isToday
                              ? 'bg-[rgb(var(--c-primary-400))]'
                              : day.balance < 0
                                ? 'bg-red-400/60'
                                : 'bg-white/20'
                          }`}
                        />
                        {isToday && (
                          <div className="absolute inset-0 rounded-full animate-ping bg-[rgb(var(--c-primary-400)/0.2)]" />
                        )}
                      </div>

                      {/* Day card */}
                      <GlassCard className="p-0 overflow-hidden" hoverEffect={false}>
                        {/* Day header */}
                        <div
                          className={`px-4 py-2.5 flex items-center justify-between border-b border-white/5 ${
                            isToday ? 'bg-[rgb(var(--c-primary-500)/0.06)]' : 'bg-white/[0.02]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm font-semibold text-slate-200 capitalize">
                              {format(parseISO(day.date), "dd 'de' MMMM", { locale: ptBR })}
                            </span>
                            {isToday && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[rgb(var(--c-primary-500)/0.15)] text-[rgb(var(--c-primary-400))] border border-[rgb(var(--c-primary-500)/0.2)]">
                                Hoje
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              day.balance < 0 ? 'bg-red-500/10 text-red-400' : 'bg-white/[0.06] text-slate-400'
                            }`}
                          >
                            {formatCurrency(day.balance)}
                          </span>
                        </div>

                        {/* Events list */}
                        <div className="divide-y divide-white/[0.04]">
                          {events.map((event: any, idx: number) => (
                            <div
                              key={idx}
                              className="px-4 py-2.5 flex items-center justify-between hover:bg-white/[0.03] transition-colors duration-200"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {getEventIcon(event.type)}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm text-slate-200 font-medium truncate">
                                      {event.description || 'Sem descrição'}
                                    </p>
                                    {!event.isReal && (
                                      <span className="flex-shrink-0 text-[9px] bg-white/[0.06] text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-white/[0.06]">
                                        Previsto
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    {accounts.find((a) => a.id === event.accountId)?.name || 'Conta não inf.'}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`text-sm font-bold flex-shrink-0 ml-3 ${
                                  event.amount >= 0 ? 'text-emerald-400' : 'text-red-400'
                                }`}
                              >
                                {event.amount > 0 ? '+' : ''}
                                {formatCurrency(event.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </PageShell>
  );
};