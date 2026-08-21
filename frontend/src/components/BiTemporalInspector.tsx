import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, Database, Zap, RefreshCw, Calendar } from 'lucide-react';
import { queryBiTemporal, fetchBiTemporalTimeline, BiTemporalTimelineEntry, BiTemporalQueryResponse } from '../lib/api';

const PRESET_SCENARIOS = [
  {
    id: 'retro_2020_now',
    label: '2020 World State (Known Today)',
    desc: 'Query user location in 2020 using latest agent memory (resolves Tokyo via retroactive update)',
    validTime: '2020-06-01',
    assertionTime: '2025-05-20',
  },
  {
    id: 'retro_2020_session1',
    label: '2020 State as of Session 01 (Flashback)',
    desc: 'Query what the agent knew about 2020 back in Session 01 (correctly abstains because Tokyo was not yet asserted)',
    validTime: '2020-06-01',
    assertionTime: '2025-01-10',
  },
  {
    id: 'past_2022_bangalore',
    label: '2022 Historical Location',
    desc: 'Query user location in 2022 (resolves Bangalore before Hyderabad relocation)',
    validTime: '2022-01-01',
    assertionTime: '2025-05-20',
  },
  {
    id: 'current_2025_hyderabad',
    label: 'Present Active State (2025)',
    desc: 'Query current active location (resolves active Hyderabad)',
    validTime: '2025-04-01',
    assertionTime: '2025-05-20',
  },
];

export const BiTemporalInspector: React.FC = () => {
  const [validTime, setValidTime] = useState<string>('2020-06-01');
  const [assertionTime, setAssertionTime] = useState<string>('2025-05-20');
  const predicate = 'lives_in';
  const subject = 'user_demo';
  const [timeline, setTimeline] = useState<BiTemporalTimelineEntry[]>([]);
  const [queryResult, setQueryResult] = useState<BiTemporalQueryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string>('retro_2020_now');

  // Load timeline on mount
  useEffect(() => {
    loadTimeline();
    executeBiTemporalQuery('2020-06-01', '2025-05-20');
  }, []);

  const loadTimeline = async () => {
    try {
      const data = await fetchBiTemporalTimeline(subject, predicate);
      if (data && data.length > 0) {
        setTimeline(data);
      } else {
        // Fallback demo timeline
        setTimeline([
          {
            memory_id: 'fact_retro_01',
            subject: 'user_demo',
            predicate: 'lives_in',
            object: 'Tokyo',
            valid_from: '2019-01-01',
            valid_until: '2020-12-31',
            asserted_at: '2025-05-20T11:00:00Z',
            assertion_session_id: 'session_03',
            is_retroactive: true,
            status: 'historical',
            confidence: 1.0,
          },
          {
            memory_id: 'fact_001',
            subject: 'user_demo',
            predicate: 'lives_in',
            object: 'Bangalore',
            valid_from: '2021-01-01',
            valid_until: '2025-03-15',
            asserted_at: '2025-01-10T10:00:00Z',
            assertion_session_id: 'session_01',
            is_retroactive: false,
            status: 'superseded',
            confidence: 1.0,
          },
          {
            memory_id: 'fact_002',
            subject: 'user_demo',
            predicate: 'lives_in',
            object: 'Hyderabad',
            valid_from: '2025-03-15',
            valid_until: null,
            asserted_at: '2025-03-15T14:30:00Z',
            assertion_session_id: 'session_02',
            is_retroactive: false,
            status: 'active',
            confidence: 1.0,
          },
        ]);
      }
    } catch {
      // Offline fallback
    }
  };

  const executeBiTemporalQuery = async (vTime: string, aTime: string) => {
    setLoading(true);
    try {
      const res = await queryBiTemporal({
        subject,
        predicate,
        as_of_valid_time: vTime,
        as_of_assertion_time: aTime,
      });
      setQueryResult(res);
    } catch {
      // Local fallback mock
      const isSession1 = aTime.includes('2025-01');
      const is2020 = vTime.includes('2020');
      if (is2020 && isSession1) {
        setQueryResult({
          subject,
          predicate,
          as_of_valid_time: vTime,
          as_of_assertion_time: aTime,
          matched_fact: null,
          timeline,
          status: 'unrecorded',
          decision: 'abstain',
          reasoning: `In Session 01 (${aTime}), the agent had not yet learned about Tokyo. Properly abstained to prevent knowledge leakage.`,
        });
      } else if (is2020) {
        setQueryResult({
          subject,
          predicate,
          as_of_valid_time: vTime,
          as_of_assertion_time: aTime,
          matched_fact: {
            memory_id: 'fact_retro_01',
            subject: 'user_demo',
            predicate: 'lives_in',
            object: 'Tokyo',
            session_id: 'session_03',
            message_id: 'msg_03',
            status: 'historical',
            confidence: 1.0,
            valid_from: '2019-01-01',
            valid_until: '2020-12-31',
            relevance_score: 1.0,
          },
          timeline,
          status: 'resolved',
          decision: 'answerable',
          reasoning: `Resolved retroactive memory 'fact_retro_01' (Tokyo) valid from 2019 to 2020, learned by agent in session_03.`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setActivePreset(preset.id);
    setValidTime(preset.validTime);
    setAssertionTime(preset.assertionTime);
    executeBiTemporalQuery(preset.validTime, preset.assertionTime);
  };

  return (
    <div className="card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase text-cyan-400 font-bold tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Track 3 Feature: Bi-Temporal Memory Engine
          </span>
          <h3 className="text-[22px] font-bold text-white tracking-tight">
            Decoupled Valid Time (<span className="text-cyan-400 font-mono">Tv</span>) vs Assertion Time (<span className="text-indigo-400 font-mono">Ta</span>)
          </h3>
          <p className="text-[13px] text-slate-300">
            Reconstruct historical real-world states and out-of-order session updates with zero destructive overwrites.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-mono rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Point-in-Time Safe
          </span>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="space-y-2">
        <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
          Preset Bi-Temporal Flashback Scenarios:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRESET_SCENARIOS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p)}
              className={`p-3 rounded-lg border text-left transition-all ${
                activePreset === p.id
                  ? 'bg-cyan-500/15 border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                  : 'bg-[#0A0D18]/80 border-white/[0.08] hover:border-white/[0.2] hover:bg-white/[0.02]'
              }`}
            >
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>{p.label}</span>
                {activePreset === p.id && <Zap className="w-3 h-3 text-cyan-400" />}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {p.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* 2D Coordinate Query Form */}
      <div className="p-4 rounded-[10px] bg-[#0A0D18]/80 border border-white/[0.08] space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              1. World Valid Time (Tv - When fact was true):
            </label>
            <input
              type="text"
              value={validTime}
              onChange={(e) => {
                setValidTime(e.target.value);
                setActivePreset('custom');
              }}
              placeholder="e.g. 2020-06-01, 2022, 2025"
              className="w-full bg-[#131924] border border-white/[0.12] rounded-md px-3 py-2 text-sm text-white font-mono focus:border-cyan-400 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 block font-mono">
              Filters facts where valid_from &le; Tv &le; valid_until
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              2. Agent Assertion Cutoff (Ta - When agent learned it):
            </label>
            <input
              type="text"
              value={assertionTime}
              onChange={(e) => {
                setAssertionTime(e.target.value);
                setActivePreset('custom');
              }}
              placeholder="e.g. 2025-01-10, 2025-05-20"
              className="w-full bg-[#131924] border border-white/[0.12] rounded-md px-3 py-2 text-sm text-white font-mono focus:border-indigo-400 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 block font-mono">
              Filters facts recorded prior to Ta (prevents future knowledge leakage)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            onClick={() => executeBiTemporalQuery(validTime, assertionTime)}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-md shadow-sm transition-all flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Evaluate 2D Coordinate Slice
          </button>
        </div>
      </div>

      {/* Query Result Callout */}
      {queryResult && (
        <div
          className={`p-4 rounded-[10px] border transition-all ${
            queryResult.decision === 'answerable'
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                    queryResult.decision === 'answerable'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {queryResult.decision === 'answerable' ? 'VERIFIED MATCH' : 'CALIBRATED ABSTENTION'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Coordinate: Tv=[{queryResult.as_of_valid_time}] &times; Ta=[{queryResult.as_of_assertion_time}]
                </span>
              </div>
              <div className="text-base font-bold text-white flex items-center gap-2">
                <span>Result:</span>
                <span className="font-mono text-cyan-300">
                  {queryResult.matched_fact ? queryResult.matched_fact.object : 'None (Abstained)'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {queryResult.reasoning}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Visual Timeline Ribbons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block">
            HydraDB Bi-Temporal Fact Evolution Lineage:
          </label>
          <span className="text-[10px] font-mono text-slate-400">
            Ordered by Real-World Validity Interval
          </span>
        </div>

        <div className="space-y-2.5">
          {timeline.map((entry, idx) => (
            <div
              key={entry.memory_id || idx}
              className={`p-3.5 rounded-lg border transition-all ${
                queryResult?.matched_fact?.memory_id === entry.memory_id
                  ? 'bg-cyan-500/10 border-cyan-400/50 shadow-md shadow-cyan-500/10'
                  : 'bg-[#0D1117] border-white/[0.08]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      entry.status === 'active'
                        ? 'bg-emerald-400'
                        : entry.is_retroactive
                        ? 'bg-purple-400'
                        : 'bg-amber-400'
                    }`}
                  />
                  <span className="text-sm font-semibold text-white font-mono">
                    ({entry.subject}) &rarr; <span className="text-cyan-400">{entry.predicate}</span> &rarr;{' '}
                    <span className="text-amber-300 font-bold">{entry.object}</span>
                  </span>
                  {entry.is_retroactive && (
                    <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      RETROACTIVE
                    </span>
                  )}
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-mono uppercase rounded border ${
                      entry.status === 'active'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    }`}
                  >
                    {entry.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-slate-400 flex items-center gap-1">
                    <span className="text-cyan-400">Tv:</span>
                    <span>{entry.valid_from} &rarr; {entry.valid_until || 'ongoing'}</span>
                  </div>
                  <div className="text-slate-400 flex items-center gap-1">
                    <span className="text-indigo-400">Ta:</span>
                    <span>{entry.asserted_at ? entry.asserted_at.slice(0, 10) : 'origin'} ({entry.assertion_session_id || 's01'})</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
