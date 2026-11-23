import asyncio
import logging
import time

from app.config.settings import settings
from app.services import storage_service
from app.services.image_service import processing_ids

logger = logging.getLogger(__name__)


def delete_expired_files(now: float | None = None) -> int:
    """Delete temp files older than the retention period. Never touches images being processed."""
    now = now or time.time()
    max_age = settings.file_retention_hours * 3600
    deleted = 0
    for kind in storage_service.KINDS:
        folder = settings.storage_dir / kind
        if not folder.is_dir():
            continue
        for path in folder.iterdir():
            if not path.is_file() or path.stem in processing_ids:
                continue
            try:
                if now - path.stat().st_mtime > max_age:
                    path.unlink()
                    deleted += 1
            except FileNotFoundError:
                pass  # deleted by a user request in the meantime
    return deleted


async def run_cleanup_loop() -> None:
    while True:
        try:
            deleted = await asyncio.to_thread(delete_expired_files)
            if deleted:
                logger.info("Cleanup removed %d expired files", deleted)
        except Exception:
            logger.exception("Cleanup failed")
        await asyncio.sleep(settings.cleanup_interval_minutes * 60)
