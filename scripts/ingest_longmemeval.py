"""CLI Script to safely and faithfully ingest LongMemEval_S records into HydraDB."""
import argparse
import asyncio
import logging
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.benchmark.longmemeval_loader import LongMemEvalLoader
from backend.app.hydra.client import get_hydra_client

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("palimn.scripts.ingest")


async def main():
    parser = argparse.ArgumentParser(description="Ingest LongMemEval_S records into PALIMN HydraDB Cloud.")
    parser.add_argument(
        "--question-id",
        type=str,
        default=None,
        help="Specific question_id to ingest (e.g. 'e47becba')",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=1,
        help="Maximum number of records to ingest (default: 1 for safe controlled execution)",
    )
    parser.add_argument(
        "--dataset-path",
        type=str,
        default=None,
        help="Optional path to longmemeval_s_cleaned.json",
    )
    args = parser.parse_args()

    hydra = get_hydra_client()
    loader = LongMemEvalLoader(dataset_path=args.dataset_path)

    # 1. Select record(s)
    if args.question_id:
        record = loader.get_record_by_id(args.question_id)
        if not record:
            logger.error("Question ID '%s' not found in dataset.", args.question_id)
            sys.exit(1)
        records_to_ingest = [record]
    else:
        # Default safe behavior: ingest exactly ONE record (or up to limit)
        records_to_ingest = loader.load_records(limit=args.limit)

    print("\n==================================================")
    print("PALIMN LongMemEval_S Ingestion")
    print("==================================================")
    print(f"Database:        {hydra.database}")
    print(f"Records to load: {len(records_to_ingest)}\n")

    for idx, rec in enumerate(records_to_ingest, 1):
        print(f"[{idx}/{len(records_to_ingest)}] Ingesting Record: {rec.question_id}")
        print(f"  Question Type:    {rec.question_type}")
        print(f"  Question Date:    {rec.question_date}")
        print(f"  Total Sessions:   {len(rec.sessions)}")
        
        # Execute ingestion via HydraClient
        result = await hydra.ingest_longmemeval_record(rec)

        print(f"  Question ID:      {result['question_id']}")
        print(f"  Number of sessions: {result['sessions_ingested']}")
        print(f"  Number of messages: {result['messages_ingested']}")
        print(f"  Earliest session: {result['earliest_session']}")
        print(f"  Latest session:   {result['latest_session']}")
        print(f"  Total messages:   {result['messages_ingested']}")
        print(f"  HydraDB write status: {result['status'].upper()}\n")

    print(">> Ingestion finished successfully.")


if __name__ == "__main__":
    asyncio.run(main())
