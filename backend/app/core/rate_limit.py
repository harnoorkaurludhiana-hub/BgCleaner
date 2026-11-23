import threading
import time
from collections import defaultdict, deque

from fastapi import Request

from app.config.settings import settings
from app.core.exceptions import AppError

WINDOW_SECONDS = 60

# ponytail: in-memory sliding window, correct for a single worker process.
# Use Redis if you run several workers or servers. Nginx adds a second limit in front.
_hits: dict[str, deque[float]] = defaultdict(deque)
_lock = threading.Lock()


def rate_limit(request: Request) -> None:
    """FastAPI dependency: allow N requests per IP per minute on expensive endpoints."""
    # Behind Nginx, uvicorn's --proxy-headers sets request.client from X-Forwarded-For.
    ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    with _lock:
        hits = _hits[ip]
        while hits and now - hits[0] > WINDOW_SECONDS:
            hits.popleft()
        if len(hits) >= settings.rate_limit_per_minute:
            raise AppError(429, "RATE_LIMITED", "Too many images in a short time. Please wait a minute and try again.")
        hits.append(now)
        # Drop idle IPs so the dict doesn't grow forever.
        if len(_hits) > 10_000:
            for key in [k for k, v in _hits.items() if not v or now - v[-1] > WINDOW_SECONDS]:
                del _hits[key]


def reset() -> None:
    with _lock:
        _hits.clear()
