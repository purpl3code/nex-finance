import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
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

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="
        relative 
        w-[min(560px,92vw)]
        max-h-[85vh]
        overflow-hidden
        flex flex-col
        rounded-2xl
        glass-lg shadow-2xl
        transform transition-all duration-300 scale-100 opacity-100
      ">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body
  );
};

export const ModalBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`flex-1 overflow-y-auto p-4 custom-scrollbar ${className}`}>
    {children}
  </div>
);

export const ModalFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`shrink-0 p-4 border-t border-white/10 flex justify-end gap-3 bg-slate-900/50 backdrop-blur-sm ${className}`}>
    {children}
  </div>
);
