import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline' | 'info' | 'purple' | 'teal';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  let variantClasses = 'bg-[#F1F5F9] text-[#0F172A] border-[#E2E8F0]';
  switch (variant) {
    case 'success':
      variantClasses = 'bg-emerald-50 text-[#16A34A] border-emerald-200';
      break;
    case 'warning':
      variantClasses = 'bg-amber-50 text-[#F59E0B] border-amber-200';
      break;
    case 'destructive':
      variantClasses = 'bg-red-50 text-[#DC2626] border-red-200';
      break;
    case 'info':
      variantClasses = 'bg-blue-50 text-[#2563EB] border-blue-200';
      break;
    case 'teal':
      variantClasses = 'bg-teal-50 text-[#0F766E] border-teal-200';
      break;
    case 'purple':
      variantClasses = 'bg-slate-100 text-[#14213D] border-[#CBD5E1]';
      break;
    case 'outline':
      variantClasses = 'bg-transparent text-[#0F172A] border-[#E2E8F0]';
      break;
  }

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold tracking-wide ${variantClasses} ${className}`}>
      {children}
    </span>
  );
}
