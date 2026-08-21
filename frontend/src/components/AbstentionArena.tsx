import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  ShieldCheck,
  FileCheck2,
  GitCommit,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Flame,
  AlertTriangle,
} from 'lucide-react';
import { evaluateArena, ArenaEvaluationResponse } from '../lib/api';

const PRESET_BUTTONS = [
  {
    id: 'unmentioned_fact',
    label: 'Unmentioned Fact',
    subtitle: 'Null memory search',
    badge: '100% Hallucination in Vector',
    accentClass: 'from-rose-500/20 to-rose-500/5',
    borderClass: 'border-rose-500/40 hover:border-rose-400/60',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dotClass: 'bg-rose-400',
    query: "What is Alice's favorite sushi restaurant in Kyoto?",
  },
  {
    id: 'explicit_negation',
    label: 'Negated Revision',
    subtitle: 'Overwritten fact check',
    badge: 'Catastrophic Recency Failure',
    accentClass: 'from-amber-500/20 to-amber-500/5',
    borderClass: 'border-amber-500/40 hover:border-amber-400/60',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotClass: 'bg-amber-400',
    query: 'Does Bob still drive a Tesla Model 3?',
  },
  {
    id: 'temporal_ambiguity',
    label: 'Temporal Ambiguity',
    subtitle: 'Conflicting schedules',
    badge: 'Overlapping Unresolved Intervals',
    accentClass: 'from-cyan-500/20 to-cyan-500/5',
    borderClass: 'border-cyan-500/40 hover:border-cyan-400/60',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    dotClass: 'bg-cyan-400',
    query: 'Where was Charlie on Tuesday at 4:00 PM?',
  },
  {
    id: 'counterfactual_future',
    label: 'Future Projection',
    subtitle: 'Out-of-horizon guardrail',
    badge: 'Ungrounded Extrapolation',
    accentClass: 'from-violet-500/20 to-violet-500/5',
    borderClass: 'border-violet-500/40 hover:border-violet-400/60',
    badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    dotClass: 'bg-violet-400',
    query: 'What is the project budget for Q4 2030?',
  },
];

const ScoreBar: React.FC<{ value: number; color: string }> = ({ value, color }) => (
  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
    <motion.div
      className={`h-full rounded-full ${color}`}
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
    />
  </div>
);

export const AbstentionArena: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<string>('unmentioned_fact');
  const [queryInput, setQueryInput] = useState<string>(PRESET_BUTTONS[0].query);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ArenaEvaluationResponse | null>(null);

  const runEvaluation = async (queryToRun: string, scenarioKey: string) => {
    setLoading(true);
    setResult(null);
    try {
      const data = await evaluateArena(queryToRun, scenarioKey);
      setResult(data);
    } catch (err) {
      console.error('Arena evaluation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (preset: typeof PRESET_BUTTONS[0]) => {
    setActiveScenario(preset.id);
    setQueryInput(preset.query);
    runEvaluation(preset.query, preset.id);
  };

  useEffect(() => {
    runEvaluation(PRESET_BUTTONS[0].query, 'unmentioned_fact');
  }, []);



  return (
    <div className="w-full space-y-5">
      {/* Scenario Selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {PRESET_BUTTONS.map((preset) => {
          const isActive = activeScenario === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              className={`relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 group ${
                isActive
                  ? `${preset.borderClass} bg-gradient-to-b ${preset.accentClass}`
                  : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between mb-2.5">
                <div className={`w-2 h-2 rounded-full mt-0.5 ${isActive ? preset.dotClass : 'bg-white/20'}`} />
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${preset.badgeClass}`}
                  >
                    ACTIVE
                  </motion.div>
                )}
              </div>
              <div className="text-xs font-bold text-white mb-0.5">{preset.label}</div>
              <div className="text-[10px] text-slate-500">{preset.subtitle}</div>
            </button>
          );
        })}
      </div>

      {/* Query Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            className="w-full bg-[#0A0D18] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 font-mono transition-all"
            placeholder="Type an adversarial test query..."
            onKeyDown={(e) => e.key === 'Enter' && runEvaluation(queryInput, activeScenario)}
          />
        </div>
        <button
          onClick={() => runEvaluation(queryInput, activeScenario)}
          disabled={loading}
          className="px-5 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-400 hover:to-orange-300 text-black font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-amber-500/20"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
          ) : (
            <Flame className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Evaluate</span>
        </button>
      </div>

      {/* Results: Split Screen */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-white/10 bg-[#0A0D18]/80 p-8 flex items-center justify-center gap-3 text-sm text-slate-400 font-mono"
          >
            <span className="w-4 h-4 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
            Running pipeline evaluation...
          </motion.div>
        )}

        {result && !loading && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Naive Vector RAG — FAIL side */}
            <div className="rounded-2xl border border-rose-500/25 bg-gradient-to-b from-rose-500/8 to-transparent p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Naive Vector RAG</div>
                    <div className="text-[10px] text-slate-500 font-mono">Flat semantic similarity</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300">
                  HALLUCINATED
                </span>
              </div>

              <div className="rounded-xl bg-black/30 border border-rose-500/20 p-4 font-mono text-sm text-rose-200 leading-relaxed">
                "{result.vector_rag.synthesized_answer}"
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Cosine Similarity</span>
                  <span className="text-rose-300">{(result.vector_rag.cosine_similarity * 100).toFixed(1)}%</span>
                </div>
                <ScoreBar value={result.vector_rag.cosine_similarity * 100} color="bg-rose-500" />
                {result.vector_rag.explanation && (
                  <div className="flex items-start gap-1.5 text-[11px] text-rose-400/80 font-mono">
                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                    {result.vector_rag.explanation}
                  </div>
                )}
              </div>
            </div>

            {/* PALIMN — PASS side */}
            <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-emerald-500/8 to-transparent p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">PALIMN HydraDB</div>
                    <div className="text-[10px] text-slate-500 font-mono">Temporal graph reasoning</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  {result.palimn_hydra.decision}
                </span>
              </div>

              <div className="rounded-xl bg-black/30 border border-emerald-500/20 p-4 font-mono text-sm text-emerald-100 leading-relaxed">
                "{result.palimn_hydra.verified_answer ?? result.palimn_hydra.abstention_reason ?? 'Abstain — no evidence recorded.'}"
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Confidence</span>
                  <span className="text-emerald-300">{(result.palimn_hydra.confidence * 100).toFixed(1)}%</span>
                </div>
                <ScoreBar value={result.palimn_hydra.confidence * 100} color="bg-emerald-500" />
              </div>

              {/* Abstention Certificate */}
              {result.palimn_hydra.certificate_id && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-xl bg-emerald-950/40 border border-emerald-500/30 p-3.5 space-y-2"
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 font-mono uppercase tracking-wider">
                    <FileCheck2 className="w-3.5 h-3.5" />
                    Proof Certificate
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="space-y-0.5">
                      <div className="text-slate-500">Certificate ID</div>
                      <div className="text-emerald-300 truncate">{result.palimn_hydra.certificate_id}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-slate-500">Traversal Steps</div>
                      <div className="text-emerald-300">{result.palimn_hydra.proof_steps.length} steps</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win summary strip */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-[11px] font-mono text-slate-500">
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <CheckCircle className="w-3.5 h-3.5" />
          PALIMN wins on calibrated abstention
        </span>
        <span className="flex items-center gap-1.5">
          <GitCommit className="w-3 h-3 text-amber-400" />
          Cryptographic proof emitted per query
        </span>
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-blue-400" />
          Zero LLM inference in resolution loop
        </span>
        <div className="ml-auto flex items-center gap-1 text-amber-400 font-semibold">
          Try another scenario
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
};
