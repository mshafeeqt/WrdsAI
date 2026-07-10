from __future__ import annotations

from fastapi import FastAPI

from app.api import router as rag_router
from exact_retrieval.parser.utils import ensure_exact_dirs


# FastAPI app entrypoint. The actual RAG behavior lives in `api.py` and `rag_engine/`.
ensure_exact_dirs()
app = FastAPI(title="CARBON Chapter RAG Service", version="1.0.0")
app.include_router(rag_router)


# powershell -ExecutionPolicy Bypass -File .\run_rag_service.ps1