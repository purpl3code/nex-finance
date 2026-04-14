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
      case 'secondary': return 'bg-white/10 text-white hover:bg-white/20';
      case 'danger':    return 'bg-red-500    text-white hover:bg-red-600';
      case 'success':   return 'bg-emerald-500 text-white hover:bg-emerald-600';
      case 'warning':   return 'bg-amber-500   text-white hover:bg-amber-600';
      default:          return 'bg-[var(--accent)] text-[rgb(var(--c-primary-foreground))] hover:brightness-110';
    }
  };

  // ─── Portal: renders directly on document.body ───────────────────────────
  // This completely escapes any parent overflow, transform, backdrop-filter,
  // or stacking-context that could misplace a position:fixed element.
  const content = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] md:hidden"
        style={{
          opacity:        isOpen ? 1 : 0,
          pointerEvents:  isOpen ? 'auto' : 'none',
          transition:     'opacity 200ms ease',
        }}
        onClick={() => setIsOpen(false)}
      />

      {/* FAB container — always fixed at bottom-right, never unmounted */}
      <div
        ref={menuRef}
        className="fixed md:hidden z-[9999] flex flex-col items-end gap-3"
        style={{
          bottom:         'calc(1rem + env(safe-area-inset-bottom))',
          right:          '1rem',
          opacity:        visible ? 1 : 0,
          transform:      visible ? 'translateY(0)' : 'translateY(16px)',
          pointerEvents:  visible ? 'auto' : 'none',
          transition:     'opacity 220ms ease, transform 220ms ease',
        }}
      >
        {/* Speed Dial Actions */}
        <div
          className="flex flex-col items-end gap-3 mb-2"
          style={{
            opacity:       isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
            transition:    'opacity 200ms ease',
          }}
        >
          {actions.map((action, idx) => (
            <div
              key={action.id}
              style={{
                transform:  isOpen ? 'translateY(0)'    : 'translateY(10px)',
                opacity:    isOpen ? 1                  : 0,
                transition: `transform 200ms ease ${idx * 45}ms, opacity 200ms ease ${idx * 45}ms`,
              }}
            >
              <button
                onClick={() => handleActionClick(action)}
                className="flex items-center gap-3 group"
              >
                <span className="glass-lg text-white text-sm px-3 py-1.5 rounded-xl shadow-lg border border-white/10 font-medium whitespace-nowrap">
                  {action.label}
                </span>
                <div
                  className={`w-11 h-11 rounded-full shadow-xl flex items-center justify-center border border-white/15 transition-transform duration-150 active:scale-90 ${getVariantColor(action.variant)}`}
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
          className={`
            w-14 h-14 rounded-full shadow-2xl
            flex items-center justify-center
            active:scale-90
            border border-white/20
            transition-all duration-300
            ${isOpen
              ? 'bg-white/10 rotate-45 shadow-none'
              : `${getVariantColor()} shadow-[0_0_20px_var(--accent-glow)]`}
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
