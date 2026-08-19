"""Phase 13 Controlled Experiment Runner for HydraDB Cloud Query Optimization.

Isolates and evaluates:
- Baseline (default query parameters: graph_context=True, max_results=20)
- Experiment A: mode="fast"
- Experiment B: num_related_chunks=0
- Experiment C: max_results=10
- Experiment D: Best Combination

Evaluates deterministically on the first 100 LongMemEval_S questions against live HydraDB Cloud.
"""
import asyncio
import json
import logging
import math
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

# Add root directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.benchmark.evaluator import LongMemEvalEvaluator
from backend.app.benchmark.longmemeval_loader import LongMemEvalLoader
from backend.app.benchmark.models import LongMemEvalRecord
from backend.app.core.config import settings
from backend.app.hydra.client import HydraClient

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("palimn.phase13_experiments")


def calculate_percentile(values: List[float], percentile: float) -> float:
    """Calculate percentile from a list of floats."""
    if not values:
        return 0.0
    sorted_vals = sorted(values)
    k = (len(sorted_vals) - 1) * (percentile / 100.0)
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return round(sorted_vals[int(k)], 2)
    d0 = sorted_vals[int(f)] * (c - k)
    d1 = sorted_vals[int(c)] * (k - f)
    return round(d0 + d1, 2)


async def run_single_experiment(
    name: str,
    records: List[LongMemEvalRecord],
    client: HydraClient,
    query_kwargs: Dict[str, Any],
) -> Dict[str, Any]:
    """Execute a single experiment across the dataset sample."""
    logger.info("============================================================")
    logger.info("STARTING EXPERIMENT: %s", name)
    logger.info("Parameters: %s", query_kwargs)
    logger.info("Sample size: %d questions", len(records))
    logger.info("============================================================")

    evaluator = LongMemEvalEvaluator(client)
    
    exact_matches = 0
    top1_recalls = 0
    top5_recalls = 0
    top10_recalls = 0
    top20_recalls = 0
    
    total_latencies: List[float] = []
    hydra_latencies: List[float] = []
    payload_sizes: List[int] = []
    
    target_max_res = query_kwargs.get("max_results", 20)
    start_all = time.perf_counter()

    for idx, record in enumerate(records):
        # Evaluate record end-to-end
        eval_res = await evaluator.evaluate_record(record, **query_kwargs)

        hydra_lat = eval_res.retrieval_latency_ms
        total_lat = eval_res.total_latency_ms
        
        hydra_latencies.append(hydra_lat)
        total_latencies.append(total_lat)

        if eval_res.exact_match:
            exact_matches += 1
        if eval_res.top_1_recall:
            top1_recalls += 1
        if eval_res.top_5_recall:
            top5_recalls += 1
        if eval_res.top_10_recall:
            top10_recalls += 1
        if eval_res.top_20_recall:
            top20_recalls += 1

        if (idx + 1) % 25 == 0 or (idx + 1) == len(records):
            logger.info(
                "[%s] Progress: %d/%d (%.1f%%) | EM: %d (%.2f%%) | R@5: %d (%.2f%%) | Last Hydra Lat: %.1f ms",
                name,
                idx + 1,
                len(records),
                ((idx + 1) / len(records)) * 100,
                exact_matches,
                (exact_matches / (idx + 1)) * 100,
                top5_recalls,
                (top5_recalls / (idx + 1)) * 100,
                hydra_lat,
            )

    # Inspect payload size for a test query using exact query params
    test_intent = evaluator.analyzer.analyze("What degree did I graduate with?", user_id="user_e47becba")
    test_q_kwargs = dict(query_kwargs)
    test_q_kwargs.setdefault("max_results", 20)
    
    raw_query_dict = {
        "database": client.cloud_store.database,
        "query": "What degree did I graduate with?",
        "type": "memory",
        "max_results": test_q_kwargs.get("max_results", 20),
        "graph_context": test_q_kwargs.get("graph_context", True),
    }
    if "mode" in test_q_kwargs:
        raw_query_dict["mode"] = test_q_kwargs["mode"]
    if "num_related_chunks" in test_q_kwargs:
        raw_query_dict["num_related_chunks"] = test_q_kwargs["num_related_chunks"]

    try:
        sample_res = await client.cloud_store.client.query(**raw_query_dict)
        if sample_res.success and sample_res.data:
            chunks = sample_res.data.chunks or []
            sample_payload_bytes = sum(len(str(c.chunk_content or "")) + len(str(c.metadata or "")) for c in chunks)
            sample_chunks_count = len(chunks)
        else:
            sample_payload_bytes = 0
            sample_chunks_count = 0
    except Exception as exc:
        logger.warning("Error measuring sample payload: %s", exc)
        sample_payload_bytes = 0
        sample_chunks_count = 0

    duration_all = round((time.perf_counter() - start_all), 2)
    n = len(records)

    results = {
        "name": name,
        "sample_size": n,
        "duration_s": duration_all,
        "query_kwargs": query_kwargs,
        "metrics": {
            "exact_match_count": exact_matches,
            "exact_match_pct": round((exact_matches / n) * 100, 2),
            "recall_1_pct": round((top1_recalls / n) * 100, 2),
            "recall_5_pct": round((top5_recalls / n) * 100, 2),
            "recall_10_pct": round((top10_recalls / n) * 100, 2),
            "recall_20_pct": round((top20_recalls / n) * 100, 2) if target_max_res >= 20 else "N/A (max_results < 20)",
        },
        "hydra_latency_ms": {
            "mean": round(sum(hydra_latencies) / n, 2),
            "p50": calculate_percentile(hydra_latencies, 50),
            "p95": calculate_percentile(hydra_latencies, 95),
            "min": round(min(hydra_latencies), 2),
            "max": round(max(hydra_latencies), 2),
        },
        "total_latency_ms": {
            "mean": round(sum(total_latencies) / n, 2),
            "p50": calculate_percentile(total_latencies, 50),
            "p95": calculate_percentile(total_latencies, 95),
            "min": round(min(total_latencies), 2),
            "max": round(max(total_latencies), 2),
        },
        "payload": {
            "sample_chunks_count": sample_chunks_count,
            "sample_payload_bytes": sample_payload_bytes,
        },
    }

    logger.info("============================================================")
    logger.info("EXPERIMENT %s FINISHED in %.2f s", name, duration_all)
    logger.info(
        "Summary: EM=%.2f%%, R@1=%.2f%%, R@5=%.2f%%, R@10=%.2f%%, R@20=%s, HydraMean=%.2fms, TotalMean=%.2fms",
        results["metrics"]["exact_match_pct"],
        results["metrics"]["recall_1_pct"],
        results["metrics"]["recall_5_pct"],
        results["metrics"]["recall_10_pct"],
        str(results["metrics"]["recall_20_pct"]),
        results["hydra_latency_ms"]["mean"],
        results["total_latency_ms"]["mean"],
    )
    logger.info("============================================================")

    return results


async def main():
    logger.info("Initializing HydraDB Client in CLOUD mode...")
    client = HydraClient(mode="cloud", database="palimn-memory")

    health = await client.health_check()
    logger.info("HydraDB Health Status: %s", health)
    if not health.get("connected") and not health.get("hydra_connected"):
        logger.error("HydraDB Cloud is not connected! Aborting.")
        sys.exit(1)

    loader = LongMemEvalLoader()
    all_records = loader.load_all_records()
    sample_records = all_records[:100]  # Deterministic 100 sample
    logger.info("Loaded %d total records. Selected %d deterministic sample records.", len(all_records), len(sample_records))

    all_experiments: Dict[str, Any] = {}

    # 1. BASELINE
    baseline_res = await run_single_experiment(
        name="BASELINE",
        records=sample_records,
        client=client,
        query_kwargs={"graph_context": True, "max_results": 20},
    )
    all_experiments["BASELINE"] = baseline_res

    # 2. EXPERIMENT A (mode="fast")
    exp_a_res = await run_single_experiment(
        name="EXPERIMENT A (mode=fast)",
        records=sample_records,
        client=client,
        query_kwargs={"mode": "fast", "graph_context": True, "max_results": 20},
    )
    all_experiments["EXPERIMENT_A"] = exp_a_res

    # 3. EXPERIMENT B (num_related_chunks=0)
    exp_b_res = await run_single_experiment(
        name="EXPERIMENT B (num_related_chunks=0)",
        records=sample_records,
        client=client,
        query_kwargs={"num_related_chunks": 0, "graph_context": True, "max_results": 20},
    )
    all_experiments["EXPERIMENT_B"] = exp_b_res

    # 4. EXPERIMENT C (max_results=10)
    exp_c_res = await run_single_experiment(
        name="EXPERIMENT C (max_results=10)",
        records=sample_records,
        client=client,
        query_kwargs={"max_results": 10, "graph_context": True},
    )
    all_experiments["EXPERIMENT_C"] = exp_c_res

    # 5. EXPERIMENT D (COMBINED: mode="fast" + num_related_chunks=0 + max_results=10)
    exp_d_res = await run_single_experiment(
        name="EXPERIMENT D (COMBINED BEST)",
        records=sample_records,
        client=client,
        query_kwargs={"mode": "fast", "num_related_chunks": 0, "max_results": 10, "graph_context": True},
    )
    all_experiments["EXPERIMENT_D"] = exp_d_res

    # Save complete experiment results to json
    output_path = Path("benchmark_phase13_experiments.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_experiments, f, indent=2)
    logger.info("Saved all experiment results to %s", output_path.resolve())


if __name__ == "__main__":
    asyncio.run(main())
