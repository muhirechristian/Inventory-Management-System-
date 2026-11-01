import React from 'react';

interface CodevLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function CodevLogo({ className = '', showText = false, size = 'md' }: CodevLogoProps) {
  let boxSize = 'size-10';
  let textSize = 'text-lg';

  if (size === 'sm') {
    boxSize = 'size-8';
    textSize = 'text-base';
  } else if (size === 'lg') {
    boxSize = 'size-14';
    textSize = 'text-2xl';
  } else if (size === 'xl') {
    boxSize = 'size-20';
    textSize = 'text-3xl';
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Codev Mark Icon */}
      <div className={`relative flex ${boxSize} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#14213D] via-[#1E293B] to-[#2563EB] shadow-md border border-white/20 p-2 text-white overflow-hidden`}>
        {/* Geometric accent */}
        <div className="absolute -top-2 -right-2 size-6 rounded-full bg-[#14B8A6]/40 blur-xs" />
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-full"
        >
          {/* C-bracket with modern code angles */}
          <path
            d="M26 9H16C12.134 9 9 12.134 9 16V24C9 27.866 12.134 31 16 31H26"
            stroke="#FFFFFF"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Tech diamond / accent node in Codev Teal & Royal Blue */}
          <rect
            x="22"
            y="14"
            width="9"
            height="9"
            rx="2.5"
            transform="rotate(45 22 14)"
            fill="#14B8A6"
          />
          <circle
            cx="22"
            cy="20"
            r="2"
            fill="#FFFFFF"
          />
        </svg>
      </div>

      {showText && (
        <div>
          <span className={`font-bold ${textSize} text-[#14213D] tracking-tight block leading-tight`}>
            Codev
          </span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#2563EB] block">
            Business Suite
          </span>
        </div>
      )}
    </div>
  );
}
