import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, GitFork, BarChart3, Clock } from 'lucide-react';
import { HealthBadge } from './HealthBadge';

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between">
      {/* Brand Identity */}
      <div className="flex items-center gap-6">
        <NavLink to="/chat" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-palimn-violet to-palimn-indigo flex items-center justify-center shadow-glow-violet group-hover:scale-105 transition-transform">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-base text-white font-mono">PALIMN</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-palimn-violet/20 text-palimn-violet-light border border-palimn-violet/30">
                Track 3
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans tracking-tight">
              Temporal Memory for AI Agents
            </p>
          </div>
        </NavLink>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 pl-4 border-l border-slate-800">
          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-palimn-violet/15 text-palimn-violet-light border border-palimn-violet/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-graphite-800/50 border border-transparent'
              }`
            }
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat & Reasoning</span>
          </NavLink>

          <NavLink
            to="/graph"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-palimn-violet/15 text-palimn-violet-light border border-palimn-violet/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-graphite-800/50 border border-transparent'
              }`
            }
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Memory Graph</span>
          </NavLink>

          <NavLink
            to="/benchmark"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-palimn-violet/15 text-palimn-violet-light border border-palimn-violet/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-graphite-800/50 border border-transparent'
              }`
            }
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>LongMemEval Benchmark</span>
          </NavLink>
        </nav>
      </div>

      {/* Live System Health */}
      <div className="flex items-center gap-3">
        <HealthBadge />
      </div>
    </header>
  );
};
