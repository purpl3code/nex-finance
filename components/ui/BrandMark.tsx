import React from 'react';

interface BrandMarkProps {
  size?: number;
  className?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({ size = 24, className = '' }) => (
  <svg
    aria-hidden="true"
    className={className}
    width={size}
    height={size}
    viewBox="0 0 256 256"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fill="currentColor">
      <path d="M44 36h44v184H44z" />
      <path d="M168 36h44v184h-44z" />
      <path d="M74 36h46l25 75H99z" />
      <path d="M111 145h46l25 75h-46z" />
    </g>
  </svg>
);
