from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from exact_retrieval.parser.utils import FIGURES_DIR, slugify, stable_pdf_key

logger = logging.getLogger(__name__)


class FigureExtractor:
    """Extract embedded PDF figures into stable per-PDF/page folders."""

    def extract_pdf_figures(self, pdf_path: Path, pdf_root: Path) -> dict[int, list[dict[str, Any]]]:
        """Return figure metadata keyed by 1-based page number.

        This extracts embedded raster images from the PDF. Vector-only textbook
        drawings may not appear as images in PyMuPDF; those remain represented
        by page/question text and runtime diagrams.
        """
        try:
            import fitz  # type: ignore[import-not-found]
        except ImportError as exc:  # pragma: no cover
            raise RuntimeError("PyMuPDF is required for figure extraction") from exc

        pdf_key = stable_pdf_key(pdf_path, pdf_root)
        pdf_slug = slugify(Path(pdf_key).stem)
        output_root = FIGURES_DIR / pdf_slug
        figures_by_page: dict[int, list[dict[str, Any]]] = {}

        with fitz.open(pdf_path) as document:
            for page_index in range(document.page_count):
                page_no = page_index + 1
                page = document.load_page(page_index)
                page_dir = output_root / f"page_{page_no}"
                page_figures: list[dict[str, Any]] = []
                seen_xrefs: set[int] = set()

                for image_number, image_info in enumerate(page.get_images(full=True), start=1):
                    xref = int(image_info[0])
                    if xref in seen_xrefs:
                        continue
                    seen_xrefs.add(xref)

                    try:
                        extracted = document.extract_image(xref)
                    except Exception:
                        logger.debug("Failed to extract image xref %s from %s page %s", xref, pdf_path, page_no)
                        continue

                    image_bytes = extracted.get("image")
                    if not image_bytes:
                        continue

                    extension = str(extracted.get("ext") or "png").lower().lstrip(".")
                    page_dir.mkdir(parents=True, exist_ok=True)
                    figure_path = page_dir / f"fig_{len(page_figures) + 1}.{extension}"
                    figure_path.write_bytes(image_bytes)

                    bbox = self._find_image_bbox(page, xref)
                    rel_path = figure_path.relative_to(FIGURES_DIR.parent).as_posix()
                    page_figures.append(
                        {
                            "page": page_no,
                            "figure_no": len(page_figures) + 1,
                            "path": rel_path,
                            "xref": xref,
                            "width": int(extracted.get("width") or 0),
                            "height": int(extracted.get("height") or 0),
                            "bbox": bbox,
                        }
                    )

                if page_figures:
                    figures_by_page[page_no] = page_figures

        return figures_by_page

    def _find_image_bbox(self, page: Any, xref: int) -> list[float] | None:
        """Best-effort image bounding box lookup for one page/xref."""
        try:
            rects = page.get_image_rects(xref)
        except Exception:
            return None
        if not rects:
            return None
        rect = rects[0]
        return [float(rect.x0), float(rect.y0), float(rect.x1), float(rect.y1)]