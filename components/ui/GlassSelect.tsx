import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, X } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface GlassSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'options'> {
  label?: string;
  error?: string;
  options?: SelectOption[];
  groups?: SelectGroup[];
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
  placeholder = "Selecione...",
  ...props 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Find selected label
  let selectedLabel = placeholder;
  if (value !== undefined && value !== '') {
    if (options) {
      const opt = options.find(o => String(o.value) === String(value));
      if (opt) selectedLabel = opt.label;
    } else if (groups) {
      for (const g of groups) {
        const opt = g.options.find(o => String(o.value) === String(value));
        if (opt) {
          selectedLabel = opt.label;
          break;
        }
      }
    }
  }

  const handleSelect = (val: string | number) => {
    if (onChange) {
      // Mock the event object
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
        <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">
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
            w-full bg-slate-900/50 border border-slate-700/50 rounded-xl 
            pl-4 pr-10 py-2.5 text-sm text-left
            focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
            transition-all duration-200
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-600/50'}
            ${error ? 'border-red-500/50 focus:ring-red-500/50' : ''}
            ${value === '' || value === undefined ? 'text-slate-400' : 'text-slate-100'}
            ${className}
          `}
        >
          <span className="block truncate">{selectedLabel}</span>
        </button>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
          <ChevronDown size={16} />
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-400 ml-1">{error}</p>}

      {isOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="
            relative 
            w-[92vw] sm:w-[min(400px,92vw)]
            max-h-[80vh] sm:max-h-[70vh]
            bg-slate-900 border border-slate-700/50
            rounded-2xl
            shadow-2xl
            flex flex-col
            animate-in zoom-in-95 duration-200
          ">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">{label || 'Selecione'}</h2>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Options List */}
            <div className="overflow-y-auto p-2">
              {options && options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => handleSelect(opt.value)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm transition-colors
                    ${opt.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}
                    ${String(value) === String(opt.value) ? 'text-blue-400 bg-blue-500/10 font-medium' : 'text-slate-200'}
                  `}
                >
                  <span className="truncate">{opt.label}</span>
                  {String(value) === String(opt.value) && <Check size={16} className="shrink-0 ml-2" />}
                </button>
              ))}

              {groups && groups.map((group, idx) => (
                <div key={idx} className="mb-2 last:mb-0">
                  <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-900/95 backdrop-blur z-10">
                    {group.label}
                  </div>
                  {group.options.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => handleSelect(opt.value)}
                      className={`
                        w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm transition-colors
                        ${opt.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}
                        ${String(value) === String(opt.value) ? 'text-blue-400 bg-blue-500/10 font-medium' : 'text-slate-200'}
                      `}
                    >
                      <span className="truncate">{opt.label}</span>
                      {String(value) === String(opt.value) && <Check size={16} className="shrink-0 ml-2" />}
                    </button>
                  ))}
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
