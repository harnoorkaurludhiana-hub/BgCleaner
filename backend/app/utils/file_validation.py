from io import BytesIO

from PIL import Image, UnidentifiedImageError

from app.config.settings import settings
from app.core.exceptions import AppError

ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}

# Pillow raises DecompressionBombError above this, before decoding pixels.
Image.MAX_IMAGE_PIXELS = settings.max_image_pixels


def validate_image(data: bytes) -> Image.Image:
    """Check size and real content (ignoring client filename/MIME). Returns a loaded image."""
    if not data:
        raise AppError(400, "EMPTY_FILE", "The uploaded file is empty")
    if len(data) > settings.max_upload_bytes:
        raise AppError(413, "FILE_TOO_LARGE", f"File exceeds {settings.max_upload_size_mb} MB")

    try:
        with Image.open(BytesIO(data)) as probe:
            fmt = probe.format
            width, height = probe.size
            probe.verify()
    except Image.DecompressionBombError:
        raise AppError(422, "IMAGE_TOO_LARGE", "Image has too many pixels")
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError):
        raise AppError(415, "INVALID_IMAGE_FORMAT", "Unsupported or corrupted image")

    if fmt not in ALLOWED_FORMATS:
        raise AppError(415, "INVALID_IMAGE_FORMAT", "Unsupported image format")
    if max(width, height) > settings.max_image_dimension or width * height > settings.max_image_pixels:
        raise AppError(422, "IMAGE_TOO_LARGE", f"Image dimensions exceed {settings.max_image_dimension}px")

    # verify() leaves the image unusable; reopen and fully decode to catch truncated data.
    try:
        image = Image.open(BytesIO(data))
        image.load()
    except (OSError, SyntaxError, ValueError):
        raise AppError(415, "INVALID_IMAGE_FORMAT", "Unsupported or corrupted image")
    return image
