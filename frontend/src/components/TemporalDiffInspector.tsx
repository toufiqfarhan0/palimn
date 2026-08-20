import React, { useState } from 'react';
import { GitCompare, ArrowRight } from 'lucide-react';

interface DiffFact {
  predicate: string;
  valA: string | null;
  valB: string | null;
  statusA: 'ACTIVE' | 'SUPERSEDED' | 'UNRECORDED';
  statusB: 'ACTIVE' | 'SUPERSEDED' | 'UNRECORDED';
  changeType: 'REVISED' | 'ADDED' | 'UNCHANGED';
}

const CHECKPOINT_OPTIONS = [
  { id: 's01', label: 'Session 01 (2021-01)', desc: 'Initial state' },
  { id: 's12', label: 'Session 12 (2021-06)', desc: 'Education update' },
  { id: 's48', label: 'Session 48 (2023-03)', desc: 'Promotion update' },
  { id: 's51', label: 'Session 51 (2023-04)', desc: 'Relocation to Hyderabad' },
  { id: 'present', label: 'Present State (2026)', desc: 'Current active memory' },
];

const DIFF_MATRIX: Record<string, Record<string, DiffFact[]>> = {
  s01: {
    s51: [
      { predicate: 'lives_in', valA: 'Bangalore', valB: 'Hyderabad', statusA: 'SUPERSEDED', statusB: 'ACTIVE', changeType: 'REVISED' },
      { predicate: 'works_at', valA: 'TechCorp', valB: 'TechCorp', statusA: 'ACTIVE', statusB: 'ACTIVE', changeType: 'UNCHANGED' },
      { predicate: 'job_title', valA: 'Junior Engineer', valB: 'Staff Engineer', statusA: 'SUPERSEDED', statusB: 'ACTIVE', changeType: 'REVISED' },
      { predicate: 'degree', valA: null, valB: 'Business Admin', statusA: 'UNRECORDED', statusB: 'ACTIVE', changeType: 'ADDED' },
      { predicate: 'knows_skill', valA: 'Python', valB: 'Python, TypeScript', statusA: 'ACTIVE', statusB: 'ACTIVE', changeType: 'REVISED' },
    ],
    present: [
      { predicate: 'lives_in', valA: 'Bangalore', valB: 'Hyderabad', statusA: 'SUPERSEDED', statusB: 'ACTIVE', changeType: 'REVISED' },
      { predicate: 'works_at', valA: 'TechCorp', valB: 'Infosys', statusA: 'SUPERSEDED', statusB: 'ACTIVE', changeType: 'REVISED' },
      { predicate: 'job_title', valA: 'Junior Engineer', valB: 'Senior Staff Architect', statusA: 'SUPERSEDED', statusB: 'ACTIVE', changeType: 'REVISED' },
      { predicate: 'degree', valA: null, valB: 'Business Admin', statusA: 'UNRECORDED', statusB: 'ACTIVE', changeType: 'ADDED' },
      { predicate: 'knows_skill', valA: 'Python', valB: 'Python, TypeScript, Rust', statusA: 'ACTIVE', statusB: 'ACTIVE', changeType: 'REVISED' },
    ],
  },
  s12: {
    s51: [
      { predicate: 'lives_in', valA: 'Bangalore', valB: 'Hyderabad', statusA: 'SUPERSEDED', statusB: 'ACTIVE', changeType: 'REVISED' },
      { predicate: 'works_at', valA: 'TechCorp', valB: 'TechCorp', statusA: 'ACTIVE', statusB: 'ACTIVE', changeType: 'UNCHANGED' },
      { predicate: 'job_title', valA: 'Product Specialist', valB: 'Staff Engineer', statusA: 'SUPERSEDED', statusB: 'ACTIVE', changeType: 'REVISED' },
      { predicate: 'degree', valA: 'Business Admin', valB: 'Business Admin', statusA: 'ACTIVE', statusB: 'ACTIVE', changeType: 'UNCHANGED' },
    ],
    present: [
      { predicate: 'lives_in', valA: 'Bangalore', valB: 'Hyderabad', statusA: 'SUPERSEDED', statusB: 'ACTIVE', changeType: 'REVISED' },
      { predicate: 'works_at', valA: 'TechCorp', valB: 'Infosys', statusA: 'SUPERSEDED', statusB: 'ACTIVE', changeType: 'REVISED' },
      { predicate: 'job_title', valA: 'Product Specialist', valB: 'Senior Staff Architect', statusA: 'SUPERSEDED', statusB: 'ACTIVE', changeType: 'REVISED' },
      { predicate: 'degree', valA: 'Business Admin', valB: 'Business Admin', statusA: 'ACTIVE', statusB: 'ACTIVE', changeType: 'UNCHANGED' },
      { predicate: 'knows_skill', valA: 'Python', valB: 'Python, TypeScript, Rust', statusA: 'ACTIVE', statusB: 'ACTIVE', changeType: 'REVISED' },
    ],
  },
  s48: {
    s51: [
      { predicate: 'lives_in', valA: 'Bangalore', valB: 'Hyderabad', statusA: 'SUPERSEDED', statusB: 'ACTIVE', changeType: 'REVISED' },
      { predicate: 'works_at', valA: 'TechCorp', valB: 'TechCorp', statusA: 'ACTIVE', statusB: 'ACTIVE', changeType: 'UNCHANGED' },
      { predicate: 'job_title', valA: 'Staff Engineer', valB: 'Staff Engineer', statusA: 'ACTIVE', statusB: 'ACTIVE', changeType: 'UNCHANGED' },
      { predicate: 'degree', valA: 'Business Admin', valB: 'Business Admin', statusA: 'ACTIVE', statusB: 'ACTIVE', changeType: 'UNCHANGED' },
    ],
    present: [
      { predicate: 'lives_in', valA: 'Bangalore', valB: 'Hyderabad', statusA: 'SUPERSEDED', statusB: 'ACTIVE', changeType: 'REVISED' },
      { predicate: 'works_at', valA: 'TechCorp', valB: 'Infosys', statusA: 'SUPERSEDED', statusB: 'ACTIVE', changeType: 'REVISED' },
      { predicate: 'job_title', valA: 'Staff Engineer', valB: 'Senior Staff Architect', statusA: 'SUPERSEDED', statusB: 'ACTIVE', changeType: 'REVISED' },
      { predicate: 'knows_skill', valA: 'Python, TypeScript', valB: 'Python, TypeScript, Rust', statusA: 'ACTIVE', statusB: 'ACTIVE', changeType: 'REVISED' },
    ],
  },
};

export const TemporalDiffInspector: React.FC = () => {
  const [pointA, setPointA] = useState('s01');
  const [pointB, setPointB] = useState('s51');

  const diffItems = DIFF_MATRIX[pointA]?.[pointB] || DIFF_MATRIX['s01']['s51'];

  return (
    <div className="card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase text-amber-400 font-bold tracking-wider flex items-center gap-1.5">
            <GitCompare className="w-3.5 h-3.5" />
            Side-by-Side Temporal Memory Diff
          </span>
          <h3 className="text-[22px] font-bold text-white tracking-tight">
            Compare Agent State Between Checkpoints
          </h3>
          <p className="text-[13px] text-slate-300">
            Audit how knowledge evolves over time without overwriting history.
          </p>
        </div>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-[10px] bg-[#0A0D18]/80 border border-white/[0.08]">
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
            Baseline Checkpoint (A):
          </label>
          <select
            value={pointA}
            onChange={(e) => setPointA(e.target.value)}
            className="w-full p-2.5 rounded-[8px] border border-white/[0.12] bg-[#0E1424] text-[13px] text-white"
          >
            {CHECKPOINT_OPTIONS.filter(o => o.id !== pointB).map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label} — {opt.desc}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-amber-400 block">
            Comparison Target (B):
          </label>
          <select
            value={pointB}
            onChange={(e) => setPointB(e.target.value)}
            className="w-full p-2.5 rounded-[8px] border border-amber-500/30 bg-[#0E1424] text-[13px] text-white"
          >
            {CHECKPOINT_OPTIONS.filter(o => o.id !== pointA).map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label} — {opt.desc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Diff Table */}
      <div className="space-y-2 font-mono text-xs">
        <div className="grid grid-cols-[120px_1fr_24px_1fr_90px] gap-3 pb-2 text-[11px] uppercase tracking-wider text-slate-400 border-b border-white/[0.08] px-3">
          <span>Predicate</span>
          <span>State at Checkpoint A</span>
          <span></span>
          <span>State at Checkpoint B</span>
          <span className="text-right">Diff Type</span>
        </div>

        {diffItems.map((item, idx) => {
          const isRevised = item.changeType === 'REVISED';
          const isAdded = item.changeType === 'ADDED';
          return (
            <div
              key={idx}
              className="grid grid-cols-[120px_1fr_24px_1fr_90px] gap-3 p-3 rounded-[8px] bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors items-center"
            >
              <div className="font-bold text-white">
                {item.predicate}
              </div>

              {/* Checkpoint A value */}
              <div className="text-slate-300">
                {item.valA ? (
                  <div className="flex items-center gap-2">
                    <span className="text-white">{item.valA}</span>
                    <span className="badge-superseded text-[9px]">{item.statusA}</span>
                  </div>
                ) : (
                  <span className="text-slate-600 italic">None recorded</span>
                )}
              </div>

              {/* Arrow */}
              <div className="text-slate-500 flex justify-center">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>

              {/* Checkpoint B value */}
              <div className="text-white">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-300">{item.valB}</span>
                  <span className="badge-active text-[9px]">{item.statusB}</span>
                </div>
              </div>

              {/* Badge */}
              <div className="text-right">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isRevised
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : isAdded
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-white/[0.05] text-slate-400'
                }`}>
                  {item.changeType}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
