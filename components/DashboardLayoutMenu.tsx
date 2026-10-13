import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Check, LayoutDashboard, RotateCcw } from 'lucide-react';
import { GlassButton } from './ui/GlassButton';

export type DashboardSection = 'monthlyBalance' | 'availableBalance' | 'balanceChart' | 'insights' | 'categorySpending' | 'creditCards' | 'recentActivity';
export type DashboardLayoutMode = 'default' | 'custom';
export type DashboardGroup = 'overview' | 'charts' | 'details';

const groups: { id: DashboardGroup; label: string }[] = [
  { id: 'overview', label: 'Resumo financeiro' },
  { id: 'charts', label: 'Gráfico e insights' },
  { id: 'details', label: 'Despesas, cartões e atividade' },
];

const sections: { id: DashboardSection; label: string }[] = [
  { id: 'monthlyBalance', label: 'Saldo restante no mês' },
  { id: 'availableBalance', label: 'Total disponível' },
  { id: 'balanceChart', label: 'Evolução do saldo' },
  { id: 'insights', label: 'Insights financeiros' },
  { id: 'categorySpending', label: 'Despesas por categoria' },
  { id: 'creditCards', label: 'Resumo dos cartões' },
  { id: 'recentActivity', label: 'Atividade recente' },
];

interface DashboardLayoutMenuProps {
  mode: DashboardLayoutMode;
  visibleSections: DashboardSection[];
  groupOrder: DashboardGroup[];
  widgetOrder: DashboardSection[];
  onModeChange: (mode: DashboardLayoutMode) => void;
  onSectionsChange: (sections: DashboardSection[]) => void;
  onGroupOrderChange: (groups: DashboardGroup[]) => void;
  onWidgetOrderChange: (sections: DashboardSection[]) => void;
  className?: string;
}

export const DashboardLayoutMenu: React.FC<DashboardLayoutMenuProps> = ({ mode, visibleSections, groupOrder, widgetOrder, onModeChange, onSectionsChange, onGroupOrderChange, onWidgetOrderChange, className = '' }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const toggleSection = (section: DashboardSection) => {
    const next = visibleSections.includes(section)
      ? visibleSections.filter(item => item !== section)
      : [...visibleSections, section];
    if (next.length) onSectionsChange(next);
  };

  const widgetGroup = (section: DashboardSection) => {
    if (['monthlyBalance', 'availableBalance'].includes(section)) return 'overview';
    if (['balanceChart', 'insights'].includes(section)) return 'charts';
    return 'details';
  };
  const moveWidget = (section: DashboardSection, offset: -1 | 1) => {
    const groupItems = widgetOrder.filter(item => widgetGroup(item) === widgetGroup(section));
    const index = groupItems.indexOf(section);
    const target = index + offset;
    if (index < 0 || target < 0 || target >= groupItems.length) return;
    const first = widgetOrder.indexOf(groupItems[index]);
    const second = widgetOrder.indexOf(groupItems[target]);
    const next = [...widgetOrder];
    [next[first], next[second]] = [next[second], next[first]];
    onWidgetOrderChange(next);
  };
  const moveGroup = (group: DashboardGroup, offset: -1 | 1) => {
    const index = groupOrder.indexOf(group);
    const target = index + offset;
    if (index < 0 || target < 0 || target >= groupOrder.length) return;
    const next = [...groupOrder];
    [next[index], next[target]] = [next[target], next[index]];
    onGroupOrderChange(next);
  };

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <GlassButton
        type="button"
        variant="secondary"
        size="icon"
        icon={<LayoutDashboard size={16} />}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Personalizar layout do dashboard"
        title="Personalizar layout do dashboard"
        onClick={() => setOpen(value => !value)}
      />

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Personalizar layout do dashboard"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-[min(19rem,calc(100vw-1rem))] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-2xl [scrollbar-width:thin]"
            style={{ maxHeight: 'calc(100dvh - 5rem - env(safe-area-inset-top) - env(safe-area-inset-bottom))', WebkitOverflowScrolling: 'touch' }}
          >
            <div className="mb-3 flex items-start justify-between gap-3 px-1">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Layout do dashboard</h3>
                <p className="mt-0.5 text-xs text-slate-400">Escolha como organizar sua visão geral.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Fechar opções de layout">×</button>
            </div>

            <div className="space-y-1.5">
              <button type="button" onClick={() => onModeChange('default')} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${mode === 'default' ? 'bg-[rgb(var(--c-primary-500)/0.12)]' : 'bg-white/[0.03] hover:bg-white/[0.07]'}`}>
                <span><span className="block text-sm font-medium text-slate-100">Layout padrão</span><span className="block text-[11px] text-slate-400">Exibe todas as seções originais.</span></span>
                {mode === 'default' && <Check size={16} className="text-[rgb(var(--c-primary-300))]" />}
              </button>
              <button type="button" onClick={() => onModeChange('custom')} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${mode === 'custom' ? 'bg-[rgb(var(--c-primary-500)/0.12)]' : 'bg-white/[0.03] hover:bg-white/[0.07]'}`}>
                <span><span className="block text-sm font-medium text-slate-100">Meu layout</span><span className="block text-[11px] text-slate-400">Escolha as seções que deseja ver.</span></span>
                {mode === 'custom' && <Check size={16} className="text-[rgb(var(--c-primary-300))]" />}
              </button>
            </div>

            {mode === 'custom' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 space-y-1 overflow-hidden border-t border-white/8 pt-2">
                <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Widgets e ordem</p>
                {groupOrder.map((groupId, groupIndex) => {
                  const group = groups.find(item => item.id === groupId)!;
                  return (
                  <div key={group.id} className="mt-1 rounded-xl bg-white/[0.025] p-1.5">
                    <div className="flex items-center justify-between px-1 pb-1">
                      <p className="text-[10px] font-medium text-slate-500">{group.label}</p>
                      <span className="flex gap-1">
                        <motion.button type="button" whileTap={{ scale: .82 }} disabled={groupIndex === 0} onClick={() => moveGroup(group.id, -1)} aria-label={`Mover ${group.label} para cima`} className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-25"><ArrowUp size={13} /></motion.button>
                        <motion.button type="button" whileTap={{ scale: .82 }} disabled={groupIndex === groupOrder.length - 1} onClick={() => moveGroup(group.id, 1)} aria-label={`Mover ${group.label} para baixo`} className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-25"><ArrowDown size={13} /></motion.button>
                      </span>
                    </div>
                    {widgetOrder.filter(id => widgetGroup(id) === group.id).map(id => {
                      const section = sections.find(item => item.id === id)!;
                      const siblings = widgetOrder.filter(item => widgetGroup(item) === group.id);
                      const index = siblings.indexOf(id);
                      return <div key={id} className="flex items-center gap-1 rounded-lg px-1 py-1 hover:bg-white/[0.04]">
                        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-xs text-slate-300">
                          <input type="checkbox" checked={visibleSections.includes(id)} onChange={() => toggleSection(id)} className="accent-[rgb(var(--c-primary-400))]" />
                          <span className="truncate">{section.label}</span>
                        </label>
                        <motion.button type="button" whileTap={{ scale: .82 }} disabled={index === 0} onClick={() => moveWidget(id, -1)} aria-label={`Mover ${section.label} para cima`} className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-25"><ArrowUp size={13} /></motion.button>
                        <motion.button type="button" whileTap={{ scale: .82 }} disabled={index === siblings.length - 1} onClick={() => moveWidget(id, 1)} aria-label={`Mover ${section.label} para baixo`} className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-25"><ArrowDown size={13} /></motion.button>
                      </div>;
                    })}
                  </div>
                  );
                })}
                <button type="button" onClick={() => { onSectionsChange(sections.map(section => section.id)); onWidgetOrderChange(sections.map(section => section.id)); onGroupOrderChange(groups.map(group => group.id)); }} className="mt-1 inline-flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-medium text-[rgb(var(--c-primary-300))] hover:text-white">
                  <RotateCcw size={12} /> Restaurar todas as seções
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
