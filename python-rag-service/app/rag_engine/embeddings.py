from __future__ import annotations

from functools import lru_cache

from langchain_openai import OpenAIEmbeddings

from app.config import settings


@lru_cache(maxsize=1)
def get_embeddings() -> OpenAIEmbeddings:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is required for the Python RAG service")

    # Disable tokenizer-based prechecks so embedding calls do not depend on extra model downloads.
    return OpenAIEmbeddings(
        api_key=settings.openai_api_key,
        model=settings.embedding_model,
        tiktoken_enabled=False,
        check_embedding_ctx_length=False,
    )
