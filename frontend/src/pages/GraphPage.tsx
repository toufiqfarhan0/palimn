import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, Network, Filter } from 'lucide-react';
import { VisualQueryBuilder } from '../components/VisualQueryBuilder';

/* ─── Graph data ────────────────────────────────────────────────── */
const NODES_INIT = [
  { id: 'n1', label: 'Sam',        type: 'Person', x: 350, y: 190 },
  { id: 'n2', label: 'Bangalore',  type: 'Place',  x: 160, y: 110 },
  { id: 'n3', label: 'Hyderabad',  type: 'Place',  x: 540, y: 110 },
  { id: 'n4', label: 'TechCorp',   type: 'Org',    x: 160, y: 280 },
  { id: 'n5', label: 'Infosys',    type: 'Org',    x: 540, y: 280 },
  { id: 'n6', label: 'Python',     type: 'Skill',  x: 350, y: 360 },
  { id: 'n7', label: 'TypeScript', type: 'Skill',  x: 200, y: 430 },
  { id: 'n8', label: 'Rust',       type: 'Skill',  x: 500, y: 430 },
];

const EDGES = [
  { from: 'n1', to: 'n2', label: 'lived_in',  status: 'SUPERSEDED', valid_from: '2019-01', valid_to: '2023-04' },
  { from: 'n1', to: 'n3', label: 'lives_in',  status: 'ACTIVE',     valid_from: '2023-04', valid_to: null },
  { from: 'n1', to: 'n4', label: 'worked_at', status: 'SUPERSEDED', valid_from: '2018-06', valid_to: '2023-08' },
  { from: 'n1', to: 'n5', label: 'works_at',  status: 'ACTIVE',     valid_from: '2023-09', valid_to: null },
  { from: 'n1', to: 'n6', label: 'knows',     status: 'ACTIVE',     valid_from: '2018-01', valid_to: null },
  { from: 'n1', to: 'n7', label: 'knows',     status: 'ACTIVE',     valid_from: '2021-06', valid_to: null },
  { from: 'n1', to: 'n8', label: 'learning',  status: 'ACTIVE',     valid_from: '2024-01', valid_to: null },
];

const TYPE_COLOR: Record<string, string> = {
  Person: '#3B82F6',
  Place:  '#22C55E',
  Org:    '#F59E0B',
  Skill:  '#A855F7',
};

type NodeId = string;

export const GraphPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'CANVAS' | 'QUERY_BUILDER'>('CANVAS');
  const [nodePos, setNodePos] = useState<Record<string, { x: number; y: number }>>(() =>
    Object.fromEntries(NODES_INIT.map(n => [n.id, { x: n.x, y: n.y }]))
  );
  const [selected, setSelected] = useState<NodeId | null>(null);
  const [filter, setFilter]     = useState<'ALL' | 'ACTIVE' | 'SUPERSEDED'>('ALL');

  const svgRef   = useRef<SVGSVGElement>(null);
  const draggingNode = useRef<NodeId | null>(null);
  const lastMouse    = useRef({ x: 0, y: 0 });
  const nodePosRef   = useRef(nodePos);
  nodePosRef.current = nodePos;

  const clientToSvg = useCallback((cx: number, cy: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const viewBox = [0, 0, 700, 500];
    const scaleX = viewBox[2] / rect.width;
    const scaleY = viewBox[3] / rect.height;
    return {
      x: (cx - rect.left) * scaleX,
      y: (cy - rect.top)  * scaleY,
    };
  }, []);

  const hitNode = useCallback((worldX: number, worldY: number): NodeId | null => {
    const pos = nodePosRef.current;
    for (const id of Object.keys(pos)) {
      const dx = worldX - pos[id].x;
      const dy = worldY - pos[id].y;
      if (Math.sqrt(dx * dx + dy * dy) < 22) return id;
    }
    return null;
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const world = clientToSvg(e.clientX, e.clientY);
    const hit   = hitNode(world.x, world.y);

    lastMouse.current = { x: e.clientX, y: e.clientY };

    if (hit) {
      draggingNode.current = hit;
      setSelected(hit);
    } else {
      setSelected(null);
    }
  }, [clientToSvg, hitNode]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };

    if (draggingNode.current && svgRef.current) {
      const id = draggingNode.current;
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = 700 / rect.width;
      const scaleY = 500 / rect.height;

      setNodePos(prev => ({
        ...prev,
        [id]: {
          x: Math.max(30, Math.min(670, prev[id].x + dx * scaleX)),
          y: Math.max(30, Math.min(470, prev[id].y + dy * scaleY)),
        },
      }));
    }
  }, []);

  const onMouseUp = useCallback(() => {
    draggingNode.current = null;
  }, []);

  const resetView = () => {
    setNodePos(Object.fromEntries(NODES_INIT.map(n => [n.id, { x: n.x, y: n.y }])));
    setSelected(null);
  };

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const selectedNode  = selected ? NODES_INIT.find(n => n.id === selected) : null;
  const selectedEdges = selected ? EDGES.filter(e => e.from === selected || e.to === selected) : [];
  const visibleEdges  = EDGES.filter(e => filter === 'ALL' ? true : e.status === filter);

  return (
    <div className="min-h-[100dvh] bg-transparent max-w-[1200px] mx-auto px-6 pt-12 pb-24 font-['Plus_Jakarta_Sans',sans-serif]">

      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[12px] font-semibold text-amber-300 backdrop-blur-md">
            <Network className="w-3.5 h-3.5 text-amber-400" />
            <span>TOPOLOGICAL GRAPH UNIVERSE</span>
          </div>
          <h1 className="text-[36px] sm:text-[44px] font-extrabold text-white tracking-tight">
            Graph Universe & Query Explorer
          </h1>
          <p className="text-[14px] text-slate-300">
            {NODES_INIT.length} memory entities · {EDGES.length} temporal edges · drag nodes or build visual queries
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-[8px] bg-[#0E1424]/90 border border-white/[0.1]">
          <button
            onClick={() => setViewMode('CANVAS')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-[6px] transition-all flex items-center gap-1.5 ${
              viewMode === 'CANVAS'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Interactive Graph</span>
          </button>
          <button
            onClick={() => setViewMode('QUERY_BUILDER')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-[6px] transition-all flex items-center gap-1.5 ${
              viewMode === 'QUERY_BUILDER'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Visual Query Builder</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Topological Graph Canvas */}
      {viewMode === 'CANVAS' && (
        <div>
          {/* Filter Toolbar & Reset */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5 p-1 rounded-[8px] bg-[#0E1424]/80 border border-white/[0.08]">
              {(['ALL', 'ACTIVE', 'SUPERSEDED'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-[12px] font-mono rounded-[6px] font-semibold transition-all ${
                    filter === f
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              onClick={resetView}
              className="p-2 rounded-[8px] bg-[#0E1424]/80 border border-white/[0.08] text-slate-300 hover:text-white hover:border-amber-400/40 transition-all flex items-center gap-1.5 text-xs font-mono"
              title="Reset Node Positions"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset Layout</span>
            </button>
          </div>

          {/* Main Grid: Fixed Canvas (8 cols) + Inspector (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Fixed Size SVG Canvas (8 cols) */}
            <div
              className="lg:col-span-8 relative rounded-[12px] overflow-hidden border border-white/[0.12] bg-[#090D18]/90 shadow-2xl flex items-center justify-center backdrop-blur-xl"
              style={{ height: '500px', maxHeight: '500px' }}
            >
              <svg
                ref={svgRef}
                viewBox="0 0 700 500"
                className="w-full h-full select-none cursor-default"
                onMouseDown={onMouseDown}
              >
                <defs>
                  <pattern id="graph-dots" width="24" height="24" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.08)" />
                  </pattern>
                  <marker id="arr-active-clean" markerWidth="7" markerHeight="7" refX="7" refY="3.5" orient="auto">
                    <path d="M0,0 L7,3.5 L0,7" fill="#3B82F6" />
                  </marker>
                  <marker id="arr-superseded-clean" markerWidth="7" markerHeight="7" refX="7" refY="3.5" orient="auto">
                    <path d="M0,0 L7,3.5 L0,7" fill="#F59E0B" />
                  </marker>
                </defs>

                {/* Canvas dot grid */}
                <rect width="700" height="500" fill="url(#graph-dots)" />

                {/* Edges */}
                {visibleEdges.map((edge, i) => {
                  const from = nodePos[edge.from];
                  const to   = nodePos[edge.to];
                  if (!from || !to) return null;
                  const isActive = edge.status === 'ACTIVE';
                  const isHighlighted = selected === edge.from || selected === edge.to;
                  const mx = (from.x + to.x) / 2;
                  const my = (from.y + to.y) / 2;

                  const dist = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2) || 1;
                  const ux = (to.x - from.x) / dist;
                  const uy = (to.y - from.y) / dist;
                  const x1 = from.x + ux * 18;
                  const y1 = from.y + uy * 18;
                  const x2 = to.x - ux * 22;
                  const y2 = to.y - uy * 22;

                  return (
                    <g key={i}>
                      <line
                        x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke={isActive ? '#3B82F6' : '#F59E0B'}
                        strokeWidth={isHighlighted ? 2.4 : 1.4}
                        strokeOpacity={isHighlighted ? 1 : isActive ? 0.8 : 0.5}
                        strokeDasharray={isActive ? 'none' : '5 3'}
                        markerEnd={`url(#arr-${isActive ? 'active' : 'superseded'}-clean)`}
                      />
                      <text
                        x={mx} y={my - 5}
                        textAnchor="middle"
                        fontSize="10"
                        fill={isActive ? '#93C5FD' : '#FBBF24'}
                        fontFamily="'JetBrains Mono', monospace"
                        fontWeight="600"
                      >
                        {edge.label}
                      </text>
                    </g>
                  );
                })}

                {/* Nodes */}
                {NODES_INIT.map(node => {
                  const pos = nodePos[node.id];
                  if (!pos) return null;
                  const isSelected = selected === node.id;
                  const isConnected = selected ? EDGES.some(e =>
                    (e.from === node.id && e.to === selected) ||
                    (e.to === node.id && e.from === selected)
                  ) : false;
                  const color = TYPE_COLOR[node.type] ?? '#3B82F6';

                  return (
                    <g key={node.id} style={{ cursor: 'grab' }}>
                      {isSelected && (
                        <circle cx={pos.x} cy={pos.y} r={24} fill="#F59E0B" opacity={0.2} />
                      )}
                      <circle
                        cx={pos.x} cy={pos.y} r={16}
                        fill="#0E1424"
                        stroke={isSelected ? '#F59E0B' : isConnected ? color : 'rgba(255,255,255,0.2)'}
                        strokeWidth={isSelected ? 3 : 2}
                      />
                      <circle cx={pos.x} cy={pos.y} r={6} fill={color} />
                      <text
                        x={pos.x} y={pos.y + 30}
                        textAnchor="middle"
                        fontSize="11"
                        fill={isSelected ? '#FFFFFF' : '#CBD5E1'}
                        fontFamily="'Plus Jakarta Sans', sans-serif"
                        fontWeight="700"
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Sidebar Panel (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Legend Card */}
              <div className="card space-y-3">
                <div className="text-[12px] font-mono uppercase font-semibold text-slate-400 tracking-wider border-b border-white/[0.08] pb-2">
                  Entity Taxonomy
                </div>

                <div className="grid grid-cols-2 gap-2 text-[13px]">
                  {Object.entries(TYPE_COLOR).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                      <span className="text-white font-medium">{type}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-white/[0.08] space-y-2 text-[12px] font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-0.5 bg-[#3B82F6] inline-block" />
                    <span>ACTIVE edge (valid truth)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-0.5 border-t-2 border-dashed border-[#F59E0B] inline-block" />
                    <span>SUPERSEDED edge (history)</span>
                  </div>
                </div>
              </div>

              {/* Selected Node Inspector */}
              <AnimatePresence>
                {selectedNode && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="card space-y-4 border-l-4"
                    style={{ borderLeftColor: TYPE_COLOR[selectedNode.type] }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-mono font-bold uppercase" style={{ color: TYPE_COLOR[selectedNode.type] }}>
                          {selectedNode.type} Entity
                        </span>
                        <h3 className="text-[22px] font-bold text-white">{selectedNode.label}</h3>
                      </div>
                      <button onClick={() => setSelected(null)} className="p-1 text-slate-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                        Associated Relationships ({selectedEdges.length})
                      </div>

                      {selectedEdges.map((e, idx) => {
                        const otherId = e.from === selectedNode.id ? e.to : e.from;
                        const other = NODES_INIT.find(n => n.id === otherId);
                        return (
                          <div key={idx} className="p-2.5 rounded-[6px] bg-[#0A0D18]/80 border border-white/[0.08] text-[12px] font-mono space-y-1">
                            <div className="flex items-center justify-between">
                              <span className={e.status === 'ACTIVE' ? 'badge-active' : 'badge-superseded'}>
                                {e.status}
                              </span>
                              <span className="text-slate-400">{e.valid_from}</span>
                            </div>
                            <div className="text-white">
                              <strong>{e.label}</strong> → {other?.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!selectedNode && (
                <div className="card text-center py-8 text-[13px] text-slate-400">
                  Click or drag any node to inspect its temporal edges and valid intervals.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Visual Query Builder */}
      {viewMode === 'QUERY_BUILDER' && (
        <div>
          <VisualQueryBuilder />
        </div>
      )}

    </div>
  );
};
