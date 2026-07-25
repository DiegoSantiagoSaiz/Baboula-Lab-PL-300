
import React from 'react';

export const StopIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor" 
    strokeWidth={2}
  >
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
    />
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M9 9h6v6H9V9z" 
    />
  </svg>
);
