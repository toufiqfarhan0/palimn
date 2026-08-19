"""Benchmark runner for executing controlled LongMemEval_S evaluations."""
import asyncio
import json
import logging
import statistics
from pathlib import Path
from typing import Any, Dict, List, Optional
from backend.app.benchmark.evaluator import LongMemEvalEvaluator
from backend.app.benchmark.longmemeval_loader import LongMemEvalLoader
from backend.app.benchmark.models import (
    BenchmarkAggregateMetrics,
    BenchmarkRunReport,
    EvaluationResult,
    LongMemEvalRecord,
)
from backend.app.hydra.client import HydraClient, get_hydra_client

logger = logging.getLogger("palimn.benchmark.runner")


class BenchmarkRunner:
    """Orchestrates controlled LongMemEval_S benchmark evaluations with memory isolation."""

    def __init__(self, hydra_client: Optional[HydraClient] = None, dataset_path: Optional[str] = None):
        self.hydra = hydra_client or get_hydra_client()
        self.loader = LongMemEvalLoader(dataset_path=dataset_path)
        self.evaluator = LongMemEvalEvaluator(self.hydra)

    async def run_benchmark(
        self,
        limit: int = 10,
        question_id: Optional[str] = None,
        output_path: Optional[str] = None,
    ) -> BenchmarkRunReport:
        """Run controlled benchmark across selected records."""
        # 1. Select records
        if question_id:
            rec = self.loader.get_record_by_id(question_id)
            if not rec:
                raise ValueError(f"Question ID '{question_id}' not found.")
            records = [rec]
        else:
            records = self.loader.load_records(limit=limit)

        logger.info("Executing benchmark on %d records...", len(records))
        results: List[EvaluationResult] = []

        # 2. Ingest and Evaluate each record in its own isolated namespace
        for idx, rec in enumerate(records, 1):
            # Ingest record (idempotent)
            await self.hydra.ingest_longmemeval_record(rec)
            # Evaluate (strict oracle isolation)
            eval_res = await self.evaluator.evaluate_record(rec)
            results.append(eval_res)

        # 3. Calculate Aggregate Metrics
        total = len(results)
        exact_matches = sum(1 for r in results if r.exact_match)
        answerable_cnt = sum(1 for r in results if r.decision == "answerable")
        abstain_cnt = sum(1 for r in results if r.decision == "abstain")

        # Confusion Matrix
        # TP: Gold answer exists & answered correctly or predicted
        tp = sum(1 for r in results if not r.is_abstention and r.decision == "answerable")
        # False Abstain: Gold answer exists & system abstained
        fa = sum(1 for r in results if not r.is_abstention and r.decision == "abstain")
        # False Answer: Gold answer absent & system answered
        false_ans = sum(1 for r in results if r.is_abstention and r.decision == "answerable")
        # Correct Abstain: Gold answer absent & system abstained
        ca = sum(1 for r in results if r.is_abstention and r.decision == "abstain")

        total_with_ans = sum(1 for r in results if not r.is_abstention)
        total_no_ans = sum(1 for r in results if r.is_abstention)

        fa_rate = round(fa / total_with_ans, 4) if total_with_ans > 0 else 0.0
        false_ans_rate = round(false_ans / total_no_ans, 4) if total_no_ans > 0 else 0.0
        abstain_acc = round(ca / total_no_ans, 4) if total_no_ans > 0 else 1.0

        recall_1 = round(sum(1 for r in results if r.top_1_recall) / total, 4) if total else 0.0
        recall_5 = round(sum(1 for r in results if r.top_5_recall) / total, 4) if total else 0.0
        recall_10 = round(sum(1 for r in results if r.top_10_recall) / total, 4) if total else 0.0
        recall_20 = round(sum(1 for r in results if r.top_20_recall) / total, 4) if total else 0.0

        latencies = [r.total_latency_ms for r in results]
        avg_lat = round(statistics.mean(latencies), 2) if latencies else 0.0
        p50_lat = round(statistics.median(latencies), 2) if latencies else 0.0
        p95_lat = round(
            float(statistics.quantiles(latencies, n=20)[18]) if len(latencies) >= 20 else max(latencies),
            2
        ) if latencies else 0.0
        max_lat = round(max(latencies), 2) if latencies else 0.0

        metrics = BenchmarkAggregateMetrics(
            total_questions=total,
            exact_match_count=exact_matches,
            exact_match_accuracy=round(exact_matches / total, 4) if total else 0.0,
            answerable_count=answerable_cnt,
            abstention_count=abstain_cnt,
            true_positives=tp,
            false_abstentions=fa,
            false_answers=false_ans,
            correct_abstentions=ca,
            false_abstention_rate=fa_rate,
            false_answer_rate=false_ans_rate,
            abstention_accuracy=abstain_acc,
            recall_at_1=recall_1,
            recall_at_5=recall_5,
            recall_at_10=recall_10,
            recall_at_20=recall_20,
            avg_latency_ms=avg_lat,
            p50_latency_ms=p50_lat,
            p95_latency_ms=p95_lat,
            max_latency_ms=max_lat,
        )

        # 4. Breakdown by question_type
        by_type: Dict[str, Dict[str, Any]] = {}
        for r in results:
            qtype = r.question_type
            if qtype not in by_type:
                by_type[qtype] = {
                    "count": 0,
                    "exact_matches": 0,
                    "answerable": 0,
                    "abstain": 0,
                    "recall_at_5": 0,
                    "latencies": [],
                }
            by_type[qtype]["count"] += 1
            if r.exact_match:
                by_type[qtype]["exact_matches"] += 1
            if r.decision == "answerable":
                by_type[qtype]["answerable"] += 1
            else:
                by_type[qtype]["abstain"] += 1
            if r.top_5_recall:
                by_type[qtype]["recall_at_5"] += 1
            by_type[qtype]["latencies"].append(r.total_latency_ms)

        # Format summary for each question type
        by_type_summary: Dict[str, Dict[str, Any]] = {}
        for qtype, d in by_type.items():
            cnt = d["count"]
            by_type_summary[qtype] = {
                "count": cnt,
                "exact_match_accuracy": round(d["exact_matches"] / cnt, 4),
                "answerable_count": d["answerable"],
                "abstention_count": d["abstain"],
                "recall_at_5": round(d["recall_at_5"] / cnt, 4),
                "avg_latency_ms": round(statistics.mean(d["latencies"]), 2),
            }

        # 5. Breakdown by failure_categories
        failure_cats: Dict[str, int] = {}
        for r in results:
            if not r.exact_match and r.failure_category:
                failure_cats[r.failure_category] = failure_cats.get(r.failure_category, 0) + 1

        # 6. Database growth snapshot
        db_snapshot = self.hydra.get_graph_snapshot()
        node_counts: Dict[str, int] = {}
        for n in db_snapshot.nodes:
            node_counts[n.label] = node_counts.get(n.label, 0) + 1

        db_growth = {
            "users": node_counts.get("User", 0),
            "sessions": node_counts.get("Session", 0),
            "messages": node_counts.get("Message", 0),
            "entities": node_counts.get("Entity", 0),
            "facts": node_counts.get("Fact", 0),
            "relationships": db_snapshot.total_edges,
            "total_nodes": db_snapshot.total_nodes,
        }

        report = BenchmarkRunReport(
            dataset="LongMemEval_S",
            limit=len(records),
            metrics=metrics,
            by_question_type=by_type_summary,
            failure_categories=failure_cats,
            database_growth=db_growth,
            questions=results,
        )

        # 7. Save JSON output if requested
        if output_path:
            p = Path(output_path)
            p.parent.mkdir(parents=True, exist_ok=True)
            with open(p, "w", encoding="utf-8") as f:
                json.dump(report.model_dump(), f, indent=2)
            logger.info("Saved benchmark report to %s", output_path)

        return report
