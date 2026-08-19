"""CLI Script to trigger and export controlled LongMemEval_S benchmark evaluations."""
import argparse
import asyncio
import json
import logging
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.benchmark.runner import BenchmarkRunner

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("palimn.scripts.benchmark")


async def main():
    parser = argparse.ArgumentParser(description="Run controlled LongMemEval_S evaluation.")
    parser.add_argument(
        "--limit",
        type=int,
        default=10,
        help="Number of LongMemEval_S questions to evaluate (1, 10, 25, 50, 100).",
    )
    parser.add_argument(
        "--question-id",
        type=str,
        default=None,
        help="Specific question_id to evaluate (e.g. 'e47becba')",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Path to export machine-readable JSON results (e.g. 'results/longmemeval_10.json')",
    )
    parser.add_argument(
        "--dataset-path",
        type=str,
        default=None,
        help="Optional path to longmemeval_s_cleaned.json",
    )
    args = parser.parse_args()

    runner = BenchmarkRunner(dataset_path=args.dataset_path)
    
    print("\n==================================================")
    print(f"PALIMN LONGMEMEVAL_S BENCHMARK EVALUATION (Limit: {args.limit})")
    print("==================================================")

    report = await runner.run_benchmark(
        limit=args.limit,
        question_id=args.question_id,
        output_path=args.output,
    )

    m = report.metrics
    print("\n==================================================")
    print("AGGREGATE BENCHMARK METRICS")
    print("==================================================")
    print(f"Total Questions Evaluated:  {m.total_questions}")
    print(f"Exact Match Count:          {m.exact_match_count} / {m.total_questions} ({m.exact_match_accuracy * 100:.2f}%)")
    print(f"Answerable vs Abstain:      {m.answerable_count} Answerable / {m.abstention_count} Abstain")
    print(f"Confusion Matrix:")
    print(f"  - True Positives (Answered):   {m.true_positives}")
    print(f"  - False Abstentions:           {m.false_abstentions} ({m.false_abstention_rate * 100:.2f}%)")
    print(f"  - Correct Abstentions:         {m.correct_abstentions} ({m.abstention_accuracy * 100:.2f}%)")
    print(f"  - False Answers:               {m.false_answers} ({m.false_answer_rate * 100:.2f}%)")
    print(f"Retrieval Recall:")
    print(f"  - Recall@1:                    {m.recall_at_1 * 100:.2f}%")
    print(f"  - Recall@5:                    {m.recall_at_5 * 100:.2f}%")
    print(f"  - Recall@10:                   {m.recall_at_10 * 100:.2f}%")
    print(f"  - Recall@20:                   {m.recall_at_20 * 100:.2f}%")
    print(f"Latency Statistics (ms):")
    print(f"  - Mean / Average:              {m.avg_latency_ms:.2f} ms")
    print(f"  - Median (p50):                {m.p50_latency_ms:.2f} ms")
    print(f"  - p95:                         {m.p95_latency_ms:.2f} ms")
    print(f"  - Maximum:                     {m.max_latency_ms:.2f} ms\n")

    print("==================================================")
    print("QUESTION TYPE BREAKDOWN")
    print("==================================================")
    for qtype, stats in report.by_question_type.items():
        print(f"[{qtype}] (Count: {stats['count']})")
        print(f"  - Exact Match Accuracy:        {stats['exact_match_accuracy'] * 100:.2f}%")
        print(f"  - Retrieval Recall@5:          {stats['recall_at_5'] * 100:.2f}%")
        print(f"  - Answerable / Abstain:        {stats['answerable_count']} / {stats['abstention_count']}")
        print(f"  - Avg Latency:                 {stats['avg_latency_ms']:.2f} ms")

    print("\n==================================================")
    print("FAILURE CATEGORIES BREAKDOWN")
    print("==================================================")
    for cat, cnt in report.failure_categories.items():
        print(f"  - {cat}: {cnt}")

    print("\n==================================================")
    print("DATABASE GROWTH SNAPSHOT")
    print("==================================================")
    for k, v in report.database_growth.items():
        print(f"  - {k}: {v}")

    if args.output:
        print(f"\n>> Machine-readable report saved to {args.output}")


if __name__ == "__main__":
    asyncio.run(main())
