import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Calendar,
  Clock, 
  Database, 
  GitFork, 
  ShieldCheck, 
  CheckCircle2,
  Search
} from 'lucide-react';
import { HeroConstellation } from '../components/HeroConstellation';

export const HomePage: React.FC = () => {
  // Temporal Transition state
  const [temporalStep, setTemporalStep] = useState<'both' | 'session01' | 'session51'>('both');

  // Interactive Memory Explorer state
  const [activeQueryIndex, setActiveQueryIndex] = useState<number>(0);

  const EXPLORER_QUERIES = [
    {
      question: "Where do I live now?",
      type: "Current State",
      step1: "Extract entity 'user' + predicate 'lives_in' with current temporal context (present).",
      step2: "HydraDB Cloud retrieved 2 candidate location facts from sessions 01 and 51.",
      step3: "TemporalResolver found Hyderabad is ACTIVE (valid_from: 2023-04-20, superseded_by: None).",
      answer: "Hyderabad",
      status: "ACTIVE",
      statusColor: "emerald",
      confidence: "98%",
      evidence: "Session 51: 'I relocated from Bangalore to Hyderabad for my new role.'",
    },
    {
      question: "Where did I live before Hyderabad?",
      type: "Historical State",
      step1: "Detected temporal revision modifier 'before Hyderabad' -> backward lineage traversal.",
      step2: "Traversed backwards along incoming (Hyderabad) <- SUPERSEDES - (Bangalore) edge.",
      step3: "Resolved historical fact Bangalore (valid_from: 2021-03-15, valid_until: 2023-04-20).",
      answer: "Bangalore",
      status: "SUPERSEDED",
      statusColor: "amber",
      confidence: "95%",
      evidence: "Session 01: 'I currently live in Bangalore, working near Indiranagar.'",
    },
    {
      question: "What degree did I graduate with?",
      type: "Knowledge Fact",
      step1: "Intent extraction: entity 'user' + predicate 'graduated_with' + object wildcard.",
      step2: "HydraDB Cloud candidate match found msg_e47becba_s051_m004 (score: 37.50).",
      step3: "Temporal resolver confirmed stable fact with zero contradicting revisions.",
      answer: "Business Administration",
      status: "ACTIVE",
      statusColor: "cyan",
      confidence: "95%",
      evidence: "Session 51: 'I graduated with a degree in Business Administration...'",
    },
    {
      question: "What spaceship does the user own?",
      type: "Abstention",
      step1: "Query analysis parsed subject 'user' + object 'spaceship'.",
      step2: "HydraDB Cloud query returned 0 matching candidate memories or facts.",
      step3: "Abstention engine triggered: INSUFFICIENT_EVIDENCE (0 hallucinations allowed).",
      answer: "I do not have any record of you owning a spaceship.",
      status: "ABSTAIN",
      statusColor: "slate",
      confidence: "100%",
      evidence: "0 supporting facts found across 500 session memory nodes.",
    },
  ];

  return (
    <div className="bg-constellation min-h-screen pb-24 text-[#F4F7FB]">
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO SECTION */}
      {/* ------------------------------------------------------------- */}
      <section className="relative pt-16 sm:pt-24 pb-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-6 max-w-4xl mx-auto">
          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-[#0E1726]/80 text-xs font-mono text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.15)]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>PALIMN • TEMPORAL GRAPH MEMORY</span>
          </motion.div>

          {/* Main Editorial Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-white leading-[1.08]"
          >
            Memory that <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">remembers.</span>
          </motion.h1>

          {/* Subtitle Statement */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-xl text-[#9AA4B2] max-w-2xl font-sans leading-relaxed"
          >
            PALIMN gives AI agents persistent temporal memory across conversations — preserving what changed, what came before, and why.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium text-sm transition-all duration-300 shadow-[0_0_25px_rgba(56,189,248,0.3)] hover:shadow-[0_0_35px_rgba(56,189,248,0.5)] group"
            >
              <span>Ask PALIMN</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/graph"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#111522] hover:bg-[#161B2C] text-white border border-white/[0.08] hover:border-cyan-500/40 font-medium text-sm transition-all duration-300 shadow-sm"
            >
              <GitFork className="w-4 h-4 text-cyan-400" />
              <span>Explore Graph Universe</span>
            </Link>
          </motion.div>
        </div>

        {/* Interactive Constellation Hero Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 sm:mt-16"
        >
          <HeroConstellation />
        </motion.div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. THE TEMPORAL TRANSITION STORY (Bangalore -> SUPERSEDES -> Hyderabad) */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-8 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
            Temporal Lineage
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight">
            Facts change. Memory should adapt.
          </h2>
          <p className="text-[#9AA4B2] text-sm sm:text-base leading-relaxed">
            Most AI vector databases overwrite or hallucinate when facts evolve. PALIMN creates bidirectional <code className="text-amber-300 font-mono text-xs px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-500/30">SUPERSEDES</code> edges, preserving the complete temporal lineage.
          </p>

          {/* Stepper Selector */}
          <div className="inline-flex p-1 rounded-full bg-[#111522] border border-white/[0.08] text-xs font-mono">
            <button
              onClick={() => setTemporalStep('session01')}
              className={`px-4 py-1.5 rounded-full transition-colors ${
                temporalStep === 'session01' ? 'bg-slate-700 text-white' : 'text-[#9AA4B2] hover:text-white'
              }`}
            >
              1. Session 01 (March 2021)
            </button>
            <button
              onClick={() => setTemporalStep('session51')}
              className={`px-4 py-1.5 rounded-full transition-colors ${
                temporalStep === 'session51' ? 'bg-cyan-500 text-slate-950 font-medium' : 'text-[#9AA4B2] hover:text-white'
              }`}
            >
              2. Session 51 (April 2023)
            </button>
            <button
              onClick={() => setTemporalStep('both')}
              className={`px-4 py-1.5 rounded-full transition-colors ${
                temporalStep === 'both' ? 'bg-amber-500 text-slate-950 font-medium' : 'text-[#9AA4B2] hover:text-white'
              }`}
            >
              Full Lineage
            </button>
          </div>
        </div>

        {/* Visual Temporal Transition Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
          {/* Historical Fact (Bangalore) */}
          <motion.div
            animate={{
              opacity: temporalStep === 'session51' ? 0.35 : 1,
              scale: temporalStep === 'session01' ? 1.02 : 1,
            }}
            transition={{ duration: 0.3 }}
            className={`p-6 rounded-2xl border transition-all duration-300 ${
              temporalStep === 'session01'
                ? 'bg-[#121626] border-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.15)]'
                : 'bg-[#0D101A]/80 border-white/[0.08]'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-[#9AA4B2] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Session 01 • 2021-03-15
              </span>
              <span className="badge-superseded px-2.5 py-0.5 rounded-full text-[10px] font-mono">
                HISTORICAL STATE
              </span>
            </div>

            <h3 className="text-xl font-display font-semibold text-white mb-2">
              "I live in Bangalore."
            </h3>
            <p className="text-xs text-[#9AA4B2] mb-4">
              Indiranagar residence recorded during onboarding.
            </p>

            <div className="p-3 rounded-lg bg-[#07090E] border border-white/[0.04] text-xs font-mono space-y-1">
              <div className="text-slate-400">valid_from: <span className="text-white">2021-03-15</span></div>
              <div className="text-amber-400">valid_until: <span className="text-amber-300 font-semibold">2023-04-20</span></div>
              <div className="text-slate-400">status: <span className="text-amber-400">superseded</span></div>
            </div>
          </motion.div>

          {/* Active Fact (Hyderabad) */}
          <motion.div
            animate={{
              opacity: temporalStep === 'session01' ? 0.35 : 1,
              scale: temporalStep === 'session51' ? 1.02 : 1,
            }}
            transition={{ duration: 0.3 }}
            className={`p-6 rounded-2xl border transition-all duration-300 ${
              temporalStep === 'session51' || temporalStep === 'both'
                ? 'bg-[#0E1A2C] border-cyan-400/50 shadow-[0_0_25px_rgba(56,189,248,0.15)]'
                : 'bg-[#0D101A]/80 border-white/[0.08]'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-[#9AA4B2] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                Session 51 • 2023-04-20
              </span>
              <span className="badge-active px-2.5 py-0.5 rounded-full text-[10px] font-mono">
                ACTIVE STATE
              </span>
            </div>

            <h3 className="text-xl font-display font-semibold text-white mb-2">
              "I moved to Hyderabad."
            </h3>
            <p className="text-xs text-[#9AA4B2] mb-4">
              Relocated for tech center leadership role.
            </p>

            <div className="p-3 rounded-lg bg-[#07090E] border border-white/[0.04] text-xs font-mono space-y-1">
              <div className="text-slate-400">valid_from: <span className="text-white">2023-04-20</span></div>
              <div className="text-emerald-400">valid_until: <span className="text-emerald-300 font-semibold">present</span></div>
              <div className="text-slate-400">supersedes: <span className="text-amber-400">fact_loc_bangalore</span></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. MEMORY EXPLORER (Interactive Investigation Section) */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-8 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
            Interactive Investigation
          </span>
          <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight">
            Explore how PALIMN resolves memory.
          </h2>
          <p className="text-[#9AA4B2] text-sm sm:text-base">
            Select a sample query to follow PALIMN's temporal reasoning through the memory graph in real time.
          </p>
        </div>

        {/* Query selector tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl mx-auto mb-8">
          {EXPLORER_QUERIES.map((q, idx) => {
            const isSelected = activeQueryIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveQueryIndex(idx)}
                className={`p-4 rounded-xl text-left border transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#111625] border-cyan-400 text-white shadow-[0_0_20px_rgba(56,189,248,0.15)]'
                    : 'bg-[#0D101B]/70 border-white/[0.06] text-[#9AA4B2] hover:text-white hover:bg-[#111522]'
                }`}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 mb-1">
                  {q.type}
                </div>
                <div className="text-xs font-medium line-clamp-2">{q.question}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Investigation Pipeline Display */}
        {(() => {
          const current = EXPLORER_QUERIES[activeQueryIndex];
          return (
            <div className="max-w-5xl mx-auto rounded-2xl border border-white/[0.08] bg-[#0A0D18]/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-8">
              {/* Question Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
                <div>
                  <span className="text-[11px] font-mono text-[#9AA4B2] uppercase tracking-wider">
                    Target Question
                  </span>
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-white mt-1">
                    "{current.question}"
                  </h3>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs font-mono text-[#9AA4B2]">Decision:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-medium border ${
                      current.status === 'ACTIVE'
                        ? 'badge-active'
                        : current.status === 'SUPERSEDED'
                        ? 'badge-superseded'
                        : 'badge-abstain'
                    }`}
                  >
                    {current.status}
                  </span>
                </div>
              </div>

              {/* 3 Step Animated Trace */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#111522]/80 border border-white/[0.06] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                    <Search className="w-3.5 h-3.5" />
                    <span>1. Intent Analysis</span>
                  </div>
                  <p className="text-xs text-slate-300">{current.step1}</p>
                </div>

                <div className="p-4 rounded-xl bg-[#111522]/80 border border-white/[0.06] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
                    <Database className="w-3.5 h-3.5" />
                    <span>2. HydraDB Cloud Pool</span>
                  </div>
                  <p className="text-xs text-slate-300">{current.step2}</p>
                </div>

                <div className="p-4 rounded-xl bg-[#111522]/80 border border-white/[0.06] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>3. Temporal Resolution</span>
                  </div>
                  <p className="text-xs text-slate-300">{current.step3}</p>
                </div>
              </div>

              {/* Dominant Answer & Provenance Box */}
              <div className="p-6 rounded-xl bg-gradient-to-r from-[#0E1A2C] to-[#12162A] border border-cyan-500/30 space-y-4">
                <div>
                  <span className="text-[11px] font-mono text-cyan-300 uppercase tracking-widest">
                    Resolved Answer
                  </span>
                  <div className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
                    {current.answer}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-[#9AA4B2]">
                  <span className="text-slate-300 italic">"{current.evidence}"</span>
                  <span className="text-cyan-400 font-medium">Confidence: {current.confidence}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. PERSISTENT HYDRADB CLOUD FOUNDATION */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-8 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              HydraDB Cloud Storage
            </span>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
              Persistent memory in the cloud. Zero in-memory loss.
            </h2>
            <p className="text-[#9AA4B2] text-sm sm:text-base leading-relaxed">
              Every user session, candidate message, entity mention, and temporal revision is indexed and remotely stored in the HydraDB Cloud database <code className="text-cyan-300 font-mono text-xs px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30">palimn-memory</code>.
            </p>

            <ul className="space-y-3 text-xs font-mono text-slate-300">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Fresh-process memory recovery without local cache</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Deterministic temporal graph traversal (SUPERSEDES/PRECEDES)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero LLM hallucination in the memory pipeline</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#0D101B] border border-white/[0.08] space-y-2">
              <div className="text-2xl sm:text-3xl font-display font-bold text-white">500 / 500</div>
              <div className="text-xs text-[#9AA4B2] font-mono">LongMemEval_S Questions</div>
            </div>
            <div className="p-5 rounded-2xl bg-[#0D101B] border border-white/[0.08] space-y-2">
              <div className="text-2xl sm:text-3xl font-display font-bold text-cyan-400">96.60%</div>
              <div className="text-xs text-[#9AA4B2] font-mono">Recall@20 Candidates</div>
            </div>
            <div className="p-5 rounded-2xl bg-[#0D101B] border border-white/[0.08] space-y-2">
              <div className="text-2xl sm:text-3xl font-display font-bold text-emerald-400">0 LLMs</div>
              <div className="text-xs text-[#9AA4B2] font-mono">Zero LLM Dependencies</div>
            </div>
            <div className="p-5 rounded-2xl bg-[#0D101B] border border-white/[0.08] space-y-2">
              <div className="text-2xl sm:text-3xl font-display font-bold text-indigo-400">100% Cloud</div>
              <div className="text-xs text-[#9AA4B2] font-mono">Real Persistent Storage</div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. BOTTOM CTA BANNER */}
      {/* ------------------------------------------------------------- */}
      <section className="pt-12 px-4 sm:px-8 max-w-5xl mx-auto text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#111625] to-[#07080D] border border-white/[0.08] space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-glow opacity-50 pointer-events-none" />
          <h3 className="text-2xl sm:text-4xl font-display font-bold text-white relative z-10">
            Ready to explore living temporal memory?
          </h3>
          <p className="text-[#9AA4B2] text-sm max-w-xl mx-auto relative z-10">
            Search conversational history, follow fact updates backwards in time, and inspect exact provenance snippets.
          </p>
          <div className="pt-2 relative z-10 flex justify-center gap-4">
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium text-sm transition-all duration-300 shadow-[0_0_25px_rgba(56,189,248,0.3)]"
            >
              <span>Launch Memory Console</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
