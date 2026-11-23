import asyncio
import logging
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.ai.background_remover import get_session
from app.config.settings import settings
from app.core.exceptions import register_exception_handlers
from app.routes import health_routes, image_routes
from app.services.storage_service import init_storage
from app.tasks.cleanup import run_cleanup_loop

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_storage()
    # Load the model in the background so startup isn't blocked and the first upload is fast.
    threading.Thread(target=get_session, daemon=True).start()
    cleanup = asyncio.create_task(run_cleanup_loop())
    yield
    cleanup.cancel()


app = FastAPI(
    title="Background Remover API",
    lifespan=lifespan,
    docs_url="/docs" if settings.app_env == "development" else None,
    openapi_url="/openapi.json" if settings.app_env == "development" else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)
register_exception_handlers(app)

app.include_router(health_routes.router, prefix="/api/v1")
app.include_router(image_routes.router, prefix="/api/v1")
app.include_router(image_routes.media_router)
