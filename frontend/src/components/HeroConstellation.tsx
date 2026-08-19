import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Briefcase, GraduationCap, MessageSquare, Clock, ShieldCheck, Sparkles } from 'lucide-react';

interface ConstellationNode {
  id: string;
  label: string;
  type: 'active' | 'historical' | 'session' | 'user';
  subject: string;
  predicate: string;
  object: string;
  session: string;
  date: string;
  valid_from: string;
  valid_until?: string;
  snippet: string;
  x: number; // percentage
  y: number; // percentage
  icon: any;
}

const NODES: ConstellationNode[] = [
  {
    id: 'user',
    label: 'User (Alex)',
    type: 'user',
    subject: 'user_alex',
    predicate: 'IDENTITY',
    object: 'Alex Chen',
    session: 'sess_init',
    date: '2021-01-10',
    valid_from: '2021-01-10',
    snippet: 'Hi, I am Alex Chen, starting my remote role.',
    x: 48,
    y: 45,
    icon: Sparkles,
  },
  {
    id: 'bangalore',
    label: 'Location: Bangalore',
    type: 'historical',
    subject: 'user_alex',
    predicate: 'lives_in',
    object: 'Bangalore',
    session: 'session_01',
    date: '2021-03-15',
    valid_from: '2021-03-15',
    valid_until: '2023-04-20',
    snippet: 'I currently live in Bangalore, working near Indiranagar.',
    x: 22,
    y: 30,
    icon: MapPin,
  },
  {
    id: 'hyderabad',
    label: 'Location: Hyderabad (Active)',
    type: 'active',
    subject: 'user_alex',
    predicate: 'lives_in',
    object: 'Hyderabad',
    session: 'session_51',
    date: '2023-04-20',
    valid_from: '2023-04-20',
    valid_until: 'present',
    snippet: 'I just relocated from Bangalore to Hyderabad for my new role at the tech center.',
    x: 28,
    y: 75,
    icon: MapPin,
  },
  {
    id: 'job',
    label: 'Role: Staff Engineer',
    type: 'active',
    subject: 'user_alex',
    predicate: 'works_as',
    object: 'Staff Engineer',
    session: 'session_48',
    date: '2023-03-10',
    valid_from: '2023-03-10',
    snippet: 'I was promoted to Staff Engineer on the infrastructure team.',
    x: 75,
    y: 35,
    icon: Briefcase,
  },
  {
    id: 'degree',
    label: 'Degree: Business Administration',
    type: 'active',
    subject: 'user_alex',
    predicate: 'graduated_with',
    object: 'Business Administration',
    session: 'session_12',
    date: '2021-06-05',
    valid_from: '2021-06-05',
    snippet: 'I graduated with a degree in Business Administration before switching to engineering.',
    x: 72,
    y: 78,
    icon: GraduationCap,
  },
];

const EDGES = [
  { from: 'bangalore', to: 'hyderabad', label: 'SUPERSEDES', type: 'amber' },
  { from: 'user', to: 'bangalore', label: 'MENTIONS', type: 'cyan' },
  { from: 'user', to: 'hyderabad', label: 'MENTIONS', type: 'cyan' },
  { from: 'user', to: 'job', label: 'MENTIONS', type: 'cyan' },
  { from: 'user', to: 'degree', label: 'MENTIONS', type: 'cyan' },
];

export const HeroConstellation: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>('hyderabad');
  const selectedNode = NODES.find((n) => n.id === selectedId) || NODES[2];

  return (
    <div className="relative w-full rounded-2xl border border-white/[0.08] bg-[#0A0D18]/90 overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Subtle Grid & Stars Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#161B2C_1px,transparent_1px),linear-gradient(to_bottom,#161B2C_1px,transparent_1px)] bg-[size:28px_28px] opacity-25 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-glow opacity-80 pointer-events-none" />

      {/* Header bar of constellation */}
      <div className="relative z-10 flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-[#07090F]/70 text-xs">
        <div className="flex items-center gap-2 font-mono text-[#9AA4B2]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-white font-medium">LIVE MEMORY GRAPH</span>
          <span className="text-white/30">•</span>
          <span className="text-[11px] text-cyan-300">HydraDB Cloud (palimn-memory)</span>
        </div>
        <span className="text-[11px] text-[#9AA4B2] hidden sm:inline">
          Click any node to explore temporal state
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[440px]">
        {/* Constellation Canvas View (Left/Center 7 cols) */}
        <div className="relative lg:col-span-7 h-[360px] lg:h-auto min-h-[380px] p-6 flex items-center justify-center">
          {/* SVG Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="amberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#D97706" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {EDGES.map((edge, idx) => {
              const src = NODES.find((n) => n.id === edge.from);
              const dst = NODES.find((n) => n.id === edge.to);
              if (!src || !dst) return null;

              const isAmber = edge.type === 'amber';
              return (
                <g key={idx}>
                  <line
                    x1={`${src.x}%`}
                    y1={`${src.y}%`}
                    x2={`${dst.x}%`}
                    y2={`${dst.y}%`}
                    stroke={isAmber ? 'url(#amberGrad)' : 'url(#cyanGrad)'}
                    strokeWidth={isAmber ? 2.5 : 1.5}
                    strokeDasharray={isAmber ? '4,4' : 'none'}
                    className={isAmber ? 'animate-pulse' : ''}
                  />
                  {isAmber && (
                    <text
                      x={`${(src.x + dst.x) / 2 - 4}%`}
                      y={`${(src.y + dst.y) / 2}%`}
                      fill="#F59E0B"
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                      className="tracking-wider uppercase font-semibold"
                    >
                      SUPERSEDES
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Interactive Constellation Nodes */}
          {NODES.map((node) => {
            const isSelected = node.id === selectedId;
            const Icon = node.icon;
            const isHistorical = node.type === 'historical';
            const isUser = node.type === 'user';

            let nodeBadge = isHistorical ? 'SUPERSEDED' : isUser ? 'ROOT' : 'ACTIVE';
            let badgeBg = isHistorical
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              : isUser
              ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';

            return (
              <motion.button
                key={node.id}
                onClick={() => setSelectedId(node.id)}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer focus:outline-none transition-transform ${
                  isSelected ? 'scale-110 z-30' : 'hover:scale-105 z-20'
                }`}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.96 }}
              >
                {/* Halo for active selection */}
                {isSelected && (
                  <motion.div
                    layoutId="nodeGlow"
                    className={`absolute -inset-3 rounded-full blur-md ${
                      isHistorical ? 'bg-amber-500/30' : 'bg-cyan-500/30'
                    }`}
                  />
                )}

                {/* Node Pill */}
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-lg transition-all duration-300 ${
                    isSelected
                      ? isHistorical
                        ? 'bg-[#1C160B] border-amber-400 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                        : 'bg-[#0E1A2C] border-cyan-400 text-cyan-100 shadow-[0_0_20px_rgba(56,189,248,0.25)]'
                      : isHistorical
                      ? 'bg-[#111319]/80 border-slate-700/60 text-slate-400 opacity-70 hover:opacity-100'
                      : 'bg-[#111625]/90 border-slate-700/80 text-slate-200 hover:border-slate-500'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? (isHistorical ? 'text-amber-400' : 'text-cyan-400') : 'text-slate-400'}`} />
                  <span className="text-xs font-medium whitespace-nowrap">{node.label}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${badgeBg}`}>
                    {nodeBadge}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Selected Memory Inspector Panel (Right 5 cols) */}
        <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-white/[0.06] bg-[#07090F]/90 p-6 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedNode.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#9AA4B2]">
                  Memory Node Details
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    selectedNode.type === 'historical'
                      ? 'badge-superseded'
                      : selectedNode.type === 'user'
                      ? 'badge-temporal'
                      : 'badge-active'
                  }`}
                >
                  {selectedNode.type === 'historical'
                    ? 'HISTORICAL / SUPERSEDED'
                    : selectedNode.type === 'user'
                    ? 'ROOT ENTITY'
                    : 'ACTIVE MEMORY'}
                </span>
              </div>

              <div>
                <h4 className="text-lg font-display font-semibold text-white flex items-center gap-2">
                  {selectedNode.object}
                </h4>
                <p className="text-xs font-mono text-cyan-400/90 mt-0.5">
                  ({selectedNode.subject}, {selectedNode.predicate}, {selectedNode.object})
                </p>
              </div>

              {/* Temporal Timeline Range */}
              <div className="p-3 rounded-lg bg-[#111522]/80 border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#9AA4B2] flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-indigo-400" />
                    Temporal Validity
                  </span>
                  <span className="text-white font-medium">
                    {selectedNode.valid_from} → {selectedNode.valid_until || 'Present'}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      selectedNode.type === 'historical'
                        ? 'w-2/3 bg-amber-500'
                        : 'w-full bg-gradient-to-r from-cyan-400 to-emerald-400'
                    }`}
                  />
                </div>
              </div>

              {/* Provenance Snippet */}
              <div className="p-3 rounded-lg bg-[#111522]/80 border border-white/[0.06] space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#9AA4B2]">
                  <span className="flex items-center gap-1.5 text-white/80">
                    <MessageSquare className="w-3 h-3 text-cyan-400" />
                    Origin: {selectedNode.session}
                  </span>
                  <span>{selectedNode.date}</span>
                </div>
                <p className="text-xs text-slate-300 italic bg-[#0B0D14] p-2.5 rounded border border-white/[0.04]">
                  "{selectedNode.snippet}"
                </p>
              </div>

              {/* Lineage Note if Superseded */}
              {selectedNode.id === 'bangalore' && (
                <div className="p-2.5 rounded border border-amber-500/20 bg-amber-950/20 text-amber-200/90 text-xs flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Superseded by Hyderabad in Session 51</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#9AA4B2]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              HydraDB Cloud Synchronized
            </span>
            <span className="text-white/60">ID: {selectedNode.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
