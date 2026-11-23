import threading

from PIL import Image

from app.config.settings import settings

_session = None
_lock = threading.Lock()


def get_session():
    """Load the rembg model once per process (first call downloads it if missing)."""
    global _session
    if _session is None:
        with _lock:
            if _session is None:
                from rembg import new_session

                _session = new_session(settings.rembg_model)
    return _session


def remove_background(image: Image.Image) -> Image.Image:
    from rembg import remove

    result = remove(image, session=get_session())
    return result.convert("RGBA")
