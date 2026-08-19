import React, { useEffect, useState } from 'react';
import { fetchBenchmarkResults, BenchmarkResultsResponse } from '../lib/api';
import { BarChart3, Play } from 'lucide-react';

export const BenchmarkPage: React.FC = () => {
  const [results, setResults] = useState<BenchmarkResultsResponse | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const data = await fetchBenchmarkResults();
        setResults(data);
      } catch (err) {
        console.error('Failed to load benchmark results', err);
      }
    };
    loadResults();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-palimn-violet" />
            <span>LongMemEval_S Benchmark Suite</span>
          </h1>
          <p className="text-xs text-slate-400">
            500 evaluation questions spanning ~40 sessions and ~115K tokens. Empirical evaluation of temporal reasoning & abstention.
          </p>
        </div>

        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-graphite-800 border border-slate-700 text-slate-400 text-xs font-mono opacity-60 cursor-not-allowed"
          title="Run from CLI via scripts/run_benchmark.py or after LongMemEval dataset ingestion"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Execute Run (Phase 9)</span>
        </button>
      </div>

      {/* Baseline Comparison Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel rounded-xl p-4 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Baseline A</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Standard RAG</span>
          </div>
          <h3 className="text-sm font-semibold text-white font-mono">Vector Top-K Search</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Fails on temporal updates and overwrites because semantically similar old facts outrank newer revisions.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Baseline B</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">Exhaustive</span>
          </div>
          <h3 className="text-sm font-semibold text-white font-mono">Full-Context LLM</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            115K token prompt per question. High latency, prohibitive cost, and lost-in-the-middle degradation.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-palimn-violet/40 bg-palimn-violet/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-palimn-violet-light font-semibold">Track 3 Solution</span>
            <span className="px-1.5 py-0.5 rounded bg-palimn-violet/20 text-palimn-violet-light border border-palimn-violet/30">
              PALIMN
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white font-mono">Temporal Memory Graph</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Explicit revision lineage (<span className="font-mono text-amber-400">SUPERSEDES</span>), temporal grounding, and calibrated abstention.
          </p>
        </div>
      </div>

      {/* Benchmark Metric Cards */}
      <div className="glass-panel rounded-xl p-6 border border-slate-800/80 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300">
            Empirical Results (LongMemEval_S)
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {results?.latest_run ? `Run: ${results.latest_run.run_id}` : 'No verified runs yet'}
          </span>
        </div>

        {results?.runs.length === 0 ? (
          <div className="p-8 text-center space-y-2 rounded-lg bg-graphite-900/40 border border-slate-800/50">
            <BarChart3 className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-300 font-mono">No Benchmark Runs Recorded</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Run <code className="text-palimn-violet">python scripts/run_benchmark.py</code> once LongMemEval_S dataset ingestion is complete in subsequent phases.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-graphite-900 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400">Overall Accuracy</span>
              <p className="text-2xl font-bold text-white font-mono mt-1">
                {((results?.latest_run?.metrics?.overall_accuracy || 0) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
