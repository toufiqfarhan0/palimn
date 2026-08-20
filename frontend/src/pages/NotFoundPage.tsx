import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Network, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100dvh-120px)] bg-transparent flex items-center justify-center px-6 py-20 font-['Plus_Jakarta_Sans',sans-serif]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-lg mx-auto w-full space-y-6 text-center"
      >
        {/* Error badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[12px] font-mono backdrop-blur-md">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>404 · CALIBRATED_ABSTENTION</span>
        </div>

        {/* Big 404 */}
        <div>
          <h1 className="text-[96px] sm:text-[120px] font-extrabold tracking-tight leading-none text-white">
            4<span className="text-amber-400">0</span>4
          </h1>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <h2 className="text-[20px] font-bold text-white">
            Memory route not found in graph.
          </h2>
          <p className="text-[14px] text-slate-300 max-w-sm mx-auto">
            This state does not exist or was superseded across historical sessions. PALIMN refuses to hallucinate nonexistent paths.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link to="/" className="btn-primary">
            <ArrowLeft className="w-4 h-4 text-slate-950" />
            Return Home
          </Link>
          <Link to="/chat" className="btn-ghost">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Query Console
          </Link>
          <Link to="/graph" className="btn-ghost">
            <Network className="w-4 h-4 text-blue-400" />
            Inspect Graph
          </Link>
        </div>

        {/* Terminal Decision Card */}
        <div className="code-window text-left max-w-md mx-auto mt-6">
          <div className="code-window-header">
            <span className="code-window-dot bg-red-400" />
            <span className="code-window-dot bg-amber-400" />
            <span className="code-window-dot bg-emerald-400" />
            <span className="ml-3 text-[11px] font-mono text-slate-400">
              hydradb-cloud · node lookup
            </span>
          </div>
          <div className="p-4 font-mono text-[12px] space-y-1 text-slate-300">
            <div>
              <span className="text-amber-400">POST</span>{' '}
              <span className="text-white">/api/graph/route</span>
            </div>
            <div className="text-amber-400/90">→ 0 matching edges found</div>
            <div className="text-emerald-400 font-semibold">
              → decision: CALIBRATED_ABSTENTION
            </div>
            <div className="text-slate-400">
              → hallucinations emitted: <strong className="text-white">0</strong>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
