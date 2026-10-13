import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Download, X } from 'lucide-react';
import { AppUpdate } from '../services/updateService';
import { GlassButton } from './ui/GlassButton';

interface UpdateNotificationMenuProps {
  update: AppUpdate | null;
  currentVersion: string;
  isInstalling: boolean;
  progress: number;
  status: string | null;
  statusIsError: boolean;
  onInstall: () => void;
  className?: string;
}

export const UpdateNotificationMenu: React.FC<UpdateNotificationMenuProps> = ({
  update, currentVersion, isInstalling, progress, status, statusIsError, onInstall, className = '',
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <GlassButton
        type="button"
        variant="secondary"
        size="icon"
        icon={<Bell size={17} />}
        aria-label={update ? `Notificações. Atualização ${update.version} disponível` : 'Notificações'}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Notificações"
        onClick={() => setOpen(value => !value)}
        className="relative"
      >
        {update && <span aria-hidden="true" className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-400 ring-2 ring-slate-950" />}
      </GlassButton>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Notificações"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-[calc(100%+0.65rem)] z-[60] w-[min(21rem,calc(100vw-1.5rem))] rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Notificações</h3>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Fechar notificações"><X size={15} /></button>
            </div>

            {update ? (
              <div className="rounded-xl border border-[rgb(var(--c-primary-400)/0.2)] bg-[rgb(var(--c-primary-500)/0.07)] p-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgb(var(--c-primary-500)/0.15)] text-[rgb(var(--c-primary-300))]"><Download size={17} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-100">Atualização {update.version} disponível</p>
                    <p className="mt-1 text-xs text-slate-400">Versão instalada: {currentVersion}</p>
                  </div>
                </div>

                {update.releaseNotes && <p className="mt-3 max-h-24 overflow-y-auto whitespace-pre-wrap text-xs text-slate-400">{update.releaseNotes}</p>}
                {status && <p role={statusIsError ? 'alert' : 'status'} className={`mt-3 text-xs ${statusIsError ? 'text-red-400' : 'text-slate-300'}`}>{status}</p>}
                {isInstalling && <div className="mt-3 space-y-1"><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full bg-[rgb(var(--c-primary-400))] transition-[width] ${progress < 0 ? 'w-1/3 animate-pulse' : ''}`} style={progress >= 0 ? { width: `${progress}%` } : undefined} /></div><p className="text-right text-[10px] text-slate-500">{progress < 0 ? 'Baixando…' : `${progress}%`}</p></div>}

                <GlassButton type="button" variant="primary" size="sm" className="mt-3 w-full" isLoading={isInstalling} onClick={onInstall}>
                  {isInstalling ? 'Baixando atualização…' : status?.includes('instalador') ? 'Abrir instalador' : status?.includes('Permita') ? 'Tentar novamente' : 'Atualizar agora'}
                </GlassButton>
              </div>
            ) : (
              <p className="rounded-xl bg-white/[0.03] px-3 py-5 text-center text-xs text-slate-400">Nenhuma notificação no momento.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
