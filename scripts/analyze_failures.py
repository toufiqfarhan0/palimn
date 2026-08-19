"""Failure analysis script for detailed review of benchmark errors and successes."""
import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Any, Dict, List

logging.basicConfig(level=logging.INFO, format="%(message)s")


def analyze_report(report_path: str):
    path = Path(report_path)
    if not path.is_file():
        print(f"Error: Report file not found: {report_path}")
        sys.exit(1)

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    questions = data.get("questions", [])
    metrics = data.get("metrics", {})
    by_type = data.get("by_question_type", {})
    failure_cats = data.get("failure_categories", {})

    print("==================================================")
    print(f"FAILURE ANALYSIS FOR: {report_path}")
    print(f"Total Questions: {len(questions)} | Exact Matches: {metrics.get('exact_match_count')} ({metrics.get('exact_match_accuracy', 0)*100:.2f}%)")
    print("==================================================")

    print("\n--------------------------------------------------")
    print("1. FAILURE CATEGORIES BREAKDOWN")
    print("--------------------------------------------------")
    for cat, count in failure_cats.items():
        pct = (count / len(questions)) * 100 if questions else 0
        print(f"  - {cat:22s}: {count:3d} ({pct:5.2f}%)")

    # Filter Successes and Failures
    successes = [q for q in questions if q.get("exact_match")]
    failures = [q for q in questions if not q.get("exact_match")]

    print("\n--------------------------------------------------")
    print(f"2. SUCCESSFUL EXAMPLES (Showing up to 10 of {len(successes)})")
    print("--------------------------------------------------")
    for idx, s in enumerate(successes[:10], 1):
        print(f"[Success {idx}] Question ID: {s['question_id']} ({s.get('question_type')})")
        print(f"  Question:   \"{s['question']}\"")
        print(f"  Prediction: \"{s['prediction']}\"")
        print(f"  Gold Target:\"{s['expected_answer']}\"")
        print(f"  Evidence:   {s.get('retrieved_session_ids')}")
        print(f"  Confidence: {s.get('confidence')}\n")

    print("\n--------------------------------------------------")
    print(f"3. FAILURE EXAMPLES (Showing up to 10 of {len(failures)})")
    print("--------------------------------------------------")
    for idx, fl in enumerate(failures[:10], 1):
        print(f"[Failure {idx}] Question ID: {fl['question_id']} ({fl.get('question_type')})")
        print(f"  Question:     \"{fl['question']}\"")
        print(f"  Gold Target:  \"{fl['expected_answer']}\"")
        print(f"  System Pred:  \"{fl['prediction']}\" (Decision: {fl['decision']})")
        print(f"  Failure Cat:  {fl.get('failure_category')}")
        print(f"  Recall@5:     {fl.get('top_5_recall')} | Recall@20: {fl.get('top_20_recall')}")
        print(f"  Retrieved:    {fl.get('retrieved_session_ids')}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Analyze benchmark failures.")
    parser.add_argument(
        "--report",
        type=str,
        default="results/longmemeval_100.json",
        help="Path to benchmark JSON report file.",
    )
    args = parser.parse_args()
    analyze_report(args.report)
