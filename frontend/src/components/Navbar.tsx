import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { GitFork, BarChart2, Cpu, Terminal, ArrowRight } from 'lucide-react';
import { HealthBadge } from './HealthBadge';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-[#07090E]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3 flex items-center justify-between transition-all">
      {/* Brand Identity */}
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded border border-slate-700 bg-graphite-900 flex items-center justify-center text-slate-200 group-hover:border-cyan-500/50 group-hover:text-cyan-400 transition-colors">
            <span className="font-mono text-xs font-bold tracking-tight">Pλ</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-sm text-slate-100 font-mono">PALIMN</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-slate-800/80 text-slate-300 rounded border border-slate-700/60">
                Track 3
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans tracking-tight leading-none mt-0.5">
              Temporal memory for AI agents
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-800" aria-label="Main Navigation">
          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                isActive
                  ? 'bg-slate-800/80 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent'
              }`
            }
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Memory</span>
          </NavLink>

          <NavLink
            to="/graph"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                isActive
                  ? 'bg-slate-800/80 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent'
              }`
            }
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Graph</span>
          </NavLink>

          <NavLink
            to="/benchmark"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                isActive
                  ? 'bg-slate-800/80 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent'
              }`
            }
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Benchmark</span>
          </NavLink>

          <NavLink
            to="/architecture"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                isActive
                  ? 'bg-slate-800/80 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-transparent'
              }`
            }
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Architecture</span>
          </NavLink>
        </nav>
      </div>

      {/* Primary CTA & Live Status */}
      <div className="flex items-center gap-4">
        <HealthBadge />
        <Link
          to="/chat"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 hover:bg-white text-graphite-950 text-xs font-mono font-medium transition-colors border border-transparent"
        >
          <span>Open Console</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </header>
  );
};
