import React from 'react';
import {
  Cpu,
  Database,
  Layers,
  GitFork,
  Clock,
  ShieldCheck,
  CheckCircle2,
  BarChart2,
  ArrowDown,
} from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  const architecturalPillars = [
    {
      title: '01 / Memory Graph Model',
      icon: <Database className="w-4 h-4 text-cyan-400" />,
      content:
        'PALIMN models memory as a high-density, native property graph in HydraDB Cloud. Nodes represent Users, Sessions, Messages, Entities, and Facts. Relationships include HAS_SESSION, PRECEDES, CONTAINS, MENTIONS, SUPPORTS, and SUPERSEDES.',
    },
    {
      title: '02 / Temporal Lineage & State Machine',
      icon: <Clock className="w-4 h-4 text-amber-400" />,
      content:
        'Facts possess strict bi-temporal timestamps (valid_from, valid_until) and lifecycle states (ACTIVE, SUPERSEDED, HISTORICAL). When newer statements update an active fact, a directed SUPERSEDES edge links the new fact to its predecessor without deleting historical truth.',
    },
    {
      title: '03 / Deterministic Retrieval Pipeline',
      icon: <GitFork className="w-4 h-4 text-indigo-400" />,
      content:
        'Query Analyzer extracts keywords, concepts, and temporal intent. Candidate messages are retrieved and scored from the HydraDB graph index using exact and stemmed concept matching with user-authorship multipliers (0 LLM, 0 embeddings).',
    },
    {
      title: '04 / Generalized Memory Units',
      icon: <Layers className="w-4 h-4 text-purple-400" />,
      content:
        'Information is decomposed into structured relation triples (subject, predicate, object, confidence, status). Memory units generalize across open-domain properties (locations, employment, purchases, metrics) without domain lock-in.',
    },
    {
      title: '05 / Cross-Session Composition',
      icon: <Cpu className="w-4 h-4 text-cyan-400" />,
      content:
        'Sessions are chronologically chained using PRECEDES edges. Multi-session queries traverse the session timeline to synthesize facts distributed across multiple distant conversations.',
    },
    {
      title: '06 / Auditable Evidence & Provenance',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
      content:
        'Every answerable prediction is strictly grounded in source graph nodes. Provenance exposes source_message_id, source_session_id, timestamp, text span, and confidence score for end-to-end auditability.',
    },
    {
      title: '07 / Calibrated Abstention Engine',
      icon: <ShieldCheck className="w-4 h-4 text-amber-400" />,
      content:
        'When candidate evidence is missing, unrecorded, or contradictory, the system executes first-class abstention (decision: abstain) with a structured reason (no_matching_memory) rather than guessing.',
    },
    {
      title: '08 / LongMemEval_S Benchmark Protocol',
      icon: <BarChart2 className="w-4 h-4 text-slate-300" />,
      content:
        'Evaluated across all 500 instances of the official LongMemEval_S dataset with strict oracle isolation (retrieval pipeline never touches gold answers) and user namespace isolation.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-12 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <h1 className="text-lg font-bold font-mono tracking-wider text-white uppercase">
              Technical Architecture
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              System Specification
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Detailed technical breakdown of PALIMN's deterministic, time-aware graph memory engine built on HydraDB Cloud.
          </p>
        </div>

        {/* Technical Badges */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
          <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-700/60 font-bold">
            HYDRADB CLOUD
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            DETERMINISTIC
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            0 LLM
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            0 EMBEDDINGS
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            LONGMEMEVAL_S
          </span>
        </div>
      </div>

      {/* Centerpiece Architecture Diagram */}
      <section className="bg-graphite-900 border border-slate-800 rounded-xl p-8 space-y-8">
        <div className="text-center space-y-1">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
            END-TO-END DATA & REASONING FLOW
          </span>
          <h2 className="text-xl font-bold text-white font-mono">
            HydraDB-Native Temporal Memory Pipeline
          </h2>
        </div>

        {/* Structured Visual Pipeline */}
        <div className="max-w-4xl mx-auto space-y-4 font-mono text-xs">
          {/* Stage 1 */}
          <div className="bg-graphite-950 p-4 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">
                01
              </span>
              <div>
                <span className="font-bold text-slate-200">LongMemEval_S Ingestion</span>
                <span className="text-[10px] text-slate-400 block">500 users · 23,867 sessions · 246,750 messages</span>
              </div>
            </div>
            <span className="text-[10px] text-slate-400">Strict Oracle Isolation</span>
          </div>

          <div className="flex justify-center text-slate-600">
            <ArrowDown className="w-4 h-4" />
          </div>

          {/* Central HydraDB Store */}
          <div className="bg-gradient-to-r from-cyan-950/40 via-graphite-850 to-cyan-950/40 p-5 rounded-xl border border-cyan-500/40 text-center space-y-2">
            <div className="inline-flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <Database className="w-4 h-4" />
              <span>HydraDB Cloud (palimn-memory)</span>
            </div>
            <p className="text-[11px] text-slate-300 max-w-xl mx-auto">
              Persistent graph repository holding 266,689 nodes (User, Session, Message, Fact, Entity) and 294,457 relationships (HAS_SESSION, PRECEDES, CONTAINS, SUPPORTS, SUPERSEDES).
            </p>
          </div>

          <div className="flex justify-center text-slate-600">
            <ArrowDown className="w-4 h-4" />
          </div>

          {/* Stage 2 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-graphite-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] text-cyan-400 font-bold block">Candidate Retrieval</span>
              <p className="text-[11px] text-slate-200">Concept inverted index & user-authorship ranking (Recall@20: 96.60%)</p>
            </div>
            <div className="bg-graphite-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] text-amber-400 font-bold block">Temporal Resolution</span>
              <p className="text-[11px] text-slate-200">SUPERSEDES graph traversal for current vs historical queries</p>
            </div>
            <div className="bg-graphite-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold block">Evidence & Output</span>
              <p className="text-[11px] text-slate-200">Provenanced answer or structured abstention (0.00 confidence)</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8 Architectural Pillars */}
      <section className="space-y-6">
        <h2 className="text-base font-bold font-mono text-white tracking-wide uppercase border-b border-slate-800 pb-3">
          Architectural Subsystems & Technical Specifications
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {architecturalPillars.map((p, idx) => (
            <div
              key={idx}
              className="bg-graphite-900 border border-slate-800 rounded-xl p-5 space-y-3"
            >
              <div className="flex items-center gap-2.5 font-mono text-xs font-bold text-slate-200">
                {p.icon}
                <span>{p.title}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                {p.content}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
