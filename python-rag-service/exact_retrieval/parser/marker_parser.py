from __future__ import annotations

import logging
import os
import re
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from exact_retrieval.parser.utils import EXACT_DATA_DIR, markdown_file_path, stable_pdf_key, write_text

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class _LayoutSpan:
    text: str
    x0: float
    y0: float
    x1: float
    y1: float


@dataclass(frozen=True)
class _QuestionAnchor:
    number: str
    x0: float
    y0: float
    x1: float
    y1: float



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
        if os.environ.get("EXACT_USE_MARKER", "true").strip().lower() in {"0", "false", "no"}:
            logger.info("Marker disabled by EXACT_USE_MARKER; using PyMuPDF Markdown fallback for %s", pdf_path)
            return self._convert_with_pymupdf_fallback(pdf_path)

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
                    layout_markdown = self._extract_layout_exercise_markdown(page)
                    if layout_markdown:
                        markdown = layout_markdown
                    else:
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

    def _extract_layout_exercise_markdown(self, page: Any) -> str:
        """Return cleaner text for compact multi-column exercise pages.

        PyMuPDF markdown often linearizes stacked math by y-position, which turns
        expressions such as `lim x + 3, x -> 3` into unusable vertical fragments.
        This layout pass only activates on pages with an exercise heading and
        numbered question anchors. It groups nearby spans by question number and
        keeps normal PyMuPDF extraction for non-exercise pages.
        """
        try:
            spans = self._layout_spans(page)
        except Exception:
            logger.debug("Layout exercise extraction failed", exc_info=True)
            return ""

        if not spans or not any(re.search(r"\bEXERCISE\b", span.text, re.IGNORECASE) for span in spans):
            return ""

        anchors = self._question_anchors(spans)
        if len(anchors) < 3:
            return ""

        exercise_heading = self._first_text_matching(spans, r"\bEXERCISE\s+\d+(?:\.\d+)?\b")
        instruction = self._exercise_instruction(spans)
        question_lines = self._layout_question_lines(spans, anchors)
        if len(question_lines) < 3:
            return ""

        lines = []
        if exercise_heading:
            lines.append(exercise_heading)
        if instruction:
            lines.append(instruction)
        lines.extend(question_lines)
        return "\n".join(lines).strip()

    def _layout_spans(self, page: Any) -> list[_LayoutSpan]:
        spans: list[_LayoutSpan] = []
        data = page.get_text("dict")
        for block in data.get("blocks", []):
            if block.get("type") != 0:
                continue
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    text = str(span.get("text") or "").strip()
                    if not text:
                        continue
                    x0, y0, x1, y1 = span.get("bbox", (0, 0, 0, 0))
                    spans.append(_LayoutSpan(text=text, x0=x0, y0=y0, x1=x1, y1=y1))
        return spans

    def _question_anchors(self, spans: list[_LayoutSpan]) -> list[_QuestionAnchor]:
        anchors: list[_QuestionAnchor] = []
        for span in spans:
            match = re.match(r"^(\d{1,3})\.$", span.text)
            if not match:
                continue
            number = int(match.group(1))
            if number < 1 or number > 250:
                continue
            anchors.append(_QuestionAnchor(match.group(1), span.x0, span.y0, span.x1, span.y1))
        return sorted(anchors, key=lambda item: int(item.number))

    def _first_text_matching(self, spans: list[_LayoutSpan], pattern: str) -> str:
        regex = re.compile(pattern, re.IGNORECASE)
        for span in sorted(spans, key=lambda item: (item.y0, item.x0)):
            if regex.search(span.text):
                return span.text
        return ""

    def _exercise_instruction(self, spans: list[_LayoutSpan]) -> str:
        heading = next((span for span in sorted(spans, key=lambda item: (item.y0, item.x0)) if re.search(r"\bEXERCISE\b", span.text, re.IGNORECASE)), None)
        min_y = heading.y1 if heading else 0
        candidates = [
            span for span in spans
            if span.y0 > min_y and re.search(r"\bEvaluate\b|\bfollowing\b|\bExercises\b", span.text, re.IGNORECASE)
        ]
        if not candidates:
            return ""
        candidates.sort(key=lambda item: (item.y0, item.x0))
        first_y = candidates[0].y0
        same_line = [span for span in spans if abs(span.y0 - first_y) < 4 and span.y0 > min_y]
        return self._join_plain_tokens(same_line)

    def _layout_question_lines(self, spans: list[_LayoutSpan], anchors: list[_QuestionAnchor]) -> list[str]:
        anchors_by_column = self._anchors_by_column(anchors)
        lines: list[str] = []
        for anchor in anchors:
            region = self._question_region(anchor, anchors_by_column, page_width=max((span.x1 for span in spans), default=420))
            region_spans = [
                span for span in spans
                if span.text != f"{anchor.number}."
                and region[0] <= span.x0 <= region[1]
                and region[2] <= span.y0 <= region[3]
                and not re.match(r"^\d{1,3}\.$", span.text)
                and not re.search(r"\bEXERCISE\b|\bEvaluate\b|\bReprint\b", span.text, re.IGNORECASE)
            ]
            expression = self._format_layout_expression(region_spans)
            if expression:
                lines.append(f"{anchor.number}. {expression}")
        return lines

    def _anchors_by_column(self, anchors: list[_QuestionAnchor]) -> list[list[_QuestionAnchor]]:
        columns: list[list[_QuestionAnchor]] = []
        for anchor in sorted(anchors, key=lambda item: item.x0):
            for column in columns:
                if abs(column[0].x0 - anchor.x0) < 35:
                    column.append(anchor)
                    break
            else:
                columns.append([anchor])
        for column in columns:
            column.sort(key=lambda item: item.y0)
        return columns

    def _question_region(self, anchor: _QuestionAnchor, columns: list[list[_QuestionAnchor]], page_width: float) -> tuple[float, float, float, float]:
        column = next((items for items in columns if anchor in items), [anchor])
        index = column.index(anchor)
        y_top = anchor.y0 - 18
        y_bottom = column[index + 1].y0 - 18 if index + 1 < len(column) else anchor.y0 + 48

        column_heads = sorted(items[0].x0 for items in columns)
        col_index = min(range(len(column_heads)), key=lambda idx: abs(column_heads[idx] - anchor.x0))
        x_left = max(0, anchor.x0 - 2)
        x_right = (column_heads[col_index + 1] - 8) if col_index + 1 < len(column_heads) else page_width
        return x_left, x_right, y_top, y_bottom

    def _format_layout_expression(self, spans: list[_LayoutSpan]) -> str:
        if not spans:
            return ""
        spans = sorted(spans, key=lambda item: (item.x0, item.y0))
        if any(span.text.startswith("lim") for span in spans):
            return self._format_limit_expression(spans)
        return self._join_math_tokens(spans)

    def _format_limit_expression(self, spans: list[_LayoutSpan]) -> str:
        spans = sorted(spans, key=lambda item: (item.x0, item.y0))
        lim_span = next((span for span in spans if span.text.startswith("lim")), None)
        if not lim_span:
            return self._join_math_tokens(spans)

        below = [span for span in spans if span.y0 > lim_span.y0 + 4 and span.x0 >= lim_span.x0 - 2 and span.x0 <= lim_span.x1 + 6]
        below_text = self._join_math_tokens(sorted(below, key=lambda item: (item.x0, item.y0))).replace(" ", "")
        below_text = below_text.replace("??", "?-")
        limit_part = f"lim_{{{below_text}}}" if below_text else "lim"

        body = [span for span in spans if span not in below and span is not lim_span and span.x0 > lim_span.x1 - 2]
        body_text = self._join_math_tokens(body)
        return f"{limit_part} {body_text}".strip()

    def _join_plain_tokens(self, spans: list[_LayoutSpan]) -> str:
        return " ".join(span.text for span in sorted(spans, key=lambda item: item.x0)).strip()

    def _join_math_tokens(self, spans: list[_LayoutSpan]) -> str:
        ordered_spans = self._merge_fraction_spans(sorted(spans, key=lambda item: (item.x0, item.y0)))
        tokens: list[str] = []
        previous_span: _LayoutSpan | None = None
        for span in sorted(ordered_spans, key=lambda item: (item.x0, item.y0)):
            token = self._clean_layout_token(span.text)
            if not token:
                continue
            if (
                previous_span
                and tokens
                and re.fullmatch(r"\d+", token)
                and re.search(r"[A-Za-z)]$", tokens[-1])
                and span.y0 <= previous_span.y0 - 3
                and span.x0 <= previous_span.x1 + 8
            ):
                tokens[-1] = f"{tokens[-1]}^{token}"
            else:
                tokens.append(token)
            previous_span = span
        text = " ".join(tokens)
        text = re.sub(r"\s+([,.;:)])", r"\1", text)
        text = re.sub(r"([(])\s+", r"\1", text)
        text = re.sub(r"\s+([+\-?=])\s+", r" \1 ", text)
        text = text.replace("?", "-")
        text = re.sub(r"\s+", " ", text)
        return text.strip()

    def _merge_fraction_spans(self, spans: list[_LayoutSpan]) -> list[_LayoutSpan]:
        merged: list[_LayoutSpan] = []
        consumed: set[int] = set()
        simple_term = re.compile(r"^[A-Za-z0-9]+$")
        for index, top in enumerate(spans):
            top_text = self._clean_layout_token(top.text)
            if index in consumed or not simple_term.match(top_text):
                continue
            denominator_index = None
            for candidate_index, bottom in enumerate(spans):
                if candidate_index == index or candidate_index in consumed:
                    continue
                bottom_text = self._clean_layout_token(bottom.text)
                if not simple_term.match(bottom_text):
                    continue
                horizontally_aligned = abs(((top.x0 + top.x1) / 2) - ((bottom.x0 + bottom.x1) / 2)) <= 5
                vertically_stacked = 7 <= (bottom.y0 - top.y0) <= 22
                if horizontally_aligned and vertically_stacked:
                    denominator_index = candidate_index
                    break
            if denominator_index is None:
                continue
            bottom = spans[denominator_index]
            fraction = f"{top_text}/{self._clean_layout_token(bottom.text)}"
            merged.append(_LayoutSpan(fraction, min(top.x0, bottom.x0), min(top.y0, bottom.y0), max(top.x1, bottom.x1), max(top.y1, bottom.y1)))
            consumed.add(index)
            consumed.add(denominator_index)
        for index, span in enumerate(spans):
            if index not in consumed:
                merged.append(span)
        return merged

    def _clean_layout_token(self, value: str) -> str:
        replacements = {
            "\uf8eb": "(",
            "\uf8ec": "",
            "\uf8ed": "",
            "\uf8f6": ")",
            "\uf8f7": "",
            "\uf8f8": "",
        }
        text = value
        for source, replacement in replacements.items():
            text = text.replace(source, replacement)
        return text.strip()

