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
      user_demo: { x: 300, y: 30 },
      session_01: { x: 120, y: 140 },
      session_02: { x: 480, y: 140 },
      msg_01: { x: 120, y: 250 },
      msg_02: { x: 480, y: 250 },
      fact_001: { x: 120, y: 370 },
      fact_002: { x: 480, y: 370 },
      entity_bangalore: { x: 120, y: 490 },
      entity_hyderabad: { x: 480, y: 490 },
    };

    const rfNodes: Node[] = data.nodes.map((n: GraphNode, idx: number) => {
      const pos = layoutPositions[n.id] || { x: 100 + (idx % 3) * 220, y: 80 + Math.floor(idx / 3) * 120 };
      const props = n.properties || {};
      const status = props.status;

      let style = {
        background: '#0F172A',
        color: '#94A3B8',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '11px',
        minWidth: '150px',
      };

      if (n.label === 'User') {
        style = { ...style, background: '#1E1B4B', color: '#E0E7FF', border: '1px solid #6366F1' };
      } else if (n.label === 'Session') {
        style = { ...style, background: '#1E293B', color: '#CBD5E1', border: '1px solid #475569' };
      } else if (n.label === 'Fact') {
        if (status === 'active') {
          style = { ...style, background: '#064E3B', color: '#6EE7B7', border: '1px solid #10B981' };
        } else {
          style = { ...style, background: '#1C1917', color: '#FCD34D', border: '1px solid #D97706' };
        }
      } else if (n.label === 'Entity') {
        style = { ...style, background: '#1E1E2E', color: '#C4B5FD', border: '1px solid #8B5CF6' };
      }

      return {
        id: n.id,
        position: pos,
        data: {
          label: n.name || `${n.label}: ${n.id}`,
          details: props,
          nodeLabel: n.label,
        },
        style,
      };
    });

    const rfEdges: Edge[] = data.edges.map((e: GraphEdge) => {
      const isSupersedes = e.type === 'SUPERSEDES';
      const isPrecedes = e.type === 'PRECEDES';

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.type,
        animated: isSupersedes || isPrecedes,
        style: {
          stroke: isSupersedes ? '#F59E0B' : isPrecedes ? '#6366F1' : '#475569',
          strokeWidth: isSupersedes ? 2 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isSupersedes ? '#F59E0B' : isPrecedes ? '#6366F1' : '#475569',
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

  return (
    <div className="h-[calc(100vh-65px)] flex flex-col">
      {/* Top toolbar */}
      <div className="glass-panel px-6 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitFork className="w-4 h-4 text-palimn-violet" />
          <h2 className="text-sm font-semibold text-white font-mono">Temporal Memory Subgraph</h2>
          <span className="text-[11px] text-slate-400 ml-2">
            Inspect active, historical, and superseded memories with revision edges.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadGraph}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-graphite-850 hover:bg-graphite-800 border border-slate-800 text-xs text-slate-300 font-mono transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* Main Canvas & Details Drawer */}
      <div className="flex-1 relative bg-graphite-950">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          className="bg-[#07090E]"
        >
          <Background color="#1E293B" gap={16} size={1} />
          <Controls className="!bg-graphite-900 !border-slate-800 !text-slate-300" />
          <MiniMap
            className="!bg-graphite-900 !border-slate-800"
            nodeColor={(n) => {
              if (n.id.includes('fact')) return '#8B5CF6';
              if (n.id.includes('user')) return '#6366F1';
              return '#475569';
            }}
          />
        </ReactFlow>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="absolute right-4 top-4 w-80 glass-panel rounded-xl p-4 border border-slate-800/80 shadow-glass space-y-3 z-10">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-mono uppercase text-palimn-violet font-semibold">
                Node Inspector
              </h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 font-mono text-[10px]">ID:</span>
                <p className="font-mono text-slate-200">{selectedNode.id}</p>
              </div>

              {selectedNode.data?.details ? (
                <div className="space-y-1.5 bg-graphite-900/80 p-2.5 rounded border border-slate-800 font-mono text-[11px]">
                  {Object.entries(selectedNode.data.details as Record<string, any>).map(([key, val]) => (
                    <div key={key} className="flex items-start justify-between gap-2">
                      <span className="text-slate-500">{key}:</span>
                      <span className={`text-right font-semibold ${
                        key === 'status' && val === 'active' ? 'text-emerald-400' :
                        key === 'status' && val === 'superseded' ? 'text-amber-400' :
                        'text-slate-200'
                      }`}>
                        {String(val ?? 'null')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-xs">
                  {selectedNode.data?.label as string}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
