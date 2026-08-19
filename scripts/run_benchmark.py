"""CLI Script to trigger and export benchmark runs."""
import asyncio
import logging
from benchmark.runner import BenchmarkRunner

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("palimn.scripts.benchmark")


async def main():
    runner = BenchmarkRunner()
    results = await runner.run_evaluation(sample_size=10)
    logger.info("Evaluation results: %s", results)


if __name__ == "__main__":
    asyncio.run(main())
