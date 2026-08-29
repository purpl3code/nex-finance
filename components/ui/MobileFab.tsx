import React, { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { createPortal } from 'react-dom';

interface MobileFabAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
}

interface MobileFabProps {
  visible?: boolean;
  actions: MobileFabAction[];
}

export const MobileFab: React.FC<MobileFabProps> = ({ visible = true, actions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close speed-dial when FAB becomes invisible
  useEffect(() => {
    if (!visible) setIsOpen(false);
  }, [visible]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleMainClick = () => {
    if (actions.length === 1) {
      actions[0].onClick();
    } else {
      setIsOpen(prev => !prev);
    }
  };

  const handleActionClick = (action: MobileFabAction) => {
    action.onClick();
    setIsOpen(false);
  };

  const getVariantColor = (variant?: string) => {
    switch (variant) {
      case 'secondary': return 'bg-white/10 text-white hover:bg-white/20 border-white/20';
      case 'danger':    return 'bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-[0_4px_16px_rgba(239,68,68,0.4)] border-red-400/30';
      case 'success':   return 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-[0_4px_16px_rgba(16,185,129,0.4)] border-emerald-400/30';
      case 'warning':   return 'bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-[0_4px_16px_rgba(245,158,11,0.4)] border-amber-400/30';
      default:          return 'bg-gradient-to-tr from-[rgb(var(--c-primary-600))] to-[rgb(var(--c-primary-400))] text-white shadow-[0_4px_20px_var(--accent-glow)] border-[rgb(var(--c-primary-300)/0.4)]';
    }
  };

  const content = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[9998] md:hidden"
        style={{
          opacity:        isOpen ? 1 : 0,
          pointerEvents:  isOpen ? 'auto' : 'none',
          transition:     'opacity 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={() => setIsOpen(false)}
      />

      {/* FAB container */}
      <div
        ref={menuRef}
        className="fixed md:hidden z-[9999] flex flex-col items-end gap-3 pointer-events-none"
        style={{
          bottom:         'calc(1.25rem + env(safe-area-inset-bottom))',
          right:          '1.25rem',
          opacity:        visible ? 1 : 0,
          transform:      visible ? 'translateY(0)' : 'translateY(16px)',
          transition:     'opacity 220ms ease, transform 220ms ease',
        }}
      >
        {/* Speed Dial Actions */}
        <div
          className="flex flex-col items-end gap-3 mb-1"
          style={{
            opacity:       isOpen ? 1 : 0,
            pointerEvents: isOpen && visible ? 'auto' : 'none',
            transition:    'opacity 200ms ease',
          }}
        >
          {actions.map((action, idx) => (
            <div
              key={action.id}
              style={{
                transform:  isOpen ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.9)',
                opacity:    isOpen ? 1 : 0,
                transition: `transform 220ms cubic-bezier(0.16, 1, 0.3, 1) ${idx * 40}ms, opacity 220ms ease ${idx * 40}ms`,
              }}
            >
              <button
                onClick={() => handleActionClick(action)}
                className="flex items-center gap-3 group active:scale-95 transition-transform duration-150"
              >
                <span className="glass-lg text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xl border border-white/12 whitespace-nowrap tracking-wide">
                  {action.label}
                </span>
                <div
                  className={`w-11 h-11 rounded-2xl shadow-xl flex items-center justify-center border transition-all duration-150 group-hover:scale-105 ${getVariantColor(action.variant)}`}
                >
                  {action.icon}
                </div>
              </button>
            </div>
          ))}
        </div>

        {/* Main FAB Button */}
        <button
          onClick={handleMainClick}
          aria-label={isOpen ? 'Fechar menu' : 'Adicionar'}
          style={{ pointerEvents: visible ? 'auto' : 'none' }}
          className={`
            w-14 h-14 rounded-2xl shadow-2xl
            flex items-center justify-center
            active:scale-90
            border
            transition-all duration-300 ease-out
            ${isOpen
              ? 'bg-white/15 text-white rotate-45 border-white/25 backdrop-blur-xl'
              : `${getVariantColor()} hover:scale-105`}
          `}
        >
          {actions.length === 1 ? (
            actions[0].icon
          ) : (
            <Plus
              size={26}
              strokeWidth={2.5}
              className={isOpen ? 'text-white' : 'text-[rgb(var(--c-primary-foreground))]'}
            />
          )}
        </button>
      </div>
    </>
  );

  return createPortal(content, document.body);
};
