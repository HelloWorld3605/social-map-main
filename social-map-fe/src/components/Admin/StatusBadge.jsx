import React from 'react';

const variantStyles = {
  success: 'bg-[#C7CFA0] text-[#3b3f24]',
  warning: 'bg-[#F2E9A0] text-[#5c531a]',
  danger: 'bg-[#F3C6D9] text-[#7a2444]',
  info: 'bg-[#BBD4E8] text-[#1d3a52]',
  neutral: 'bg-gray-100 text-gray-600'
};

export default function StatusBadge({ label, variant }) {
  const style = variantStyles[variant] || variantStyles.neutral;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${style}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
