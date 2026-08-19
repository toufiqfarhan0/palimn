"""Script to evaluate exactly ONE LongMemEval_S question with strict oracle isolation."""
import argparse
import asyncio
import json
import logging
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.benchmark.longmemeval_loader import LongMemEvalLoader
from backend.app.benchmark.evaluator import LongMemEvalEvaluator
from backend.app.hydra.client import get_hydra_client

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("palimn.scripts.eval_one")


async def main():
    parser = argparse.ArgumentParser(description="Run single-record LongMemEval_S evaluation.")
    parser.add_argument(
        "--question-id",
        type=str,
        default=None,
        help="Specific question_id to evaluate (e.g. 'e47becba')",
    )
    args = parser.parse_args()

    hydra = get_hydra_client()
    loader = LongMemEvalLoader()

    # 1. Select record
    if args.question_id:
        record = loader.get_record_by_id(args.question_id)
        if not record:
            logger.error("Question ID '%s' not found.", args.question_id)
            sys.exit(1)
    else:
        record = loader.get_sample_record(0)

    # 2. Ingest into graph
    print("\n==================================================")
    print(f"1. Ingesting Record: {record.question_id}")
    print("==================================================")
    ingest_res = await hydra.ingest_longmemeval_record(record)
    print(f"Ingested {ingest_res['sessions_ingested']} sessions ({ingest_res['messages_ingested']} messages)")
    print(f"Date range: {ingest_res['earliest_session']} -> {ingest_res['latest_session']}")

    # 3. Evaluate query (Strict oracle isolation)
    print("\n==================================================")
    print("2. Running Retrieval Query (No Oracle Knowledge)")
    print("==================================================")
    evaluator = LongMemEvalEvaluator(hydra)
    eval_result = await evaluator.evaluate_record(record)

    print(json.dumps(eval_result.model_dump(), indent=2))
    print("\n>> Single Question Evaluation Complete.")


if __name__ == "__main__":
    asyncio.run(main())
