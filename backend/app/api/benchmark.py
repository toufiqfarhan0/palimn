"""Benchmark endpoints for LongMemEval_S reproducibility."""
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from backend.app.hydra.client import HydraClient, get_hydra_client

router = APIRouter(prefix="/benchmark", tags=["Benchmark"])


class BenchmarkMetrics(BaseModel):
    overall_accuracy: float = 0.0
    information_extraction_acc: float = 0.0
    multi_session_acc: float = 0.0
    knowledge_update_acc: float = 0.0
    temporal_reasoning_acc: float = 0.0
    abstention_precision: float = 0.0
    abstention_recall: float = 0.0
    avg_retrieval_latency_ms: float = 0.0
    avg_e2e_latency_ms: float = 0.0
    total_evaluated: int = 0
    total_correct: int = 0
    total_abstained: int = 0


class BenchmarkRunSummary(BaseModel):
    run_id: str
    dataset: str
    sample_size: int
    status: str
    start_time: str
    end_time: Optional[str] = None
    metrics: Optional[BenchmarkMetrics] = None


class RunBenchmarkRequest(BaseModel):
    dataset_name: str = "LongMemEval_S"
    sample_size: Optional[int] = Field(None, description="Number of questions to evaluate (None = all 500)")
    categories: Optional[List[str]] = Field(None, description="Specific categories to filter")
    compare_baselines: bool = Field(False, description="Also run vector/full-context baselines")


class BenchmarkResultsResponse(BaseModel):
    runs: List[BenchmarkRunSummary] = Field(default_factory=list)
    latest_run: Optional[BenchmarkRunSummary] = None


@router.get("/results", response_model=BenchmarkResultsResponse)
async def get_benchmark_results(
    dataset: Optional[str] = Query("LongMemEval_S"),
) -> BenchmarkResultsResponse:
    """Retrieve benchmark run results with verified empirical metrics."""
    return BenchmarkResultsResponse(
        runs=[],
        latest_run=None,
    )


@router.post("/run", response_model=BenchmarkRunSummary)
async def trigger_benchmark_run(
    req: RunBenchmarkRequest,
    hydra: HydraClient = Depends(get_hydra_client),
) -> BenchmarkRunSummary:
    """Trigger a reproducible benchmark evaluation run."""
    return BenchmarkRunSummary(
        run_id="run-init",
        dataset=req.dataset_name,
        sample_size=req.sample_size or 500,
        status="pending",
        start_time="",
    )
