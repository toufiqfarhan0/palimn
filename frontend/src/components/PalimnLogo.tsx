import React from 'react';

interface PalimnLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const PalimnLogo: React.FC<PalimnLogoProps> = ({ size = 'md', showSubtitle = true }) => {
  const iconBox = size === 'sm' ? 'w-6 h-6 text-[11px]' : size === 'lg' ? 'w-9 h-9 text-[13px]' : 'w-7 h-7 text-[12px]';
  const titleSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-[14px]';

  return (
    <div className="flex items-center gap-2.5 select-none group">
      {/* Crisp geometric mark matching temporal amber theme */}
      <div
        className={`${iconBox} rounded-[7px] bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-mono font-black tracking-tighter shadow-[0_0_14px_rgba(245,158,11,0.5)] border border-amber-300/50 flex-shrink-0 transition-transform group-hover:scale-105`}
      >
        <span>Pλ</span>
      </div>

      {/* Brand title */}
      <div>
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-['Plus_Jakarta_Sans',sans-serif] font-extrabold tracking-tight ${titleSize} text-white`}>
            PALIMN
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
        </div>
        {showSubtitle && (
          <p className="text-[10px] text-slate-400 font-['Plus_Jakarta_Sans',sans-serif] tracking-tight leading-none mt-1">
            Temporal Memory for AI
          </p>
        )}
      </div>
    </div>
  );
};
