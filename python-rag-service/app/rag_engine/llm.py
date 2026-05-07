from __future__ import annotations


def build_chapter_guardrails(chapter: str, context_text: str, query: str) -> str:
    # Prompt helper kept separate so retrieval and prompt-construction stay decoupled.
    return f"""
Selected chapter: {chapter}

Use only the retrieved chapter context below to answer the user's question.
If the answer is not supported by the chapter context, clearly say that the selected chapter does not contain enough information.
Do not answer from other chapters, outside knowledge, or general web knowledge.

Retrieved chapter context:
{context_text}

User question:
{query}
""".strip()
