"""CLI Script to safely reset the PALIMN HydraDB database."""
import asyncio
import logging
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.hydra.client import get_hydra_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("palimn.scripts.reset")


async def main():
    hydra = get_hydra_client()
    logger.info("Resetting database: %s", hydra.database)
    try:
        await hydra.reset_database()
        logger.info("Database reset successful.")
    except Exception as exc:
        logger.error("Failed to reset database: %s", exc)


if __name__ == "__main__":
    asyncio.run(main())
