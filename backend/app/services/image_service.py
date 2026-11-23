import logging
import threading
from io import BytesIO

from PIL import Image, ImageOps

from app.ai.background_remover import remove_background
from app.config.settings import settings
from app.core.exceptions import AppError
from app.schemas.image_schema import ImageData
from app.services import storage_service
from app.utils.file_validation import validate_image

logger = logging.getLogger(__name__)

# ponytail: in-process semaphore; move to a job queue (e.g. RQ/Celery) if one box isn't enough.
_job_slots = threading.BoundedSemaphore(settings.max_concurrent_jobs)
# Ids being processed right now; cleanup skips them.
processing_ids: set[str] = set()


def _normalize(image: Image.Image) -> Image.Image:
    image = ImageOps.exif_transpose(image)
    has_alpha = image.mode in ("RGBA", "LA", "PA") or (image.mode == "P" and "transparency" in image.info)
    return image.convert("RGBA" if has_alpha else "RGB")


def _to_png(image: Image.Image) -> bytes:
    buf = BytesIO()
    image.save(buf, format="PNG", optimize=False)
    return buf.getvalue()


def _image_data(image_id: str, width: int, height: int) -> ImageData:
    return ImageData(
        image_id=image_id,
        original_url=f"/media/original/{image_id}.png",
        processed_url=f"/media/processed/{image_id}.png",
        width=width,
        height=height,
        format="PNG",
    )


def process_upload(data: bytes) -> ImageData:
    image = _normalize(validate_image(data))
    image_id = storage_service.new_id()

    if not _job_slots.acquire(timeout=60):
        raise AppError(429, "SERVER_BUSY", "Server is busy, please try again shortly")
    processing_ids.add(image_id)
    try:
        storage_service.save("originals", image_id, _to_png(image))
        try:
            result = remove_background(image)
        except Exception:
            logger.exception("Background removal failed for %s", image_id)
            storage_service.delete_all(image_id)
            raise AppError(500, "PROCESSING_FAILED", "Background removal failed, please try again")
        storage_service.save("processed", image_id, _to_png(result))
    finally:
        processing_ids.discard(image_id)
        _job_slots.release()

    logger.info("Processed %s (%dx%d)", image_id, result.width, result.height)
    return _image_data(image_id, result.width, result.height)


def get_image(image_id: str) -> ImageData:
    with Image.open(storage_service.get("processed", image_id)) as img:
        width, height = img.size
    return _image_data(image_id, width, height)


def delete_image(image_id: str) -> None:
    if not storage_service.delete_all(image_id):
        raise AppError(404, "IMAGE_NOT_FOUND", "Image not found")
