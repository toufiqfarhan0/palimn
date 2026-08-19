import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  Database, 
  Search, 
  Clock, 
  GitFork, 
  ShieldCheck, 
  Cpu, 
  Zap
} from 'lucide-react';

interface StageInfo {
  id: string;
  step: number;
  title: string;
  subtitle: string;
  input: string;
  output: string;
  description: string;
  guarantee: string;
  icon: any;
  accent: 'cyan' | 'indigo' | 'amber' | 'emerald';
}

const STAGES: StageInfo[] = [
  {
    id: 'cloud_store',
    step: 1,
    title: 'HydraDB Cloud Storage',
    subtitle: 'Persistent Graph & Vector Corpus',
    input: 'Conversational sessions, user messages, timestamps',
    output: 'Indexed message chunks in database palimn-memory',
    description: 'All 500 benchmark user histories (246,750+ turns) are ingested and remotely indexed in HydraDB Cloud. Ensures zero local volatile state and seamless fresh-process recovery.',
    guarantee: '100% cloud persistent • Zero local in-memory fallback',
    icon: Database,
    accent: 'emerald',
  },
  {
    id: 'query_analyzer',
    step: 2,
    title: 'Query Intent Analyzer',
    subtitle: 'Symbolic Query & Subject Normalization',
    input: "Natural language question (e.g. 'Where did I live before Hyderabad?')",
    output: 'QueryIntent(subject, predicate, temporal_context, query_type)',
    description: 'Analyzes the linguistic intent to extract target entities, time anchors (e.g. before/after), and query classification without invoking any external language models.',
    guarantee: '0.23 ms deterministic parsing • Zero LLMs',
    icon: Search,
    accent: 'cyan',
  },
  {
    id: 'candidate_retrieval',
    step: 3,
    title: 'HydraDB Candidate Retrieval',
    subtitle: 'Hybrid Dense & Sparse Search',
    input: 'Query string + user_id scope',
    output: 'Top-20 ranked candidate messages with relevancy scores',
    description: 'Queries HydraDB Cloud via POST /query with hybrid search to retrieve candidate transcript chunks. Achieves 96.60% Recall@20 on LongMemEval_S.',
    guarantee: '96.60% Recall@20 • Strict oracle isolation',
    icon: Zap,
    accent: 'indigo',
  },
  {
    id: 'fact_extraction',
    step: 4,
    title: 'Memory Unit Extraction',
    subtitle: 'Structural Fact Parsing',
    input: 'Ranked message transcripts',
    output: 'List of structured FactCandidate(subject, predicate, object, qualifiers)',
    description: 'Extracts memory units across identity, location, employment, preferences, and events using deterministic rule sets and generalized syntactical pattern engines.',
    guarantee: 'Deterministic extraction • Provenance linked to message ID',
    icon: Layers,
    accent: 'amber',
  },
  {
    id: 'memory_composition',
    step: 5,
    title: 'Cross-Session Composition',
    subtitle: 'Multi-Turn Syntactic Fusion',
    input: 'Extracted memory units across disparate sessions',
    output: 'Composed multi-hop facts and aggregated attributes',
    description: 'Connects entity mentions and qualifiers distributed across multiple chronological sessions to synthesize cohesive multi-session facts.',
    guarantee: 'Multi-session linking • Temporal ordering preserved',
    icon: GitFork,
    accent: 'indigo',
  },
  {
    id: 'temporal_resolution',
    step: 6,
    title: 'Temporal Resolution & Lineage',
    subtitle: 'SUPERSEDES Graph Traversal',
    input: 'Candidate facts + query temporal context',
    output: 'Final resolved answer OR honest abstention',
    description: 'Traverses SUPERSEDES and PRECEDES edges to determine current active state versus historical state. Refuses to hallucinate when evidence is missing.',
    guarantee: 'Accurate historical rollback • Zero hallucinations',
    icon: Clock,
    accent: 'emerald',
  },
];

export const ArchitecturePage: React.FC = () => {
  const [selectedStageId, setSelectedStageId] = useState<string>('temporal_resolution');
  const activeStage = STAGES.find((s) => s.id === selectedStageId) || STAGES[5];

  return (
    <div className="bg-constellation min-h-screen py-16 px-4 sm:px-8 max-w-6xl mx-auto text-[#F4F7FB] space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-950/20 text-indigo-300 text-xs font-mono">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>System Narrative • Architectural Guarantees</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white tracking-tight leading-tight">
          How PALIMN Thinks.
        </h1>
        <p className="text-[#9AA4B2] text-sm sm:text-base leading-relaxed">
          An end-to-end deterministic pipeline built on top of HydraDB Cloud. Designed for high reliability, temporal precision, and zero hallucinations.
        </p>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. INTERACTIVE PIPELINE FLOW */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto items-start">
        {/* Left 6 cols: Pipeline Stepper List */}
        <div className="lg:col-span-6 space-y-3">
          <span className="text-xs font-mono uppercase text-[#9AA4B2] tracking-wider block mb-2">
            Execution Pipeline (Click to inspect)
          </span>

          {STAGES.map((stage) => {
            const isSelected = stage.id === selectedStageId;
            const Icon = stage.icon;

            return (
              <button
                key={stage.id}
                onClick={() => setSelectedStageId(stage.id)}
                className={`w-full p-4 rounded-2xl text-left border transition-all duration-200 flex items-center justify-between group ${
                  isSelected
                    ? 'bg-[#111625] border-cyan-400 text-white shadow-[0_0_20px_rgba(56,189,248,0.15)]'
                    : 'bg-[#0D101B]/80 border-white/[0.06] text-[#9AA4B2] hover:bg-[#111522] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border text-xs font-mono font-bold ${
                      isSelected
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-[#07090E] border-slate-700/60 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-cyan-200 transition-colors">
                      {stage.title}
                    </h4>
                    <p className="text-[11px] text-[#9AA4B2] font-mono">{stage.subtitle}</p>
                  </div>
                </div>

                <div className="w-2 h-2 rounded-full bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            );
          })}
        </div>

        {/* Right 6 cols: Stage Detail Box */}
        <div className="lg:col-span-6 sticky top-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6 sm:p-8 rounded-3xl bg-[#0A0D18]/95 border border-cyan-500/30 backdrop-blur-xl shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-xs font-mono font-bold text-cyan-300">
                    {activeStage.step}
                  </span>
                  <span className="text-xs font-mono uppercase tracking-widest text-[#9AA4B2]">
                    Stage Details
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-950/20 text-emerald-300">
                  VERIFIED
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-display font-bold text-white">
                  {activeStage.title}
                </h3>
                <p className="text-xs font-mono text-cyan-400 mt-0.5">{activeStage.subtitle}</p>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                {activeStage.description}
              </p>

              {/* Data Flow Input/Output */}
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-[#111522] border border-white/[0.06] space-y-1">
                  <span className="text-[#9AA4B2] text-[10px] uppercase block">Input Stream:</span>
                  <span className="text-white text-xs">{activeStage.input}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#111522] border border-white/[0.06] space-y-1">
                  <span className="text-cyan-400 text-[10px] uppercase block">Output Artifact:</span>
                  <span className="text-cyan-200 text-xs">{activeStage.output}</span>
                </div>
              </div>

              {/* Guarantee Pill */}
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs font-mono text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{activeStage.guarantee}</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. CORE ARCHITECTURAL PILLARS */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div className="p-6 rounded-2xl bg-[#0D101B] border border-white/[0.08] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h4 className="text-lg font-display font-semibold text-white">Zero LLM Dependencies</h4>
          <p className="text-xs text-[#9AA4B2] leading-relaxed">
            The retrieval, extraction, and resolution pipelines run with 0 external LLM calls, eliminating non-deterministic generation and API costs.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0D101B] border border-white/[0.08] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
          <h4 className="text-lg font-display font-semibold text-white">Temporal Graph Native</h4>
          <p className="text-xs text-[#9AA4B2] leading-relaxed">
            SUPERSEDES and PRECEDES edges allow effortless traversal between current facts and superseded historical states without destructive overwrites.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0D101B] border border-white/[0.08] space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <h4 className="text-lg font-display font-semibold text-white">HydraDB Cloud Backend</h4>
          <p className="text-xs text-[#9AA4B2] leading-relaxed">
            Directly integrates with HydraDB Cloud API for persistent storage, indexing, and high-performance hybrid memory search.
          </p>
        </div>
      </div>
    </div>
  );
};
