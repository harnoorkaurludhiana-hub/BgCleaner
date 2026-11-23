from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse

from app.config.settings import settings
from app.core.exceptions import AppError
from app.core.rate_limit import rate_limit
from app.schemas.image_schema import ImageResponse, MessageResponse
from app.services import image_service, storage_service

router = APIRouter(prefix="/images", tags=["images"])
media_router = APIRouter(tags=["media"])

# Plain `def` endpoints run in FastAPI's threadpool, so slow AI work doesn't block other requests.


@router.post("/remove-bg", response_model=ImageResponse, dependencies=[Depends(rate_limit)])
def remove_bg(file: UploadFile = File(...)):
    # Read one byte past the limit so oversized uploads are rejected without loading them fully.
    data = file.file.read(settings.max_upload_bytes + 1)
    if len(data) > settings.max_upload_bytes:
        raise AppError(413, "FILE_TOO_LARGE", f"File exceeds {settings.max_upload_size_mb} MB")
    result = image_service.process_upload(data)
    return ImageResponse(message="Background removed successfully", data=result)


@router.get("/{image_id}", response_model=ImageResponse)
def get_image(image_id: str):
    return ImageResponse(message="Image found", data=image_service.get_image(image_id))


@router.delete("/{image_id}", response_model=MessageResponse)
def delete_image(image_id: str):
    image_service.delete_image(image_id)
    return MessageResponse(message="Image deleted")


# Public URL kind -> storage folder. Only these files are ever served.
MEDIA_KINDS = {"original": "originals", "processed": "processed"}


@media_router.get("/media/{kind}/{filename}")
def media(kind: str, filename: str):
    image_id, _, ext = filename.partition(".")
    if kind not in MEDIA_KINDS or ext != "png":
        raise AppError(404, "IMAGE_NOT_FOUND", "Image not found")
    path = storage_service.get(MEDIA_KINDS[kind], image_id)
    return FileResponse(
        path,
        media_type="image/png",
        headers={"Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff"},
    )
