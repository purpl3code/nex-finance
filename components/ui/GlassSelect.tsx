import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, X } from 'lucide-react';

interface SelectOption {
  value: string | number;
  label: React.ReactNode;
  disabled?: boolean;
  color?: string;
}

interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface GlassSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'options'> {
  label?: string;
  error?: string;
  options?: SelectOption[];
  groups?: SelectGroup[];
  placeholder?: string;
}

export const GlassSelect: React.FC<GlassSelectProps> = ({ 
  label, 
  error, 
  options,
  groups,
  className = '', 
  value,
  onChange,
  disabled,
  placeholder = "Selecione..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Find selected label and color
  let selectedLabel: React.ReactNode = placeholder;
  let selectedColor: string | undefined = undefined;
  if (value !== undefined && value !== '') {
    if (options) {
      const opt = options.find(o => String(o.value) === String(value));
      if (opt) {
        selectedLabel = opt.label;
        selectedColor = opt.color;
      }
    } else if (groups) {
      for (const g of groups) {
        const opt = g.options.find(o => String(o.value) === String(value));
        if (opt) {
          selectedLabel = opt.label;
          selectedColor = opt.color;
          break;
        }
      }
    }
  }

  const handleSelect = (val: string | number) => {
    if (onChange) {
      onChange({
        target: { value: String(val) }
      } as React.ChangeEvent<HTMLSelectElement>);
    }
    setIsOpen(false);
  };

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-[10px] sm:text-[11px] font-semibold text-slate-400 mb-1.5 ml-1 uppercase tracking-wider truncate">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(true)}
          className={`
            w-full bg-white/[0.04] hover:bg-white/[0.08]
            border border-white/[0.1] hover:border-white/[0.2]
            rounded-xl pl-4 pr-10 py-2.5 text-sm text-left
            focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[rgb(var(--c-primary-400)/0.6)]
            transition-all duration-200 select-none
            ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
            ${error ? 'border-red-500/50 focus:ring-red-500/40' : ''}
            ${value === '' || value === undefined ? 'text-slate-400' : 'text-slate-100 font-medium'}
            ${className}
          `}
        >
          <div className="flex items-center gap-2.5 truncate">
            {selectedColor && (
              <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: selectedColor }} />
            )}
            <span className="block truncate">{selectedLabel}</span>
          </div>
        </button>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <ChevronDown size={16} />
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-400 ml-1 font-medium">{error}</p>}

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/65 backdrop-blur-md transition-opacity duration-200" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="
            relative 
            w-[92vw] sm:w-[min(420px,92vw)]
            max-h-[80vh] sm:max-h-[72vh]
            glass-lg
            rounded-2xl
            shadow-2xl
            border border-white/12
            flex flex-col
            overflow-hidden
            animate-in zoom-in-95 fade-in duration-200
          ">
            {/* Top highlight bar */}
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/8">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-4 rounded-full bg-[var(--accent)]" />
                <h2 className="text-sm font-bold text-white tracking-tight">{label || 'Selecione uma opção'}</h2>
              </div>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/8 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Options List */}
            <div className="overflow-y-auto p-2.5 space-y-1 custom-scrollbar">
              {(!groups || groups.length === 0) && options && options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => handleSelect(opt.value)}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-sm transition-all duration-150 active:scale-[0.99]
                    ${opt.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/8'}
                    ${String(value) === String(opt.value) ? 'text-[rgb(var(--c-primary-300))] bg-[rgb(var(--c-primary-500)/0.15)] font-semibold border border-[rgb(var(--c-primary-500)/0.25)]' : 'text-slate-200 border border-transparent'}
                  `}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {opt.color && (
                      <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: opt.color }} />
                    )}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {String(value) === String(opt.value) && (
                    <div className="w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center text-white shrink-0 ml-2 shadow-sm">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}

              {groups && groups.map((group, idx) => (
                <div key={idx} className="mb-2 last:mb-0">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-white/[0.03] rounded-lg mb-1">
                    {group.label}
                  </div>
                  <div className="space-y-0.5">
                    {group.options.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={opt.disabled}
                        onClick={() => handleSelect(opt.value)}
                        className={`
                          w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-sm transition-all duration-150 active:scale-[0.99]
                          ${opt.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/8'}
                          ${String(value) === String(opt.value) ? 'text-[rgb(var(--c-primary-300))] bg-[rgb(var(--c-primary-500)/0.15)] font-semibold border border-[rgb(var(--c-primary-500)/0.25)]' : 'text-slate-200 border border-transparent'}
                        `}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {opt.color && (
                            <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: opt.color }} />
                          )}
                          <span className="truncate">{opt.label}</span>
                        </div>
                        {String(value) === String(opt.value) && (
                          <div className="w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center text-white shrink-0 ml-2 shadow-sm">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
