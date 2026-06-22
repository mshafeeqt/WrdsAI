from __future__ import annotations

import json
import logging
import re
import shutil
from pathlib import Path
from typing import Any, Iterable, Sequence

from app.config import settings

logger = logging.getLogger(__name__)

EXACT_DATA_DIR = settings.service_root / "data"
MARKDOWN_DIR = EXACT_DATA_DIR / "markdown"
PARSED_DIR = EXACT_DATA_DIR / "parsed"
PAGE_INDEX_DIR = EXACT_DATA_DIR / "page_index"
QUESTION_INDEX_DIR = EXACT_DATA_DIR / "question_index"
FIGURES_DIR = EXACT_DATA_DIR / "figures"
GENERATED_DIRS = (MARKDOWN_DIR, PARSED_DIR, PAGE_INDEX_DIR, QUESTION_INDEX_DIR, FIGURES_DIR)
PAGE_MARKER_RE = re.compile(r"<!--\s*page\s*:\s*(\d+)\s*-->", re.IGNORECASE)
CONTROL_CHAR_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\xad]")


def ensure_exact_dirs() -> None:
    """Create exact-retrieval output folders."""
    for directory in GENERATED_DIRS:
        directory.mkdir(parents=True, exist_ok=True)


def reset_exact_dirs() -> None:
    """Clear generated exact-retrieval output folders before a full rebuild."""
    for directory in GENERATED_DIRS:
        if directory.exists():
            shutil.rmtree(directory)
        directory.mkdir(parents=True, exist_ok=True)


def get_pdf_root() -> Path:
    """Return the configured corpus root shared with semantic RAG."""
    return settings.math_data_dir


def list_pdf_files(pdf_root: Path | None = None) -> list[Path]:
    """List all PDFs under the configured corpus root."""
    root = pdf_root or get_pdf_root()
    if not root.exists():
        raise FileNotFoundError(f"PDF directory not found: {root}")
    pdfs = sorted(path for path in root.rglob("*.pdf") if path.is_file())
    if not pdfs:
        raise FileNotFoundError(f"No PDF files found in: {root}")
    return pdfs


def stable_pdf_key(pdf_path: Path, pdf_root: Path | None = None) -> str:
    """Use a stable relative PDF key for all JSON records."""
    root = pdf_root or get_pdf_root()
    try:
        return pdf_path.relative_to(root).as_posix()
    except ValueError:
        return pdf_path.name


def slugify(value: str) -> str:
    """Create a filesystem-safe lowercase slug."""
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", str(value)).strip("-").lower()
    return slug or "document"


def markdown_file_path(pdf_key: str) -> Path:
    return MARKDOWN_DIR / f"{Path(pdf_key).stem}.md"


def parsed_file_path(pdf_key: str) -> Path:
    return PARSED_DIR / f"{slugify(Path(pdf_key).stem)}.json"


def per_pdf_question_file_path(pdf_key: str) -> Path:
    return QUESTION_INDEX_DIR / f"{slugify(Path(pdf_key).stem)}_questions.json"


def per_pdf_page_file_path(pdf_key: str) -> Path:
    return PAGE_INDEX_DIR / f"{slugify(Path(pdf_key).stem)}_pages.json"


def figures_pdf_dir(pdf_key: str) -> Path:
    return FIGURES_DIR / slugify(Path(pdf_key).stem)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        logger.warning("Invalid JSON at %s: %s", path, exc)
        return default


def write_text(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value, encoding="utf-8")


def normalize_pdf_query(value: str | None) -> str | None:
    if not value:
        return None
    normalized = str(value).replace("\\", "/").strip().lower()
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized or None


def normalize_question_no(value: str | None) -> str:
    return str(value or "").strip().lower().rstrip(".")


def normalize_sub_question(value: str | None) -> str | None:
    if not value:
        return None
    normalized = str(value).strip().lower().strip("()")
    return normalized or None


def strip_markdown(value: str) -> str:
    """Convert Markdown-ish question content into compact plain text."""
    text = str(value or "")
    text = re.sub(r"<\s*sup\s*>\s*([^<]+?)\s*<\s*/\s*sup\s*>", r"^\1", text, flags=re.IGNORECASE)
    text = re.sub(r"<\s*sub\s*>\s*([^<]+?)\s*<\s*/\s*sub\s*>", r"_\1", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    text = re.sub(r'[`*_#>"]', "", text)
    text = text.replace("\\(", "").replace("\\)", "")
    text = text.replace("\\[", "").replace("\\]", "")
    text = CONTROL_CHAR_RE.sub("", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def split_markdown_pages(markdown: str) -> list[tuple[int, str]]:
    """Split a Markdown document into `(page, markdown)` chunks."""
    matches = list(PAGE_MARKER_RE.finditer(markdown))
    if not matches:
        return [(1, markdown.strip())] if markdown.strip() else []

    pages: list[tuple[int, str]] = []
    for index, match in enumerate(matches):
        page = int(match.group(1))
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(markdown)
        chunk = markdown[start:end].strip()
        pages.append((page, chunk))
    return pages


def first_present(values: Iterable[str | None]) -> str | None:
    for value in values:
        cleaned = str(value or "").strip()
        if cleaned:
            return cleaned
    return None


def class_subject_key(pdf: str | None) -> str | None:
    normalized = normalize_pdf_query(pdf)
    if not normalized:
        return None
    parts = [part for part in normalized.removesuffix(".pdf").split("/") if part]
    if len(parts) < 2:
        return None
    return "/".join(parts[:2])


def dump_records(records: Sequence[Any]) -> list[dict[str, Any]]:
    payload: list[dict[str, Any]] = []
    for record in records:
        if hasattr(record, "to_dict"):
            payload.append(record.to_dict())
        else:
            payload.append(dict(record))
    return payload
