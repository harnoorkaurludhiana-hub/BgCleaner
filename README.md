# ClearCut — AI Background Remover

Next.js frontend + FastAPI/rembg backend. Full spec: [CLAUDE.md](CLAUDE.md).

## Run locally

Backend (port 8000):
```
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements-dev.txt
copy .env.example .env
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```
The first start downloads the AI model (~180 MB for `isnet-general-use`) to `~/.rembg/models`.
Set `REMBG_MODEL=u2netp` in `.env` for a 5 MB model while developing.

Frontend (port 3000):
```
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Tests: `cd backend && .venv\Scripts\python -m pytest`
