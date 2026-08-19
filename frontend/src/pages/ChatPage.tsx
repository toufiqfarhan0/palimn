import React, { useState } from 'react';
import { sendChatQuery, ChatQueryResponse, EvidenceItem } from '../lib/api';
import {
  Send,
  Sparkles,
  ShieldAlert,
  Clock,
  History,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const ChatPage: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<ChatQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleQuestions = [
    "Where do I live now?",
    "Where did I live before Hyderabad?",
    "What project did I work on in Session 3?",
    "What is my preferred editor and when did I change it?",
  ];

  const handleAsk = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await sendChatQuery({ question: q });
      setResponse(res);
    } catch (err: any) {
      setError(err.message || 'Failed to query memory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Hero Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-palimn-violet" />
          <span>Cross-Session Temporal Reasoning</span>
        </h1>
        <p className="text-xs text-slate-400">
          Query cross-session memories with explicit chronological revision resolution, provenance tracking, and first-class abstention.
        </p>
      </div>

      {/* Query Input Box */}
      <div className="glass-panel rounded-xl p-4 border border-slate-800/80 shadow-glass space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(question);
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question spanning 30+ sessions (e.g. 'Where do I live now?')..."
            className="flex-1 bg-graphite-900/90 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-palimn-violet/60 focus:ring-1 focus:ring-palimn-violet/40 transition-all font-sans"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-palimn-violet hover:bg-palimn-violet-dark disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold tracking-wide transition-all shadow-glow-violet"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Reasoning...' : 'Query'}</span>
          </button>
        </form>

        {/* Sample queries */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <span className="text-[11px] text-slate-500 font-mono">Quick test:</span>
          {sampleQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => {
                setQuestion(sq);
                handleAsk(sq);
              }}
              className="text-[11px] px-2.5 py-1 rounded bg-graphite-850 hover:bg-graphite-800 text-slate-300 border border-slate-800 transition-colors"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="p-4 rounded-lg bg-red-950/30 border border-red-800/50 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results View */}
      {response && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Answer / Abstention Card */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel rounded-xl p-5 border border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    Decision:
                  </span>
                  {response.decision === 'answerable' ? (
                    <span className="flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-800/60">
                      <CheckCircle2 className="w-3 h-3" />
                      ANSWERABLE
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-950/50 text-amber-400 border border-amber-800/60">
                      <ShieldAlert className="w-3 h-3" />
                      ABSTAIN ({response.reason || 'insufficient_evidence'})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                  <span>Confidence: {(response.confidence * 100).toFixed(0)}%</span>
                  <span>•</span>
                  <span>{response.latency_ms} ms</span>
                </div>
              </div>

              {/* Answer Content */}
              {response.decision === 'answerable' && response.answer ? (
                <div className="space-y-2">
                  <h3 className="text-xs uppercase font-mono text-slate-400">Synthesized Answer:</h3>
                  <div className="p-4 rounded-lg bg-graphite-900/80 border border-slate-800 text-sm text-slate-100 leading-relaxed font-sans">
                    {response.answer}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200/90 leading-relaxed space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    First-Class Abstention Triggered
                  </p>
                  <p className="text-[11px] text-amber-300/70">
                    {response.temporal_reasoning ||
                      'The system identified insufficient or absent temporal memory evidence to reliably answer without hallucination.'}
                  </p>
                </div>
              )}

              {/* Temporal Reasoning Box */}
              {response.temporal_reasoning && (
                <div className="space-y-1.5 pt-2">
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-palimn-cyan" />
                    <span>Temporal & Revision Reasoning</span>
                  </h4>
                  <div className="p-3 rounded-lg bg-graphite-900/50 border border-slate-800/70 text-xs text-slate-300 font-mono leading-relaxed">
                    {response.temporal_reasoning}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Provenance & Evidence Sidebar */}
          <div className="space-y-4">
            <div className="glass-panel rounded-xl p-4 border border-slate-800/80 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-palimn-violet" />
                <span>Memory Provenance ({response.evidence.length})</span>
              </h3>

              {response.evidence.length === 0 ? (
                <div className="p-4 rounded-lg bg-graphite-900/40 border border-slate-800/50 text-center text-xs text-slate-500">
                  No supporting memories retrieved for this query.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {response.evidence.map((item: EvidenceItem, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-graphite-900/70 border border-slate-800 hover:border-slate-700 transition-colors space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                            item.status === 'active'
                              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                              : item.status === 'superseded'
                              ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {item.status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {item.session_id}
                        </span>
                      </div>

                      <div className="font-mono text-slate-200 text-[11px]">
                        <span className="text-palimn-violet">{item.subject}</span>{' '}
                        <span className="text-palimn-cyan">{item.predicate}</span>{' '}
                        <span className="text-slate-100 font-semibold">{item.object}</span>
                      </div>

                      {item.provenance_text && (
                        <p className="text-[10px] text-slate-400 italic bg-graphite-950 p-1.5 rounded border border-slate-800/50">
                          "{item.provenance_text}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
