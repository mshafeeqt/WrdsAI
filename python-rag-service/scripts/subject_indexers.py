from __future__ import annotations

import logging
import os
from pathlib import Path

try:
    from tqdm import tqdm
except ImportError:  # pragma: no cover
    def tqdm(iterable, **_kwargs):  # type: ignore[no-redef]
        return iterable

from app.config import settings
from app.models import IndexedChapter
from app.rag_engine.cache import chapter_index_path, read_index_manifest, write_index_manifest
from app.rag_engine.embeddings import get_embeddings
from app.rag_engine.ingestion import build_chapter_id, load_and_chunk_pdf
from exact_retrieval.index.build_index import ExactIndexBuilder
from exact_retrieval.parser.utils import (
    PAGE_INDEX_DIR,
    QUESTION_INDEX_DIR,
    dump_records,
    ensure_exact_dirs,
    parsed_file_path,
    per_pdf_page_file_path,
    per_pdf_question_file_path,
    read_json,
    stable_pdf_key,
    write_json,
)
from exact_retrieval.schemas.models import Page, Question
from langchain_community.vectorstores import FAISS

logger = logging.getLogger(__name__)


def subject_dir(class_name: str, subject: str) -> Path:
    """Return the source PDF directory for one class and subject."""
    target = settings.math_data_dir / class_name / subject
    if not target.exists():
        raise FileNotFoundError(f"Directory not found: {target}")
    return target


def list_subject_pdfs(class_name: str, subject: str) -> list[Path]:
    """Return PDFs for one class and subject in deterministic order."""
    pdf_files = sorted(subject_dir(class_name, subject).glob("*.pdf"))
    if not pdf_files:
        raise FileNotFoundError(f"No PDFs found in: {subject_dir(class_name, subject)}")
    return pdf_files


def build_subject_exact_index(
    *,
    class_name: str,
    subject: str,
    use_marker: bool = False,
) -> None:
    """Build exact retrieval JSON for one subject without touching other records."""
    logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
    ensure_exact_dirs()

    root = settings.math_data_dir
    pdf_files = list_subject_pdfs(class_name, subject)
    record_prefix = f"{class_name}/{subject}/".lower()

    previous_marker_setting = os.environ.get("EXACT_USE_MARKER")
    os.environ["EXACT_USE_MARKER"] = "true" if use_marker else "false"

    builder = ExactIndexBuilder()
    all_pages: list[Page] = []
    all_questions: list[Question] = []
    failed = 0

    print(f"Found {len(pdf_files)} {class_name} {subject} PDFs")
    try:
        for pdf_path in tqdm(pdf_files, desc=f"{class_name} {subject} exact", unit="pdf"):
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
    finally:
        if previous_marker_setting is None:
            os.environ.pop("EXACT_USE_MARKER", None)
        else:
            os.environ["EXACT_USE_MARKER"] = previous_marker_setting

    existing_pages = read_json(PAGE_INDEX_DIR / "all_pages.json", [])
    existing_questions = read_json(QUESTION_INDEX_DIR / "all_questions.json", [])

    merged_pages = [record for record in existing_pages if not _record_pdf(record).lower().startswith(record_prefix)]
    merged_questions = [record for record in existing_questions if not _record_pdf(record).lower().startswith(record_prefix)]
    merged_pages.extend(dump_records(all_pages))
    merged_questions.extend(dump_records(all_questions))

    write_json(PAGE_INDEX_DIR / "all_pages.json", merged_pages)
    write_json(QUESTION_INDEX_DIR / "all_questions.json", merged_questions)

    print(
        f"{class_name} {subject} exact indexing complete: "
        f"pdfs={len(pdf_files)}, failed={failed}, "
        f"pages={len(all_pages)}, questions={len(all_questions)}"
    )


def build_subject_semantic_index(*, class_name: str, subject: str) -> None:
    """Build semantic FAISS indexes for one subject without touching other chapters."""
    pdf_files = list_subject_pdfs(class_name, subject)
    embeddings = get_embeddings()
    manifest = read_index_manifest()
    manifest.setdefault("chapters", {})

    successes = 0
    failures = 0
    total_chunks = 0
    print(f"Found {len(pdf_files)} {class_name} {subject} PDFs")

    for pdf_path in pdf_files:
        chapter = build_chapter_id(pdf_path)
        print(f"[*] Indexing semantic FAISS: {chapter}")
        try:
            documents = load_and_chunk_pdf(pdf_path)
            if not documents:
                print(f"[!] No content found in {pdf_path}")
                failures += 1
                continue

            vector_store = FAISS.from_documents(documents, embeddings)
            index_path = chapter_index_path(chapter)
            index_path.mkdir(parents=True, exist_ok=True)
            vector_store.save_local(str(index_path))

            indexed_chapter = IndexedChapter(
                chapter=chapter,
                source_file=pdf_path.relative_to(settings.math_data_dir).as_posix(),
                chunk_count=len(documents),
                file_mtime_ms=int(pdf_path.stat().st_mtime * 1000),
            )
            manifest["chapters"][chapter] = indexed_chapter.model_dump()
            successes += 1
            total_chunks += len(documents)
            print(f"[OK] {chapter} ({len(documents)} chunks)")
        except Exception as exc:
            failures += 1
            print(f"[X] Failed {chapter}: {exc}")

    write_index_manifest(manifest)
    print(
        f"{class_name} {subject} semantic indexing complete: "
        f"success={successes}, failed={failures}, chunks={total_chunks}"
    )


def _record_pdf(record: dict) -> str:
    return str(record.get("pdf") or "").replace("\\", "/")

