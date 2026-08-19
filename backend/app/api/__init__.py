"""API routes package for PALIMN."""
from backend.app.api.health import router as health_router
from backend.app.api.chat import router as chat_router
from backend.app.api.memory import router as memory_router
from backend.app.api.graph import router as graph_router
from backend.app.api.benchmark import router as benchmark_router

__all__ = [
    "health_router",
    "chat_router",
    "memory_router",
    "graph_router",
    "benchmark_router",
]
