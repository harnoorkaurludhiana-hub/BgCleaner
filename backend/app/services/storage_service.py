"""Local temp storage. Swap this module for S3/R2 later; callers only use these functions."""
import uuid
from pathlib import Path

from app.config.settings import settings
from app.core.exceptions import AppError

KINDS = ("originals", "processed", "backgrounds", "exports")


def init_storage() -> None:
    for kind in KINDS:
        (settings.storage_dir / kind).mkdir(parents=True, exist_ok=True)


def new_id() -> str:
    return uuid.uuid4().hex


def _check_id(image_id: str) -> str:
    # Only canonical hex UUIDs are accepted, which rules out path traversal.
    try:
        if uuid.UUID(hex=image_id).hex == image_id:
            return image_id
    except ValueError:
        pass
    raise AppError(404, "IMAGE_NOT_FOUND", "Image not found")


def file_path(kind: str, image_id: str) -> Path:
    if kind not in KINDS:
        raise AppError(404, "IMAGE_NOT_FOUND", "Image not found")
    return settings.storage_dir / kind / f"{_check_id(image_id)}.png"


def save(kind: str, image_id: str, data: bytes) -> Path:
    path = file_path(kind, image_id)
    tmp = path.with_suffix(".tmp")
    tmp.write_bytes(data)
    tmp.replace(path)  # atomic, so readers never see half-written files
    return path


def get(kind: str, image_id: str) -> Path:
    path = file_path(kind, image_id)
    if not path.is_file():
        raise AppError(404, "IMAGE_NOT_FOUND", "Image not found")
    return path


def delete_all(image_id: str) -> bool:
    deleted = False
    for kind in KINDS:
        path = file_path(kind, image_id)
        if path.is_file():
            path.unlink()
            deleted = True
    return deleted
