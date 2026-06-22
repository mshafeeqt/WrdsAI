# Python Chapter RAG Service

This service provides a structured, chapter-locked RAG pipeline for the existing chatbot project.

## What it does

- Ingests chapter PDFs from `chatbot-backend/Math_Data`
- Splits them into meaningful chunks
- Generates embeddings with OpenAI
- Stores vectors in a persistent FAISS vector index on disk
- Retrieves only from the selected chapter
- Returns compact context blocks for the Node backend
- Keeps chapter scope strict so answers stay inside the chosen chapter

## Why this is safe

- The current Node.js RAG remains as a fallback
- Node uses this service only when `PYTHON_RAG_URL` is configured
- If the service is down, chat falls back to the existing JavaScript RAG

## Environment

Create a `.env` file in this folder with:

```env
OPENAI_API_KEY=your_key_here
MATH_DATA_DIR=../chatbot-backend/Math_Data
RAG_VECTOR_DB_DIR=./data/vector_db
RAG_INDEX_MANIFEST_PATH=./data/index_manifest.json
RAG_EMBEDDING_MODEL=text-embedding-3-small
RAG_CHUNK_SIZE=1200
RAG_CHUNK_OVERLAP=180
RAG_TOP_K=5
RAG_SCORE_THRESHOLD=0.34
RAG_MAX_CONTEXT_CHARS=4000
```

`OPENAI_API_KEY` is required because embeddings are generated in Python during indexing and retrieval.

## Install

```bash
pip install -r requirements.txt
```

## Run

```bash
pwsh ./run_rag_service.ps1
```

Because dependencies were installed into the project-local `.packages` folder, the launcher script sets `PYTHONPATH` for you.

You can also start the service directly from this folder:

```bash
uvicorn main:app --host 0.0.0.0 --port 8001
```

`main.py` is the production entrypoint and re-exports the FastAPI app from `app/main.py`.

## Rebuild the vector index

```bash
pwsh ./rebuild_index.ps1
```

## Recommended backend env

In the Node backend `.env`:

```env
PYTHON_RAG_URL=http://127.0.0.1:8001
```

## Backend helper endpoints

Once the backend is running, you can also use:

```text
GET  /api/ai/rag/health
POST /api/ai/rag/rebuild
```

These proxy to the Python RAG service from Node.

## Full RAG flow

1. `POST /rag/index/rebuild`
2. Service reads all chapter PDFs
3. PDFs are chunked with overlap
4. Embeddings are generated
5. Chunks + metadata are stored in persistent FAISS indexes on disk
6. Manifest metadata is stored in `index_manifest.json`
7. Node backend calls retrieval endpoint during chapter-locked chat
8. Retrieval filters by the exact selected chapter only
9. Node injects retrieved context into the final LLM prompt

## Endpoints

- `GET /rag/health`
- `POST /rag/index/rebuild`
- `POST /rag/chapters/retrieve`
## Exact retrieval layer

This service also includes a separate exact retrieval pipeline beside the existing FAISS semantic RAG. It does not replace embeddings or semantic search.

Exact retrieval supports:

- PDF/page lookup, such as `Show page 45`
- Exercise/question lookup, such as `Solve question 2 from exercise 8.1`
- JSON indexes with preserved PDF page numbers

Rebuild the exact indexes after adding or changing PDFs:

```powershell
python -m exact_retrieval.build_index
```

Or rebuild through the API while the service is running:

```http
POST /rag/exact/rebuild
```

Generated exact indexes are stored in:

- `data/parsed/` for question JSON per PDF
- `data/page_index/` for page text JSON
- `data/question_index/` for combined question lookup

Runtime flow:

1. `/rag/chapters/retrieve` checks exact intent first.
2. If an exact page/question is found, it returns exact context.
3. If not, it falls back to the existing semantic FAISS retrieval unchanged.
