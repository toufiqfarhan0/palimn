import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Activity } from 'lucide-react';
import { fetchDecaySimulation, DecaySimulateResponse } from '../lib/api';

const DECAY_CATEGORIES = [
  {
    id: 'transient_state',
    label: 'Transient State',
    halfLifeLabel: 't½ = 3 Days',
    example: '"I am currently boarding Flight UA248"',
    accentClass: 'text-rose-400',
    borderClass: 'border-rose-500/40',
    bgClass: 'bg-rose-500/10',
    ringClass: 'ring-rose-500/30',
    barClass: 'bg-rose-500',
    dotClass: 'bg-rose-400',
    lambda: 'λ = 0.231',
    decaySpeed: 'Fast Decay',
  },
  {
    id: 'preference',
    label: 'User Preference',
    halfLifeLabel: 't½ = 90 Days',
    example: '"I prefer dark mode and TypeScript"',
    accentClass: 'text-amber-400',
    borderClass: 'border-amber-500/40',
    bgClass: 'bg-amber-500/10',
    ringClass: 'ring-amber-500/30',
    barClass: 'bg-amber-500',
    dotClass: 'bg-amber-400',
    lambda: 'λ = 0.0077',
    decaySpeed: 'Slow Decay',
  },
  {
    id: 'permanent_identity',
    label: 'Permanent Invariant',
    halfLifeLabel: 't½ = ∞',
    example: '"Born in Seattle, graduated in 2021"',
    accentClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/40',
    bgClass: 'bg-emerald-500/10',
    ringClass: 'ring-emerald-500/30',
    barClass: 'bg-emerald-500',
    dotClass: 'bg-emerald-400',
    lambda: 'λ = 0',
    decaySpeed: 'No Decay',
  },
];

export const TemporalDecayInspector: React.FC = () => {
  const [category, setCategory] = useState<string>('transient_state');
  const [daysElapsed, setDaysElapsed] = useState<number>(7);
  const [decayData, setDecayData] = useState<DecaySimulateResponse | null>(null);

  useEffect(() => {
    fetchDecaySimulation(category, daysElapsed, 0.98)
      .then((data) => setDecayData(data))
      .catch((err) => console.error('Decay sim error:', err));
  }, [category, daysElapsed]);

  const activeCat = DECAY_CATEGORIES.find((c) => c.id === category)!;
  const confidencePct = decayData ? decayData.current_confidence * 100 : 98;
  const statusColors: Record<string, string> = {
    ACTIVE: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
    DECAYING: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
    EXPIRED: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
  };

  return (
    <div className="w-full space-y-5">
      {/* Category Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {DECAY_CATEGORIES.map((c) => {
          const isSelected = category === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`relative text-left rounded-2xl border p-5 transition-all duration-200 overflow-hidden ${
                isSelected
                  ? `${c.borderClass} ${c.bgClass} ring-1 ${c.ringClass}`
                  : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-2 h-2 rounded-full mt-0.5 ${isSelected ? c.dotClass : 'bg-white/20'}`} />
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${isSelected ? `${c.bgClass} ${c.borderClass} ${c.accentClass}` : 'bg-white/5 border-white/10 text-slate-500'}`}>
                  {c.halfLifeLabel}
                </span>
              </div>
              <div className="text-xs font-bold text-white mb-1">{c.label}</div>
              <div className={`text-[10px] font-mono mb-2 ${isSelected ? c.accentClass : 'text-slate-600'}`}>{c.decaySpeed}</div>
              <div className="text-[10px] text-slate-500 italic leading-relaxed">{c.example}</div>
            </button>
          );
        })}
      </div>

      {/* Slider Panel */}
      <div className="rounded-2xl border border-white/10 bg-[#0A0D18]/80 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${activeCat.bgClass} ${activeCat.borderClass}`}>
              <Clock className={`w-4 h-4 ${activeCat.accentClass}`} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Days Elapsed Since Ingestion</div>
              <div className="text-[10px] text-slate-500 font-mono">{activeCat.lambda} · {activeCat.decaySpeed}</div>
            </div>
          </div>
          <div className={`text-xl font-extrabold font-mono tracking-tight ${activeCat.accentClass}`}>
            Day {daysElapsed}
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="60"
            step="1"
            value={daysElapsed}
            onChange={(e) => setDaysElapsed(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${
                category === 'transient_state' ? '#EF4444' :
                category === 'preference' ? '#F59E0B' : '#22C55E'
              } ${(daysElapsed / 60) * 100}%, rgba(255,255,255,0.1) ${(daysElapsed / 60) * 100}%)`,
            }}
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-600">
            <span>Day 0</span>
            <span>Day 15</span>
            <span>Day 30</span>
            <span>Day 45</span>
            <span>Day 60</span>
          </div>
        </div>

        {/* Confidence Visualization */}
        <AnimatePresence mode="wait">
          {decayData && (
            <motion.div
              key={`${category}-${daysElapsed}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4 pt-4 border-t border-white/[0.06]"
            >
              {/* Big confidence gauge */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Activity className={`w-3.5 h-3.5 ${activeCat.accentClass}`} />
                    <span className="text-slate-400">Current Confidence</span>
                  </div>
                  <span className={`font-bold text-base ${activeCat.accentClass}`}>
                    {confidencePct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/[0.05]">
                  <motion.div
                    className={`h-full rounded-full ${activeCat.barClass}`}
                    style={{ width: `${confidencePct}%` }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    layout
                  />
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5 space-y-1">
                  <div className="text-[9px] text-slate-600 font-mono uppercase">Status</div>
                  <span className={`inline-block text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${statusColors[decayData.status] ?? 'text-slate-300 bg-white/5 border-white/10'}`}>
                    {decayData.status}
                  </span>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5 space-y-1">
                  <div className="text-[9px] text-slate-600 font-mono uppercase">Decay λ</div>
                  <div className={`text-sm font-bold font-mono ${activeCat.accentClass}`}>
                    {decayData.decay_lambda}
                  </div>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5 space-y-1">
                  <div className="text-[9px] text-slate-600 font-mono uppercase">S(t) Formula</div>
                  <div className="text-[10px] font-mono text-slate-300">S₀·e^(−λΔt)</div>
                </div>
              </div>

              {/* Contextual message */}
              <div className={`text-[11px] font-mono px-3 py-2.5 rounded-xl border ${
                decayData.status === 'ACTIVE' ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' :
                decayData.status === 'DECAYING' ? 'border-amber-500/20 bg-amber-500/5 text-amber-400' :
                'border-rose-500/20 bg-rose-500/5 text-rose-400'
              }`}>
                {decayData.status === 'ACTIVE' && `Fact is ground truth. PALIMN will respond with full confidence at Day ${daysElapsed}.`}
                {decayData.status === 'DECAYING' && `Fact confidence has degraded to ${confidencePct.toFixed(1)}%. PALIMN hedges response with uncertainty markers.`}
                {decayData.status === 'EXPIRED' && `Fact is below threshold. PALIMN will abstain rather than emit stale state.`}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
