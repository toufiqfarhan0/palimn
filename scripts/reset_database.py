"""CLI Script to safely reset the PALIMN HydraDB namespace."""
import asyncio
import logging
from backend.app.hydra.client import get_hydra_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("palimn.scripts.reset")


async def main():
    hydra = get_hydra_client()
    if not hydra.is_configured:
        logger.warning("HydraDB is not configured. Nothing to reset.")
        return
    logger.info("Resetting database: %s", hydra.database)
    # Execute node deletion within namespace
    query = "MATCH (n) DETACH DELETE n"
    try:
        await hydra.execute_query(query)
        logger.info("Namespace reset successful.")
    except Exception as exc:
        logger.error("Failed to reset database: %s", exc)


if __name__ == "__main__":
    asyncio.run(main())
