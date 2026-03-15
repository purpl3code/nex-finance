import React from 'react';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
}

export const PageShell: React.FC<PageShellProps> = ({ children, className = '' }) => {
  return (
    <div className={`w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-3 sm:space-y-6 ${className}`}>
      {children}
    </div>
  );
};