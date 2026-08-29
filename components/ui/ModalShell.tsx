import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = ''
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

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/65 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          
          {/* Modal panel */}
          <motion.div
            className={`
              relative 
              w-[min(560px,92vw)]
              max-h-[88vh]
              overflow-hidden
              flex flex-col
              rounded-2xl
              glass-lg
              shadow-2xl
              border border-white/12
              ${className}
            `}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.96, y: 8   }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {/* Top accent highlight */}
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/28 to-transparent pointer-events-none" />

            {/* Subtle top-right glow */}
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[var(--accent-glow)] blur-3xl pointer-events-none opacity-40" />

            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/8 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[var(--accent)] to-[rgb(var(--c-primary-700))]" />
                <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/8 text-slate-400 hover:text-white transition-all duration-200 hover:rotate-90"
              >
                <X size={18} />
              </button>
            </div>

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export const ModalBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`flex-1 overflow-y-auto p-5 custom-scrollbar ${className}`}>
    {children}
  </div>
);

export const ModalFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`shrink-0 px-5 py-4 border-t border-white/8 flex justify-end gap-3 bg-white/4 backdrop-blur-md ${className}`}>
    {children}
  </div>
);
