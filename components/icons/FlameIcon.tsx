import React from 'react';

export const FlameIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8 text-white" }) => (
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
      d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7.014a8.002 8.002 0 0110.014 10.014c-2.014 2.486-5 2.986-7.014 2.986-1 0-2.657-.343-2.657-.343z"
    />
  </svg>
);