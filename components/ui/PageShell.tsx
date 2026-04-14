import React from 'react';
import { motion } from 'framer-motion';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

const pageVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.38, ease: 'easeOut' as const }
  },
  exit: { 
    opacity: 0, 
    y: -8,
    transition: { duration: 0.2, ease: 'easeIn' as const }
  }
};

export const PageShell: React.FC<PageShellProps> = ({ children, className = '' }) => {
  return (
    <motion.div 
      className={`w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-3 sm:space-y-6 ${className}`}
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {children}
    </motion.div>
  );
};