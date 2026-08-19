import React from 'react';
import { 
  Activity, 
  Clock
} from 'lucide-react';

export const BenchmarkPage: React.FC = () => {
  return (
    <div className="bg-constellation min-h-screen py-16 px-4 sm:px-8 max-w-6xl mx-auto text-[#F4F7FB] space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-950/20 text-cyan-300 text-xs font-mono">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>LongMemEval_S Benchmark • Real HydraDB Cloud Evaluation</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white tracking-tight leading-tight">
          Retrieval is solved. Answering is the frontier.
        </h1>
        <p className="text-[#9AA4B2] text-sm sm:text-base leading-relaxed">
          Full 500-question evaluation on LongMemEval_S against live HydraDB Cloud persistence with strict oracle isolation, zero LLM calls, and zero PALIMN embeddings.
        </p>
      </div>

      {/* Primary Hero Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
        <div className="p-6 rounded-2xl bg-[#0D101B] border border-white/[0.08] space-y-1">
          <span className="text-[11px] font-mono uppercase text-[#9AA4B2]">Questions Evaluated</span>
          <div className="text-3xl sm:text-4xl font-display font-bold text-white">500</div>
          <p className="text-[11px] font-mono text-emerald-400">100% evaluated</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#0E1A2C] border border-cyan-500/40 shadow-[0_0_25px_rgba(56,189,248,0.15)] space-y-1">
          <span className="text-[11px] font-mono uppercase text-cyan-300">Recall @ 20</span>
          <div className="text-3xl sm:text-4xl font-display font-bold text-cyan-300">96.60%</div>
          <p className="text-[11px] font-mono text-cyan-400">483 / 500 target sessions</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#111522] border border-white/[0.08] space-y-1">
          <span className="text-[11px] font-mono uppercase text-[#9AA4B2]">Recall @ 5</span>
          <div className="text-3xl sm:text-4xl font-display font-bold text-white">91.60%</div>
          <p className="text-[11px] font-mono text-[#9AA4B2]">458 / 500 target sessions</p>
        </div>

        <div className="p-6 rounded-2xl bg-[#181524] border border-indigo-500/30 space-y-1">
          <span className="text-[11px] font-mono uppercase text-indigo-300">Exact Match</span>
          <div className="text-3xl sm:text-4xl font-display font-bold text-indigo-200">7.60%</div>
          <p className="text-[11px] font-mono text-indigo-400">38 exact predictions</p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. THE BOTTLENECK FUNNEL (RETRIEVAL != ANSWERING) */}
      {/* ------------------------------------------------------------- */}
      <section className="p-8 sm:p-10 rounded-3xl bg-[#0A0D18]/90 border border-white/[0.08] backdrop-blur-xl shadow-2xl space-y-8 max-w-5xl mx-auto">
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase text-cyan-400 tracking-widest">
            Diagnostic Discovery
          </span>
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-white tracking-tight">
            The Pipeline Bottleneck: Why Retrieval ≠ Answering
          </h2>
          <p className="text-xs sm:text-sm text-[#9AA4B2] leading-relaxed">
            HydraDB Cloud successfully retrieves the correct target message for 96.60% of questions. The drop occurs downstream in fact extraction and multi-session composition.
          </p>
        </div>

        {/* Visual Animated Funnel Steps */}
        <div className="space-y-4 font-mono text-xs">
          {/* Step 1: Input Questions */}
          <div className="p-4 rounded-xl bg-[#111522] border border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-[11px]">1</span>
              <div>
                <span className="text-white font-medium">Input Questions</span>
                <span className="text-[#9AA4B2] block text-[11px]">LongMemEval_S 500-question benchmark</span>
              </div>
            </div>
            <span className="text-white font-bold text-sm">500 (100%)</span>
          </div>

          {/* Step 2: HydraDB Cloud Candidate Retrieval */}
          <div className="p-4 rounded-xl bg-[#0E1A2C] border border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-[11px]">2</span>
              <div>
                <span className="text-cyan-300 font-medium">HydraDB Cloud Retrieval (Recall@20)</span>
                <span className="text-[#9AA4B2] block text-[11px]">Gold session present in candidate pool</span>
              </div>
            </div>
            <span className="text-cyan-300 font-bold text-sm">483 (96.60%)</span>
          </div>

          {/* Step 3: Fact Extraction Bottleneck */}
          <div className="p-4 rounded-xl bg-[#1C160B] border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-[11px]">3</span>
              <div>
                <span className="text-amber-300 font-medium">Fact Extraction Bottleneck</span>
                <span className="text-amber-200/70 block text-[11px]">302 cases missed due to unstructured syntax patterns</span>
              </div>
            </div>
            <span className="text-amber-300 font-bold text-sm">65.37% of misses</span>
          </div>

          {/* Step 4: Cross-Session Composition Bottleneck */}
          <div className="p-4 rounded-xl bg-[#1B1425] border border-indigo-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-[11px]">4</span>
              <div>
                <span className="text-indigo-300 font-medium">Cross-Session Composition Bottleneck</span>
                <span className="text-indigo-200/70 block text-[11px]">118 multi-session counting/reduction misses</span>
              </div>
            </div>
            <span className="text-indigo-300 font-bold text-sm">25.54% of misses</span>
          </div>

          {/* Step 5: Final Exact Match */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#0E1A2C] to-[#121626] border border-cyan-400 flex items-center justify-between shadow-[0_0_20px_rgba(56,189,248,0.2)]">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-bold text-[11px]">5</span>
              <div>
                <span className="text-white font-medium">Final Exact Match Answer</span>
                <span className="text-cyan-300 block text-[11px]">Exact string/entity match against benchmark ground truth</span>
              </div>
            </div>
            <span className="text-cyan-300 font-bold text-base">38 (7.60%)</span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. QUESTION TYPE ACCURACY & LATENCY */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto">
        {/* Category Breakdown (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0D101B] border border-white/[0.08] space-y-4">
          <span className="text-xs font-mono uppercase text-[#9AA4B2] tracking-wider">
            Accuracy By Question Type
          </span>
          <div className="space-y-3 font-mono text-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Single-Session User (70)</span>
                <span className="text-cyan-400 font-bold">24.29% (17 / 70)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800">
                <div className="h-full bg-cyan-400 rounded-full" style={{ width: '24.29%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Multi-Session Composition (133)</span>
                <span className="text-indigo-400 font-bold">9.02% (12 / 133)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800">
                <div className="h-full bg-indigo-400 rounded-full" style={{ width: '9.02%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Knowledge Update (78)</span>
                <span className="text-amber-400 font-bold">5.13% (4 / 78)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: '5.13%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Temporal Reasoning (133)</span>
                <span className="text-slate-400 font-bold">3.01% (4 / 133)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: '3.01%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Single-Session Assistant (56)</span>
                <span className="text-slate-400 font-bold">1.79% (1 / 56)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800">
                <div className="h-full bg-slate-500 rounded-full" style={{ width: '1.79%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Latency Breakdown (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0D101B] border border-white/[0.08] space-y-4">
          <span className="text-xs font-mono uppercase text-[#9AA4B2] tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Latency Distribution
          </span>
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 rounded-lg bg-[#111522] border border-white/[0.04] space-y-1">
              <div className="text-[#9AA4B2]">Average Total Latency</div>
              <div className="text-xl font-display font-bold text-white">7,704.57 ms</div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded bg-[#111522] border border-white/[0.04]">
                <span className="text-[#9AA4B2] block">P50 Latency</span>
                <span className="text-white font-bold">6,354.65 ms</span>
              </div>
              <div className="p-2.5 rounded bg-[#111522] border border-white/[0.04]">
                <span className="text-[#9AA4B2] block">P95 Latency</span>
                <span className="text-amber-400 font-bold">14,813.42 ms</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.06] text-[11px] space-y-1">
              <div className="flex justify-between text-[#9AA4B2]">
                <span>HydraDB Cloud Average:</span>
                <span className="text-white">7,297.16 ms (94.7%)</span>
              </div>
              <div className="flex justify-between text-[#9AA4B2]">
                <span>PALIMN Reasoning Average:</span>
                <span className="text-cyan-400">343.62 ms (4.5%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
