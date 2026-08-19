import React, { useEffect, useState } from 'react';
import { fetchHealth, HealthResponse } from '../lib/api';
import { Activity, Database, AlertCircle } from 'lucide-react';

export const HealthBadge: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    try {
      const data = await fetchHealth();
      setHealth(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Offline');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-graphite-850 border border-slate-800 text-xs text-slate-400">
        <Activity className="w-3.5 h-3.5 animate-pulse text-palimn-violet" />
        <span>Connecting...</span>
      </div>
    );
  }

  if (error || !health) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/40 border border-red-800/50 text-xs text-red-300">
        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
        <span>Backend Offline</span>
      </div>
    );
  }

  const isHydraConnected = health.hydradb.connected;
  const isHydraUnconfigured = health.hydradb.status === 'unconfigured';

  return (
    <div className="flex items-center gap-2">
      {/* Backend Status */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-graphite-850 border border-slate-800 text-xs text-slate-300">
        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
        <span className="font-mono font-medium">API v{health.version}</span>
      </div>

      {/* HydraDB Cloud Status */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono transition-colors ${
          isHydraConnected
            ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
            : isHydraUnconfigured
            ? 'bg-amber-950/30 border-amber-800/60 text-amber-300'
            : 'bg-red-950/30 border-red-800/60 text-red-300'
        }`}
        title={
          isHydraConnected
            ? `HydraDB Cloud Connected (${health.hydradb.latency_ms}ms)`
            : isHydraUnconfigured
            ? 'HydraDB Cloud unconfigured - set credentials in .env'
            : health.hydradb.reason || 'HydraDB Connection Error'
        }
      >
        <Database className="w-3 h-3" />
        <span>
          {isHydraConnected
            ? 'HydraDB Cloud'
            : isHydraUnconfigured
            ? 'HydraDB (Unconfigured)'
            : 'HydraDB Error'}
        </span>
      </div>
    </div>
  );
};
