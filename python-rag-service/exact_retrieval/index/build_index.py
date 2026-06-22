from __future__ import annotations

import logging
from pathlib import Path

try:
    from tqdm import tqdm
except ImportError:  # pragma: no cover - local fallback for minimal installs
    def tqdm(iterable, **_kwargs):  # type: ignore[no-redef]
        return iterable

from exact_retrieval.parser.figure_extractor import FigureExtractor
from exact_retrieval.parser.marker_parser import MarkerParser
from exact_retrieval.parser.markdown_parser import MarkdownParser
from exact_retrieval.parser.utils import (
    FIGURES_DIR,
    MARKDOWN_DIR,
    PAGE_INDEX_DIR,
    PARSED_DIR,
    QUESTION_INDEX_DIR,
    dump_records,
    get_pdf_root,
    list_pdf_files,
    per_pdf_page_file_path,
    per_pdf_question_file_path,
    parsed_file_path,
    reset_exact_dirs,
    stable_pdf_key,
    write_json,
)
from exact_retrieval.schemas.models import ExactIndexSummary, Page, Question

logger = logging.getLogger(__name__)


class ExactIndexBuilder:
    """Build exact retrieval JSON from Marker Markdown and extracted figures."""

    def __init__(
        self,
        *,
        marker_parser: MarkerParser | None = None,
        markdown_parser: MarkdownParser | None = None,
        figure_extractor: FigureExtractor | None = None,
    ) -> None:
        self.marker_parser = marker_parser or MarkerParser()
        self.markdown_parser = markdown_parser or MarkdownParser()
        self.figure_extractor = figure_extractor or FigureExtractor()

    def rebuild(self, pdf_root: Path | None = None) -> ExactIndexSummary:
        reset_exact_dirs()
        root = pdf_root or get_pdf_root()
        pdf_files = list_pdf_files(root)
        all_pages: list[Page] = []
        all_questions: list[Question] = []
        figures_extracted = 0
        failed_pdfs = 0

        logger.info("Starting exact index rebuild for %s PDFs", len(pdf_files))
        for pdf_path in tqdm(pdf_files, desc="Exact PDFs", unit="pdf"):
            pdf_key = stable_pdf_key(pdf_path, root)
            try:
                markdown_path = self.marker_parser.convert_pdf_to_markdown(pdf_path, root)
                markdown = markdown_path.read_text(encoding="utf-8")
                figures = self.figure_extractor.extract_figures(pdf_path, root)
                pages, questions = self.markdown_parser.parse(
                    markdown=markdown,
                    pdf_path=pdf_path,
                    pdf_root=root,
                    figures=figures,
                )
                self._write_pdf_outputs(pdf_key, pages, questions)
                all_pages.extend(pages)
                all_questions.extend(questions)
                figures_extracted += len(figures)
            except Exception:
                failed_pdfs += 1
                logger.exception("Failed to build exact index for %s", pdf_path)
                continue

        write_json(PAGE_INDEX_DIR / "all_pages.json", dump_records(all_pages))
        write_json(QUESTION_INDEX_DIR / "all_questions.json", dump_records(all_questions))

        summary = ExactIndexSummary(
            pdfs_processed=len(pdf_files),
            pages_indexed=len(all_pages),
            questions_indexed=len(all_questions),
            figures_extracted=figures_extracted,
            failed_pdfs=failed_pdfs,
            parsed_dir=str(PARSED_DIR),
            page_index_dir=str(PAGE_INDEX_DIR),
            question_index_dir=str(QUESTION_INDEX_DIR),
            markdown_dir=str(MARKDOWN_DIR),
            figures_dir=str(FIGURES_DIR),
        )
        logger.info("Exact index rebuild complete: %s", summary)
        return summary

    def _write_pdf_outputs(self, pdf_key: str, pages: list[Page], questions: list[Question]) -> None:
        question_payload = dump_records(questions)
        write_json(parsed_file_path(pdf_key), question_payload)
        write_json(per_pdf_question_file_path(pdf_key), question_payload)
        write_json(per_pdf_page_file_path(pdf_key), dump_records(pages))


def rebuild_exact_indexes(pdf_root: Path | None = None) -> ExactIndexSummary:
    """Public rebuild entrypoint used by scripts/API."""
    return ExactIndexBuilder().rebuild(pdf_root)


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
    summary = rebuild_exact_indexes()
    print(summary.to_dict())


if __name__ == "__main__":
    main()
