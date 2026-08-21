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
  exact_match_accuracy?: number;
  information_extraction_acc: number;
  multi_session_acc: number;
  single_session_acc?: number;
  knowledge_update_acc: number;
  temporal_reasoning_acc: number;
  abstention_precision: number;
  abstention_recall: number;
  false_answer_rate?: number;
  false_abstention_rate?: number;
  recall_at_1?: number;
  recall_at_5?: number;
  recall_at_10?: number;
  recall_at_20?: number;
  avg_retrieval_latency_ms: number;
  avg_e2e_latency_ms: number;
  p50_latency_ms?: number;
  p95_latency_ms?: number;
  total_evaluated: number;
  total_correct: number;
  total_abstained: number;
  total_answerable?: number;
}

export interface BenchmarkRunSummary {
  run_id: string;
  dataset: string;
  sample_size: number;
  status: string;
  start_time: string;
  end_time?: string | null;
  metrics?: BenchmarkMetrics | null;
  by_question_type?: Record<string, any>;
  failure_categories?: Record<string, number>;
  database_growth?: Record<string, number>;
}

export interface BenchmarkResultsResponse {
  runs: BenchmarkRunSummary[];
  latest_run?: BenchmarkRunSummary | null;
}

const API_BASE = (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '') + '/api';

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

export async function fetchBenchmarkResults(dataset: string = "LongMemEval_S"): Promise<BenchmarkResultsResponse> {
  const res = await fetch(`${API_BASE}/benchmark/results?dataset=${encodeURIComponent(dataset)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch benchmark: ${res.statusText}`);
  }
  return res.json();
}

/* ─── TRACK 3: ADVANCED EXTENSION TYPES & CLIENT CALLS ─────────────── */

export interface VectorRagResult {
  decision: string;
  hallucinated: boolean;
  retrieved_chunk: string;
  cosine_similarity: number;
  synthesized_answer: string;
  explanation: string;
  latency_ms: number;
}

export interface PalimnGraphResult {
  decision: string;
  abstention_reason?: string | null;
  confidence: number;
  verified_answer?: string | null;
  certificate_id: string;
  traversal_path: string[];
  proof_steps: string[];
  latency_ms: number;
}

export interface ArenaEvaluationResponse {
  query: string;
  scenario_type: string;
  vector_rag: VectorRagResult;
  palimn_hydra: PalimnGraphResult;
  verdict: string;
  total_latency_ms: number;
}

export async function evaluateArena(
  query: string,
  scenario_type: string = 'custom'
): Promise<ArenaEvaluationResponse> {
  const res = await fetch(`${API_BASE}/arena/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, scenario_type }),
  });
  if (!res.ok) {
    throw new Error(`Arena evaluation failed: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchArenaPresets(): Promise<Record<string, any>> {
  const res = await fetch(`${API_BASE}/arena/presets`);
  if (!res.ok) {
    throw new Error(`Failed to fetch arena presets: ${res.statusText}`);
  }
  return res.json();
}

export interface HopStep {
  step_number: number;
  session_id: string;
  session_date: string;
  from_node: string;
  relation: string;
  to_node: string;
  evidence: string;
  confidence: number;
}

export interface MultiHopWeaverResponse {
  query: string;
  source_entity: string;
  target_entity: string;
  hops_count: number;
  causal_chain: HopStep[];
  synthesized_answer: string;
  graph_nodes: Array<{ id: string; name: string; type: string; session?: string }>;
  graph_links: Array<{ source: string; target: string; label: string; session?: string }>;
  traversal_latency_ms: number;
}

export async function fetchMultiHopWeaver(
  query: string,
  source_entity: string = 'user'
): Promise<MultiHopWeaverResponse> {
  const res = await fetch(`${API_BASE}/memory/multi-hop-weaver`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, source_entity }),
  });
  if (!res.ok) {
    throw new Error(`Multi-hop weaver failed: ${res.statusText}`);
  }
  return res.json();
}

export interface CostTelemetryData {
  metric: string;
  full_context_115k: number;
  palimn_hydradb: number;
  savings_percentage: number;
  unit: string;
}

export interface CostTelemetryResponse {
  session_tokens_total: number;
  retrieved_subgraph_tokens: number;
  compression_ratio: string;
  cost_per_query_dollars: Record<string, number>;
  monthly_cost_10k_queries: Record<string, number>;
  avg_latency_ms: Record<string, number>;
  table: CostTelemetryData[];
}

export async function fetchCostTelemetry(): Promise<CostTelemetryResponse> {
  const res = await fetch(`${API_BASE}/memory/cost-telemetry`);
  if (!res.ok) {
    throw new Error(`Failed to fetch cost telemetry: ${res.statusText}`);
  }
  return res.json();
}

export interface DecayPoint {
  day: number;
  confidence: number;
  status: string;
}

export interface DecaySimulateResponse {
  category: string;
  half_life_days: number;
  decay_lambda: number;
  current_confidence: number;
  status: string;
  curve: DecayPoint[];
}

export async function fetchDecaySimulation(
  category: string = 'transient_state',
  days_elapsed: number = 7.0,
  initial_confidence: number = 0.98
): Promise<DecaySimulateResponse> {
  const res = await fetch(`${API_BASE}/memory/decay-simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, days_elapsed, initial_confidence }),
  });
  if (!res.ok) {
    throw new Error(`Decay simulation failed: ${res.statusText}`);
  }
  return res.json();
}

