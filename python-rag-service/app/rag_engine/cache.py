from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

from app.config import settings


def normalize_chapter_name(value: str) -> str:
    # Keep chapter names consistent across PDF filenames, requests, and stored metadata.
    normalized = value.strip().replace("\\", "/")
    return re.sub(r"\.pdf$", "", normalized, flags=re.IGNORECASE)


def chapter_slug(chapter: str) -> str:
    # Build a folder-safe identifier so each chapter gets its own on-disk FAISS index.
    normalized = normalize_chapter_name(chapter).lower()
    return re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")


def chapter_index_path(chapter: str) -> Path:
    return settings.vector_db_dir / chapter_slug(chapter)


def reset_vector_db_dir() -> None:
    # Current indexing strategy is a full rebuild, so old chapter indexes are removed first.
    settings.vector_db_dir.mkdir(parents=True, exist_ok=True)
    for child in settings.vector_db_dir.iterdir():
        if child.is_dir():
            shutil.rmtree(child)
        else:
            child.unlink()


def read_index_manifest() -> dict:
    # Manifest is a lightweight record of what got indexed without opening FAISS files.
    if not settings.index_manifest_path.exists():
        return {"chapters": {}}
    return json.loads(settings.index_manifest_path.read_text(encoding="utf-8"))


def write_index_manifest(payload: dict) -> None:
    settings.index_manifest_path.parent.mkdir(parents=True, exist_ok=True)
    settings.index_manifest_path.write_text(
        json.dumps(payload, indent=2),
        encoding="utf-8",
    )
