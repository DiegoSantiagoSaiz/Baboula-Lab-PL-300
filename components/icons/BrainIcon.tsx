import React from 'react';

export const BrainIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8 text-white" }) => (
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
      d="M9.5 21a2.5 2.5 0 110-5 2.5 2.5 0 010 5zm0 0v-2.5m0 0c2.29 0 4.5-1.5 4.5-4s-2.21-4-4.5-4S5 9.5 5 12s2.21 4 4.5 4zm0 0V11m0-5.5a4.5 4.5 0 014.5 4.5"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm0 0v-2.5m0 0c-2.29 0-4.5-1.5-4.5-4s2.21-4 4.5-4S19 9.5 19 12s-2.21 4-4.5 4zm0 0V11m0-5.5a4.5 4.5 0 00-4.5 4.5"
    />
  </svg>
);