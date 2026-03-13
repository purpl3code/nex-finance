import React, { useState, useMemo } from 'react';
import { Account } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { PageShell } from './ui/PageShell';
import { PageHeader } from './ui/PageHeader';
import { GlassSelect } from './ui/GlassSelect';
import { GlassCard } from './ui/GlassCard';
import { TrendingUp, Calendar, ArrowRight, CreditCard, Repeat } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ForecastViewProps {
  accounts: Account[];
  onGetForecast: (month: number, year: number) => any;
}

export const ForecastView: React.FC<ForecastViewProps> = ({ accounts, onGetForecast }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const forecastData = useMemo(() => {
    return onGetForecast(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, onGetForecast]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const StatCard = ({ title, value, variant }: { title: string, value: string | number, variant: 'neutral' | 'good' | 'bad' }) => {
    const colors = {
      neutral: 'text-white bg-white/5 border-white/5',
      good: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      bad: 'text-red-400 bg-red-500/10 border-red-500/20',
    };
    return (
      <GlassCard className={`p-4 sm:p-5 ${colors[variant]} overflow-hidden`}>
        <p className="text-[10px] sm:text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider truncate" title={title}>{title}</p>
        <p className="text-lg sm:text-2xl font-bold truncate" title={typeof value === 'number' ? formatCurrency(value) : String(value)}>{typeof value === 'number' ? formatCurrency(value) : value}</p>
      </GlassCard>
    );
  };

  const getEventIcon = (type: string) => {
    switch(type) {
      case 'transaction': return <div className="p-1.5 bg-white/10 rounded text-slate-300"><Calendar size={14} /></div>;
      case 'recurring': return <div className="p-1.5 bg-blue-500/10 rounded text-blue-400"><Repeat size={14} /></div>;
      case 'invoice': return <div className="p-1.5 bg-red-500/10 rounded text-red-400"><CreditCard size={14} /></div>;
      case 'transfer_out': return <div className="p-1.5 bg-white/10 rounded text-slate-400"><ArrowRight size={14} /></div>;
      case 'transfer_in': return <div className="p-1.5 bg-white/10 rounded text-slate-400"><ArrowRight size={14} className="rotate-180" /></div>;
      default: return <div className="p-1.5 bg-white/10 rounded text-slate-300"><Calendar size={14} /></div>;
    }
  };

  const dayEvents = (dateStr: string) => {
    const events = forecastData.eventsByDay[dateStr] || [];
    return events.filter((e: any) => e.amount !== 0);
  };

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
                  options={Array.from({length: 12}, (_, i) => i).map(m => ({
                    value: m,
                    label: new Date(2000, m, 1).toLocaleDateString('pt-BR', {month: 'long'})
                  }))}
               />
             </div>
             <div className="w-24">
               <GlassSelect 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  options={Array.from({length: 5}, (_, i) => currentDate.getFullYear() - 1 + i).map(y => ({
                    value: y,
                    label: String(y)
                  }))}
               />
             </div>
          </div>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <StatCard title="Saldo Inicial" value={forecastData.initialBalance} variant="neutral" />
        <StatCard title="Saldo Final Previsto" value={forecastData.endBalance} variant={forecastData.endBalance >= 0 ? 'good' : 'bad'} />
        <StatCard title="Pior Cenário" value={forecastData.minBalance} variant={forecastData.minBalance >= 0 ? 'good' : 'bad'} />
        <StatCard 
           title="Risco de Negativo" 
           value={forecastData.riskDate ? format(parseISO(forecastData.riskDate), 'dd/MM') : 'Sem Risco'} 
           variant={forecastData.riskDate ? 'bad' : 'good'} 
        />
      </div>

      {/* Chart */}
      <GlassCard className="p-6">
        <h3 className="text-sm font-bold text-slate-300 mb-6 uppercase tracking-wider">Projeção de Saldo Diário</h3>
        <div className="h-72 w-full">
           <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData.dailyData}>
                 <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                 <XAxis 
                   dataKey="formattedDate" 
                   tick={{fontSize: 12, fill: '#94a3b8'}} 
                   axisLine={false}
                   tickLine={false}
                   minTickGap={30}
                 />
                 <YAxis 
                   tick={{fontSize: 12, fill: '#94a3b8'}} 
                   axisLine={false}
                   tickLine={false}
                   tickFormatter={(val) => `R$${val/1000}k`}
                 />
                 <Tooltip 
                   contentStyle={{backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px'}}
                   itemStyle={{color: '#fff'}}
                   formatter={(val: number) => formatCurrency(val)}
                   labelStyle={{color: '#94a3b8', marginBottom: '0.5rem'}}
                 />
                 <Area 
                   type="monotone" 
                   dataKey="balance" 
                   stroke="#3b82f6" 
                   strokeWidth={3}
                   fillOpacity={1} 
                   fill="url(#colorBalance)" 
                 />
              </AreaChart>
           </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Timeline View */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-200">Linha do Tempo Detalhada</h3>
        <div className="space-y-4">
           {forecastData.dailyData.map((day: any) => {
              const events = dayEvents(day.date);
              if (events.length === 0) return null;

              return (
                 <GlassCard key={day.date} className="overflow-hidden p-0">
                    <div className="bg-white/5 px-4 py-3 flex justify-between items-center border-b border-white/5">
                       <span className="text-sm font-medium text-slate-200 capitalize">{format(parseISO(day.date), 'dd ')} de {format(parseISO(day.date), 'MMMM', {locale: ptBR})}</span>
                       <span className={`text-xs font-bold ${day.balance < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                          Saldo do dia: {formatCurrency(day.balance)}
                       </span>
                    </div>
                    <div className="divide-y divide-white/5">
                       {events.map((event: any, idx: number) => (
                          <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                             <div className="flex items-center gap-3">
                                {getEventIcon(event.type)}
                                <div>
                                   <p className="text-sm text-slate-200 font-medium">
                                      {event.description || 'Sem descrição'}
                                      {!event.isReal && <span className="ml-2 text-[10px] bg-white/10 text-slate-300 px-1.5 py-0.5 rounded font-bold uppercase">Previsto</span>}
                                   </p>
                                   <p className="text-xs text-slate-500">
                                      {accounts.find(a => a.id === event.accountId)?.name || 'Conta não inf.'}
                                   </p>
                                </div>
                             </div>
                             <span className={`text-sm font-bold ${event.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {event.amount > 0 ? '+' : ''}{formatCurrency(event.amount)}
                             </span>
                          </div>
                       ))}
                    </div>
                 </GlassCard>
              );
           })}
        </div>
      </div>
    </PageShell>
  );
};