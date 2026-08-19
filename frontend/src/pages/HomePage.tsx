import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  GitFork,
  Terminal,
  History,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';

interface RevisionNodeInfo {
  name: string;
  state: 'HISTORICAL' | 'ACTIVE';
  validFrom: string;
  validUntil: string | null;
  session: string;
  date: string;
  sourceMessage: string;
  predicate: string;
}

export const HomePage: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<'bangalore' | 'hyderabad'>('hyderabad');

  const revisionData: Record<'bangalore' | 'hyderabad', RevisionNodeInfo> = {
    bangalore: {
      name: 'Bangalore',
      state: 'HISTORICAL',
      validFrom: '2025-01-10',
      validUntil: '2025-03-15',
      session: 'session_01',
      date: '2025-01-10',
      sourceMessage: 'I live in Bangalore.',
      predicate: 'lives_in',
    },
    hyderabad: {
      name: 'Hyderabad',
      state: 'ACTIVE',
      validFrom: '2025-03-15',
      validUntil: null,
      session: 'session_02',
      date: '2025-03-15',
      sourceMessage: 'I moved to Hyderabad.',
      predicate: 'lives_in',
    },
  };

  const activeNodeInfo = revisionData[selectedNode];

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* SECTION 1: HERO (Above the fold) */}
      <section className="relative border-b border-slate-800/80 px-6 pt-16 pb-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Value Prop */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-slate-700 bg-graphite-900 text-[11px] font-mono text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>HACKHYDRA 2026 TRACK 3 SUBMISSION</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white font-sans leading-[1.08]">
              PALIMN
              <span className="block text-2xl sm:text-3xl font-medium text-slate-400 mt-2 font-mono">
                Temporal memory for AI agents.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
              Remember what changed, preserve what happened, and retrieve the right memory across sessions with deterministic revision lineage and calibrated abstention.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/chat"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-slate-100 hover:bg-white text-graphite-950 text-xs font-mono font-semibold transition-colors"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Open Memory Console</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </Link>
              <Link
                to="/graph"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-graphite-850 hover:bg-graphite-800 text-slate-200 border border-slate-700 text-xs font-mono transition-colors"
              >
                <GitFork className="w-3.5 h-3.5 text-cyan-400" />
                <span>Explore Graph</span>
              </Link>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="text-cyan-400">✓</span> HydraDB Cloud Native
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-cyan-400">✓</span> 100% Deterministic (0 LLM)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-cyan-400">✓</span> 500 LongMemEval_S Verified
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Bangalore -> Hyderabad Revision Component */}
          <div className="lg:col-span-5">
            <div className="bg-graphite-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-300">
                    Live Temporal Revision Lineage
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Click node to inspect</span>
              </div>

              {/* Interactive Node Flow */}
              <div className="space-y-3 pt-1">
                {/* Bangalore Node */}
                <button
                  onClick={() => setSelectedNode('bangalore')}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all ${
                    selectedNode === 'bangalore'
                      ? 'bg-amber-950/30 border-amber-500/80 shadow-sm ring-1 ring-amber-500/40'
                      : 'bg-graphite-850/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-slate-200">Fact: lives_in Bangalore</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-700/60">
                      HISTORICAL
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1 flex justify-between">
                    <span>Session 01 (2025-01-10)</span>
                    <span className="text-amber-400/90 font-mono">Valid: 2025-01-10 → 2025-03-15</span>
                  </div>
                </button>

                {/* SUPERSEDES Edge indicator */}
                <div className="flex items-center justify-center gap-2 py-0.5">
                  <div className="h-4 w-[1px] bg-amber-500/40" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                    ↓ SUPERSEDES
                  </span>
                  <div className="h-4 w-[1px] bg-amber-500/40" />
                </div>

                {/* Hyderabad Node */}
                <button
                  onClick={() => setSelectedNode('hyderabad')}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all ${
                    selectedNode === 'hyderabad'
                      ? 'bg-emerald-950/30 border-emerald-500/80 shadow-sm ring-1 ring-emerald-500/40'
                      : 'bg-graphite-850/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-slate-200">Fact: lives_in Hyderabad</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-700/60">
                      ACTIVE
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1 flex justify-between">
                    <span>Session 02 (2025-03-15)</span>
                    <span className="text-emerald-400/90 font-mono">Valid: 2025-03-15 → present</span>
                  </div>
                </button>
              </div>

              {/* Node Inspector Detail Pane */}
              <div className="bg-graphite-950 rounded-lg p-3 border border-slate-800/90 font-mono text-[11px] space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5">
                  <span className="text-slate-300 font-semibold">Inspector: {activeNodeInfo.name}</span>
                  <span className={activeNodeInfo.state === 'ACTIVE' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    [{activeNodeInfo.state}]
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-400 pt-1">
                  <div>Valid From: <span className="text-slate-200">{activeNodeInfo.validFrom}</span></div>
                  <div>Valid Until: <span className="text-slate-200">{activeNodeInfo.validUntil || 'None (Current)'}</span></div>
                  <div>Origin Session: <span className="text-slate-200">{activeNodeInfo.session}</span></div>
                  <div>Timestamp: <span className="text-slate-200">{activeNodeInfo.date}</span></div>
                </div>
                <div className="pt-1.5 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500 block">Ground Truth Provenance:</span>
                  <p className="text-[11px] text-slate-200 italic font-sans bg-graphite-900 p-1.5 rounded border border-slate-800 mt-0.5">
                    "{activeNodeInfo.sourceMessage}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: WHY PALIMN (Asymmetric Editorial Grid) */}
      <section className="px-6 py-20 max-w-7xl mx-auto border-b border-slate-800/80 space-y-12">
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
            THE CROSS-SESSION MEMORY BOTTLENECK
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Vector embeddings cannot track what changed over time.
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Real user conversations span tens to hundreds of sessions. Information evolves, gets revised, or becomes invalid. PALIMN replaces lossy vector search with explicit graph-structured temporal lineage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Asymmetric Block 1: Revisions over Overwrite (7 cols) */}
          <div className="md:col-span-7 bg-graphite-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold">
              <History className="w-4 h-4" />
              <span>01 / FACT REVISIONS WITHOUT DESTRUCTION</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Old facts are superseded, never deleted.
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When a user says "I moved to Hyderabad", traditional memory systems either overwrite "Bangalore" or retrieve both ambiguously. PALIMN links <span className="font-mono text-amber-400">SUPERSEDES</span> edges, maintaining complete bi-temporal lineage so questions like "Where did I live before?" return Bangalore with 100% precision.
            </p>
          </div>

          {/* Asymmetric Block 2: Calibrated Abstention (5 cols) */}
          <div className="md:col-span-5 bg-graphite-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>02 / CALIBRATED ABSTENTION</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              A wrong answer is worse than a safe abstention.
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              If information was never mentioned, PALIMN explicitly abstains with a structured reason (<code className="text-slate-300 font-mono">no_matching_memory</code>) rather than hallucinating plausible guesses.
            </p>
          </div>

          {/* Asymmetric Block 3: Cross-Session Composition (5 cols) */}
          <div className="md:col-span-5 bg-graphite-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-semibold">
              <Layers className="w-4 h-4" />
              <span>03 / CROSS-SESSION COMPOSITION</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Facts connect across distant turns.
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sessions are chronologically linked with <span className="font-mono text-cyan-300">PRECEDES</span> relationships. Candidate messages are retrieved from across the haystack without token window truncation.
            </p>
          </div>

          {/* Asymmetric Block 4: Transparent Provenance (7 cols) */}
          <div className="md:col-span-7 bg-graphite-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>04 / AUDITABLE PROVENANCE</span>
            </div>
            <h3 className="text-lg font-bold text-white">
              Every retrieved memory is grounded in source turns.
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every answer carries exact source metadata: <code className="text-slate-300 font-mono">session_id</code>, <code className="text-slate-300 font-mono">message_id</code>, timestamp, confidence score, and text span. No black-box answers.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: HYDRADB CLOUD INTEGRATION */}
      <section className="px-6 py-20 max-w-7xl mx-auto border-b border-slate-800/80 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              PERSISTENT GRAPH MEMORY ENGINE
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              HydraDB stores PALIMN's temporal memory graph.
            </h2>
            <p className="text-sm text-slate-400">
              Native graph topology on HydraDB Cloud allows sub-millisecond traversal over hundreds of thousands of conversational nodes without vector lookups.
            </p>
          </div>

          <div className="flex items-center gap-6 font-mono text-xs text-slate-300 bg-graphite-900 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px]">DATABASE</span>
              <span className="font-bold text-cyan-400">palimn-memory</span>
            </div>
            <div className="border-l border-slate-800 pl-6">
              <span className="text-slate-500 block text-[10px]">TOTAL NODES</span>
              <span className="font-bold text-slate-100">266,689</span>
            </div>
            <div className="border-l border-slate-800 pl-6">
              <span className="text-slate-500 block text-[10px]">RELATIONSHIPS</span>
              <span className="font-bold text-slate-100">294,457</span>
            </div>
          </div>
        </div>

        {/* Graph Schema Structure Visualizer */}
        <div className="bg-graphite-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">
            HydraDB Schema & Relationship Topology
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded bg-graphite-850 border border-indigo-900/60 space-y-1">
              <span className="text-[10px] text-indigo-400 font-bold block">NODE</span>
              <span className="text-slate-200 font-semibold">User</span>
              <span className="text-[10px] text-slate-500 block">501 instances</span>
            </div>
            <div className="p-3.5 rounded bg-graphite-850 border border-slate-700/60 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">NODE</span>
              <span className="text-slate-200 font-semibold">Session</span>
              <span className="text-[10px] text-slate-500 block">19,197 instances</span>
            </div>
            <div className="p-3.5 rounded bg-graphite-850 border border-slate-700/60 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">NODE</span>
              <span className="text-slate-200 font-semibold">Message</span>
              <span className="text-[10px] text-slate-500 block">246,752 turns</span>
            </div>
            <div className="p-3.5 rounded bg-graphite-850 border border-purple-900/60 space-y-1">
              <span className="text-[10px] text-purple-400 font-bold block">NODE</span>
              <span className="text-slate-200 font-semibold">Entity</span>
              <span className="text-[10px] text-slate-500 block">112 concepts</span>
            </div>
            <div className="p-3.5 rounded bg-graphite-850 border border-emerald-900/60 space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold block">NODE</span>
              <span className="text-slate-200 font-semibold">Fact</span>
              <span className="text-[10px] text-slate-500 block">127 memories</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-graphite-950 border border-slate-800/80 font-mono text-xs flex flex-wrap items-center justify-between gap-4 text-slate-300">
            <span className="flex items-center gap-1.5"><span className="text-indigo-400">User</span> ─[HAS_SESSION]→ <span className="text-slate-300">Session</span></span>
            <span className="flex items-center gap-1.5"><span className="text-slate-300">Session</span> ─[PRECEDES]→ <span className="text-slate-300">Session</span></span>
            <span className="flex items-center gap-1.5"><span className="text-slate-300">Session</span> ─[CONTAINS]→ <span className="text-slate-300">Message</span></span>
            <span className="flex items-center gap-1.5"><span className="text-slate-300">Message</span> ─[SUPPORTS]→ <span className="text-emerald-400">Fact</span></span>
            <span className="flex items-center gap-1.5"><span className="text-emerald-400">Fact</span> ─[SUPERSEDES]→ <span className="text-amber-400">Fact</span></span>
          </div>
        </div>
      </section>

      {/* SECTION 4: BENCHMARK SUMMARY (Empirical 500-Question Results) */}
      <section className="px-6 py-20 max-w-7xl mx-auto border-b border-slate-800/80 space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              EMPIRICAL EVALUATION
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              LongMemEval_S Benchmark (500 Questions)
            </h2>
            <p className="text-sm text-slate-400">
              Rigorous, full-dataset benchmark execution with strict oracle isolation, zero cherry-picking, and 0 LLM calls.
            </p>
          </div>

          <Link
            to="/benchmark"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>View Complete Breakdown</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 5 Hero Metric Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-graphite-900 border border-slate-800 rounded-xl p-4 space-y-1">
            <span className="text-[10px] font-mono text-slate-400">EVALUATED</span>
            <p className="text-2xl font-bold text-white font-mono">500</p>
            <span className="text-[10px] text-slate-500 font-mono block">Complete Dataset</span>
          </div>

          <div className="bg-graphite-900 border border-slate-800 rounded-xl p-4 space-y-1">
            <span className="text-[10px] font-mono text-slate-400">RECALL@20</span>
            <p className="text-2xl font-bold text-cyan-400 font-mono">96.60%</p>
            <span className="text-[10px] text-slate-500 font-mono block">483 / 500 records</span>
          </div>

          <div className="bg-graphite-900 border border-slate-800 rounded-xl p-4 space-y-1">
            <span className="text-[10px] font-mono text-slate-400">RECALL@5</span>
            <p className="text-2xl font-bold text-cyan-400 font-mono">91.60%</p>
            <span className="text-[10px] text-slate-500 font-mono block">458 / 500 records</span>
          </div>

          <div className="bg-graphite-900 border border-slate-800 rounded-xl p-4 space-y-1">
            <span className="text-[10px] font-mono text-slate-400">MULTI-SESSION</span>
            <p className="text-2xl font-bold text-slate-200 font-mono">9.02%</p>
            <span className="text-[10px] text-slate-500 font-mono block">Exact match (133 Qs)</span>
          </div>

          <div className="bg-graphite-900 border border-slate-800 rounded-xl p-4 space-y-1">
            <span className="text-[10px] font-mono text-slate-400">AVG LATENCY</span>
            <p className="text-2xl font-bold text-emerald-400 font-mono">495 ms</p>
            <span className="text-[10px] text-slate-500 font-mono block">P50: 349 ms</span>
          </div>
        </div>

        {/* Technical Honesty Note */}
        <div className="p-4 rounded-lg bg-graphite-850 border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed">
          <span className="text-cyan-400 font-semibold">Technical Finding:</span> Retrieval achieves <span className="text-white font-bold">96.60% Recall@20</span>. In this 100% deterministic, 0-LLM pipeline, the remaining bottleneck is downstream open-domain fact extraction and multi-session synthesis, causing the conservative decision engine to abstain rather than hallucinate. Overall false answer rate is kept to <span className="text-emerald-400 font-bold">1.80%</span>.
        </div>
      </section>

      {/* SECTION 5: ARCHITECTURE PIPELINE */}
      <section className="px-6 py-20 max-w-7xl mx-auto border-b border-slate-800/80 space-y-10">
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
            DETERMINISTIC RETRIEVAL PIPELINE
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How PALIMN processes temporal questions
          </h2>
        </div>

        {/* Pipeline Steps Flow */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 font-mono text-xs">
          <div className="bg-graphite-900 p-3.5 rounded border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block">STEP 01</span>
            <p className="font-semibold text-slate-200">Question</p>
            <span className="text-[10px] text-slate-400 block">User query & timestamp</span>
          </div>
          <div className="bg-graphite-900 p-3.5 rounded border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block">STEP 02</span>
            <p className="font-semibold text-cyan-300">Query Planner</p>
            <span className="text-[10px] text-slate-400 block">Intent & concept extraction</span>
          </div>
          <div className="bg-graphite-900 p-3.5 rounded border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block">STEP 03</span>
            <p className="font-semibold text-indigo-300">HydraDB</p>
            <span className="text-[10px] text-slate-400 block">Message traversal & scoring</span>
          </div>
          <div className="bg-graphite-900 p-3.5 rounded border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block">STEP 04</span>
            <p className="font-semibold text-purple-300">Memory Units</p>
            <span className="text-[10px] text-slate-400 block">Triple decomposition</span>
          </div>
          <div className="bg-graphite-900 p-3.5 rounded border border-slate-800 space-y-1">
            <span className="text-[10px] text-amber-300">Temporal Resolution</span>
            <span className="text-[10px] text-slate-400 block">SUPERSEDES traversal</span>
          </div>
          <div className="bg-graphite-900 p-3.5 rounded border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block">STEP 06</span>
            <p className="font-semibold text-emerald-300">Evidence</p>
            <span className="text-[10px] text-slate-400 block">Provenance bundling</span>
          </div>
          <div className="bg-graphite-900 p-3.5 rounded border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block">STEP 07</span>
            <p className="font-semibold text-white">Answer / Abstain</p>
            <span className="text-[10px] text-slate-400 block">Calibrated output</span>
          </div>
        </div>
      </section>

      {/* SECTION 6: FINAL CTA */}
      <section className="px-6 py-24 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Inspect the memory graph live.
        </h2>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Test temporal queries, inspect revision lineage, and evaluate the full LongMemEval benchmark directly in the console.
        </p>
        <div className="pt-2">
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 px-6 py-3 rounded bg-slate-100 hover:bg-white text-graphite-950 text-xs font-mono font-semibold transition-colors shadow-lg"
          >
            <Terminal className="w-4 h-4" />
            <span>Open Memory Console</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </section>
    </div>
  );
};
