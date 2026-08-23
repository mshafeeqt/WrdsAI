from __future__ import annotations

import sys
from pathlib import Path

sys.path.append(str(Path.cwd()))
sys.path.append(str(Path.cwd() / ".packages"))

from scripts.subject_indexers import build_subject_exact_index


def index_class_11_biology_exact() -> None:
    """Build exact retrieval JSON and page indexes for Class 11 Biology PDFs."""
    build_subject_exact_index(class_name="Class 11", subject="Biology", use_marker=False)


if __name__ == "__main__":
    index_class_11_biology_exact()

