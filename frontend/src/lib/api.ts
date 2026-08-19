/**
 * PALIMN API Client and TypeScript Definitions
 */

export interface HydraHealthStatus {
  connected: boolean;
  status: string;
  reason?: string | null;
  latency_ms?: number | null;
  database: string;
  mode: string;
  base_url?: string | null;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  environment: string;
  hydradb: HydraHealthStatus;
}

export type MemoryStatus = 'active' | 'historical' | 'superseded' | 'contradicted' | 'uncertain';
export type DecisionType = 'answerable' | 'abstain';

export interface EvidenceItem {
  memory_id: string;
  subject: string;
  predicate: string;
  object: string;
  session_id: string;
  message_id: string;
  status: MemoryStatus;
  confidence: number;
  valid_from?: string | null;
  valid_until?: string | null;
  relevance_score: number;
  provenance_text?: string | null;
}

export interface ChatQueryRequest {
  question: string;
  user_id?: string;
  session_id?: string;
  time_context?: string;
}

export interface ChatQueryResponse {
  question: string;
  decision: DecisionType;
  reason?: string | null;
  answer?: string | null;
  confidence: number;
  evidence: EvidenceItem[];
  temporal_reasoning?: string | null;
  latency_ms: number;
}

export interface GraphNode {
  id: string;
  label: string;
  name: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_nodes: number;
  total_edges: number;
}

export interface BenchmarkMetrics {
  overall_accuracy: number;
  information_extraction_acc: number;
  multi_session_acc: number;
  knowledge_update_acc: number;
  temporal_reasoning_acc: number;
  abstention_precision: number;
  abstention_recall: number;
  avg_retrieval_latency_ms: number;
  avg_e2e_latency_ms: number;
  total_evaluated: number;
  total_correct: number;
  total_abstained: number;
}

export interface BenchmarkRunSummary {
  run_id: string;
  dataset: string;
  sample_size: number;
  status: string;
  start_time: string;
  end_time?: string | null;
  metrics?: BenchmarkMetrics | null;
}

export interface BenchmarkResultsResponse {
  runs: BenchmarkRunSummary[];
  latest_run?: BenchmarkRunSummary | null;
}

const API_BASE = '/api';

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Failed to fetch health: ${res.statusText}`);
  }
  return res.json();
}

export async function sendChatQuery(req: ChatQueryRequest): Promise<ChatQueryResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    throw new Error(`Chat query failed: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchGraphData(limit: number = 100): Promise<GraphResponse> {
  const res = await fetch(`${API_BASE}/graph?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch graph: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchBenchmarkResults(): Promise<BenchmarkResultsResponse> {
  const res = await fetch(`${API_BASE}/benchmark/results`);
  if (!res.ok) {
    throw new Error(`Failed to fetch benchmark: ${res.statusText}`);
  }
  return res.json();
}
