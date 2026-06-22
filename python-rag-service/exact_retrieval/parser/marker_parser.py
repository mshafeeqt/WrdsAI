from __future__ import annotations

import logging
import os
import shutil
import subprocess
from pathlib import Path

from exact_retrieval.parser.utils import EXACT_DATA_DIR, markdown_file_path, stable_pdf_key, write_text

logger = logging.getLogger(__name__)


class MarkerUnavailableError(RuntimeError):
    """Raised when no Marker executable is available."""


class MarkerParser:
    """Convert PDFs to page-delimited Markdown using Marker when available."""

    def __init__(self, *, timeout_seconds: int | None = None) -> None:
        self.timeout_seconds = timeout_seconds or int(os.environ.get("EXACT_MARKER_TIMEOUT_SECONDS", "3600"))

    def convert_pdf_to_markdown(self, pdf_path: Path, pdf_root: Path) -> Path:
        """Convert `pdf_path` to Markdown and return the saved Markdown path."""
        pdf_key = stable_pdf_key(pdf_path, pdf_root)
        output_path = markdown_file_path(pdf_key)
        markdown = self.convert_pdf_to_markdown_text(pdf_path)
        write_text(output_path, markdown)
        return output_path

    def convert_pdf_to_markdown_text(self, pdf_path: Path) -> str:
        """Return page-delimited Markdown for one PDF.

        Marker does not guarantee page markers in every output mode, so this
        method converts one temporary single-page PDF at a time and joins the
        page Markdown with explicit `<!-- page: N -->` markers.
        """
        try:
            return self._convert_with_marker_per_page(pdf_path)
        except MarkerUnavailableError:
            logger.warning("Marker CLI not found; using PyMuPDF Markdown fallback for %s", pdf_path)
            return self._convert_with_pymupdf_fallback(pdf_path)
        except Exception:
            logger.exception("Marker conversion failed; using PyMuPDF Markdown fallback for %s", pdf_path)
            return self._convert_with_pymupdf_fallback(pdf_path)

    def _convert_with_marker_per_page(self, pdf_path: Path) -> str:
        marker_command = self._find_marker_command()
        try:
            import fitz  # type: ignore[import-not-found]
        except ImportError as exc:
            raise RuntimeError("PyMuPDF is required to count pages for Marker conversion") from exc

        with fitz.open(pdf_path) as document:
            page_count = document.page_count

        temp_root = EXACT_DATA_DIR / "tmp" / "marker"
        temp_root.mkdir(parents=True, exist_ok=True)
        output_dir = temp_root / pdf_path.stem
        if output_dir.exists():
            shutil.rmtree(output_dir, ignore_errors=True)

        separator = "\n\n<!-- marker-page-break -->\n\n"
        raw_markdown = self._run_marker(marker_command, pdf_path, output_dir, separator=separator)
        page_chunks = [self._clean_marker_page_chunk(chunk) for chunk in raw_markdown.split("<!-- marker-page-break -->")]
        if len(page_chunks) == page_count + 1 and not page_chunks[0]:
            page_chunks = page_chunks[1:]
        if len(page_chunks) < page_count:
            logger.warning(
                "Marker returned %s page chunks for %s pages in %s; falling back to PyMuPDF page boundaries",
                len(page_chunks),
                page_count,
                pdf_path,
            )
            return self._convert_with_pymupdf_fallback(pdf_path)

        parts = [f"<!-- page: {page_no} -->\n\n{chunk}\n" for page_no, chunk in enumerate(page_chunks[:page_count], start=1)]
        return "\n".join(parts).strip() + "\n"

    def _clean_marker_page_chunk(self, chunk: str) -> str:
        """Remove Marker page-number placeholders from one page chunk."""
        lines = []
        for line in chunk.splitlines():
            if line.strip().startswith("{") and line.strip().endswith("}"):
                inner = line.strip()[1:-1]
                if inner.isdigit():
                    continue
            lines.append(line)
        return "\n".join(lines).strip()
    def _find_marker_command(self) -> str:
        for command in ("marker_single", "marker"):
            resolved = shutil.which(command)
            if resolved:
                return resolved
        raise MarkerUnavailableError("Install marker-pdf so marker_single is available")

    def _run_marker(self, command: str, pdf_path: Path, output_dir: Path, *, separator: str) -> str:
        output_dir.mkdir(parents=True, exist_ok=True)
        command_variants = [
            [
                command,
                str(pdf_path),
                "--output_dir",
                str(output_dir),
                "--output_format",
                "markdown",
                "--paginate_output",
                "--page_separator",
                separator,
                "--disable_ocr",
                "--disable_image_extraction",
                "--disable_tqdm",
            ],
            [
                command,
                str(pdf_path),
                "--output_dir",
                str(output_dir),
                "--output_format",
                "markdown",
                "--disable_ocr",
                "--disable_image_extraction",
                "--disable_tqdm",
            ],
            [
                command,
                str(pdf_path),
                "--output_dir",
                str(output_dir),
                "--disable_ocr",
                "--disable_image_extraction",
                "--disable_tqdm",
            ],
        ]

        env = os.environ.copy()
        model_cache_dir = EXACT_DATA_DIR / "model_cache"
        model_cache_dir.mkdir(parents=True, exist_ok=True)
        temp_cache_dir = EXACT_DATA_DIR / "tmp" / "marker-runtime"
        temp_cache_dir.mkdir(parents=True, exist_ok=True)
        env.setdefault("MODEL_CACHE_DIR", str(model_cache_dir))
        env.setdefault("HF_HOME", str(model_cache_dir / "huggingface"))
        env.setdefault("TORCH_HOME", str(model_cache_dir / "torch"))
        env.setdefault("XDG_CACHE_HOME", str(model_cache_dir / "xdg"))
        env["TMP"] = str(temp_cache_dir)
        env["TEMP"] = str(temp_cache_dir)

        last_error = ""
        for args in command_variants:
            result = subprocess.run(
                args,
                capture_output=True,
                text=True,
                timeout=self.timeout_seconds,
                check=False,
                env=env,
            )
            if result.returncode == 0:
                markdown = self._read_marker_markdown(output_dir)
                if markdown:
                    return markdown
            last_error = result.stderr or result.stdout or f"exit code {result.returncode}"

        raise RuntimeError(f"Marker failed for {pdf_path}: {last_error}")

    def _read_marker_markdown(self, output_dir: Path) -> str:
        candidates = sorted(
            output_dir.rglob("*.md"),
            key=lambda path: path.stat().st_mtime,
            reverse=True,
        )
        if not candidates:
            return ""
        return candidates[0].read_text(encoding="utf-8", errors="replace")

    def _convert_with_pymupdf_fallback(self, pdf_path: Path) -> str:
        try:
            import fitz  # type: ignore[import-not-found]
        except ImportError as exc:
            raise RuntimeError("PyMuPDF is required for exact retrieval fallback parsing") from exc

        parts: list[str] = []
        with fitz.open(pdf_path) as document:
            for page_index in range(document.page_count):
                page_no = page_index + 1
                page = document.load_page(page_index)
                if hasattr(page, "get_text"):
                    try:
                        markdown = page.get_text("markdown")
                    except (AssertionError, ValueError):
                        markdown = page.get_text("text")
                    if not markdown or markdown == "()":
                        markdown = page.get_text("text")
                else:
                    markdown = ""
                parts.append(f"<!-- page: {page_no} -->\n\n{markdown.strip()}\n")
        return "\n".join(parts).strip() + "\n"
