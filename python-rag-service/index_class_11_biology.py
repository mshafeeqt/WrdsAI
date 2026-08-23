from __future__ import annotations

import sys
from pathlib import Path

sys.path.append(str(Path.cwd()))
sys.path.append(str(Path.cwd() / ".packages"))

from scripts.subject_indexers import build_subject_semantic_index


def index_class_11_biology() -> None:
    """Build semantic FAISS indexes for Class 11 Biology PDFs."""
    build_subject_semantic_index(class_name="Class 11", subject="Biology")


if __name__ == "__main__":
    index_class_11_biology()

