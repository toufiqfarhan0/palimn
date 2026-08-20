import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, GitBranch, CheckCircle2, Loader2, Play, RefreshCw } from 'lucide-react';

interface SimulationPreset {
  title: string;
  turnText: string;
  date: string;
  category: string;
  predicate: string;
  value: string;
  prior: string;
}

const PRESETS: SimulationPreset[] = [
  {
    title: 'Relocation Event',
    turnText: 'I just moved from Hyderabad to Seattle to lead the AI systems engineering team.',
    date: '2025-06-01',
    category: 'Location Update',
    predicate: 'lives_in',
    value: 'Seattle',
    prior: 'Hyderabad (2023-04 to 2025-06)',
  },
  {
    title: 'Career Transition',
    turnText: 'Exciting news: I left Infosys and joined OpenAI as a Principal Staff Architect.',
    date: '2025-07-15',
    category: 'Employment Update',
    predicate: 'works_at',
    value: 'OpenAI',
    prior: 'Infosys (2023-09 to 2025-07)',
  },
  {
    title: 'Tech Skill Acquisition',
    turnText: 'I have finished my advanced systems specialization and now write production services in Rust.',
    date: '2025-08-10',
    category: 'Skill Addition',
    predicate: 'knows_skill',
    value: 'Rust Systems',
    prior: 'None (Additive)',
  },
];

export const LiveIngestionSimulator: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<SimulationPreset>(PRESETS[0]);
  const [customText, setCustomText] = useState(PRESETS[0].turnText);
  const [sessionDate, setSessionDate] = useState(PRESETS[0].date);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [ingestedResult, setIngestedResult] = useState<any | null>(null);

  const runSimulation = () => {
    setLoading(true);
    setIngestedResult(null);
    setActiveStep(1);

    setTimeout(() => {
      setActiveStep(2);
      setTimeout(() => {
        setActiveStep(3);
        setTimeout(() => {
          setIngestedResult({
            turnText: customText,
            sessionDate,
            extracted: {
              subject: 'user',
              predicate: selectedPreset.predicate,
              object: selectedPreset.value,
              status: 'ACTIVE',
              valid_from: sessionDate,
            },
            prior: selectedPreset.prior.startsWith('None') ? null : {
              subject: 'user',
              predicate: selectedPreset.predicate,
              object: selectedPreset.prior.split(' ')[0],
              status: 'SUPERSEDED',
              valid_to: sessionDate,
            },
            supersedesEdge: selectedPreset.prior.startsWith('None') ? null : `SUPERSEDES -> ${selectedPreset.prior}`,
            latencyMs: 248,
          });
          setLoading(false);
        }, 350);
      }, 350);
    }, 350);
  };

  const handleSelectPreset = (p: SimulationPreset) => {
    setSelectedPreset(p);
    setCustomText(p.turnText);
    setSessionDate(p.date);
    setIngestedResult(null);
    setActiveStep(0);
  };

  return (
    <div className="card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase text-amber-400 font-bold tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Live Memory Ingestion & Session Simulator
          </span>
          <h3 className="text-[22px] font-bold text-white tracking-tight">
            Ingest Conversation Turns & Watch Graph Evolution
          </h3>
          <p className="text-[13px] text-slate-300">
            Type or select a dialogue turn. Watch PALIMN extract semantic facts, write to HydraDB Cloud, and automatically link SUPERSEDES edges.
          </p>
        </div>

        <button
          onClick={() => handleSelectPreset(PRESETS[0])}
          className="btn-ghost text-[12px] px-3 py-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3 h-3 text-amber-400" />
          <span>Reset Demo</span>
        </button>
      </div>

      {/* Preset Scenario Selector */}
      <div className="space-y-2">
        <label className="text-[12px] font-mono text-slate-400 uppercase tracking-wider block">
          Select Simulation Scenario:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {PRESETS.map((p) => {
            const isSelected = selectedPreset.title === p.title;
            return (
              <button
                key={p.title}
                onClick={() => handleSelectPreset(p)}
                className={`p-3 rounded-[8px] border text-left transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-400/80 text-white shadow-md'
                    : 'bg-[#0E1424]/75 border-white/[0.08] text-slate-300 hover:border-white/[0.18]'
                }`}
              >
                <div className="text-[13px] font-bold text-white">{p.title}</div>
                <div className="text-[11px] font-mono text-amber-400/90">{p.category}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Area */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-[11px] font-mono text-slate-400">Natural Language Dialogue Turn:</label>
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-[8px] border border-white/[0.12] bg-[#0A0D18]/90 text-[14px] text-white focus:border-amber-400"
              placeholder="e.g. I moved to Seattle in June 2025"
            />
          </div>
          <div className="sm:w-44 space-y-1">
            <label className="text-[11px] font-mono text-slate-400">Timestamp Date:</label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-[8px] border border-white/[0.12] bg-[#0A0D18]/90 text-[13px] text-white"
            />
          </div>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading || !customText.trim()}
          className="btn-primary w-full justify-center disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Play className="w-4 h-4 text-slate-950" />}
          {loading ? 'Executing Deterministic Pipeline...' : 'Simulate Ingestion & Graph Update'}
        </button>
      </div>

      {/* Pipeline Step Progress */}
      {loading && (
        <div className="p-4 rounded-[8px] bg-[#0A0E1A]/80 border border-white/[0.08] space-y-3">
          <div className="text-[11px] font-mono text-amber-400 uppercase font-bold tracking-wider">
            Real-Time Pipeline Execution Trace
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[12px] font-mono">
            <div className={`p-2.5 rounded border ${activeStep >= 1 ? 'border-amber-400/60 bg-amber-500/10 text-amber-300' : 'border-white/[0.06] text-slate-500'}`}>
              01. Intent & Fact Parsing
            </div>
            <div className={`p-2.5 rounded border ${activeStep >= 2 ? 'border-amber-400/60 bg-amber-500/10 text-amber-300' : 'border-white/[0.06] text-slate-500'}`}>
              02. HydraDB Vector Lookup
            </div>
            <div className={`p-2.5 rounded border ${activeStep >= 3 ? 'border-amber-400/60 bg-amber-500/10 text-amber-300' : 'border-white/[0.06] text-slate-500'}`}>
              03. SUPERSEDES Edge Commit
            </div>
          </div>
        </div>
      )}

      {/* Ingestion Output Card */}
      <AnimatePresence>
        {ingestedResult && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="p-5 rounded-[12px] bg-[#0A0E1A]/95 border border-amber-500/30 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-bold">INGESTION COMMITTED TO HYDRADB CLOUD</span>
              </div>
              <span className="text-amber-400 font-bold">Latency: {ingestedResult.latencyMs}ms</span>
            </div>

            {/* Graph Delta Cards (Before vs After) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
              {/* Prior State */}
              <div className="p-3.5 rounded-[8px] bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase text-slate-400">Previous Historical State:</span>
                  <span className="badge-superseded">SUPERSEDED</span>
                </div>
                {ingestedResult.prior ? (
                  <div>
                    <div className="text-white font-bold text-sm">
                      {ingestedResult.prior.subject} → {ingestedResult.prior.predicate} → <span className="text-amber-400">{ingestedResult.prior.object}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Archived to historical lineage (valid_to: {ingestedResult.sessionDate})</div>
                  </div>
                ) : (
                  <div className="text-slate-400 italic">No conflicting prior state. Direct addition.</div>
                )}
              </div>

              {/* Newly Ingested Active State */}
              <div className="p-3.5 rounded-[8px] bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase text-amber-300 font-bold">New Active State in Graph:</span>
                  <span className="badge-active">ACTIVE</span>
                </div>
                <div>
                  <div className="text-white font-bold text-sm">
                    {ingestedResult.extracted.subject} → {ingestedResult.extracted.predicate} → <span className="text-emerald-300 font-extrabold">{ingestedResult.extracted.object}</span>
                  </div>
                  <div className="text-[11px] text-amber-200/80 mt-1">Grounded truth starting: {ingestedResult.extracted.valid_from}</div>
                </div>
              </div>
            </div>

            {/* Lineage Link Notice */}
            {ingestedResult.supersedesEdge && (
              <div className="p-3 rounded-[8px] bg-amber-950/40 border border-amber-500/40 text-[12px] font-mono text-amber-300 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Directed Edge Created: <code className="text-amber-200">{ingestedResult.supersedesEdge}</code></span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
