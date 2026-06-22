from __future__ import annotations

from typing import Any, List

from pydantic import BaseModel, Field


# Request contract for chapter-restricted retrieval.
class ChapterRetrieveRequest(BaseModel):
    query: str = Field(..., min_length=1)
    chapter: str = Field(..., min_length=1)
    top_k: int | None = None
    score_threshold: float | None = None
    max_context_chars: int | None = None


# One retrieved chunk from the selected chapter index.
class RetrievedChunk(BaseModel):
    chapter: str
    source: str
    page: int | None = None
    chunk_index: int
    score: float
    content: str


# Response sent back to Node after chapter retrieval.
class ChapterRetrieveResponse(BaseModel):
    success: bool = True
    chapter: str
    context_text: str
    matches: List[RetrievedChunk]
    retrieval_type: str = "semantic"
    exact_result: dict[str, Any] | None = None


# Metadata we keep for each indexed chapter PDF.
class IndexedChapter(BaseModel):
    chapter: str
    source_file: str
    chunk_count: int
    file_mtime_ms: int


# Summary returned after rebuilding all chapter indexes.
class RebuildIndexResponse(BaseModel):
    success: bool = True
    collection_name: str
    indexed_chapters: int
    indexed_chunks: int
    chapters: List[IndexedChapter]


# Small health payload used by backend operational checks.
class HealthResponse(BaseModel):
    success: bool = True
    service: str
    math_data_dir: str
    vector_db_dir: str
    collection_name: str


# Summary returned after rebuilding exact page/question JSON indexes.
class ExactRebuildIndexResponse(BaseModel):
    success: bool = True
    pdfs_processed: int
    pages_indexed: int
    questions_indexed: int
    parsed_dir: str
    page_index_dir: str
    question_index_dir: str