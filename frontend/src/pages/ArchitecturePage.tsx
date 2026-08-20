import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Cloud, FileText, GitBranch, ArrowDown, Database, ShieldCheck, Layers } from 'lucide-react';

const STAGES = [
  {
    id: '01',
    icon: Search,
    label: 'Intent Analysis',
    token: 'STAGE_PARSE',
    input: 'Natural language user query string',
    output: '{ entity: "user", predicate: "lives_in", anchor: "present" }',
    detail: 'Extracts the semantic triple tuple — entity subject, relationship predicate, and temporal anchor ("now", "in 2022", "before session 51"). Operates through deterministic grammar parsing without LLM inference.',
  },
  {
    id: '02',
    icon: Cloud,
    label: 'Candidate Retrieval',
    token: 'STAGE_RETRIEVAL',
    input: '{ entity: "user", predicate: "lives_in" }',
    output: 'Top-K memory nodes from HydraDB Cloud',
    detail: 'Executes indexed search over HydraDB Cloud memory collections. Returns candidate historical fact nodes matching the entity and predicate, sorted by relevance and recency.',
  },
  {
    id: '03',
    icon: FileText,
    label: 'Fact Extraction',
    token: 'STAGE_EXTRACTION',
    input: 'Raw memory chunk strings',
    output: '{ subject, predicate, object, valid_from, valid_to }',
    detail: 'Parses each candidate memory chunk into a typed temporal tuple. Assigns explicit valid_from and valid_to intervals. If valid_to is null, the fact is considered current.',
  },
  {
    id: '04',
    icon: GitBranch,
    label: 'Temporal Resolution',
    token: 'STAGE_RESOLUTION',
    input: 'Fact tuples + temporal query anchor',
    output: 'Resolved fact string OR CALIBRATED_ABSTENTION',
    detail: 'Walks the SUPERSEDES directed graph. If an active fact covers the requested temporal anchor, it is emitted. If evidence is missing, the resolver executes calibrated abstention.',
  },
];

const PILLARS = [
  {
    icon: Database,
    title: 'HydraDB Cloud Persistence',
    desc: 'Every memory update is written directly to HydraDB Cloud collections with timestamped nodes, ensuring zero state loss across sessions.',
  },
  {
    icon: GitBranch,
    title: 'SUPERSEDES Directed Graph',
    desc: 'When facts evolve, the previous state is linked via a SUPERSEDES edge rather than being overwritten, enabling complete historical auditing.',
  },
  {
    icon: ShieldCheck,
    title: 'Zero LLM Hallucinations',
    desc: '100% deterministic code pipeline. If HydraDB does not contain sufficient grounded evidence, PALIMN abstains instead of guessing.',
  },
];

export const ArchitecturePage: React.FC = () => {
  const [active, setActive] = useState(0);
  const stage = STAGES[active];
  const Icon = stage.icon;

  return (
    <div className="min-h-[100dvh] bg-transparent max-w-[1200px] mx-auto px-6 pt-12 pb-24 font-['Plus_Jakarta_Sans',sans-serif]">

      {/* Header */}
      <div className="mb-12 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[12px] font-semibold text-amber-300 backdrop-blur-md">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>PIPELINE SPECIFICATION</span>
        </div>
        <h1 className="text-[36px] sm:text-[48px] font-extrabold text-white tracking-tight">
          System Architecture
        </h1>
        <p className="text-[15px] text-slate-300 max-w-2xl">
          PALIMN resolves temporal agent memory across 4 deterministic stages. No stochastic LLMs, no hallucinations, sub-second execution.
        </p>
      </div>

      {/* Interactive Stage Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">

        {/* Stage Tabs (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          {STAGES.map((s, i) => {
            const SIcon = s.icon;
            const isSelected = active === i;
            return (
              <button
                key={s.id}
                onClick={() => setActive(i)}
                className={`w-full text-left p-4 rounded-[10px] border transition-all flex items-center gap-3.5 ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-lg'
                    : 'bg-[#0E1424]/75 border-white/[0.08] text-slate-300 hover:border-white/[0.18] hover:bg-white/[0.04]'
                }`}
              >
                <div className={`w-8 h-8 rounded-[6px] flex items-center justify-center font-mono text-[12px] font-bold ${
                  isSelected ? 'bg-amber-400 text-slate-950' : 'bg-white/[0.05] text-slate-400'
                }`}>
                  <SIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[15px] font-bold text-white">
                    {s.label}
                  </div>
                  <div className="text-[12px] font-mono text-slate-400">{s.token}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Stage Detail Panel (8 cols) */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="card space-y-6"
            >
              <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
                <div className="w-10 h-10 rounded-[8px] bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase text-amber-400 font-bold tracking-wider">
                    Stage {stage.id} Specification
                  </span>
                  <h3 className="text-[22px] font-bold text-white">{stage.label}</h3>
                </div>
              </div>

              <p className="text-[15px] text-slate-300 leading-relaxed">
                {stage.detail}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-[8px] bg-[#0A0D18]/80 border border-white/[0.08] space-y-1.5">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Input Contract</div>
                  <code className="text-[12px] text-slate-200 block">{stage.input}</code>
                </div>

                <div className="p-4 rounded-[8px] bg-[#0A0D18]/80 border border-white/[0.08] space-y-1.5">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">Output Contract</div>
                  <code className="text-[12px] text-amber-300 block">{stage.output}</code>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* End-to-End Flow Diagram */}
      <div className="mb-20 space-y-6">
        <div className="space-y-1">
          <h2 className="text-[26px] font-bold text-white tracking-tight">End-to-End Query Flow</h2>
          <p className="text-[14px] text-slate-300">Sequential execution path for every memory query.</p>
        </div>

        <div className="max-w-xl space-y-2">
          {[
            { step: '00', title: 'User Input', sub: 'Natural language question', bg: 'bg-[#0E1424]/80' },
            { step: '01', title: 'Intent Analyzer', sub: 'Rule-based semantic parser', bg: 'bg-[#0E1424]/80' },
            { step: '02', title: 'Candidate Retrieval', sub: 'HydraDB Cloud indexed vectors', bg: 'bg-[#0E1424]/80' },
            { step: '03', title: 'Fact Extraction', sub: 'Temporal tuple parsing', bg: 'bg-[#0E1424]/80' },
            { step: '04', title: 'Temporal Resolution', sub: 'SUPERSEDES graph traversal', bg: 'bg-[#0E1424]/80' },
            { step: '05', title: 'Ground Truth Response', sub: 'ACTIVE Fact or Calibrated Abstention', bg: 'bg-amber-500/20 border-amber-500/40', highlight: true },
          ].map((item, idx, arr) => (
            <div key={item.step}>
              <div className={`p-4 rounded-[8px] border border-white/[0.08] ${item.bg} backdrop-blur-md flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <span className={`text-[12px] font-mono font-bold ${item.highlight ? 'text-amber-300' : 'text-slate-500'}`}>
                    {item.step}
                  </span>
                  <span className={`text-[14px] font-bold ${item.highlight ? 'text-amber-300' : 'text-white'}`}>
                    {item.title}
                  </span>
                </div>
                <span className="text-[12px] font-mono text-slate-400">{item.sub}</span>
              </div>
              {idx < arr.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="w-3.5 h-3.5 text-slate-600" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Core Architectural Pillars */}
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-[26px] font-bold text-white tracking-tight">Design Invariants</h2>
          <p className="text-[14px] text-slate-300">Key properties guaranteed by the PALIMN architecture.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PILLARS.map((p, idx) => {
            const PIcon = p.icon;
            return (
              <div key={idx} className="card space-y-3">
                <div className="w-9 h-9 rounded-[6px] bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <PIcon className="w-5 h-5" />
                </div>
                <h4 className="text-[17px] font-bold text-white">{p.title}</h4>
                <p className="text-[13px] text-slate-300 leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
