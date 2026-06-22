"""Exact PDF retrieval package.

This package is intentionally separate from the existing semantic FAISS RAG
pipeline. It builds lightweight JSON indexes for exact page / exercise /
question lookup, then lets the API route exact hits before semantic retrieval.
"""