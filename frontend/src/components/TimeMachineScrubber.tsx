import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, Briefcase, GraduationCap, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';

interface TimelineCheckpoint {
  id: string;
  year: string;
  session: string;
  date: string;
  location: string;
  role: string;
  status: 'active' | 'superseded';
  eventDescription: string;
  supersedesEdge?: string;
}

const CHECKPOINTS: TimelineCheckpoint[] = [
  {
    id: 's01',
    year: '2021 (Jan)',
    session: 'Session 01',
    date: '2021-01-10',
    location: 'Bangalore',
    role: 'Junior Engineer',
    status: 'superseded',
    eventDescription: 'User initiated memory: "I currently live in Bangalore, working near Indiranagar."',
  },
  {
    id: 's12',
    year: '2021 (Jun)',
    session: 'Session 12',
    date: '2021-06-05',
    location: 'Bangalore',
    role: 'Product Specialist',
    status: 'superseded',
    eventDescription: 'User recorded degree: "I graduated with a degree in Business Administration."',
  },
  {
    id: 's48',
    year: '2023 (Mar)',
    session: 'Session 48',
    date: '2023-03-10',
    location: 'Bangalore',
    role: 'Staff Engineer',
    status: 'superseded',
    eventDescription: 'Promotion update: "Promoted to Staff Engineer on the infrastructure team."',
  },
  {
    id: 's51',
    year: '2023 (Apr)',
    session: 'Session 51',
    date: '2023-04-20',
    location: 'Hyderabad',
    role: 'Staff Engineer',
    status: 'active',
    eventDescription: 'Major revision: "I relocated from Bangalore to Hyderabad for my new role."',
    supersedesEdge: 'SUPERSEDES -> Bangalore (2021-03-15 to 2023-04-20)',
  },
  {
    id: 'present',
    year: 'Present (2026)',
    session: 'Active State',
    date: 'Current',
    location: 'Hyderabad',
    role: 'Staff Engineer',
    status: 'active',
    eventDescription: 'Persistent active state in HydraDB Cloud with complete provenance and zero history loss.',
  },
];

export const TimeMachineScrubber: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(3); // default to Session 51
  const activeCheckpoint = CHECKPOINTS[currentIndex];

  return (
    <div className="p-6 sm:p-8 rounded-[16px] bg-[#0E1424]/85 backdrop-blur-xl border border-white/[0.12] shadow-2xl space-y-6 max-w-5xl mx-auto font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="space-y-1">
          <span className="text-[11px] font-mono font-semibold uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Interactive Temporal Lineage
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Scrub Agent Memory History Across Sessions
          </h3>
          <p className="text-[13px] text-slate-300">
            Click any checkpoint to observe how temporal states transition from superseded to active.
          </p>
        </div>

        <button
          onClick={() => setCurrentIndex(3)}
          className="btn-ghost text-[12px] px-3.5 py-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Reset to Active</span>
        </button>
      </div>

      {/* Scrubber Progress Slider */}
      <div className="space-y-4 pt-2">
        <div className="relative">
          {/* Track background */}
          <div className="h-2 w-full bg-slate-800/90 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 rounded-full"
              initial={false}
              animate={{ width: `${(currentIndex / (CHECKPOINTS.length - 1)) * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>

          {/* Stepper Dots */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between">
            {CHECKPOINTS.map((cp, idx) => {
              const isSelected = idx === currentIndex;
              const isPast = idx < currentIndex;
              return (
                <button
                  key={cp.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center -translate-y-0.5 ${
                    isSelected
                      ? 'bg-amber-400 border-white shadow-[0_0_16px_rgba(245,158,11,0.8)] scale-125'
                      : isPast
                      ? 'bg-amber-700 border-amber-400/60'
                      : 'bg-slate-900 border-slate-700 hover:border-amber-400'
                  }`}
                  title={cp.session}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-white/80'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Checkpoint Labels */}
        <div className="flex justify-between text-[12px] font-mono text-slate-400 pt-2">
          {CHECKPOINTS.map((cp, idx) => (
            <button
              key={cp.id}
              onClick={() => setCurrentIndex(idx)}
              className={`transition-colors text-center ${
                idx === currentIndex ? 'text-amber-300 font-bold' : 'hover:text-white'
              }`}
            >
              <span className="block text-[11px] text-slate-500">{cp.session}</span>
              <span className="hidden sm:block">{cp.year}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Checkpoint State Card */}
      <motion.div
        key={activeCheckpoint.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="p-5 sm:p-6 rounded-[12px] bg-[#0A0E1A]/90 border border-white/[0.08] space-y-4 shadow-xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono border-b border-white/[0.06] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm sm:text-base">{activeCheckpoint.session}</span>
            <span className="text-slate-400">({activeCheckpoint.date})</span>
          </div>
          <span
            className={
              activeCheckpoint.location === 'Hyderabad'
                ? 'badge-active'
                : 'badge-superseded'
            }
          >
            {activeCheckpoint.location === 'Hyderabad' ? 'ACTIVE STATE' : 'SUPERSEDED STATE'}
          </span>
        </div>

        {/* Fact Triples Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 rounded-[8px] bg-white/[0.03] border border-white/[0.06] space-y-1">
            <span className="text-[11px] uppercase text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-amber-400" />
              Location Fact:
            </span>
            <div className="text-white font-bold text-sm sm:text-base flex items-center justify-between">
              <span>{activeCheckpoint.location}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  activeCheckpoint.location === 'Hyderabad'
                    ? 'bg-emerald-950/70 text-emerald-300'
                    : 'bg-amber-950/70 text-amber-300'
                }`}
              >
                {activeCheckpoint.location === 'Hyderabad' ? 'Active' : 'Superseded'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-[8px] bg-white/[0.03] border border-white/[0.06] space-y-1">
            <span className="text-[11px] uppercase text-slate-400 flex items-center gap-1.5">
              <Briefcase className="w-3 h-3 text-blue-400" />
              Role Fact:
            </span>
            <div className="text-white font-bold text-sm sm:text-base">
              {activeCheckpoint.role}
            </div>
          </div>

          <div className="p-3 rounded-[8px] bg-white/[0.03] border border-white/[0.06] space-y-1">
            <span className="text-[11px] uppercase text-slate-400 flex items-center gap-1.5">
              <GraduationCap className="w-3 h-3 text-amber-400" />
              Education Fact:
            </span>
            <div className="text-white font-bold text-sm sm:text-base">
              Business Admin
            </div>
          </div>
        </div>

        {/* Event Transcript Quote */}
        <div className="p-3.5 rounded-[8px] bg-white/[0.02] border border-white/[0.06] text-[13px] text-slate-300 italic font-sans flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>"{activeCheckpoint.eventDescription}"</span>
        </div>

        {/* SUPERSEDES Lineage Notice if applicable */}
        {activeCheckpoint.supersedesEdge && (
          <div className="p-3 rounded-[8px] bg-amber-950/30 border border-amber-500/30 text-[12px] font-mono text-amber-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Graph Lineage: <code className="text-amber-200">{activeCheckpoint.supersedesEdge}</code></span>
          </div>
        )}
      </motion.div>
    </div>
  );
};
