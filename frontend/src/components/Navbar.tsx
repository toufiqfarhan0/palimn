import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PalimnLogo } from './PalimnLogo';

const NAV = [
  { to: '/chat',         label: 'Console'      },
  { to: '/graph',        label: 'Graph'        },
  { to: '/benchmark',    label: 'Benchmark'    },
  { to: '/architecture', label: 'Architecture' },
];

export const Navbar: React.FC = () => {
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => { setMobile(false); }, [location]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <>
      {/* ── Announcement strip ─────────────────────────────────── */}
      <div className="w-full bg-gradient-to-r from-amber-600/90 via-amber-500/90 to-blue-600/90 px-4 py-1.5 flex items-center justify-center gap-3 text-white">
        <span className="text-[11px] font-semibold tracking-wide font-['Plus_Jakarta_Sans',sans-serif] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
          <span>HackHydra Track 3 · 96.60% Recall@20 on LongMemEval_S · 0 LLM Hallucinations</span>
        </span>
      </div>

      {/* ── Main nav ──────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 w-full transition-all duration-200 border-b border-white/[0.08] bg-[#07090E]/80 backdrop-blur-xl"
        style={{
          boxShadow: scrolled ? '0 4px 30px rgba(0, 0, 0, 0.5)' : 'none',
        }}
      >
        <div
          className="max-w-[1200px] mx-auto px-6 h-[60px] flex items-center justify-between"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" aria-label="PALIMN home">
            <PalimnLogo size="md" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-[6px] text-[14px] font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Live Indicator */}
            <div className="hidden sm:flex items-center gap-2 text-[12px] text-slate-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-live text-emerald-400" />
              HydraDB Live
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
              onClick={() => setMobile(v => !v)}
              aria-label="Toggle mobile menu"
            >
              {mobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile menu ───────────────────────────────────────── */}
      <AnimatePresence>
        {mobile && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col pt-[120px] px-6 bg-[#07090E]/95 backdrop-blur-2xl md:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <nav className="flex flex-col gap-1.5">
              {NAV.map(({ to, label }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) =>
                    `px-4 py-3.5 rounded-[8px] text-[15px] font-medium transition-colors ${
                      isActive ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'text-slate-300 hover:text-white'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
