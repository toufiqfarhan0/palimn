import React, { useState } from 'react';
import { Filter, Database, Calendar, GitFork } from 'lucide-react';

interface MockQueryResult {
  subject: string;
  predicate: string;
  object: string;
  valid_from: string;
  valid_to: string | null;
  status: 'ACTIVE' | 'SUPERSEDED';
  provenanceSession: string;
}

const ALL_MOCK_FACTS: MockQueryResult[] = [
  { subject: 'user', predicate: 'lives_in', object: 'Hyderabad', valid_from: '2023-04', valid_to: null, status: 'ACTIVE', provenanceSession: 'Session 51' },
  { subject: 'user', predicate: 'lives_in', object: 'Bangalore', valid_from: '2019-01', valid_to: '2023-04', status: 'SUPERSEDED', provenanceSession: 'Session 01' },
  { subject: 'user', predicate: 'works_at', object: 'Infosys', valid_from: '2023-09', valid_to: null, status: 'ACTIVE', provenanceSession: 'Session 60' },
  { subject: 'user', predicate: 'works_at', object: 'TechCorp', valid_from: '2018-06', valid_to: '2023-08', status: 'SUPERSEDED', provenanceSession: 'Session 14' },
  { subject: 'user', predicate: 'knows_skill', object: 'Python', valid_from: '2018-01', valid_to: null, status: 'ACTIVE', provenanceSession: 'Session 01' },
  { subject: 'user', predicate: 'knows_skill', object: 'TypeScript', valid_from: '2021-06', valid_to: null, status: 'ACTIVE', provenanceSession: 'Session 12' },
  { subject: 'user', predicate: 'knows_skill', object: 'Rust', valid_from: '2024-01', valid_to: null, status: 'ACTIVE', provenanceSession: 'Session 75' },
];

export const VisualQueryBuilder: React.FC = () => {
  const [temporalMode, setTemporalMode] = useState<'ACTIVE_ONLY' | 'ALL_HISTORY' | 'SUPERSEDED_ONLY'>('ACTIVE_ONLY');
  const [selectedPredicate, setSelectedPredicate] = useState<string>('ALL');
  const [hopDepth, setHopDepth] = useState<number>(1);

  const filteredFacts = ALL_MOCK_FACTS.filter(fact => {
    if (temporalMode === 'ACTIVE_ONLY' && fact.status !== 'ACTIVE') return false;
    if (temporalMode === 'SUPERSEDED_ONLY' && fact.status !== 'SUPERSEDED') return false;
    if (selectedPredicate !== 'ALL' && fact.predicate !== selectedPredicate) return false;
    return true;
  });

  const generatedDSL = `MATCH (u:Entity {id: "user"})-[r:RELATION]->(target)
WHERE ${
    temporalMode === 'ACTIVE_ONLY'
      ? 'r.status = "ACTIVE" AND r.valid_to IS NULL'
      : temporalMode === 'SUPERSEDED_ONLY'
      ? 'r.status = "SUPERSEDED" AND r.valid_to IS NOT NULL'
      : '1=1 /* Full Temporal Lineage */'
  }${
    selectedPredicate !== 'ALL' ? `\n  AND type(r) = "${selectedPredicate.toUpperCase()}"` : ''
  }
RETURN u, r, target, r.valid_from, r.valid_to
ORDER BY r.valid_from DESC
LIMIT 50;`;

  return (
    <div className="card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase text-amber-400 font-bold tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            Visual Temporal Query Builder
          </span>
          <h3 className="text-[22px] font-bold text-white tracking-tight">
            Construct Deterministic Subgraph Traversal Queries
          </h3>
          <p className="text-[13px] text-slate-300">
            Filter memory tuples by temporal boundaries, relationship types, and graph traversal depth.
          </p>
        </div>
      </div>

      {/* Query Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-[10px] bg-[#0A0D18]/80 border border-white/[0.08]">
        {/* Temporal Mode */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-amber-400" />
            Temporal Scope:
          </label>
          <select
            value={temporalMode}
            onChange={(e) => setTemporalMode(e.target.value as any)}
            className="w-full p-2.5 rounded-[8px] border border-white/[0.12] bg-[#0E1424] text-[13px] text-white"
          >
            <option value="ACTIVE_ONLY">Active Truth Only (valid_to is null)</option>
            <option value="ALL_HISTORY">Complete Historical Lineage</option>
            <option value="SUPERSEDED_ONLY">Superseded Facts Only</option>
          </select>
        </div>

        {/* Predicate */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <GitFork className="w-3 h-3 text-blue-400" />
            Predicate Type:
          </label>
          <select
            value={selectedPredicate}
            onChange={(e) => setSelectedPredicate(e.target.value)}
            className="w-full p-2.5 rounded-[8px] border border-white/[0.12] bg-[#0E1424] text-[13px] text-white"
          >
            <option value="ALL">All Predicates (*)</option>
            <option value="lives_in">lives_in (Location)</option>
            <option value="works_at">works_at (Employment)</option>
            <option value="knows_skill">knows_skill (Technical)</option>
          </select>
        </div>

        {/* Hop Depth */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Database className="w-3 h-3 text-emerald-400" />
            Graph Hop Depth:
          </label>
          <div className="flex items-center gap-3 pt-1">
            <input
              type="range"
              min={1}
              max={3}
              value={hopDepth}
              onChange={(e) => setHopDepth(parseInt(e.target.value))}
              className="flex-1 accent-amber-400"
            />
            <span className="text-xs font-mono text-amber-300 font-bold w-12 text-right">{hopDepth}-Hop</span>
          </div>
        </div>
      </div>

      {/* Generated DSL Code */}
      <div className="code-window">
        <div className="code-window-header">
          <span className="code-window-dot bg-red-400" />
          <span className="code-window-dot bg-amber-400" />
          <span className="code-window-dot bg-emerald-400" />
          <span className="ml-3 text-[11px] font-mono text-slate-400">
            Generated HydraDB Graph Query DSL
          </span>
        </div>
        <pre className="p-4 text-[12px] font-mono text-amber-300 overflow-x-auto">
          {generatedDSL}
        </pre>
      </div>

      {/* Filtered Results Table */}
      <div className="space-y-2 font-mono text-xs">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold px-1">
          Queried Fact Subgraph ({filteredFacts.length} results matching filter)
        </div>

        <div className="space-y-1.5">
          {filteredFacts.map((fact, idx) => (
            <div
              key={idx}
              className="p-3 rounded-[8px] bg-white/[0.02] border border-white/[0.06] flex items-center justify-between hover:bg-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={fact.status === 'ACTIVE' ? 'badge-active' : 'badge-superseded'}>
                  {fact.status}
                </span>
                <span className="text-white font-bold">
                  {fact.subject} <span className="text-slate-400 font-normal">→ {fact.predicate} →</span> <span className="text-amber-300">{fact.object}</span>
                </span>
              </div>

              <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                <span>{fact.valid_from} {fact.valid_to ? `to ${fact.valid_to}` : '→ Present'}</span>
                <span className="px-2 py-0.5 rounded bg-white/[0.04] text-slate-300">{fact.provenanceSession}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
