from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.config import settings
from app.models import (
    ChapterRetrieveRequest,
    ChapterRetrieveResponse,
    HealthResponse,
    RebuildIndexResponse,
)
from app.rag_engine.engine import get_rag_engine
from app.safety import (
    build_self_harm_support_message,
    should_trigger_self_harm_guardrail,
)


router = APIRouter(prefix="/rag", tags=["rag"])
# Reuse one engine instance so indexing/retrieval wiring stays centralized.
engine = get_rag_engine()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    # Lets the Node backend verify that the Python RAG service is configured and reachable.
    return HealthResponse(
        service=settings.service_name,
        math_data_dir=str(settings.math_data_dir),
        vector_db_dir=str(settings.vector_db_dir),
        collection_name=settings.collection_name,
    )


@router.post("/index/rebuild", response_model=RebuildIndexResponse)
def rebuild_index() -> RebuildIndexResponse:
    try:
        # Offline/admin flow: load PDFs, chunk them, create embeddings, and persist FAISS indexes.
        return engine.rebuild_index()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.post("/chapters/retrieve", response_model=ChapterRetrieveResponse)
def retrieve_from_chapter(
    payload: ChapterRetrieveRequest,
) -> ChapterRetrieveResponse:
    try:
        if should_trigger_self_harm_guardrail(payload.query):
            raise HTTPException(
                status_code=403,
                detail=build_self_harm_support_message(),
            )

        # Online chat flow: retrieve context only from the selected chapter index.
        return engine.retrieve(
            query=payload.query,
            chapter=payload.chapter,
            top_k=payload.top_k,
            score_threshold=payload.score_threshold,
            max_context_chars=payload.max_context_chars,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
