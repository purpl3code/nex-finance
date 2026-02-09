import React, { useState, useMemo } from 'react';
import { Account } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, Calendar, ArrowRight, CreditCard, Repeat, RefreshCw } from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';
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
      neutral: 'text-white bg-slate-800 border-slate-700',
      good: 'text-emerald-400 bg-emerald-900/10 border-emerald-900/30',
      bad: 'text-red-400 bg-red-900/10 border-red-900/30',
    };
    return (
      <div className={`p-4 rounded-xl border ${colors[variant]} shadow-sm`}>
        <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wider">{title}</p>
        <p className="text-xl font-bold">{typeof value === 'number' ? formatCurrency(value) : value}</p>
      </div>
    );
  };

  const getEventIcon = (type: string) => {
    switch(type) {
      case 'transaction': return <div className="p-1.5 bg-slate-700 rounded text-slate-300"><Calendar size={14} /></div>;
      case 'recurring': return <div className="p-1.5 bg-blue-500/10 rounded text-blue-400"><Repeat size={14} /></div>;
      case 'invoice': return <div className="p-1.5 bg-red-500/10 rounded text-red-400"><CreditCard size={14} /></div>;
      case 'transfer_out': return <div className="p-1.5 bg-slate-700 rounded text-slate-400"><ArrowRight size={14} /></div>;
      case 'transfer_in': return <div className="p-1.5 bg-slate-700 rounded text-slate-400"><ArrowRight size={14} className="rotate-180" /></div>;
      default: return <div className="p-1.5 bg-slate-700 rounded text-slate-300"><Calendar size={14} /></div>;
    }
  };

  const dayEvents = (dateStr: string) => forecastData.eventsByDay[dateStr] || [];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
        <div>
           <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
             <TrendingUp size={20} className="text-blue-500" />
             Previsão Financeira
           </h2>
           <p className="text-xs text-slate-400">Simulação baseada em lançamentos, recorrências e faturas.</p>
        </div>
        <div className="flex gap-2">
           <select className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white" value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
              {Array.from({length: 12}, (_, i) => i).map(m => <option key={m} value={m}>{new Date(2000, m, 1).toLocaleDateString('pt-BR', {month: 'long'})}</option>)}
           </select>
           <select className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
              {Array.from({length: 5}, (_, i) => currentDate.getFullYear() - 1 + i).map(y => <option key={y} value={y}>{y}</option>)}
           </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Projeção de Saldo Diário</h3>
        <div className="h-64 w-full">
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
                   contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px'}}
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
      </div>

      {/* Timeline View */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-300">Linha do Tempo</h3>
        <div className="space-y-2">
           {forecastData.dailyData.map((day: any) => {
              const events = dayEvents(day.date);
              if (events.length === 0) return null;

              return (
                 <div key={day.date} className="bg-slate-800/60 border border-slate-700/50 rounded-lg overflow-hidden">
                    <div className="bg-slate-800 px-4 py-2 flex justify-between items-center border-b border-slate-700/50">
                       <span className="text-sm font-medium text-slate-200">{format(parseISO(day.date), 'dd ')} de {format(parseISO(day.date), 'MMMM', {locale: ptBR})}</span>
                       <span className={`text-xs font-medium ${day.balance < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                          Saldo dia: {formatCurrency(day.balance)}
                       </span>
                    </div>
                    <div className="divide-y divide-slate-700/30">
                       {events.map((event: any, idx: number) => (
                          <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-slate-700/20 transition-colors">
                             <div className="flex items-center gap-3">
                                {getEventIcon(event.type)}
                                <div>
                                   <p className="text-sm text-slate-200 font-medium">
                                      {event.description || 'Sem descrição'}
                                      {!event.isReal && <span className="ml-2 text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">Previsto</span>}
                                   </p>
                                   <p className="text-xs text-slate-500">
                                      {accounts.find(a => a.id === event.accountId)?.name || 'Conta não inf.'}
                                   </p>
                                </div>
                             </div>
                             <span className={`text-sm font-semibold ${event.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {event.amount > 0 ? '+' : ''}{formatCurrency(event.amount)}
                             </span>
                          </div>
                       ))}
                    </div>
                 </div>
              );
           })}
        </div>
      </div>
    </div>
  );
};