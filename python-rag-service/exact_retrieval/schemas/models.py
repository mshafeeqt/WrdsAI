from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any


@dataclass(frozen=True)
class Question:
    """Exact exercise question parsed from Marker Markdown."""

    id: str
    pdf: str
    page: int
    chapter: str | None
    exercise: str | None
    question_no: str
    sub_question: str | None
    question_markdown: str
    question_text: str
    figures: list[dict[str, Any]]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class Page:
    """Page-level Markdown/text record used for exact page lookup."""

    pdf: str
    page: int
    markdown: str
    text: str
    figures: list[dict[str, Any]]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class ExactIndexSummary:
    """Summary produced by an exact index rebuild."""

    pdfs_processed: int
    pages_indexed: int
    questions_indexed: int
    failed_pdfs: int
    parsed_dir: str
    page_index_dir: str
    question_index_dir: str
    markdown_dir: str

    def to_dict(self) -> dict[str, Any]:
        return {"success": True, **asdict(self)}