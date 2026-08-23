from __future__ import annotations

import sys
from pathlib import Path

sys.path.append(str(Path.cwd()))
sys.path.append(str(Path.cwd() / ".packages"))

from scripts.subject_indexers import build_subject_exact_index


def index_class_11_chemistry_exact() -> None:
    """Build exact retrieval JSON for Class 11 Chemistry PDFs only."""
    build_subject_exact_index(class_name="Class 11", subject="Chemistry", use_marker=False)


if __name__ == "__main__":
    index_class_11_chemistry_exact()
