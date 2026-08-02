import React from 'react';

interface NearbyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  lightText?: boolean;
  className?: string;
}

export const NearbyLogo: React.FC<NearbyLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  lightText = false,
  className = ''
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-[22px]',
    lg: 'text-[28px]',
    xl: 'text-[36px]'
  };

  const subtitleSizes = {
    sm: 'text-[10px]',
    md: 'text-[12px]',
    lg: 'text-[14px]',
    xl: 'text-[16px]'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Radar Badge Icon - Circular Green Badge with Orange Top-Right Accent Dot */}
      <div className={`relative ${iconSizes[size]} flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-br from-[#16A34A] to-[#15803D] shadow-md shadow-emerald-600/20 group`}>
        {/* Radar Line Art SVG - Matches Official Nearby Logo */}
        <svg viewBox="0 0 100 100" className="w-3/5 h-3/5 text-white stroke-current fill-none stroke-[7] stroke-linecap-round stroke-linejoin-round">
          {/* Outer arc */}
          <path d="M 22,50 A 28,28 0 1,1 78,50" className="opacity-95" />
          {/* Inner arc */}
          <path d="M 36,50 A 14,14 0 1,1 64,50" className="opacity-100" />
          {/* Center Target Dot */}
          <circle cx="50" cy="50" r="5" className="fill-white stroke-none" />
          {/* Sweep line pointer */}
          <line x1="50" y1="50" x2="72" y2="28" className="stroke-[7] stroke-white" />
          {/* Signal dots */}
          <circle cx="30" cy="35" r="2.5" className="fill-white stroke-none opacity-80" />
          <circle cx="50" cy="78" r="2.5" className="fill-white stroke-none opacity-80" />
        </svg>

        {/* Top-Right Orange Accent Dot */}
        <span className="absolute -top-0.5 -right-0.5 w-[28%] h-[28%] rounded-full bg-[#F97316] border-2 border-white shadow-sm" />
      </div>

      {/* Brand Name & Tagline */}
      <div className="flex flex-col justify-center">
        <div className={`font-extrabold tracking-tight font-display leading-none ${textSizes[size]} ${lightText ? 'text-white' : 'text-[#111827] dark:text-white'}`}>
          Nearby<span className="text-[#16A34A]">.</span>
        </div>
        {showSubtitle && (
          <div className={`hidden sm:flex font-semibold tracking-tight ${subtitleSizes[size]} ${lightText ? 'text-slate-300' : 'text-[#6B7280] dark:text-slate-300'} items-center gap-1 mt-0.5`}>
            <span>Discover</span>
            <span className="text-[#16A34A] font-bold">•</span>
            <span>Connect</span>
            <span className="text-[#16A34A] font-bold">•</span>
            <span>Belong</span>
          </div>
        )}
      </div>
    </div>
  );
};
