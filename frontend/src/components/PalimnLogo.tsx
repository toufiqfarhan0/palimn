import React from 'react';
import { motion } from 'framer-motion';

interface PalimnLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const PalimnLogo: React.FC<PalimnLogoProps> = ({ size = 'md', showSubtitle = true }) => {
  const iconSize = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs';
  const titleSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';

  return (
    <div className="flex items-center gap-3 select-none group">
      {/* Emblem with breathing orbital ring */}
      <div className="relative flex items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -inset-1 rounded-lg bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-cyan-500/20 blur-sm pointer-events-none"
        />
        <div
          className={`${iconSize} rounded-lg border border-slate-700/80 bg-gradient-to-b from-[#161B2C] to-[#0D101A] flex items-center justify-center text-slate-100 font-mono font-bold tracking-tight shadow-sm group-hover:border-cyan-400/50 group-hover:text-cyan-300 transition-all duration-300 relative z-10`}
        >
          <span>Pλ</span>
        </div>
      </div>

      {/* Wordmark */}
      <div>
        <div className="flex items-center gap-2">
          <span className={`font-display font-bold tracking-wider ${titleSize} text-white group-hover:text-cyan-100 transition-colors`}>
            PALIMN
          </span>
          <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 bg-slate-800/80 text-cyan-400/90 rounded border border-slate-700/60 tracking-wider">
            Cloud
          </span>
        </div>
        {showSubtitle && (
          <p className="text-[10px] text-[#9AA4B2] font-sans tracking-tight leading-none mt-0.5">
            Temporal Memory for AI Agents
          </p>
        )}
      </div>
    </div>
  );
};
