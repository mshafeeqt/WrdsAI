import sys
import os
from pathlib import Path

# Add the project root to sys.path so we can import 'app'
sys.path.append(str(Path.cwd()))
# Add .packages to path
sys.path.append(str(Path.cwd() / ".packages"))

from app.rag_engine.ingestion import load_and_chunk_pdf, build_chapter_id
from app.rag_engine.cache import chapter_index_path, write_index_manifest, read_index_manifest
from app.config import settings
from app.rag_engine.embeddings import get_embeddings
from langchain_community.vectorstores import FAISS
from app.models import IndexedChapter

def index_batch(pdf_names):
    print(f"[*] Starting Batch Indexing for {len(pdf_names)} chapters...")
    embeddings = get_embeddings()
    math_data_dir = settings.math_data_dir
    target_dir = math_data_dir / "Class 10" / "Maths"
    
    manifest = read_index_manifest()
    if "chapters" not in manifest:
        manifest["chapters"] = {}

    for pdf_name in pdf_names:
        pdf_path = target_dir / pdf_name
        if not pdf_path.exists():
            print(f"[X] File not found: {pdf_path}")
            continue

        chapter = build_chapter_id(pdf_path)
        print(f"[*] Processing: {chapter}")
        
        try:
            # Use EXACT same logic as ingestion.py
            documents = load_and_chunk_pdf(pdf_path)
            if not documents:
                print(f"[!] No content in {pdf_path}")
                continue

            vector_store = FAISS.from_documents(documents, embeddings)
            index_path = chapter_index_path(chapter)
            index_path.mkdir(parents=True, exist_ok=True)
            vector_store.save_local(str(index_path))

            file_mtime_ms = int(pdf_path.stat().st_mtime * 1000)
            chunk_count = len(documents)
            
            indexed_chapter = IndexedChapter(
                chapter=chapter,
                source_file=pdf_path.relative_to(settings.math_data_dir).as_posix(),
                chunk_count=chunk_count,
                file_mtime_ms=file_mtime_ms,
            )
            manifest["chapters"][chapter] = indexed_chapter.model_dump()
            print(f"[✓] Successfully indexed: {chapter} ({chunk_count} chunks)")
        except Exception as e:
            print(f"[X] Critical error indexing {chapter}: {e}")

    write_index_manifest(manifest)
    print("[*] Batch indexing complete. Manifest updated.")

if __name__ == "__main__":
    # Batch 1
    batch_1 = [
        "Real Numbers.pdf",
        "Polynomials.pdf",
        "Pair of Linear Equations in Two Variables.pdf",
        "Quadratic Equations.pdf"
    ]
    index_batch(batch_1)
