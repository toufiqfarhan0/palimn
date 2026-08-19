import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  User, 
  Clock, 
  X, 
  ShieldCheck,
  Sparkles,
  MessageSquare
} from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  type: 'User' | 'Session' | 'Message' | 'Fact' | 'Entity' | 'Topic';
  properties: {
    subject?: string;
    predicate?: string;
    object?: string;
    session_id?: string;
    message_id?: string;
    created_at?: string;
    valid_from?: string;
    valid_until?: string;
    status?: string;
    snippet?: string;
    content?: string;
    [key: string]: any;
  };
  x: number;
  y: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'SUPERSEDES' | 'PRECEDES' | 'CONTAINS' | 'MENTIONS' | 'ABOUT' | 'SUPPORTS';
  properties?: any;
}

const DEFAULT_NODES: GraphNode[] = [
  {
    id: 'user_alex',
    label: 'User (Alex Chen)',
    type: 'User',
    properties: { subject: 'user_alex', role: 'root' },
    x: 50,
    y: 40,
  },
  {
    id: 'sess_01',
    label: 'Session 01',
    type: 'Session',
    properties: { session_id: 'session_01', date: '2021-03-15' },
    x: 20,
    y: 20,
  },
  {
    id: 'sess_51',
    label: 'Session 51',
    type: 'Session',
    properties: { session_id: 'session_51', date: '2023-04-20' },
    x: 35,
    y: 75,
  },
  {
    id: 'fact_bangalore',
    label: 'Location: Bangalore',
    type: 'Fact',
    properties: {
      subject: 'user_alex',
      predicate: 'lives_in',
      object: 'Bangalore',
      status: 'superseded',
      valid_from: '2021-03-15',
      valid_until: '2023-04-20',
      snippet: 'I currently live in Bangalore, working near Indiranagar.',
    },
    x: 25,
    y: 45,
  },
  {
    id: 'fact_hyderabad',
    label: 'Location: Hyderabad (Active)',
    type: 'Fact',
    properties: {
      subject: 'user_alex',
      predicate: 'lives_in',
      object: 'Hyderabad',
      status: 'active',
      valid_from: '2023-04-20',
      valid_until: 'present',
      snippet: 'I relocated from Bangalore to Hyderabad for my new role.',
    },
    x: 45,
    y: 85,
  },
  {
    id: 'fact_job',
    label: 'Role: Staff Engineer',
    type: 'Fact',
    properties: {
      subject: 'user_alex',
      predicate: 'works_as',
      object: 'Staff Engineer',
      status: 'active',
      valid_from: '2023-03-10',
      valid_until: 'present',
      snippet: 'Promoted to Staff Engineer leading core infrastructure.',
    },
    x: 80,
    y: 35,
  },
  {
    id: 'fact_degree',
    label: 'Degree: Business Admin',
    type: 'Fact',
    properties: {
      subject: 'user_alex',
      predicate: 'graduated_with',
      object: 'Business Administration',
      status: 'active',
      valid_from: '2021-06-05',
      snippet: 'Graduated with a degree in Business Administration.',
    },
    x: 75,
    y: 70,
  },
];

const DEFAULT_EDGES: GraphEdge[] = [
  { id: 'e1', source: 'fact_bangalore', target: 'fact_hyderabad', type: 'SUPERSEDES' },
  { id: 'e2', source: 'sess_01', target: 'sess_51', type: 'PRECEDES' },
  { id: 'e3', source: 'user_alex', target: 'fact_bangalore', type: 'MENTIONS' },
  { id: 'e4', source: 'user_alex', target: 'fact_hyderabad', type: 'MENTIONS' },
  { id: 'e5', source: 'user_alex', target: 'fact_job', type: 'MENTIONS' },
  { id: 'e6', source: 'user_alex', target: 'fact_degree', type: 'MENTIONS' },
  { id: 'e7', source: 'sess_01', target: 'fact_bangalore', type: 'CONTAINS' },
  { id: 'e8', source: 'sess_51', target: 'fact_hyderabad', type: 'CONTAINS' },
];

export const GraphPage: React.FC = () => {
  const [nodes, setNodes] = useState<GraphNode[]>(DEFAULT_NODES);
  const [edges, setEdges] = useState<GraphEdge[]>(DEFAULT_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('fact_hyderabad');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch real graph data from /api/graph
  useEffect(() => {
    fetch('/api/graph')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.nodes && data.nodes.length > 0) {
          // Layout nodes across a 100x100 virtual canvas
          const mappedNodes: GraphNode[] = data.nodes.map((n: any, idx: number) => {
            const angle = (idx / data.nodes.length) * 2 * Math.PI;
            const r = 32 + (idx % 3) * 6;
            return {
              id: n.id,
              label: n.properties?.object || n.properties?.label || n.label || n.id,
              type: n.label || 'Fact',
              properties: n.properties || {},
              x: 50 + r * Math.cos(angle),
              y: 50 + r * Math.sin(angle),
            };
          });
          setNodes(mappedNodes);
          if (data.edges) {
            setEdges(
              data.edges.map((e: any, idx: number) => ({
                id: `edge_${idx}`,
                source: e.source,
                target: e.target,
                type: e.type || 'MENTIONS',
                properties: e.properties || {},
              }))
            );
          }
        }
      })
      .catch(() => {
        // Retain default demo constellation
      });
  }, []);

  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchesType = filterType === 'ALL' || n.type.toUpperCase() === filterType.toUpperCase();
      const matchesSearch =
        !searchQuery ||
        n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [nodes, filterType, searchQuery]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const connectedEdges = useMemo(() => {
    return edges.filter(
      (e) => e.source === selectedNodeId || e.target === selectedNodeId
    );
  }, [edges, selectedNodeId]);

  return (
    <div className="relative min-h-[calc(100vh-65px)] bg-[#07080D] flex flex-col overflow-hidden text-[#F4F7FB]">
      {/* Top Floating Control Bar */}
      <div className="absolute top-6 left-6 right-6 z-20 flex flex-wrap items-center justify-between gap-4 pointer-events-none">
        {/* Search & Filter Controls (Pointer events enabled) */}
        <div className="flex flex-wrap items-center gap-3 pointer-events-auto">
          {/* Search Box */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111522]/90 border border-white/[0.08] backdrop-blur-xl shadow-lg text-xs">
            <Search className="w-3.5 h-3.5 text-[#9AA4B2]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memory node..."
              className="bg-transparent text-white placeholder:text-[#556075] focus:outline-none w-36 sm:w-48 font-sans"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[#9AA4B2] hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-full bg-[#111522]/90 border border-white/[0.08] backdrop-blur-xl text-xs font-mono">
            {['ALL', 'FACT', 'SESSION', 'USER'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1 rounded-full transition-colors ${
                  filterType === t
                    ? 'bg-cyan-500 text-slate-950 font-medium'
                    : 'text-[#9AA4B2] hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D101B]/90 border border-white/[0.08] backdrop-blur-xl text-xs font-mono text-[#9AA4B2]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>HydraDB Graph • {nodes.length} Nodes</span>
        </div>
      </div>

      {/* Interactive Memory Universe Canvas */}
      <div className="relative flex-1 w-full h-full min-h-[600px] flex items-center justify-center p-8 select-none">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#1E2640_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
        <div className="absolute inset-0 bg-radial-glow opacity-60 pointer-events-none" />

        {/* SVG Edges Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="edgeAmber" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#D97706" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="edgeCyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {edges.map((edge) => {
            const src = nodes.find((n) => n.id === edge.source);
            const dst = nodes.find((n) => n.id === edge.target);
            if (!src || !dst) return null;

            const isSelectedEdge = edge.source === selectedNodeId || edge.target === selectedNodeId;
            const isAmber = edge.type === 'SUPERSEDES';

            return (
              <g key={edge.id}>
                <line
                  x1={`${src.x}%`}
                  y1={`${src.y}%`}
                  x2={`${dst.x}%`}
                  y2={`${dst.y}%`}
                  stroke={isAmber ? 'url(#edgeAmber)' : 'url(#edgeCyan)'}
                  strokeWidth={isSelectedEdge ? 2.5 : 1.2}
                  strokeDasharray={isAmber ? '4,4' : 'none'}
                  strokeOpacity={isSelectedEdge ? 1 : 0.4}
                />
                {isAmber && (
                  <text
                    x={`${(src.x + dst.x) / 2}%`}
                    y={`${(src.y + dst.y) / 2 - 4}%`}
                    fill="#F59E0B"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                    className="font-bold"
                  >
                    SUPERSEDES
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Node Elements */}
        {filteredNodes.map((node) => {
          const isSelected = node.id === selectedNodeId;
          const isHistorical = node.properties.status === 'superseded';
          const isUser = node.type === 'User';

          return (
            <motion.button
              key={node.id}
              onClick={() => setSelectedNodeId(node.id)}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer focus:outline-none transition-all ${
                isSelected ? 'scale-110 z-30' : 'hover:scale-105 z-10 opacity-85 hover:opacity-100'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSelected && (
                <div
                  className={`absolute -inset-3 rounded-full blur-md ${
                    isHistorical ? 'bg-amber-500/30' : 'bg-cyan-500/30'
                  }`}
                />
              )}

              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-xl transition-all duration-300 ${
                  isSelected
                    ? isHistorical
                      ? 'bg-[#1C160B] border-amber-400 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                      : 'bg-[#0E1A2C] border-cyan-400 text-cyan-100 shadow-[0_0_20px_rgba(56,189,248,0.3)]'
                    : isHistorical
                    ? 'bg-[#111319]/80 border-slate-700/60 text-slate-400 opacity-60'
                    : isUser
                    ? 'bg-[#181E32]/90 border-indigo-500/40 text-indigo-200'
                    : 'bg-[#111625]/90 border-slate-700/80 text-slate-200'
                }`}
              >
                {isUser ? (
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                ) : isHistorical ? (
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span className="text-xs font-medium whitespace-nowrap">{node.label}</span>
                {node.properties.status && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${
                      isHistorical ? 'badge-superseded' : 'badge-active'
                    }`}
                  >
                    {node.properties.status.toUpperCase()}
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Side Slide-Over Inspector Drawer (Only when a node is selected) */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute bottom-6 right-6 top-20 w-80 sm:w-96 rounded-2xl bg-[#0A0D18]/95 border border-white/[0.08] backdrop-blur-2xl p-6 shadow-2xl z-40 flex flex-col justify-between overflow-y-auto"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#9AA4B2]">
                  Selected Memory
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    selectedNode.properties.status === 'superseded'
                      ? 'badge-superseded'
                      : 'badge-active'
                  }`}
                >
                  {selectedNode.type.toUpperCase()}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-display font-bold text-white">
                  {selectedNode.label}
                </h3>
                <p className="text-xs font-mono text-cyan-400 mt-0.5">ID: {selectedNode.id}</p>
              </div>

              {/* Temporal Range */}
              {(selectedNode.properties.valid_from || selectedNode.properties.valid_until) && (
                <div className="p-3 rounded-xl bg-[#111522] border border-white/[0.06] space-y-1.5 text-xs font-mono">
                  <div className="text-[#9AA4B2] flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-indigo-400" />
                    <span>Temporal Range</span>
                  </div>
                  <div className="text-white font-medium">
                    {selectedNode.properties.valid_from || 'Genesis'} → {selectedNode.properties.valid_until || 'Present'}
                  </div>
                </div>
              )}

              {/* Source Message Snippet */}
              {selectedNode.properties.snippet && (
                <div className="p-3.5 rounded-xl bg-[#111522] border border-white/[0.06] space-y-2">
                  <div className="text-[11px] font-mono text-[#9AA4B2] flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3 text-cyan-400" />
                    <span>Origin Transcript</span>
                  </div>
                  <p className="text-xs text-slate-300 italic bg-[#07090F] p-2.5 rounded border border-white/[0.04]">
                    "{selectedNode.properties.snippet}"
                  </p>
                </div>
              )}

              {/* Connected Lineage Edges */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase text-[#9AA4B2]">
                  Connected Relations ({connectedEdges.length})
                </span>
                <div className="space-y-1.5">
                  {connectedEdges.map((e) => (
                    <div
                      key={e.id}
                      className="px-3 py-2 rounded-lg bg-[#111522]/60 border border-white/[0.04] text-xs font-mono flex items-center justify-between"
                    >
                      <span className="text-[#9AA4B2]">{e.type}</span>
                      <span className="text-cyan-300 truncate max-w-[140px]">
                        {e.source === selectedNodeId ? e.target : e.source}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#9AA4B2]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Persistent in HydraDB
              </span>
              <button
                onClick={() => setSelectedNodeId('')}
                className="text-white hover:text-cyan-300"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
