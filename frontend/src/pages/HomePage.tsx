import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Database,
  GitFork,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { TimeMachineScrubber } from '../components/TimeMachineScrubber';

/* ─── Scroll-reveal helper ───────────────────────────────────────── */
const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className = '',
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

/* ─── Live counter ────────────────────────────────────────────────── */
const Counter: React.FC<{ to: number; suffix?: string; decimals?: number }> = ({
  to, suffix = '', decimals = 0,
}) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const dur = 1400;
    const run = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setVal(parseFloat((eased * to).toFixed(decimals)));
      if (p < 1) frame = requestAnimationFrame(run);
    };
    const ob = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { frame = requestAnimationFrame(run); ob.disconnect(); }
    });
    const el = document.getElementById('counter-trigger');
    if (el) ob.observe(el);
    return () => { cancelAnimationFrame(frame); ob.disconnect(); };
  }, [to, decimals]);
  return <span>{decimals > 0 ? val.toFixed(decimals) : val}{suffix}</span>;
};

/* ─── Stats ──────────────────────────────────────────────────────── */
const STATS = [
  { label: 'Recall@20 on LongMemEval_S', value: 96.60, suffix: '%', decimals: 2, highlight: true },
  { label: 'Recall@5 Precision',         value: 91.60, suffix: '%', decimals: 2, highlight: false },
  { label: 'Benchmark Questions Tested',  value: 500,   suffix: '',  decimals: 0, highlight: false },
  { label: 'LLM Inference Dependencies',  value: 0,     suffix: '',  decimals: 0, highlight: false },
];

/* ─── Pipeline stages ────────────────────────────────────────────── */
const STAGES = [
  { id: '01', title: 'Intent Analyzer', desc: 'Parses entity, predicate, and temporal anchors from natural language queries.' },
  { id: '02', title: 'Candidate Retrieval', desc: 'Queries HydraDB Cloud for ranked vector candidates matching entity relationships.' },
  { id: '03', title: 'Fact Extraction', desc: 'Structures candidates into temporal tuples with valid_from and valid_to intervals.' },
  { id: '04', title: 'Temporal Resolution', desc: 'Traverses the SUPERSEDES graph to resolve active truth or execute calibrated abstention.' },
];

export const HomePage: React.FC = () => {
  return (
    <div className="bg-transparent min-h-screen font-['Plus_Jakarta_Sans',sans-serif]">

      {/* ── HERO SECTION ────────────────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left Hero Content (7 cols) */}
          <motion.div
            className="lg:col-span-7 space-y-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[12px] font-semibold text-amber-300 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>HACKHYDRA TRACK 3 · HYDRADB CLOUD NATIVE</span>
            </div>

            {/* Headline */}
            <h1 className="text-[44px] sm:text-[56px] lg:text-[64px] font-extrabold text-white leading-[1.05] tracking-tight">
              Memory that <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200">
                never hallucinates.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-[17px] text-slate-300 leading-relaxed max-w-[540px]">
              Persistent, time-anchored graph memory for AI agents. Every fact update is tracked with <code className="text-amber-300 bg-amber-950/40 border border-amber-500/30">SUPERSEDES</code> edges, ensuring 100% deterministic temporal resolution with zero LLM inference.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link to="/chat" className="btn-primary">
                Launch Memory Console
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/graph" className="btn-ghost">
                Inspect Graph Universe
              </Link>
            </div>

            {/* Feature badges */}
            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-white/[0.08] text-[13px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 text-slate-200 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                96.60% Recall@20
              </span>
              <span className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-400" />
                HydraDB Cloud
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                0 Hallucinations
              </span>
            </div>
          </motion.div>

          {/* Right Hero Image Card (5 cols) */}
          <motion.div
            className="lg:col-span-5"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="rounded-[16px] overflow-hidden border border-white/[0.12] shadow-2xl bg-[#0F1424]/85 backdrop-blur-xl p-2.5">
              <img
                src="/hero-light.jpg"
                alt="PALIMN Knowledge Graph and Memory Query Interface"
                className="w-full h-auto rounded-[12px] object-cover"
              />
              <div className="px-3 py-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Status: Deterministic Pipeline Active</span>
                <span className="text-emerald-400 font-semibold">0ms LLM Overhead</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────────── */}
      <section id="counter-trigger" className="border-y border-white/[0.08] bg-[#07090E]/80 backdrop-blur-lg">
        <div className="max-w-[1200px] mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="space-y-1">
              <div
                className="text-[36px] sm:text-[44px] font-extrabold tracking-tight leading-none"
                style={{ color: s.highlight ? '#F59E0B' : '#FFFFFF' }}
              >
                <Counter to={s.value} suffix={s.suffix} decimals={s.decimals} />
              </div>
              <div className="text-[12px] font-mono text-slate-400 leading-snug">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── THREE PILLARS (Clean Glass Cards) ────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 py-20">
        <Reveal className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <h2 className="text-[32px] sm:text-[40px] font-extrabold text-white tracking-tight">
            Engineered for Grounded Agent State
          </h2>
          <p className="text-[15px] text-slate-300">
            Why standard RAG fails on temporal facts and how PALIMN resolves it deterministically.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <Reveal delay={0.05}>
            <div className="card h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-[8px] bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <GitFork className="w-5 h-5" />
                </div>
                <h3 className="text-[20px] font-bold text-white tracking-tight">
                  Temporal Lineage Graph
                </h3>
                <p className="text-[14px] text-slate-300 leading-relaxed">
                  Facts aren't overwritten or merged into vague summaries. Each update creates an explicit <code className="text-amber-300">SUPERSEDES</code> edge, preserving full provenance.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-white/[0.08] text-[12px] font-mono text-amber-400 font-semibold">
                valid_from → valid_to intervals
              </div>
            </div>
          </Reveal>

          {/* Card 2 */}
          <Reveal delay={0.1}>
            <div className="card h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-[8px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-[20px] font-bold text-white tracking-tight">
                  Calibrated Abstention
                </h3>
                <p className="text-[14px] text-slate-300 leading-relaxed">
                  When a queried fact has no historical evidence in HydraDB, PALIMN executes a calibrated refusal instead of confabulating a plausible lie.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-white/[0.08] text-[12px] font-mono text-emerald-400 font-semibold">
                0 false positives emitted
              </div>
            </div>
          </Reveal>

          {/* Card 3 */}
          <Reveal delay={0.15}>
            <div className="card h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-[8px] bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-[20px] font-bold text-white tracking-tight">
                  Deterministic Execution
                </h3>
                <p className="text-[14px] text-slate-300 leading-relaxed">
                  Zero LLM generation in the query loop. The 4-stage pipeline operates through rule extraction, semantic indexing, and graph traversal.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-white/[0.08] text-[12px] font-mono text-amber-400 font-semibold">
                Sub-second response latency
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── TIME MACHINE SCRUBBER INTERACTIVE ─────────────────────── */}
      <section className="border-y border-white/[0.08] bg-[#07090E]/70 backdrop-blur-md py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <TimeMachineScrubber />
        </div>
      </section>

      {/* ── PIPELINE FLOW (4 Steps) ───────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-6 py-20">
        <Reveal className="max-w-2xl mb-12 space-y-2">
          <span className="text-[12px] font-mono font-semibold uppercase text-amber-400">Deterministic Pipeline</span>
          <h2 className="text-[32px] sm:text-[40px] font-extrabold text-white tracking-tight">
            How PALIMN Answers in 4 Stages
          </h2>
          <p className="text-[15px] text-slate-300">
            From ambiguous natural language query to provable ground truth.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAGES.map((s, i) => (
            <Reveal key={s.id} delay={i * 0.05}>
              <div className="card h-full space-y-3">
                <div className="text-[12px] font-mono font-bold text-amber-400">STAGE {s.id}</div>
                <h4 className="text-[17px] font-bold text-white">{s.title}</h4>
                <p className="text-[13px] text-slate-300 leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-10">
          <Link to="/architecture" className="btn-ghost">
            View Complete Architectural Contracts
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── BOTTOM CTA ────────────────────────────────────────────── */}
      <section className="border-t border-white/[0.08] bg-gradient-to-r from-amber-950/40 via-[#0E1528]/60 to-blue-950/40 backdrop-blur-xl py-16">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-1">
            <h3 className="text-[24px] font-bold text-white tracking-tight">
              Test PALIMN with your own questions
            </h3>
            <p className="text-[14px] text-slate-300">
              Run queries against LongMemEval_S or test live graph navigation.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/chat" className="btn-primary">
              Open Console
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/benchmark" className="btn-ghost">
              View Benchmarks
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
