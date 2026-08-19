"""Top-level benchmark evaluator bridging backend and CLI."""
import asyncio
from typing import Optional
from backend.app.benchmark.evaluator import LongMemEvalEvaluator
from backend.app.benchmark.models import EvaluationResult, LongMemEvalRecord
from backend.app.hydra.client import HydraClient, get_hydra_client


class BenchmarkEvaluator:
    """Benchmark runner interface for evaluating LongMemEval records."""

    def __init__(self, hydra_client: Optional[HydraClient] = None):
        self.hydra = hydra_client or get_hydra_client()
        self.engine = LongMemEvalEvaluator(self.hydra)

    async def evaluate_single_record(self, record: LongMemEvalRecord) -> EvaluationResult:
        """Evaluate a single record against the temporal memory graph."""
        return await self.engine.evaluate_record(record)
