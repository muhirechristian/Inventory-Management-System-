import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'brand' | 'teal';
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', children, ...props }, ref) => {
    let baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer';

    let variantStyles = '';
    switch (variant) {
      case 'default':
        variantStyles = 'bg-[#14213D] text-white hover:bg-[#14213D]/90 shadow-sm active:scale-[0.99]';
        break;
      case 'secondary':
        variantStyles = 'bg-[#2563EB] text-white font-semibold hover:bg-[#2563EB]/90 border border-[#2563EB] shadow-sm active:scale-[0.99]';
        break;
      case 'teal':
        variantStyles = 'bg-[#14B8A6] text-white font-semibold hover:bg-[#14B8A6]/90 border border-[#14B8A6] shadow-sm active:scale-[0.99]';
        break;
      case 'outline':
        variantStyles = 'border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F1F5F9] shadow-xs active:scale-[0.99]';
        break;
      case 'destructive':
        variantStyles = 'bg-[#DC2626] text-white hover:bg-[#DC2626]/90 shadow-sm active:scale-[0.99]';
        break;
      case 'ghost':
        variantStyles = 'hover:bg-[#F1F5F9] text-[#0F172A]';
        break;
      case 'brand':
        variantStyles = 'bg-[#14213D] text-white hover:bg-[#14213D]/90';
        break;
    }

    let sizeStyles = '';
    switch (size) {
      case 'sm':
        sizeStyles = 'h-8 px-3 text-xs gap-1.5';
        break;
      case 'default':
        sizeStyles = 'h-10 px-4 text-sm gap-2';
        break;
      case 'lg':
        sizeStyles = 'h-11 px-5 text-base gap-2';
        break;
      case 'icon':
        sizeStyles = 'size-9 p-0';
        break;
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
