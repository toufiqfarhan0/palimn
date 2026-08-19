"""CLI Script to ingest LongMemEval dataset sessions into PALIMN HydraDB."""
import asyncio
import logging
from backend.app.hydra.client import get_hydra_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("palimn.scripts.ingest")


async def main():
    hydra = get_hydra_client()
    health = await hydra.health_check()
    logger.info("HydraDB status: %s", health)
    if not hydra.is_configured:
        logger.warning("Please configure HYDRA_DB_BASE_URL and HYDRA_DB_API_KEY in .env")
        return
    logger.info("Ingestion ready.")


if __name__ == "__main__":
    asyncio.run(main())
