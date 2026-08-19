import React, { useState } from 'react';
import { sendChatQuery, ChatQueryResponse, EvidenceItem } from '../lib/api';
import {
  Terminal,
  Send,
  ShieldAlert,
  Clock,
  History,
  CheckCircle2,
  AlertTriangle,
  CornerDownRight,
} from 'lucide-react';

interface CuratedQuery {
  label: string;
  query: string;
  expectedState: 'HISTORICAL' | 'ACTIVE' | 'ABSTAIN';
}

export const ChatPage: React.FC = () => {
  const [question, setQuestion] = useState<string>('Where did I live before Hyderabad?');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<ChatQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const curatedQueries: CuratedQuery[] = [
    {
      label: 'Historical Revision',
      query: 'Where did I live before Hyderabad?',
      expectedState: 'HISTORICAL',
    },
    {
      label: 'Current Active State',
      query: 'Where do I live now?',
      expectedState: 'ACTIVE',
    },
    {
      label: 'Missing Session Abstention',
      query: 'What did I do in Session 99?',
      expectedState: 'ABSTAIN',
    },
    {
      label: 'Unrecorded Topic Abstention',
      query: 'What spaceship does the user own?',
      expectedState: 'ABSTAIN',
    },
  ];

  const handleQuery = async (qText: string) => {
    if (!qText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await sendChatQuery({ question: qText });
      setResponse(res);
    } catch (err: any) {
      setError(err.message || 'Failed to query temporal memory graph.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Console Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <h1 className="text-lg font-bold font-mono tracking-wider text-white uppercase">
              Memory Console
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Deterministic Traversal
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Inspect time-aware memory retrieval with explicit revision resolution, evidence grounding, and calibrated abstention.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span>Engine: <span className="text-slate-200">HydraDB Cloud</span></span>
          <span>•</span>
          <span>LLM Calls: <span className="text-cyan-400">0</span></span>
        </div>
      </div>

      {/* 3-Column / Responsive Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Query Input & Curated Demo Presets (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-graphite-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="space-y-2">
              <label htmlFor="console-query" className="text-xs font-mono uppercase text-slate-400 block font-semibold">
                Input Query
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleQuery(question);
                }}
                className="space-y-3"
              >
                <textarea
                  id="console-query"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                  placeholder="Enter temporal query across sessions..."
                  className="w-full bg-graphite-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/40 transition-all resize-none"
                />
                <button
                  type="submit"
                  disabled={loading || !question.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-slate-100 hover:bg-white text-graphite-950 text-xs font-mono font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'Traversing Graph...' : 'Execute Memory Query'}</span>
                </button>
              </form>
            </div>

            {/* Curated Demo Queries */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 block font-semibold">
                Curated Demo Queries
              </span>
              <div className="space-y-1.5">
                {curatedQueries.map((cq, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuestion(cq.query);
                      handleQuery(cq.query);
                    }}
                    className="w-full text-left p-2.5 rounded bg-graphite-850 hover:bg-graphite-800 border border-slate-800 hover:border-slate-700 transition-colors text-xs font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-medium">{cq.label}</span>
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.2 rounded border ${
                          cq.expectedState === 'ACTIVE'
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                            : cq.expectedState === 'HISTORICAL'
                            ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {cq.expectedState}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">"{cq.query}"</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Decision & Answer Display (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {error && (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/50 text-xs font-mono text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!response && !error && (
            <div className="bg-graphite-900 border border-slate-800 rounded-xl p-8 text-center space-y-3">
              <Terminal className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-xs font-mono uppercase text-slate-300 font-semibold">Console Ready</h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Execute an interactive query on the left or select a curated query to inspect time-aware reasoning.
              </p>
            </div>
          )}

          {response && (
            <div className="bg-graphite-900 border border-slate-800 rounded-xl p-5 space-y-5">
              {/* Decision Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">System Decision</span>
                  {response.decision === 'answerable' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-700/60">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      ANSWERABLE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded bg-amber-950/60 text-amber-300 border border-amber-700/60">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      ABSTAIN ({response.reason || 'no_matching_memory'})
                    </span>
                  )}
                </div>

                <div className="text-right font-mono text-xs space-y-0.5">
                  <div className="text-slate-400">Confidence: <span className="text-slate-200 font-bold">{response.confidence.toFixed(2)}</span></div>
                  <div className="text-slate-400">Latency: <span className="text-cyan-400 font-bold">{response.latency_ms} ms</span></div>
                </div>
              </div>

              {/* Answer Content */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Retrieved Result</span>
                {response.decision === 'answerable' && response.answer ? (
                  <div className="p-4 rounded-lg bg-graphite-950 border border-slate-800 font-mono text-sm text-slate-100 font-semibold leading-relaxed">
                    {response.answer}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-800/40 text-xs font-mono text-amber-200/90 leading-relaxed space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      Calibrated Abstention
                    </p>
                    <p className="text-[11px] text-amber-300/80">
                      No matching memory or temporal fact satisfied the query intent with sufficient confidence.
                    </p>
                  </div>
                )}
              </div>

              {/* Temporal Reasoning Trace */}
              {response.temporal_reasoning && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>Graph Traversal & Temporal Trace</span>
                  </span>
                  <div className="p-3 rounded-lg bg-graphite-950 border border-slate-800/80 font-mono text-xs text-slate-300 leading-relaxed">
                    {response.temporal_reasoning}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Evidence & Revision Inspector (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-graphite-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-mono uppercase text-slate-300 font-semibold flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-cyan-400" />
                <span>Evidence Inspector</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                {response?.evidence.length || 0} facts
              </span>
            </div>

            {!response || response.evidence.length === 0 ? (
              <div className="p-4 rounded-lg bg-graphite-950 border border-slate-800/60 text-center text-xs font-mono text-slate-400">
                No supporting evidence items.
              </div>
            ) : (
              <div className="space-y-3">
                {response.evidence.map((ev: EvidenceItem, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-graphite-950 border border-slate-800 font-mono text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.2 rounded border ${
                          ev.status === 'active'
                            ? 'bg-emerald-950/50 text-emerald-300 border-emerald-700/60'
                            : 'bg-amber-950/50 text-amber-300 border-amber-700/60'
                        }`}
                      >
                        {ev.status}
                      </span>
                      <span className="text-[10px] text-slate-400">{ev.session_id}</span>
                    </div>

                    <div className="text-[11px] text-slate-200 leading-tight">
                      <span className="text-slate-400">{ev.subject}</span>{' '}
                      <span className="text-cyan-400 font-semibold">{ev.predicate}</span>{' '}
                      <span className="text-white font-bold">{ev.object}</span>
                    </div>

                    {ev.provenance_text && (
                      <div className="pt-1 border-t border-slate-800/80">
                        <span className="text-[9px] text-slate-400 block">Source Turn:</span>
                        <p className="text-[10px] text-slate-300 italic bg-graphite-900 p-1.5 rounded border border-slate-800 mt-0.5">
                          "{ev.provenance_text}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Revision Visualizer Mini-Lineage */}
            <div className="pt-3 border-t border-slate-800 space-y-2 font-mono text-[11px]">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                Revision Chain
              </span>
              <div className="p-2.5 rounded bg-graphite-950 border border-slate-800 text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <span>Bangalore</span>
                  <span className="text-[9px] text-slate-400 font-normal">(Session 01)</span>
                </div>
                <div className="pl-3 text-[10px] text-amber-500 font-mono flex items-center gap-1">
                  <CornerDownRight className="w-3 h-3" />
                  <span>SUPERSEDES</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span>Hyderabad</span>
                  <span className="text-[9px] text-slate-400 font-normal">(Session 02)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
