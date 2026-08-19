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
import { fetchGraphData, GraphResponse } from '../lib/api';
import { GitFork, RefreshCw } from 'lucide-react';

export const GraphPage: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const loadGraph = useCallback(async () => {
    setLoading(true);
    try {
      const data: GraphResponse = await fetchGraphData(100);
      
      // If graph is empty (e.g. freshly initialized), populate demonstration visual nodes
      if (data.nodes.length === 0) {
        const demoNodes: Node[] = [
          {
            id: 'user_1',
            position: { x: 250, y: 50 },
            data: { label: 'User: toufiq' },
            style: { background: '#1E1B4B', color: '#E0E7FF', border: '1px solid #6366F1', borderRadius: '8px', padding: '10px' },
          },
          {
            id: 'fact_s4',
            position: { x: 100, y: 180 },
            data: {
              label: 'Fact: lives_in Bangalore\n(Status: historical)',
              details: {
                memory_id: 'mem_001',
                subject: 'user',
                predicate: 'lives_in',
                object: 'Bangalore',
                session: 'Session 4',
                status: 'historical',
              }
            },
            style: { background: '#1C1917', color: '#FCD34D', border: '1px solid #D97706', borderRadius: '8px', padding: '10px', fontSize: '11px' },
          },
          {
            id: 'fact_s19',
            position: { x: 400, y: 180 },
            data: {
              label: 'Fact: lives_in Hyderabad\n(Status: active)',
              details: {
                memory_id: 'mem_002',
                subject: 'user',
                predicate: 'lives_in',
                object: 'Hyderabad',
                session: 'Session 19',
                status: 'active',
              }
            },
            style: { background: '#064E3B', color: '#6EE7B7', border: '1px solid #10B981', borderRadius: '8px', padding: '10px', fontSize: '11px' },
          },
          {
            id: 'entity_bangalore',
            position: { x: 80, y: 320 },
            data: { label: 'Entity: Bangalore' },
            style: { background: '#0F172A', color: '#94A3B8', border: '1px solid #334155', borderRadius: '8px', padding: '8px', fontSize: '11px' },
          },
          {
            id: 'entity_hyderabad',
            position: { x: 420, y: 320 },
            data: { label: 'Entity: Hyderabad' },
            style: { background: '#0F172A', color: '#94A3B8', border: '1px solid #334155', borderRadius: '8px', padding: '8px', fontSize: '11px' },
          },
        ];

        const demoEdges: Edge[] = [
          { id: 'e1', source: 'user_1', target: 'fact_s4', label: 'HAS_MEMORY', style: { stroke: '#6366F1' } },
          { id: 'e2', source: 'user_1', target: 'fact_s19', label: 'HAS_MEMORY', style: { stroke: '#6366F1' } },
          {
            id: 'e3',
            source: 'fact_s19',
            target: 'fact_s4',
            label: 'SUPERSEDES',
            animated: true,
            style: { stroke: '#F59E0B', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#F59E0B' },
          },
          { id: 'e4', source: 'fact_s4', target: 'entity_bangalore', label: 'ABOUT', style: { stroke: '#475569' } },
          { id: 'e5', source: 'fact_s19', target: 'entity_hyderabad', label: 'ABOUT', style: { stroke: '#475569' } },
        ];

        setNodes(demoNodes);
        setEdges(demoEdges);
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
                  <div>
                    <span className="text-slate-500">Subject:</span>{' '}
                    <span className="text-slate-200">{(selectedNode.data.details as any).subject}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Predicate:</span>{' '}
                    <span className="text-palimn-cyan">{(selectedNode.data.details as any).predicate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Object:</span>{' '}
                    <span className="text-slate-100 font-semibold">{(selectedNode.data.details as any).object}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Origin:</span>{' '}
                    <span className="text-slate-300">{(selectedNode.data.details as any).session}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Status:</span>{' '}
                    <span className="text-amber-400">{(selectedNode.data.details as any).status}</span>
                  </div>
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
