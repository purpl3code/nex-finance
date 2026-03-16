import React, { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';

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

  if (!visible) return null;

  const handleMainClick = () => {
    if (actions.length === 1) {
      actions[0].onClick();
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleActionClick = (action: MobileFabAction) => {
    action.onClick();
    setIsOpen(false);
  };

  const getVariantColor = (variant?: string) => {
    switch (variant) {
      case 'secondary': return 'bg-white/10 text-white hover:bg-white/20';
      case 'danger': return 'bg-red-500 text-white hover:bg-red-600';
      case 'success': return 'bg-emerald-500 text-white hover:bg-emerald-600';
      case 'warning': return 'bg-amber-500 text-white hover:bg-amber-600';
      default: return 'bg-blue-600 text-white hover:bg-blue-700';
    }
  };

  return (
    <>
      {/* Overlay for focus when menu is open */}
      {isOpen && actions.length > 1 && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="md:hidden fixed z-40 bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 flex flex-col items-end gap-3 pointer-events-none" ref={menuRef}>
        
        {/* Speed Dial Actions */}
        <div className={`flex flex-col items-end gap-3 transition-all duration-300 mb-2 ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none absolute bottom-0 right-0'}`}>
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className="flex items-center gap-3 group"
            >
              <span className="bg-white/10 text-white text-sm px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md border border-white/10 font-medium">
                {action.label}
              </span>
              <div className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center border border-white/10 ${getVariantColor(action.variant)}`}>
                {action.icon}
              </div>
            </button>
          ))}
        </div>

        {/* Main FAB Button */}
        <button
          onClick={handleMainClick}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 pointer-events-auto active:scale-90 border border-white/20 text-white ${isOpen ? 'bg-white/10 rotate-45' : 'bg-blue-600'}`}
          aria-label={actions.length > 1 && isOpen ? "Fechar menu" : "Adicionar"}
        >
          {actions.length === 1 ? (
             actions[0].icon
          ) : (
             <Plus size={28} strokeWidth={2.5} />
          )}
        </button>
      </div>
    </>
  );
};
