from __future__ import annotations

import logging

from exact_retrieval.parser.markdown_parser import MarkdownParser
from exact_retrieval.parser.utils import (
    PAGE_INDEX_DIR,
    QUESTION_INDEX_DIR,
    dump_records,
    get_pdf_root,
    list_pdf_files,
    markdown_file_path,
    per_pdf_page_file_path,
    per_pdf_question_file_path,
    parsed_file_path,
    stable_pdf_key,
    write_json,
)
from exact_retrieval.schemas.models import Page, Question

logger = logging.getLogger(__name__)


def reparse_existing_markdown() -> dict[str, int]:
    root = get_pdf_root()
    parser = MarkdownParser()
    all_pages: list[Page] = []
    all_questions: list[Question] = []
    missing_markdown = 0

    for pdf_path in list_pdf_files(root):
        pdf_key = stable_pdf_key(pdf_path, root)
        markdown_path = markdown_file_path(pdf_key)
        if not markdown_path.exists():
            missing_markdown += 1
            logger.warning("Markdown missing for %s", pdf_key)
            continue

        markdown = markdown_path.read_text(encoding="utf-8")
        pages = parser._parse_pages(pdf_key, markdown)  # noqa: SLF001
        questions = parser._parse_questions(pdf_key, markdown)  # noqa: SLF001
        write_json(per_pdf_page_file_path(pdf_key), dump_records(pages))
        write_json(per_pdf_question_file_path(pdf_key), dump_records(questions))
        write_json(parsed_file_path(pdf_key), dump_records(questions))
        all_pages.extend(pages)
        all_questions.extend(questions)

    write_json(PAGE_INDEX_DIR / "all_pages.json", dump_records(all_pages))
    write_json(QUESTION_INDEX_DIR / "all_questions.json", dump_records(all_questions))
    return {
        "pdfs": len({page.pdf for page in all_pages}),
        "pages": len(all_pages),
        "questions": len(all_questions),
        "missing_markdown": missing_markdown,
    }


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
    print(reparse_existing_markdown())


if __name__ == "__main__":
    main()