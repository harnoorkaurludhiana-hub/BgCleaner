FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    REMBG_HOME=/models \
    APP_ENV=production \
    STORAGE_DIR=/data/storage

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

# Download the AI model at build time so containers start ready and never fetch it at runtime.
ARG REMBG_MODEL=isnet-general-use
ENV REMBG_MODEL=${REMBG_MODEL}
RUN python -c "import os; from rembg import new_session; new_session(os.environ['REMBG_MODEL'])"

COPY app ./app

RUN useradd --create-home --uid 1000 app && mkdir -p /data/storage && chown -R app:app /data /models
USER app

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health')"

# One worker: the model and in-memory rate limiter live per process; MAX_CONCURRENT_JOBS sets parallelism.
# --proxy-headers makes request.client the real visitor IP behind Nginx.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
