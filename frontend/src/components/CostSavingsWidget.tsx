import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingDown, Zap, Activity } from 'lucide-react';
import { fetchCostTelemetry, CostTelemetryResponse } from '../lib/api';

const METRIC_COLS = [
  {
    key: 'context',
    label: '115K Full-Context Window',
    sublabel: 'Naive LLM approach',
    accentColor: 'text-rose-400',
    barColor: 'bg-rose-500',
    borderColor: 'border-rose-500/30',
    bgColor: 'bg-rose-500/8',
    glowColor: 'shadow-rose-500/20',
  },
  {
    key: 'palimn',
    label: 'PALIMN HydraDB Subgraph',
    sublabel: 'Targeted graph retrieval',
    accentColor: 'text-emerald-400',
    barColor: 'bg-emerald-500',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/8',
    glowColor: 'shadow-emerald-500/20',
  },
];

function useSmoothCount(target: number, duration = 800): number {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = 0;
    startRef.current = null;
    const animate = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const elapsed = now - startRef.current;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(fromRef.current + (target - fromRef.current) * eased);
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return value;
}

export const CostSavingsWidget: React.FC = () => {
  const [queryVolume, setQueryVolume] = useState<number>(10000);
  const [telemetry, setTelemetry] = useState<CostTelemetryResponse | null>(null);

  useEffect(() => {
    fetchCostTelemetry()
      .then((data) => setTelemetry(data))
      .catch((err) => console.error('Cost telemetry error:', err));
  }, []);

  const fullContextCost = queryVolume * 0.345;
  const palimnCost = queryVolume * 0.00096;
  const totalSavedDollars = fullContextCost - palimnCost;
  const tokenSavingsMillion = ((queryVolume * (115000 - 320)) / 1_000_000).toFixed(1);

  const animatedFull = useSmoothCount(fullContextCost, 500);
  const animatedPalimn = useSmoothCount(palimnCost, 500);
  const animatedSaved = useSmoothCount(totalSavedDollars, 500);

  const savingsPct = ((totalSavedDollars / fullContextCost) * 100).toFixed(2);

  const rows = [
    {
      label: 'Cost per 1K queries',
      context: `$${(fullContextCost / queryVolume * 1000).toFixed(2)}`,
      palimn: `$${(palimnCost / queryVolume * 1000).toFixed(4)}`,
      delta: '−99.72%',
    },
    {
      label: 'Avg tokens per query',
      context: '115,000',
      palimn: '320',
      delta: '−99.72%',
    },
    {
      label: 'Context overflow risk',
      context: 'HIGH',
      palimn: '0%',
      delta: 'Eliminated',
    },
    {
      label: 'Avg latency',
      context: '4,200ms',
      palimn: '38ms',
      delta: '−99.1%',
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Volume Slider */}
      <div className="rounded-2xl border border-white/10 bg-[#0A0D18]/80 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Monthly Agent Query Volume</div>
              <div className="text-[10px] text-slate-500 font-mono">Drag to simulate production scale</div>
            </div>
          </div>
          <div className="text-xl font-extrabold text-amber-400 font-mono tracking-tight">
            {queryVolume.toLocaleString()}
            <span className="text-sm text-slate-500 font-normal ml-1">queries/mo</span>
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min="1000"
            max="100000"
            step="1000"
            value={queryVolume}
            onChange={(e) => setQueryVolume(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-amber-400 bg-white/10"
            style={{
              background: `linear-gradient(to right, #F59E0B ${((queryVolume - 1000) / 99000) * 100}%, rgba(255,255,255,0.1) ${((queryVolume - 1000) / 99000) * 100}%)`,
            }}
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-600">
            <span>1,000</span>
            <span>25,000</span>
            <span>50,000</span>
            <span>75,000</span>
            <span>100,000</span>
          </div>
        </div>
      </div>

      {/* Big Savings Number */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-[#080B14] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[10px] font-mono uppercase text-emerald-400 tracking-widest font-bold">Monthly cost savings</div>
          <motion.div
            key={queryVolume}
            className="text-[42px] sm:text-[52px] font-extrabold tracking-tight leading-none text-emerald-400 tabular-nums"
          >
            ${animatedSaved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </motion.div>
          <div className="text-sm text-slate-400 font-mono">saved vs. flat-context window approach</div>
        </div>
        <div className="flex flex-col gap-3 min-w-[140px]">
          <div className="text-right space-y-0.5">
            <div className="text-[10px] text-slate-500 font-mono uppercase">Token reduction</div>
            <div className="text-2xl font-extrabold text-emerald-300 font-mono">{savingsPct}%</div>
          </div>
          <div className="text-right space-y-0.5">
            <div className="text-[10px] text-slate-500 font-mono uppercase">Tokens saved</div>
            <div className="text-xl font-bold text-white font-mono">{tokenSavingsMillion}M</div>
          </div>
        </div>
      </div>

      {/* Side-by-side cost cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {METRIC_COLS.map((col) => {
          const cost = col.key === 'context' ? animatedFull : animatedPalimn;
          return (
            <div
              key={col.key}
              className={`rounded-2xl border p-5 space-y-4 ${col.borderColor} ${col.bgColor}`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white">{col.label}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{col.sublabel}</div>
                </div>
                {col.key === 'palimn' && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                    PALIMN
                  </span>
                )}
              </div>
              <div className={`text-[36px] font-extrabold font-mono tracking-tight leading-none ${col.accentColor} tabular-nums`}>
                ${cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] font-mono text-slate-500 -mt-2">total monthly cost</div>

              {/* Mini stat row */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.05]">
                <div className="space-y-0.5">
                  <div className="text-[9px] text-slate-600 font-mono uppercase">Tokens/query</div>
                  <div className={`text-sm font-bold font-mono ${col.accentColor}`}>
                    {col.key === 'context' ? '115,000' : '320'}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[9px] text-slate-600 font-mono uppercase">Latency</div>
                  <div className={`text-sm font-bold font-mono ${col.accentColor}`}>
                    {col.key === 'context' ? '4,200ms' : '38ms'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison table */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
        <div className="grid grid-cols-[1fr_110px_110px_90px] gap-0 text-[10px] font-mono uppercase tracking-wider px-5 py-3 border-b border-white/[0.06] text-slate-500">
          <span>Metric</span>
          <span className="text-right">Full Context</span>
          <span className="text-right">PALIMN</span>
          <span className="text-right">Delta</span>
        </div>
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`grid grid-cols-[1fr_110px_110px_90px] gap-0 px-5 py-3 text-[12px] items-center ${i < rows.length - 1 ? 'border-b border-white/[0.04]' : ''}`}
          >
            <span className="text-slate-300">{row.label}</span>
            <span className="text-right font-mono text-rose-400 font-medium">{row.context}</span>
            <span className="text-right font-mono text-emerald-400 font-bold">{row.palimn}</span>
            <span className="text-right font-mono text-slate-400 text-[10px]">{row.delta}</span>
          </div>
        ))}
      </div>

      {/* Telemetry footnote */}
      {telemetry && (
        <div className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[10px] font-mono text-slate-600">
          <span className="flex items-center gap-1.5"><Zap className="w-3 h-3 text-amber-500/60" /> Full context: {telemetry.session_tokens_total.toLocaleString()} tokens</span>
          <span className="flex items-center gap-1.5"><TrendingDown className="w-3 h-3 text-emerald-500/60" /> PALIMN subgraph: {telemetry.retrieved_subgraph_tokens} tokens</span>
          <span className="flex items-center gap-1.5"><DollarSign className="w-3 h-3 text-slate-500" /> Compression ratio: {telemetry.compression_ratio}×</span>
        </div>
      )}
    </div>
  );
};
