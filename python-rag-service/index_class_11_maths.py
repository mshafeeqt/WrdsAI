from __future__ import annotations

import sys
from pathlib import Path

sys.path.append(str(Path.cwd()))
sys.path.append(str(Path.cwd() / ".packages"))

from app.config import settings
from app.models import IndexedChapter
from app.rag_engine.cache import chapter_index_path, read_index_manifest, write_index_manifest
from app.rag_engine.embeddings import get_embeddings
from app.rag_engine.ingestion import build_chapter_id, load_and_chunk_pdf
from langchain_community.vectorstores import FAISS


def index_class_11_maths() -> None:
    target_dir = settings.math_data_dir / "Class 11" / "Maths"
    if not target_dir.exists():
        raise FileNotFoundError(f"Directory not found: {target_dir}")

    pdf_files = sorted(target_dir.glob("*.pdf"))
    if not pdf_files:
        raise FileNotFoundError(f"No PDFs found in: {target_dir}")

    embeddings = get_embeddings()
    manifest = read_index_manifest()
    manifest.setdefault("chapters", {})

    successes = 0
    failures = 0
    total_chunks = 0
    print(f"Found {len(pdf_files)} Class 11 Maths PDFs")

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
        "Class 11 Maths semantic indexing complete: "
        f"success={successes}, failed={failures}, chunks={total_chunks}"
    )


if __name__ == "__main__":
    index_class_11_maths()