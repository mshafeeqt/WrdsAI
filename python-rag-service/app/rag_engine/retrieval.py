from __future__ import annotations

from typing import Iterable, List

from langchain_community.vectorstores import FAISS

from app.config import settings
from app.models import ChapterRetrieveResponse, RetrievedChunk
from app.rag_engine.cache import chapter_index_path, normalize_chapter_name
from app.rag_engine.embeddings import get_embeddings


def load_chapter_vector_store(chapter: str) -> FAISS:
    # Runtime retrieval loads only the selected chapter's vector index, never the full dataset.
    index_path = chapter_index_path(chapter)
    if not index_path.exists():
        raise FileNotFoundError(
            f"Chapter index not found for '{chapter}'. Rebuild the RAG index first."
        )

    return FAISS.load_local(
        str(index_path),
        get_embeddings(),
        allow_dangerous_deserialization=True,
    )


def build_context_text(
    matches: Iterable[RetrievedChunk],
    max_context_chars: int,
) -> str:
    # Convert raw vector matches into a compact context block the backend can inject into its final prompt.
    blocks: List[str] = []
    used_chars = 0

    for match in matches:
        block = "\n".join(
            [
                f"Chapter: {match.chapter}",
                f"Source: {match.source}",
                f"Page: {match.page if match.page is not None else 'unknown'}",
                f"Chunk Index: {match.chunk_index}",
                f"Similarity: {match.score:.4f}",
                f"Excerpt: {match.content}",
            ]
        )

        if blocks and used_chars + len(block) > max_context_chars:
            break

        blocks.append(block)
        used_chars += len(block)

    return "\n\n---\n\n".join(blocks)


def build_retrieval_query(query: str, chapter: str) -> str:
    # Enrich the embedding query with the selected chapter name so short follow-up
    # prompts like "give examples" are still searched in the right chapter scope.
    cleaned_query = query.strip()
    return (
        f"Selected chapter: {chapter}\n"
        f"Find textbook content that helps answer this question only within this chapter:\n"
        f"{cleaned_query}"
    )


def retrieve_chapter_context(
    query: str,
    chapter: str,
    top_k: int | None = None,
    score_threshold: float | None = None,
    max_context_chars: int | None = None,
) -> ChapterRetrieveResponse:
    # Online RAG path:
    # load selected chapter index -> retrieve top matches -> filter by score -> assemble context text.
    normalized_chapter = normalize_chapter_name(chapter)
    vector_store = load_chapter_vector_store(normalized_chapter)
    retrieval_query = build_retrieval_query(query, normalized_chapter)
    search_results = vector_store.similarity_search_with_relevance_scores(
        query=retrieval_query,
        k=top_k or settings.top_k,
    )

    threshold = (
        settings.score_threshold
        if score_threshold is None
        else score_threshold
    )

    matches = [
        RetrievedChunk(
            chapter=normalized_chapter,
            source=doc.metadata.get("source", f"{normalized_chapter}.pdf"),
            page=doc.metadata.get("page"),
            chunk_index=int(doc.metadata.get("chunk_index", 0)),
            score=float(score),
            content=doc.page_content,
        )
        for doc, score in search_results
        if float(score) >= threshold
    ]

    context_text = build_context_text(
        matches=matches,
        max_context_chars=max_context_chars or settings.max_context_chars,
    )

    return ChapterRetrieveResponse(
        chapter=normalized_chapter,
        context_text=context_text,
        matches=matches,
    )
