import React from 'react';
import { Link } from 'react-router-dom';
import { Github, ArrowUpRight, Database } from 'lucide-react';
import { PalimnLogo } from './PalimnLogo';

const NAV_COLS = [
  {
    heading: 'Console',
    links: [
      { label: 'Memory Query',     to: '/chat' },
      { label: 'Graph Universe',   to: '/graph' },
      { label: 'Live Benchmark',   to: '/benchmark' },
      { label: 'Architecture',     to: '/architecture' },
    ],
  },
  {
    heading: 'Pipeline',
    links: [
      { label: 'HydraDB Cloud',         href: 'https://hackhydra.hydradb.com' },
      { label: 'LongMemEval_S',          href: 'https://github.com/xiaowu0162/LongMemEval' },
      { label: 'HackHydra Track 3',      href: 'https://hackhydra.hydradb.com/#tracks' },
    ],
  },
  {
    heading: 'Results',
    links: [
      { label: 'Recall@20 · 96.60%',    to: '/benchmark' },
      { label: 'Recall@5 · 91.60%',     to: '/benchmark' },
      { label: '0 LLM Dependencies',     to: '/architecture' },
    ],
  },
];

export const Footer: React.FC = () => (
  <footer className="w-full border-t border-white/[0.08] bg-[#07090E]/90 backdrop-blur-xl" aria-label="Site footer">
    <div className="max-w-[1200px] mx-auto px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

      {/* Brand */}
      <div className="space-y-4">
        <Link to="/" aria-label="PALIMN home">
          <PalimnLogo size="md" />
        </Link>
        <p className="text-[13px] text-slate-400 leading-relaxed max-w-[220px]">
          Temporal graph memory for AI agents. Deterministic, persistent, zero hallucinations.
        </p>
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          HydraDB Cloud Connected
        </div>
        <a
          href="https://github.com/toufiqfarhan0/palimn"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-400 hover:text-amber-400 transition-colors"
        >
          <Github className="w-3.5 h-3.5" />
          GitHub Repository
          <ArrowUpRight className="w-3 h-3" />
        </a>
      </div>

      {/* Nav cols */}
      {NAV_COLS.map(col => (
        <div key={col.heading} className="space-y-3">
          <h5 className="text-[11px] font-mono uppercase tracking-[0.08em] text-slate-500 font-semibold">{col.heading}</h5>
          <ul className="space-y-2">
            {col.links.map(link => {
              const cls = 'text-[13px] text-slate-400 hover:text-white transition-colors block';
              return (
                <li key={link.label}>
                  {'href' in link
                    ? <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>{link.label}</a>
                    : <Link to={link.to!} className={cls}>{link.label}</Link>
                  }
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>

    {/* Meta row */}
    <div className="border-t border-white/[0.06] max-w-[1200px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
      <span>© 2026 PALIMN · Developed for HackHydra Track 3</span>
      <div className="flex items-center gap-4 font-mono">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <Database className="w-3 h-3" />
          HydraDB Cloud
        </span>
        <span className="text-slate-700">·</span>
        <span className="text-amber-400 font-semibold">96.60% Recall@20</span>
      </div>
    </div>
  </footer>
);
