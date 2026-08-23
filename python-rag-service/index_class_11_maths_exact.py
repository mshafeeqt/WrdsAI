from __future__ import annotations

import logging
import sys
from pathlib import Path

try:
    from tqdm import tqdm
except ImportError:  # pragma: no cover
    def tqdm(iterable, **_kwargs):  # type: ignore[no-redef]
        return iterable

sys.path.append(str(Path.cwd()))
sys.path.append(str(Path.cwd() / ".packages"))

from app.config import settings
from exact_retrieval.index.build_index import ExactIndexBuilder
from exact_retrieval.parser.utils import (
    PAGE_INDEX_DIR,
    PARSED_DIR,
    QUESTION_INDEX_DIR,
    dump_records,
    ensure_exact_dirs,
    per_pdf_page_file_path,
    per_pdf_question_file_path,
    read_json,
    stable_pdf_key,
    parsed_file_path,
    write_json,
)
from exact_retrieval.schemas.models import Page, Question

logger = logging.getLogger(__name__)


def _record_pdf(record: dict) -> str:
    return str(record.get("pdf") or "").replace("\\", "/")


def _is_class_11_maths_record(record: dict) -> bool:
    return _record_pdf(record).lower().startswith("class 11/maths/")


def index_class_11_maths_exact() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
    ensure_exact_dirs()

    root = settings.math_data_dir
    target_dir = root / "Class 11" / "Maths"
    if not target_dir.exists():
        raise FileNotFoundError(f"Directory not found: {target_dir}")

    pdf_files = sorted(target_dir.glob("*.pdf"))
    if not pdf_files:
        raise FileNotFoundError(f"No PDFs found in: {target_dir}")

    builder = ExactIndexBuilder()
    all_pages: list[Page] = []
    all_questions: list[Question] = []
    failed = 0

    print(f"Found {len(pdf_files)} Class 11 Maths PDFs")
    for pdf_path in tqdm(pdf_files, desc="Class 11 exact", unit="pdf"):
        pdf_key = stable_pdf_key(pdf_path, root)
        try:
            pages, questions = builder.build_pdf(pdf_path=pdf_path, pdf_root=root)
            question_payload = dump_records(questions)
            write_json(parsed_file_path(pdf_key), question_payload)
            write_json(per_pdf_question_file_path(pdf_key), question_payload)
            write_json(per_pdf_page_file_path(pdf_key), dump_records(pages))
            all_pages.extend(pages)
            all_questions.extend(questions)
            print(f"[OK] {pdf_key}: pages={len(pages)}, questions={len(questions)}")
        except Exception:
            failed += 1
            logger.exception("Failed exact indexing for %s", pdf_path)

    existing_pages = read_json(PAGE_INDEX_DIR / "all_pages.json", [])
    existing_questions = read_json(QUESTION_INDEX_DIR / "all_questions.json", [])

    merged_pages = [record for record in existing_pages if not _is_class_11_maths_record(record)]
    merged_questions = [record for record in existing_questions if not _is_class_11_maths_record(record)]
    merged_pages.extend(dump_records(all_pages))
    merged_questions.extend(dump_records(all_questions))

    write_json(PAGE_INDEX_DIR / "all_pages.json", merged_pages)
    write_json(QUESTION_INDEX_DIR / "all_questions.json", merged_questions)

    print(
        "Class 11 Maths exact indexing complete: "
        f"pdfs={len(pdf_files)}, failed={failed}, "
        f"pages={len(all_pages)}, questions={len(all_questions)}"
    )


if __name__ == "__main__":
    index_class_11_maths_exact()