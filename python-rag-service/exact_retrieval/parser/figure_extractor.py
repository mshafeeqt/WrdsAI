from __future__ import annotations

import logging
from pathlib import Path

from exact_retrieval.parser.utils import figures_pdf_dir, stable_pdf_key
from exact_retrieval.schemas.models import Figure

logger = logging.getLogger(__name__)


class FigureExtractor:
    """Extract embedded PDF images with PyMuPDF."""

    def extract_figures(self, pdf_path: Path, pdf_root: Path) -> list[Figure]:
        """Extract all images from `pdf_path` into `data/figures`.

        Bboxes are included when PyMuPDF can map an image xref to page rects.
        """
        try:
            import fitz  # type: ignore[import-not-found]
        except ImportError as exc:
            raise RuntimeError("PyMuPDF is required for figure extraction") from exc

        pdf_key = stable_pdf_key(pdf_path, pdf_root)
        output_root = figures_pdf_dir(pdf_key)
        figures: list[Figure] = []

        with fitz.open(pdf_path) as document:
            for page_index in range(document.page_count):
                page_no = page_index + 1
                page = document.load_page(page_index)
                images = page.get_images(full=True)
                if not images:
                    continue

                page_dir = output_root / f"page_{page_no}"
                page_dir.mkdir(parents=True, exist_ok=True)

                for image_index, image_info in enumerate(images, start=1):
                    xref = int(image_info[0])
                    try:
                        image_payload = document.extract_image(xref)
                    except Exception:
                        logger.exception("Failed to extract image xref %s from %s page %s", xref, pdf_key, page_no)
                        continue

                    extension = image_payload.get("ext") or "png"
                    image_bytes = image_payload.get("image") or b""
                    if not image_bytes:
                        continue

                    image_path = page_dir / f"fig_{image_index}.{extension}"
                    image_path.write_bytes(image_bytes)
                    bbox = self._first_image_bbox(page, xref)
                    figures.append(
                        Figure(
                            pdf=pdf_key,
                            page=page_no,
                            path=image_path.relative_to(output_root.parents[1]).as_posix(),
                            bbox=bbox,
                            width=image_payload.get("width"),
                            height=image_payload.get("height"),
                        )
                    )

        return figures

    def _first_image_bbox(self, page: object, xref: int) -> tuple[float, float, float, float] | None:
        try:
            rects = page.get_image_rects(xref)  # type: ignore[attr-defined]
        except Exception:
            return None
        if not rects:
            return None
        rect = rects[0]
        return (float(rect.x0), float(rect.y0), float(rect.x1), float(rect.y1))
