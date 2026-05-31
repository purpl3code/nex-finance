import React, { useState, useCallback, useRef, useEffect } from 'react';

interface CurrencyInputProps {
  label?: string;
  error?: string;
  hint?: string;
  /** The raw numeric string value (e.g. "1234.56" or "0") managed by the parent */
  value: string;
  /** Called with the raw numeric string (e.g. "1234.56") on change */
  onChange: (rawValue: string) => void;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

/**
 * Formats a raw cents integer to Brazilian Real display format.
 * e.g. 123456 -> "1.234,56"
 *      0      -> "0,00"
 */
function formatCentsToDisplay(cents: number): string {
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const integerPart = Math.floor(absCents / 100);
  const decimalPart = absCents % 100;
  
  // Format integer part with dots as thousand separators
  const intStr = integerPart.toLocaleString('pt-BR');
  const decStr = decimalPart.toString().padStart(2, '0');
  
  return `${isNegative ? '-' : ''}${intStr},${decStr}`;
}

/**
 * Converts a raw numeric string (like "1234.56") to cents integer.
 */
function rawToCents(raw: string): number {
  if (!raw || raw === '' || raw === '-') return 0;
  // Handle both dot and comma as decimal separator
  const normalized = raw.replace(',', '.');
  const num = parseFloat(normalized);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Converts cents integer to raw numeric string (like "1234.56" or "0").
 */
function centsToRaw(cents: number): string {
  if (cents === 0) return '0';
  const isNegative = cents < 0;
  const absCents = Math.abs(cents);
  const integer = Math.floor(absCents / 100);
  const decimal = absCents % 100;
  const decStr = decimal.toString().padStart(2, '0');
  // Remove trailing zeros for cleaner raw value
  const raw = `${integer}.${decStr}`;
  return `${isNegative ? '-' : ''}${raw}`;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  error,
  hint,
  value,
  onChange,
  placeholder = '0,00',
  required,
  autoFocus,
  className = '',
  icon,
}) => {
  // Convert parent's raw value to cents for internal state
  const centsFromProps = rawToCents(value);
  const [displayValue, setDisplayValue] = useState(() => {
    if (!value || value === '' || value === '0') return '';
    return formatCentsToDisplay(centsFromProps);
  });
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Sync display when parent value changes externally (e.g. form reset)
  useEffect(() => {
    const newCents = rawToCents(value);
    if (!value || value === '' || value === '0') {
      setDisplayValue('');
    } else {
      const currentDisplayCents = displayToCents(displayValue);
      if (currentDisplayCents !== newCents) {
        setDisplayValue(formatCentsToDisplay(newCents));
      }
    }
  }, [value]);
  
  /**
   * Parse display string back to cents (e.g. "1.234,56" -> 123456)
   */
  function displayToCents(display: string): number {
    if (!display) return 0;
    // Remove dots (thousand separators), replace comma with dot
    const cleaned = display.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, arrow keys
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowedKeys.includes(e.key)) return;
    
    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return;
    
    // Allow minus sign only at the beginning (for negative values)
    if (e.key === '-') return;
    
    // Only allow digits
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    
    // Handle paste or direct input — extract only digits and minus
    const onlyDigits = inputVal.replace(/[^\d-]/g, '');
    
    // Handle empty / cleared
    if (!onlyDigits || onlyDigits === '' || onlyDigits === '-') {
      setDisplayValue('');
      onChange('');
      return;
    }
    
    // Check for negative sign
    const isNegative = onlyDigits.startsWith('-');
    const digits = onlyDigits.replace(/-/g, '');
    
    if (!digits) {
      setDisplayValue('');
      onChange('');
      return;
    }

    // Convert to cents (the digit string IS the cents value)
    let cents = parseInt(digits, 10);
    if (isNaN(cents)) {
      setDisplayValue('');
      onChange('');
      return;
    }
    
    if (isNegative) cents = -cents;
    
    // Format for display
    const formatted = formatCentsToDisplay(cents);
    setDisplayValue(formatted);
    
    // Send raw value back to parent
    const raw = centsToRaw(cents);
    onChange(raw);
  }, [onChange]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // Select all on focus for easy replacement
    setTimeout(() => {
      e.target.setSelectionRange(e.target.value.length, e.target.value.length);
    }, 0);
  }, []);

  const defaultIcon = icon || <span className="text-sm font-semibold">R$</span>;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-[10px] sm:text-[11px] font-bold text-slate-400 mb-1.5 ml-1 uppercase tracking-wide sm:tracking-wider truncate">
          {label}
        </label>
      )}
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[var(--accent)] transition-colors duration-200 pointer-events-none">
          {defaultIcon}
        </div>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          autoFocus={autoFocus}
          className={`
            w-full 
            bg-white/5 hover:bg-white/7
            border border-white/10 hover:border-white/18
            rounded-xl 
            pl-10 pr-4 py-2.5 
            text-sm text-slate-100 
            placeholder:text-slate-600
            focus:outline-none 
            focus:ring-2 focus:ring-[var(--ring)]
            focus:border-[rgb(var(--c-primary-500)/0.5)]
            focus:bg-[rgb(var(--c-primary-950)/0.2)]
            transition-all duration-200
            ${error ? 'border-red-500/50 focus:ring-red-500/40 focus:border-red-500/50' : ''}
            ${className}
          `}
        />
      </div>
      {hint && !error && (
        <p className="mt-1 text-[11px] text-slate-500 ml-1">{hint}</p>
      )}
      {error && (
        <p className="mt-1 text-[11px] text-red-400 ml-1 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-red-400 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};
