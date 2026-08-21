import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Github,
  Search,
  PanelLeft,
  Share2,
  MessageSquare,
  BarChart3,
  Layers,
  Home,
} from 'lucide-react';
import { PalimnLogo } from './PalimnLogo';

interface NavbarProps {
  onToggleSidebar?: () => void;
  onOpenCommandPalette?: () => void;
  sidebarCollapsed?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenCommandPalette,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const getPageContext = () => {
    switch (location.pathname) {
      case '/chat':
        return { label: 'Ask & Recall Console', icon: MessageSquare };
      case '/graph':
        return { label: 'Graph Universe Explorer', icon: Share2 };
      case '/benchmark':
        return { label: 'Benchmark Hub', icon: BarChart3 };
      case '/architecture':
        return { label: 'Pipeline Architecture', icon: Layers };
      default:
        return { label: 'Overview', icon: Home };
    }
  };

  const context = getPageContext();
  const ContextIcon = context.icon;

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
        className="sticky top-0 z-30 w-full transition-all duration-200 border-b border-white/[0.08] bg-[#07090E]/85 backdrop-blur-xl"
        style={{
          boxShadow: scrolled ? '0 4px 30px rgba(0, 0, 0, 0.5)' : 'none',
        }}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-[56px] flex items-center justify-between gap-4">
          {/* Left: Sidebar Toggle + Breadcrumb */}
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors border border-transparent hover:border-white/10"
                aria-label="Toggle Sidebar navigation"
                title="Toggle Sidebar Navigation"
              >
                <PanelLeft className="w-4 h-4 text-amber-400" />
              </button>
            )}

            {/* Mobile Logo for small screens */}
            <div className="lg:hidden flex items-center">
              <Link to="/" className="flex items-center gap-2" aria-label="PALIMN home">
                <PalimnLogo size="sm" showSubtitle={false} />
              </Link>
            </div>

            {/* Breadcrumb indicator */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono pl-1 border-l border-white/[0.08]">
              <span className="text-slate-500">PALIMN</span>
              <span className="text-slate-600">/</span>
              <span className="flex items-center gap-1.5 text-slate-200 font-semibold">
                <ContextIcon className="w-3.5 h-3.5 text-amber-400" />
                {context.label}
              </span>
            </div>
          </div>

          {/* Center: Command Palette Trigger */}
          <div className="flex-1 max-w-md hidden md:block">
            {onOpenCommandPalette && (
              <button
                onClick={onOpenCommandPalette}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/15 text-xs text-slate-400 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  <span>Search queries, graphs, benchmarks...</span>
                </div>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] font-mono text-slate-400 border border-white/10">
                  <span className="text-[9px]">⌘</span>K
                </kbd>
              </button>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Command Palette Trigger for Mobile */}
            {onOpenCommandPalette && (
              <button
                onClick={onOpenCommandPalette}
                className="md:hidden p-1.5 text-slate-400 hover:text-white"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            {/* Live Indicator */}
            <div className="hidden sm:flex items-center gap-2 text-[12px] text-slate-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-live text-emerald-400" />
              HydraDB Live
            </div>

            {/* GitHub Repo Button */}
            <a
              href="https://github.com/toufiqfarhan0/palimn"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] font-medium text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] transition-all"
              aria-label="GitHub Repository"
            >
              <Github className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </header>
    </>
  );
};
