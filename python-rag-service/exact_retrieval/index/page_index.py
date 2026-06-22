from __future__ import annotations

from pathlib import Path
from typing import Any

from exact_retrieval.parser.utils import PAGE_INDEX_DIR, normalize_pdf_query, read_json


class PageIndex:
    """O(1) exact page lookup over `all_pages.json`."""

    def __init__(self, pages: list[dict[str, Any]]) -> None:
        self._by_key: dict[tuple[str, int], dict[str, Any]] = {}
        for record in pages:
            pdf = normalize_pdf_query(str(record.get("pdf") or "")) or ""
            page = int(record.get("page") or 0)
            if pdf and page:
                self._by_key[(pdf, page)] = record

    @classmethod
    def from_file(cls, path: Path | None = None) -> "PageIndex":
        return cls(read_json(path or PAGE_INDEX_DIR / "all_pages.json", []))

    def get(self, *, pdf: str, page: int) -> dict[str, Any] | None:
        normalized_pdf = normalize_pdf_query(pdf) or ""
        exact = self._by_key.get((normalized_pdf, int(page)))
        if exact:
            return exact

        request_stem = normalize_pdf_query(str(pdf).removesuffix(".pdf")) or ""
        for (record_pdf, record_page), record in self._by_key.items():
            if record_page == int(page) and request_stem and request_stem in record_pdf:
                return record
        return None
