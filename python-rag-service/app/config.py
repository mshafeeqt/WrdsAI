from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv


APP_ROOT = Path(__file__).resolve().parent
SERVICE_ROOT = APP_ROOT.parent
PROJECT_ROOT = SERVICE_ROOT.parent

load_dotenv(SERVICE_ROOT / ".env")


def _resolve_path(value: str | None, default: Path) -> Path:
    # Store all paths as absolute paths even if the `.env` file uses relative values.
    if not value:
        return default.resolve()
    path = Path(value)
    if not path.is_absolute():
        path = (SERVICE_ROOT / path).resolve()
    return path


class Settings:
    def __init__(self) -> None:
        # Central place for source data, vector index storage, and retrieval tuning.
        self.service_name = "carbon-chapter-rag-service"
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "").strip()
        self.math_data_dir = _resolve_path(
            os.getenv("MATH_DATA_DIR"),
            PROJECT_ROOT / "chatbot-backend" / "Math_Data",
        )
        self.vector_db_dir = _resolve_path(
            os.getenv("RAG_VECTOR_DB_DIR"),
            SERVICE_ROOT / "data" / "vector_db",
        )
        self.index_manifest_path = _resolve_path(
            os.getenv("RAG_INDEX_MANIFEST_PATH"),
            SERVICE_ROOT / "data" / "index_manifest.json",
        )
        self.collection_name = os.getenv("RAG_COLLECTION_NAME", "cbse_math_chapters")
        self.embedding_model = os.getenv(
            "RAG_EMBEDDING_MODEL",
            "text-embedding-3-small",
        )
        self.chunk_size = int(os.getenv("RAG_CHUNK_SIZE", "1200"))
        self.chunk_overlap = int(os.getenv("RAG_CHUNK_OVERLAP", "180"))
        self.top_k = int(os.getenv("RAG_TOP_K", "5"))
        self.score_threshold = float(os.getenv("RAG_SCORE_THRESHOLD", "0.34"))
        self.max_context_chars = int(os.getenv("RAG_MAX_CONTEXT_CHARS", "4000"))


settings = Settings()
