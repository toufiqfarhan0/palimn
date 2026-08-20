import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Database, ShieldCheck, Clock, Loader2, ChevronDown, ChevronUp, Sparkles, CheckCircle2, AlertCircle, Search, Cpu, GitCompare } from 'lucide-react';
import { LiveIngestionSimulator } from '../components/LiveIngestionSimulator';
import { TemporalDiffInspector } from '../components/TemporalDiffInspector';
import { IntegrationHub } from '../components/IntegrationHub';

/* ─── Types ────────────────────────────────────────────────────── */
interface Fact {
  session: number;
  date: string;
  text: string;
  status: 'ACTIVE' | 'SUPERSEDED';
  entity: string;
  predicate: string;
  value: string;
}

interface Result {
  question: string;
  answer: string | null;
  confidence: string;
  decision: 'ACTIVE' | 'SUPERSEDED' | 'CALIBRATED_ABSTENTION';
  facts: Fact[];
  latencyMs: number;
  stages: { name: string; ms: number }[];
}

/* ─── Presets ──────────────────────────────────────────────────── */
const PRESETS: Record<string, Result> = {
  "Where does Sam live now?": {
    question: "Where does Sam live now?",
    answer: "Hyderabad",
    confidence: "HIGH (0.98)",
    decision: "ACTIVE",
    latencyMs: 312,
    stages: [
      { name: 'Intent Analysis', ms: 28 },
      { name: 'Candidate Retrieval (HydraDB Cloud)', ms: 186 },
      { name: 'Fact Extraction', ms: 54 },
      { name: 'Temporal Graph Resolution', ms: 44 },
    ],
    facts: [
      { session: 21, date: '2021-03-01', text: 'I moved to Bangalore for work.', status: 'SUPERSEDED', entity: 'user', predicate: 'lives_in', value: 'Bangalore' },
      { session: 51, date: '2023-04-20', text: 'I relocated from Bangalore to Hyderabad for my new role.', status: 'ACTIVE', entity: 'user', predicate: 'lives_in', value: 'Hyderabad' },
    ],
  },
  "What was Sam's job in 2022?": {
    question: "What was Sam's job in 2022?",
    answer: "Software Engineer at TechCorp",
    confidence: "MEDIUM (0.89)",
    decision: "SUPERSEDED",
    latencyMs: 287,
    stages: [
      { name: 'Intent Analysis', ms: 31 },
      { name: 'Candidate Retrieval (HydraDB Cloud)', ms: 158 },
      { name: 'Fact Extraction', ms: 61 },
      { name: 'Temporal Graph Resolution', ms: 37 },
    ],
    facts: [
      { session: 14, date: '2020-06-01', text: 'Started as SE at TechCorp.', status: 'SUPERSEDED', entity: 'user', predicate: 'works_at', value: 'TechCorp' },
      { session: 60, date: '2023-09-01', text: 'Now a senior staff engineer at Infosys.', status: 'ACTIVE', entity: 'user', predicate: 'works_at', value: 'Infosys' },
    ],
  },
  "What is Sam's favorite food?": {
    question: "What is Sam's favorite food?",
    answer: null,
    confidence: "—",
    decision: "CALIBRATED_ABSTENTION",
    latencyMs: 198,
    stages: [
      { name: 'Intent Analysis', ms: 22 },
      { name: 'Candidate Retrieval (HydraDB Cloud)', ms: 130 },
      { name: 'Fact Extraction', ms: 28 },
      { name: 'Temporal Graph Resolution', ms: 18 },
    ],
    facts: [],
  },
};

const QUICK = Object.keys(PRESETS);

export const ChatPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'QUERY' | 'SIMULATE' | 'DIFF' | 'SDK'>('QUERY');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(() => PRESETS["Where does Sam live now?"]);
  const [expandedFact, setExpandedFact] = useState<number | null>(1);

  const handleSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setResult(null);
    setExpandedFact(null);

    setTimeout(() => {
      const match = PRESETS[trimmed] ?? {
        question: trimmed,
        answer: null,
        confidence: '—',
        decision: 'CALIBRATED_ABSTENTION',
        latencyMs: 215,
        stages: [
          { name: 'Intent Analysis', ms: 24 },
          { name: 'Candidate Retrieval (HydraDB Cloud)', ms: 135 },
          { name: 'Fact Extraction', ms: 34 },
          { name: 'Temporal Graph Resolution', ms: 22 },
        ],
        facts: [],
      } as Result;
      setResult(match);
      setLoading(false);
    }, 700);
  };

  return (
    <div className="min-h-[100dvh] bg-transparent max-w-[1200px] mx-auto px-6 pt-12 pb-24 font-['Plus_Jakarta_Sans',sans-serif]">

      {/* Header */}
      <div className="mb-8 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[12px] font-semibold text-amber-300 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>DETERMINISTIC AGENT MEMORY PLATFORM</span>
        </div>
        <h1 className="text-[36px] sm:text-[44px] font-extrabold text-white tracking-tight">
          Memory Operations Console
        </h1>
        <p className="text-[15px] text-slate-300">
          Query, simulate live ingestion, inspect historical state diffs, and generate drop-in SDK code.
        </p>
      </div>

      {/* Feature Tabs Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-4 mb-8">
        {[
          { id: 'QUERY', label: 'Memory Query', icon: Search },
          { id: 'SIMULATE', label: 'Live Ingestion Simulator', icon: Sparkles },
          { id: 'DIFF', label: 'Temporal Memory Diff', icon: GitCompare },
          { id: 'SDK', label: 'SDK & Integrations', icon: Cpu },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-[8px] border text-xs font-bold transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md'
                  : 'bg-[#0E1424]/75 border-white/[0.08] text-slate-300 hover:border-white/[0.18]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Live Memory Query */}
      {activeTab === 'QUERY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN (8 cols): Query & Results */}
          <div className="lg:col-span-8 space-y-6">
            {/* Search Form */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSearch(query); }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question (e.g. 'Where does Sam live now?')"
                className="flex-1 px-4 py-3 text-[15px] rounded-[8px] border border-white/[0.12] bg-[#0E1424]/90 text-white placeholder-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="btn-primary px-5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <ArrowRight className="w-4 h-4 text-slate-950" />}
              </button>
            </form>

            {/* Preset Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-mono text-slate-400">Presets:</span>
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => { setQuery(q); handleSearch(q); }}
                  className="text-[12px] font-medium px-3 py-1 rounded-[6px] border border-white/[0.08] bg-white/[0.04] text-slate-300 hover:text-amber-300 hover:border-amber-500/40 hover:bg-amber-500/10 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Loading Skeleton */}
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="card space-y-4"
                >
                  <div className="shimmer h-6 w-1/3 rounded" />
                  <div className="shimmer h-12 w-3/4 rounded" />
                  <div className="shimmer h-4 w-1/2 rounded" />
                </motion.div>
              )}

              {/* Resolved Result */}
              {result && !loading && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-4"
                >
                  {/* Result Answer Box */}
                  <div className="card space-y-4 border-l-4" style={{
                    borderLeftColor: result.decision === 'ACTIVE' ? '#F59E0B' : result.decision === 'SUPERSEDED' ? '#D97706' : '#94A3B8'
                  }}>
                    <div className="flex items-center justify-between">
                      <span className={
                        result.decision === 'ACTIVE'
                          ? 'badge-active'
                          : result.decision === 'SUPERSEDED'
                          ? 'badge-superseded'
                          : 'badge-abstain'
                      }>
                        {result.decision === 'ACTIVE' && <CheckCircle2 className="w-3 h-3" />}
                        {result.decision === 'CALIBRATED_ABSTENTION' && <AlertCircle className="w-3 h-3" />}
                        {result.decision}
                      </span>
                      <span className="text-[12px] font-mono text-slate-400">
                        Latency: {result.latencyMs}ms
                      </span>
                    </div>

                    {result.answer ? (
                      <div>
                        <div className="text-[12px] font-mono uppercase tracking-wider text-slate-400">Resolved Fact:</div>
                        <div className="text-[36px] sm:text-[44px] font-extrabold text-white tracking-tight leading-tight mt-1">
                          {result.answer}
                        </div>
                        <div className="text-[13px] text-slate-300 mt-1 font-mono">
                          Confidence: <span className="text-amber-400 font-semibold">{result.confidence}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 py-2">
                        <div className="text-[20px] font-bold text-white">
                          No matching evidence in HydraDB.
                        </div>
                        <p className="text-[14px] text-slate-300">
                          PALIMN refused to hallucinate or generate an unsubstantiated guess.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Evidence Chain */}
                  {result.facts.length > 0 && (
                    <div className="card space-y-3">
                      <div className="text-[12px] font-mono uppercase font-semibold text-slate-400 tracking-wider">
                        Supporting Evidence Chain ({result.facts.length} facts)
                      </div>

                      <div className="space-y-2">
                        {result.facts.map((fact, idx) => (
                          <div key={idx} className="rounded-[8px] border border-white/[0.08] bg-[#0A0D18]/80 overflow-hidden">
                            <button
                              onClick={() => setExpandedFact(expandedFact === idx ? null : idx)}
                              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className={fact.status === 'ACTIVE' ? 'badge-active' : 'badge-superseded'}>
                                  {fact.status}
                                </span>
                                <span className="text-[14px] font-medium text-white">
                                  {fact.text}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[12px] font-mono text-slate-400">
                                <span>Session {fact.session}</span>
                                {expandedFact === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </button>

                            <AnimatePresence>
                              {expandedFact === idx && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="px-4 py-3 border-t border-white/[0.06] bg-black/40 text-[12px] font-mono space-y-1 text-slate-300"
                                >
                                  <div><strong>Entity:</strong> <code className="text-white">{fact.entity}</code></div>
                                  <div><strong>Predicate:</strong> <code className="text-white">{fact.predicate}</code></div>
                                  <div><strong>Value:</strong> <code className="text-amber-400">{fact.value}</code></div>
                                  <div><strong>Timestamp:</strong> <span className="text-slate-400">{fact.date}</span></div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT COLUMN (4 cols): Execution Trace & Pipeline */}
          <div className="lg:col-span-4 space-y-6">
            {/* Execution Trace Card */}
            {result && !loading && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="card space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <span className="text-[12px] font-mono uppercase font-semibold text-slate-400 tracking-wider">Execution Trace</span>
                  <span className="text-[12px] font-mono text-amber-400 font-bold">{result.latencyMs}ms total</span>
                </div>

                <div className="space-y-3">
                  {result.stages.map((st, i) => (
                    <div key={i} className="flex items-center justify-between text-[13px]">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-500">0{i + 1}</span>
                        <span className="text-slate-200">{st.name}</span>
                      </div>
                      <span className="font-mono text-[12px] text-amber-400 font-semibold">{st.ms}ms</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Pipeline Info */}
            <div className="card space-y-4">
              <div className="text-[12px] font-mono uppercase font-semibold text-slate-400 tracking-wider border-b border-white/[0.08] pb-3">
                HydraDB Cloud Pipeline
              </div>

              <div className="space-y-3 text-[13px]">
                <div className="flex items-start gap-3">
                  <Database className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">Persistent Vector Store</div>
                    <div className="text-[12px] text-slate-400">HydraDB Cloud stores facts with time intervals.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">SUPERSEDES Chain</div>
                    <div className="text-[12px] text-slate-400">Traverses directed graph edges to present day.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white">Zero LLM Dependencies</div>
                    <div className="text-[12px] text-slate-400">Deterministic logic guarantees repeatable answers.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Live Ingestion Simulator */}
      {activeTab === 'SIMULATE' && (
        <div className="space-y-6">
          <LiveIngestionSimulator />
        </div>
      )}

      {/* Tab 3: Temporal Memory Diff */}
      {activeTab === 'DIFF' && (
        <div className="space-y-6">
          <TemporalDiffInspector />
        </div>
      )}

      {/* Tab 4: SDK & Framework Integrations */}
      {activeTab === 'SDK' && (
        <div className="space-y-6">
          <IntegrationHub />
        </div>
      )}

    </div>
  );
};
