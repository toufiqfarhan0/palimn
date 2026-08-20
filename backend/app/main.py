"""PALIMN FastAPI Application Entrypoint.

Temporal Memory for AI Agents.
"""
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.api.health import router as health_router
from backend.app.api.chat import router as chat_router
from backend.app.api.memory import router as memory_router
from backend.app.api.graph import router as graph_router
from backend.app.api.benchmark import router as benchmark_router
from backend.app.hydra.client import get_hydra_client

# Configure structured logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s",
)
logger = logging.getLogger("palimn")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycles."""
    logger.info("Starting PALIMN Temporal Memory Engine v%s", settings.APP_VERSION)
    hydra = get_hydra_client()
    if hydra.is_configured:
        health = await hydra.health_check()
        logger.info("HydraDB Cloud status: %s", health.get("status"))
    else:
        logger.warning(
            "HydraDB Cloud credentials not configured. Set HYDRA_DB_BASE_URL and HYDRA_DB_API_KEY in .env"
        )
    yield
    logger.info("Shutting down PALIMN Temporal Memory Engine")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Temporal Memory Graph Engine for Cross-Session Agent Continuity",
    lifespan=lifespan,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception at %s: %s", request.url.path, str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal Server Error",
            "message": str(exc) if settings.DEBUG else "An unexpected error occurred.",
            "path": request.url.path,
        },
    )


# Register API Routers
app.include_router(health_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(memory_router, prefix="/api")
app.include_router(graph_router, prefix="/api")
app.include_router(benchmark_router, prefix="/api")


from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Check for production frontend build
frontend_dist_dir = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

if frontend_dist_dir.exists():
    # Mount static assets
    assets_dir = frontend_dist_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    # Serve SPA index.html and static public files
    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        if full_path.startswith("api"):
            return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
        
        # If static file exists (e.g. favicon.svg, images, js/css files)
        file_path = frontend_dist_dir / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)

        # If requesting root or client-side route
        accept = request.headers.get("accept", "")
        if full_path == "" and "text/html" not in accept:
            return {
                "app": settings.APP_NAME,
                "tagline": "Temporal Memory for AI Agents",
                "version": settings.APP_VERSION,
                "docs": "/api/docs",
                "health": "/api/health",
            }
            
        return FileResponse(frontend_dist_dir / "index.html")
else:
    @app.get("/")
    async def root_redirect():
        """Root metadata redirect."""
        return {
            "app": settings.APP_NAME,
            "tagline": "Temporal Memory for AI Agents",
            "version": settings.APP_VERSION,
            "docs": "/api/docs",
            "health": "/api/health",
        }
