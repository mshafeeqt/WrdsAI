import sys
from pathlib import Path

# Add current directory and .packages to path
sys.path.append(str(Path.cwd()))
sys.path.append(str(Path.cwd() / ".packages"))

from app.rag_engine.engine import get_rag_engine
from app.rag_engine.ingestion import load_and_chunk_pdf, build_chapter_id
from app.rag_engine.cache import chapter_index_path, write_index_manifest, read_index_manifest
from app.config import settings
from app.rag_engine.embeddings import get_embeddings
from langchain_community.vectorstores import FAISS
from app.models import IndexedChapter

def index_class_10_maths():
    engine = get_rag_engine()
    embeddings = get_embeddings()
    math_data_dir = settings.math_data_dir
    target_dir = math_data_dir / "Class 10" / "Maths"
    
    if not target_dir.exists():
        print(f"Directory not found: {target_dir}")
        return

    pdf_files = list(target_dir.glob("*.pdf"))
    print(f"Found {len(pdf_files)} PDFs in {target_dir}")

    manifest = read_index_manifest()
    if "chapters" not in manifest:
        manifest["chapters"] = {}

    for pdf_path in pdf_files:
        chapter = build_chapter_id(pdf_path)
        print(f"[*] Indexing: {chapter}")
        
        try:
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
            print(f"[✓] Success: {chapter} ({chunk_count} chunks)")
        except Exception as e:
            print(f"[X] Error indexing {chapter}: {e}")

    write_index_manifest(manifest)
    print("Indexing complete.")

if __name__ == "__main__":
    index_class_10_maths()
