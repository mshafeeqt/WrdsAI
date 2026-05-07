from __future__ import annotations

from pathlib import Path
from typing import List

from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import settings
from app.models import IndexedChapter, RebuildIndexResponse
from app.rag_engine.cache import (
    chapter_index_path,
    normalize_chapter_name,
    reset_vector_db_dir,
    write_index_manifest,
)
from app.rag_engine.embeddings import get_embeddings


def build_text_splitter() -> RecursiveCharacterTextSplitter:
    # All chapter PDFs are chunked with the same splitter so retrieval behavior stays predictable.
    return RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )


def list_chapter_pdfs() -> List[Path]:
    # The local Math_Data folder is the current RAG corpus.
    if not settings.math_data_dir.exists():
        raise FileNotFoundError(
            f"Math data directory not found: {settings.math_data_dir}"
        )

    pdf_files = sorted(settings.math_data_dir.rglob("*.pdf"))
    if not pdf_files:
        raise FileNotFoundError(
            f"No chapter PDFs found in: {settings.math_data_dir}"
        )

    return pdf_files


def build_chapter_id(pdf_path: Path) -> str:
    # Use the relative path inside Math_Data as the stable chapter/document id.
    relative_path = pdf_path.relative_to(settings.math_data_dir)
    return normalize_chapter_name(relative_path.as_posix())


def load_and_chunk_pdf(pdf_path: Path) -> List[Document]:
    # Load one PDF and split it into retrieval-sized chunks with chapter-aware metadata.
    loader = PyPDFLoader(str(pdf_path))
    splitter = build_text_splitter()
    chapter = build_chapter_id(pdf_path)
    source_path = pdf_path.relative_to(settings.math_data_dir).as_posix()
    raw_docs = loader.load()
    chunked_docs = splitter.split_documents(raw_docs)

    for index, doc in enumerate(chunked_docs):
        # This metadata makes it possible to trace every retrieved chunk back to its chapter and page.
        doc.metadata["chapter"] = chapter
        doc.metadata["source"] = source_path
        doc.metadata["chunk_index"] = index
        doc.metadata["page"] = doc.metadata.get("page")

    return chunked_docs


def rebuild_chapter_indexes() -> RebuildIndexResponse:
    # Full indexing pipeline:
    # 1. read all chapter PDFs
    # 2. chunk them
    # 3. generate embeddings
    # 4. save one FAISS index per chapter
    # 5. write a manifest for debugging/inspection
    embeddings = get_embeddings()
    reset_vector_db_dir()

    manifest = {"chapters": {}}
    indexed_chapters: List[IndexedChapter] = []
    total_chunks = 0

    for pdf_path in list_chapter_pdfs():
        chapter = build_chapter_id(pdf_path)
        print(f"[*] Indexing chapter: {chapter}")
        documents = load_and_chunk_pdf(pdf_path)
        if not documents:
            print(f"[!] No content found in {pdf_path}")
            continue

        # One separate FAISS index per chapter keeps runtime retrieval strictly chapter-scoped.
        vector_store = FAISS.from_documents(documents, embeddings)
        index_path = chapter_index_path(chapter)
        index_path.mkdir(parents=True, exist_ok=True)
        vector_store.save_local(str(index_path))

        file_mtime_ms = int(pdf_path.stat().st_mtime * 1000)
        chunk_count = len(documents)
        total_chunks += chunk_count
        print(f"[✓] Indexed {chunk_count} chunks for {chapter}")


        indexed_chapter = IndexedChapter(
            chapter=chapter,
            source_file=pdf_path.relative_to(settings.math_data_dir).as_posix(),
            chunk_count=chunk_count,
            file_mtime_ms=file_mtime_ms,
        )
        indexed_chapters.append(indexed_chapter)
        manifest["chapters"][chapter] = indexed_chapter.model_dump()

    write_index_manifest(manifest)

    return RebuildIndexResponse(
        collection_name=settings.collection_name,
        indexed_chapters=len(indexed_chapters),
        indexed_chunks=total_chunks,
        chapters=indexed_chapters,
    )
