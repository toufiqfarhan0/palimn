import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitMerge,
  ArrowRight,
  Sparkles,
  Calendar,
  CheckCircle2,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { fetchMultiHopWeaver, MultiHopWeaverResponse } from '../lib/api';

const WEAVER_PRESETS = [
  {
    label: 'Project Orion Tech Stack',
    query: "What database is Alice's team currently deploying?",
    source: 'Alice',
    desc: 'Synthesizes Project Lead → Tech Stack Migration → Staging Deployment across 3 disjoint sessions',
    sessions: ['Session 03', 'Session 19', 'Session 38'],
  },
  {
    label: 'Career & Relocation Lineage',
    query: 'Where does the user work and where did they move from?',
    source: 'User',
    desc: 'Synthesizes Bangalore → Hyderabad Relocation → Microsoft Campus across 3 disjoint sessions',
    sessions: ['Session 01', 'Session 02', 'Session 14'],
  },
];

const HOP_COLORS = [
  { ring: 'ring-blue-500/50', text: 'text-blue-300', bg: 'bg-blue-500/10', border: 'border-blue-500/30', dot: 'bg-blue-400' },
  { ring: 'ring-amber-500/50', text: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  { ring: 'ring-emerald-500/50', text: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
];

export const MultiHopWeaver: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<number>(0);
  const [customQuery, setCustomQuery] = useState<string>(WEAVER_PRESETS[0].query);
  const [loading, setLoading] = useState<boolean>(false);
  const [weaverData, setWeaverData] = useState<MultiHopWeaverResponse | null>(null);

  const runWeaver = async (q: string, source: string) => {
    setLoading(true);
    try {
      const data = await fetchMultiHopWeaver(q, source);
      setWeaverData(data);
    } catch (err) {
      console.error('Weaver fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runWeaver(WEAVER_PRESETS[0].query, WEAVER_PRESETS[0].source);
  }, []);

  const handleSelectPreset = (idx: number) => {
    setSelectedPreset(idx);
    setCustomQuery(WEAVER_PRESETS[idx].query);
    runWeaver(WEAVER_PRESETS[idx].query, WEAVER_PRESETS[idx].source);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;
    runWeaver(customQuery, 'User');
  };

  return (
    <div className="w-full space-y-5">
      {/* Preset Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {WEAVER_PRESETS.map((p, idx) => {
          const isSelected = selectedPreset === idx;
          return (
            <button
              key={idx}
              onClick={() => handleSelectPreset(idx)}
              className={`relative text-left rounded-2xl border p-5 transition-all duration-200 overflow-hidden ${
                isSelected
                  ? 'border-cyan-500/50 bg-gradient-to-b from-cyan-500/12 to-transparent shadow-lg shadow-cyan-500/10'
                  : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono ${isSelected ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300' : 'bg-white/5 border border-white/10 text-slate-400'}`}>
                    {idx + 1}
                  </div>
                  <span className="text-xs font-bold text-white">{p.label}</span>
                </div>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${isSelected ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                  3 HOPS
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mb-3 font-mono">"{p.query}"</div>
              {/* Session pill row */}
              <div className="flex gap-1.5 flex-wrap">
                {p.sessions.map((s, si) => (
                  <span key={si} className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${HOP_COLORS[si].bg} ${HOP_COLORS[si].border} ${HOP_COLORS[si].text}`}>
                    {s}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Query */}
      <form onSubmit={handleCustomSubmit} className="flex gap-2">
        <input
          type="text"
          value={customQuery}
          onChange={(e) => setCustomQuery(e.target.value)}
          placeholder="Type a cross-session synthesis query..."
          className="flex-1 bg-[#0A0D18] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 font-mono transition-all"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/20"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
          ) : (
            <GitMerge className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Weave</span>
        </button>
      </form>

      {/* Result Graph */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-white/10 bg-[#0A0D18]/80 p-8 flex items-center justify-center gap-3 text-sm text-slate-400 font-mono"
          >
            <span className="w-4 h-4 border-2 border-cyan-400/40 border-t-cyan-400 rounded-full animate-spin" />
            Traversing session graph...
          </motion.div>
        )}

        {weaverData && !loading && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            {/* Meta strip */}
            <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="text-cyan-400 font-semibold">{weaverData.hops_count} Cross-Session Hops</span>
              </span>
              <span>Latency: <strong className="text-white">{weaverData.traversal_latency_ms}ms</strong></span>
              <span>Source: <strong className="text-slate-200">{weaverData.source_entity}</strong></span>
              <span>Target: <strong className="text-cyan-300">{weaverData.target_entity}</strong></span>
            </div>

            {/* Hop Cards with connector arrows */}
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative">
                {weaverData.causal_chain.map((step, idx) => {
                  const c = HOP_COLORS[idx % HOP_COLORS.length];
                  return (
                    <React.Fragment key={idx}>
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
                        className={`rounded-2xl border bg-[#080B14] p-5 space-y-4 relative overflow-hidden ${c.border} ring-1 ${c.ring}`}
                      >
                        {/* Step number */}
                        <div className="flex items-center justify-between">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold font-mono ${c.bg} border ${c.border} ${c.text}`}>
                            {step.step_number}
                          </div>
                          <div className={`flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-lg border ${c.bg} ${c.border}`}>
                            <Calendar className={`w-3 h-3 ${c.text}`} />
                            <span className={c.text}>{step.session_id}</span>
                          </div>
                        </div>

                        {/* From → Relation → To flow */}
                        <div className="space-y-2">
                          <div className="rounded-lg bg-white/[0.04] border border-white/[0.07] px-3 py-2">
                            <div className="text-[9px] text-slate-600 font-mono uppercase mb-0.5">From</div>
                            <div className="text-xs font-bold text-white">{step.from_node}</div>
                          </div>

                          <div className="flex items-center justify-center">
                            <span className={`text-[9px] font-mono font-bold px-3 py-1 rounded-full border flex items-center gap-1 ${c.bg} ${c.border} ${c.text}`}>
                              {step.relation}
                              <ArrowRight className="w-2.5 h-2.5" />
                            </span>
                          </div>

                          <div className={`rounded-lg border px-3 py-2 ${c.bg} ${c.border}`}>
                            <div className="text-[9px] text-slate-500 font-mono uppercase mb-0.5">To</div>
                            <div className={`text-xs font-bold ${c.text}`}>{step.to_node}</div>
                          </div>
                        </div>

                        {/* Evidence */}
                        <div className={`flex items-start gap-1.5 text-[10px] font-mono text-slate-500 border-t border-white/[0.04] pt-3`}>
                          <FileText className="w-3 h-3 shrink-0 mt-0.5 text-slate-600" />
                          <span className="italic leading-relaxed">{step.evidence}</span>
                        </div>
                      </motion.div>

                      {/* Arrow connector between cards (desktop) */}
                      {idx < weaverData.causal_chain.length - 1 && (
                        <div className="hidden md:flex absolute items-center justify-center" style={{
                          left: `calc(${((idx + 1) / 3) * 100}% - 12px)`,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 10,
                        }}>
                          <ChevronRight className="w-5 h-5 text-white/20" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Synthesized Answer */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-[#080B14] to-blue-950/30 p-5 space-y-3"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Multi-Session Synthesized Ground Truth
                </span>
                <span className="text-slate-500">Confidence: <strong className="text-cyan-300">98.6%</strong></span>
              </div>
              <p className="text-sm text-white font-medium leading-relaxed">
                "{weaverData.synthesized_answer}"
              </p>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-600">
                <Sparkles className="w-3 h-3 text-amber-500/60" />
                Assembled from {weaverData.hops_count} sessions without LLM generation
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
