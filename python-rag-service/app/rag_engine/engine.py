from __future__ import annotations

from functools import lru_cache

from app.rag_engine.cache import read_index_manifest
from app.rag_engine.ingestion import rebuild_chapter_indexes
from app.rag_engine.retrieval import retrieve_chapter_context
from app.models import ChapterRetrieveResponse, RebuildIndexResponse


class ChapterRAGEngine:
    def rebuild_index(self) -> RebuildIndexResponse:
        # Entry point used by scripts/API for rebuilding all chapter indexes.
        return rebuild_chapter_indexes()

    def retrieve(
        self,
        query: str,
        chapter: str,
        top_k: int | None = None,
        score_threshold: float | None = None,
        max_context_chars: int | None = None,
    ) -> ChapterRetrieveResponse:
        # Entry point used by the backend during chapter-locked chat.
        return retrieve_chapter_context(
            query=query,
            chapter=chapter,
            top_k=top_k,
            score_threshold=score_threshold,
            max_context_chars=max_context_chars,
        )

    def get_index_manifest(self) -> dict:
        return read_index_manifest()


@lru_cache(maxsize=1)
def get_rag_engine() -> ChapterRAGEngine:
    # Singleton keeps the API layer simple and avoids repeatedly rebuilding shared clients.
    return ChapterRAGEngine()
