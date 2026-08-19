import React, { useEffect, useState } from 'react';
import { fetchBenchmarkResults, BenchmarkResultsResponse } from '../lib/api';

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

  const latest = results?.latest_run;
  const metrics = latest?.metrics;

  const failureCategories = [
    { name: 'Fact Extraction', count: 302, pct: 65.37, desc: 'Deterministic pattern absence; conservative safe abstention' },
    { name: 'Cross-Session Composition', count: 118, pct: 25.54, desc: 'Multi-session evidence requiring cross-turn synthesis' },
    { name: 'Candidate Retrieval', count: 17, pct: 3.68, desc: 'Target session not captured in Top-20 retrieved messages' },
    { name: 'Entity Binding', count: 12, pct: 2.60, desc: 'Extracted entity contains partial tokens or modifiers' },
    { name: 'Abstention', count: 9, pct: 1.95, desc: 'False answer on unanswerable query turn' },
    { name: 'Revision Resolution', count: 3, pct: 0.65, desc: 'Predecessor/historical state resolution edge mismatch' },
    { name: 'Temporal Reasoning', count: 1, pct: 0.22, desc: 'Temporal anchor misaligned with question date' },
  ];

  const questionTypes = [
    { type: 'single-session-user', count: 70, em: '24.29%', r5: '95.71%', ans: '19 / 51', lat: '475 ms' },
    { type: 'multi-session', count: 133, em: '9.02%', r5: '96.99%', ans: '40 / 93', lat: '428 ms' },
    { type: 'single-session-preference', count: 30, em: '0.00%', r5: '40.00%', ans: '3 / 27', lat: '325 ms' },
    { type: 'temporal-reasoning', count: 133, em: '3.01%', r5: '90.98%', ans: '34 / 99', lat: '382 ms' },
    { type: 'knowledge-update', count: 78, em: '5.13%', r5: '98.72%', ans: '20 / 58', lat: '775 ms' },
    { type: 'single-session-assistant', count: 56, em: '1.79%', r5: '92.86%', ans: '12 / 44', lat: '646 ms' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <h1 className="text-lg font-bold font-mono tracking-wider text-white uppercase">
              Benchmark Observatory
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              LongMemEval_S (Official)
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Empirical evaluation across all 500 LongMemEval_S questions with strict oracle isolation, 0 LLM calls, and 0 vector embeddings.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <span>Dataset Size: <span className="text-white font-bold">500 Questions</span></span>
          <span>•</span>
          <span>Sessions: <span className="text-white font-bold">23,867</span></span>
        </div>
      </div>

      {/* Hero Metrics (6 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-graphite-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">Questions</span>
          <p className="text-2xl font-bold font-mono text-white">500</p>
          <span className="text-[10px] text-slate-400 font-mono block">Complete Run</span>
        </div>

        <div className="bg-graphite-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">Recall@20</span>
          <p className="text-2xl font-bold font-mono text-cyan-400">
            {metrics?.recall_at_20 !== undefined ? `${(metrics.recall_at_20 * 100).toFixed(2)}%` : '96.60%'}
          </p>
          <span className="text-[10px] text-slate-400 font-mono block">483 / 500 records</span>
        </div>

        <div className="bg-graphite-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">Recall@5</span>
          <p className="text-2xl font-bold font-mono text-cyan-400">
            {metrics?.recall_at_5 !== undefined ? `${(metrics.recall_at_5 * 100).toFixed(2)}%` : '91.60%'}
          </p>
          <span className="text-[10px] text-slate-400 font-mono block">458 / 500 records</span>
        </div>

        <div className="bg-graphite-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">Exact Match</span>
          <p className="text-2xl font-bold font-mono text-slate-200">
            {metrics?.exact_match_accuracy !== undefined ? `${(metrics.exact_match_accuracy * 100).toFixed(2)}%` : '7.60%'}
          </p>
          <span className="text-[10px] text-slate-400 font-mono block">38 / 500 records</span>
        </div>

        <div className="bg-graphite-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">Multi-Session</span>
          <p className="text-2xl font-bold font-mono text-slate-200">
            {metrics?.multi_session_acc !== undefined ? `${(metrics.multi_session_acc * 100).toFixed(2)}%` : '9.02%'}
          </p>
          <span className="text-[10px] text-slate-400 font-mono block">12 / 133 records</span>
        </div>

        <div className="bg-graphite-900 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">Avg Latency</span>
          <p className="text-2xl font-bold font-mono text-emerald-400">
            {metrics?.avg_e2e_latency_ms !== undefined ? `${metrics.avg_e2e_latency_ms.toFixed(0)} ms` : '495 ms'}
          </p>
          <span className="text-[10px] text-slate-400 font-mono block">P50: 350 ms</span>
        </div>
      </div>

      {/* Primary Technical Analysis: Retrieval vs Answering */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-graphite-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-mono uppercase text-cyan-400 font-bold">
              01 / Retrieval Recall vs Exact Match Bottleneck
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Diagnostic Finding</span>
          </div>

          <div className="grid grid-cols-2 gap-4 font-mono">
            <div className="bg-graphite-950 p-4 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Candidate Recall@20</span>
              <p className="text-3xl font-bold text-cyan-400 mt-1">96.60%</p>
              <span className="text-[10px] text-slate-400 mt-1 block">HydraDB finds candidate session</span>
            </div>
            <div className="bg-graphite-950 p-4 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Downstream Exact Match</span>
              <p className="text-3xl font-bold text-slate-200 mt-1">7.60%</p>
              <span className="text-[10px] text-slate-400 mt-1 block">Deterministic string synthesis</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 font-mono leading-relaxed bg-graphite-950 p-3.5 rounded border border-slate-800">
            PALIMN usually finds the relevant evidence (96.60% Recall@20). The dominant limitation is converting retrieved evidence into complete answers without generative LLM synthesis.
          </p>
        </div>

        {/* Abstention Calibration Card */}
        <div className="lg:col-span-6 bg-graphite-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-mono uppercase text-amber-400 font-bold">
              02 / Calibrated Abstention Behavior
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Precision Guarantee</span>
          </div>

          <div className="grid grid-cols-3 gap-3 font-mono text-center">
            <div className="bg-graphite-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[9px] text-slate-400 block uppercase">False Answers</span>
              <p className="text-xl font-bold text-emerald-400 mt-1">1.80%</p>
              <span className="text-[9px] text-slate-400 block">9 / 500 overall</span>
            </div>
            <div className="bg-graphite-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[9px] text-slate-400 block uppercase">Correct Abstain</span>
              <p className="text-xl font-bold text-slate-200 mt-1">70.00%</p>
              <span className="text-[9px] text-slate-400 block">21 / 30 abs Qs</span>
            </div>
            <div className="bg-graphite-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[9px] text-slate-400 block uppercase">False Abstain</span>
              <p className="text-xl font-bold text-amber-400 mt-1">74.68%</p>
              <span className="text-[9px] text-slate-400 block">351 / 470 answerable</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 font-mono leading-relaxed bg-graphite-950 p-3.5 rounded border border-slate-800">
            PALIMN is conservative, but deterministic extraction still causes many answerable cases to abstain rather than risk hallucinated outputs.
          </p>
        </div>
      </div>

      {/* Error Analysis Hierarchy */}
      <div className="bg-graphite-900 border border-slate-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-mono uppercase text-slate-200 font-bold">
              Failure Taxonomy Breakdown (462 Non-Exact Match Outcomes)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive categorization of failure causes across the entire 500-question run.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400">Step 11 Taxonomy</span>
        </div>

        <div className="space-y-3 font-mono">
          {failureCategories.map((cat, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">{cat.name}</span>
                <span className="text-slate-400">{cat.count} cases ({cat.pct.toFixed(2)}%)</span>
              </div>
              <div className="w-full h-2 bg-graphite-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full ${
                    idx === 0 ? 'bg-cyan-500' : idx === 1 ? 'bg-indigo-500' : 'bg-slate-600'
                  }`}
                  style={{ width: `${cat.pct}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 block">{cat.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Question Type Breakdown Table */}
      <div className="bg-graphite-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-xs font-mono uppercase text-slate-200 font-bold border-b border-slate-800 pb-3">
          Question Type Performance Breakdown
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                <th className="py-2.5 pr-4">Question Type</th>
                <th className="py-2.5 px-4">Count</th>
                <th className="py-2.5 px-4">Exact Match</th>
                <th className="py-2.5 px-4">Recall@5</th>
                <th className="py-2.5 px-4">Answered / Abstained</th>
                <th className="py-2.5 pl-4">Avg Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {questionTypes.map((qt, idx) => (
                <tr key={idx} className="hover:bg-graphite-850/50">
                  <td className="py-2.5 pr-4 font-semibold text-slate-200">{qt.type}</td>
                  <td className="py-2.5 px-4 text-slate-400">{qt.count}</td>
                  <td className="py-2.5 px-4 text-cyan-300 font-bold">{qt.em}</td>
                  <td className="py-2.5 px-4 text-cyan-400">{qt.r5}</td>
                  <td className="py-2.5 px-4 text-slate-400">{qt.ans}</td>
                  <td className="py-2.5 pl-4 text-emerald-400">{qt.lat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
