import React, { useEffect, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { fetchGraphData, GraphResponse, GraphNode, GraphEdge } from '../lib/api';
import { GitFork, RefreshCw } from 'lucide-react';

export const GraphPage: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const formatGraph = (data: GraphResponse) => {
    const layoutPositions: Record<string, { x: number; y: number }> = {
      user_demo: { x: 380, y: 30 },
      session_01: { x: 180, y: 150 },
      session_02: { x: 580, y: 150 },
      msg_01: { x: 180, y: 280 },
      msg_02: { x: 580, y: 280 },
      fact_001: { x: 180, y: 410 },
      fact_002: { x: 580, y: 410 },
      entity_bangalore: { x: 180, y: 540 },
      entity_hyderabad: { x: 580, y: 540 },
    };

    const rfNodes: Node[] = data.nodes.map((n: GraphNode, idx: number) => {
      const pos = layoutPositions[n.id] || {
        x: 100 + (idx % 4) * 220,
        y: 80 + Math.floor(idx / 4) * 140,
      };
      const props = n.properties || {};
      const status = props.status;

      let bgColor = '#0F172A';
      let textColor = '#CBD5E1';
      let borderColor = '#334155';

      if (n.label === 'User') {
        bgColor = '#1E1B4B';
        textColor = '#E0E7FF';
        borderColor = '#6366F1';
      } else if (n.label === 'Session') {
        bgColor = '#1E293B';
        textColor = '#94A3B8';
        borderColor = '#475569';
      } else if (n.label === 'Message') {
        bgColor = '#0B0F19';
        textColor = '#E2E8F0';
        borderColor = '#334155';
      } else if (n.label === 'Fact') {
        if (status === 'active') {
          bgColor = '#064E3B';
          textColor = '#A7F3D0';
          borderColor = '#10B981';
        } else {
          bgColor = '#451A03';
          textColor = '#FDE68A';
          borderColor = '#D97706';
        }
      } else if (n.label === 'Entity') {
        bgColor = '#2E1065';
        textColor = '#DDD6FE';
        borderColor = '#8B5CF6';
      }

      return {
        id: n.id,
        position: pos,
        data: {
          label: (
            <div className="space-y-1 font-mono text-left">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                  {n.label}
                </span>
                {status && (
                  <span
                    className={`text-[8px] uppercase px-1 py-0.2 rounded ${
                      status === 'active'
                        ? 'bg-emerald-950 text-emerald-300'
                        : 'bg-amber-950 text-amber-300'
                    }`}
                  >
                    {status}
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold truncate max-w-[180px]">
                {props.object || props.name || props.id || n.id}
              </p>
              {props.date && (
                <span className="text-[9px] text-slate-400 block">{props.date}</span>
              )}
            </div>
          ),
          details: props,
          nodeLabel: n.label,
          rawName: n.name,
        },
        style: {
          background: bgColor,
          color: textColor,
          border: `1px solid ${borderColor}`,
          borderRadius: '8px',
          padding: '10px 12px',
          minWidth: '170px',
        },
      };
    });

    const rfEdges: Edge[] = data.edges.map((e: GraphEdge) => {
      const isSupersedes = e.type === 'SUPERSEDES';
      const isPrecedes = e.type === 'PRECEDES';

      let strokeColor = '#475569';
      let strokeWidth = 1;

      if (isSupersedes) {
        strokeColor = '#F59E0B';
        strokeWidth = 2.5;
      } else if (isPrecedes) {
        strokeColor = '#38BDF8';
        strokeWidth = 1.5;
      }

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.type,
        animated: isSupersedes || isPrecedes,
        style: {
          stroke: strokeColor,
          strokeWidth,
        },
        labelStyle: {
          fill: isSupersedes ? '#FCD34D' : isPrecedes ? '#7DD3FC' : '#94A3B8',
          fontFamily: 'monospace',
          fontSize: '10px',
          fontWeight: isSupersedes ? 'bold' : 'normal',
        },
        labelBgStyle: {
          fill: '#07090E',
          fillOpacity: 0.9,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: strokeColor,
        },
      };
    });

    return { rfNodes, rfEdges };
  };

  const loadGraph = useCallback(async () => {
    setLoading(true);
    try {
      const data: GraphResponse = await fetchGraphData(100);
      if (data.nodes.length > 0) {
        const { rfNodes, rfEdges } = formatGraph(data);
        setNodes(rfNodes);
        setEdges(rfEdges);
      }
    } catch (err) {
      console.error('Failed to load graph snapshot', err);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const nodeDetails = selectedNode?.data?.details as Record<string, any> | undefined;

  return (
    <div className="h-[calc(100vh-62px)] flex flex-col bg-[#07090E]">
      {/* Top Toolbar */}
      <div className="bg-graphite-900 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded border border-slate-700 bg-graphite-850 flex items-center justify-center text-cyan-400">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold font-mono text-white tracking-wide uppercase">
              Temporal Memory Graph
            </h1>
            <p className="text-[11px] text-slate-400 font-sans">
              Interactive subgraph visualizer with explicit <span className="text-amber-400 font-mono">SUPERSEDES</span> and <span className="text-cyan-400 font-mono">PRECEDES</span> edges.
            </p>
          </div>
        </div>

        {/* Action Controls & Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400 border-r border-slate-800 pr-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Active Fact
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Superseded Fact
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 bg-amber-400" /> SUPERSEDES
            </span>
          </div>

          <button
            onClick={loadGraph}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-graphite-850 hover:bg-graphite-800 border border-slate-700 text-slate-300 text-xs font-mono transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload Graph</span>
          </button>
        </div>
      </div>

      {/* Main Canvas & Node Inspector */}
      <div className="flex-1 relative bg-[#07090E]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          className="bg-[#07090E]"
        >
          <Background color="#1E293B" gap={20} size={1} />
          <Controls className="!bg-graphite-900 !border-slate-800 !text-slate-300 !rounded-lg" />
          <MiniMap
            className="!bg-graphite-900 !border-slate-800 !rounded-lg"
            nodeColor={(n) => {
              if (n.id.includes('fact')) return '#10B981';
              if (n.id.includes('user')) return '#6366F1';
              if (n.id.includes('session')) return '#475569';
              return '#334155';
            }}
          />
        </ReactFlow>

        {/* Selected Node Inspector Drawer */}
        {selectedNode && (
          <div className="absolute right-6 top-6 w-88 bg-graphite-900/95 backdrop-blur-md rounded-xl p-5 border border-slate-800 shadow-2xl space-y-4 z-10 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <h3 className="text-xs font-bold uppercase text-slate-200">
                  Node Inspector
                </h3>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-200 text-xs px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Identifier</span>
                <p className="text-slate-200 font-bold truncate">{selectedNode.id}</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Label / Type</span>
                <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-semibold mt-0.5">
                  {String(selectedNode.data?.nodeLabel || 'Node')}
                </span>
              </div>

              {nodeDetails && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Properties</span>
                  <div className="space-y-1.5 bg-graphite-950 p-3 rounded-lg border border-slate-800 text-[11px]">
                    {Object.entries(nodeDetails).map(([k, v]) => (
                      <div key={k} className="flex items-start justify-between gap-2">
                        <span className="text-slate-400">{k}:</span>
                        <span
                          className={`text-right font-semibold ${
                            k === 'status' && v === 'active'
                              ? 'text-emerald-400'
                              : k === 'status' && v === 'superseded'
                              ? 'text-amber-400'
                              : 'text-slate-200'
                          }`}
                        >
                          {String(v ?? 'null')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
