from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any, Literal

from exact_retrieval.index.page_index import PageIndex
from exact_retrieval.index.question_index import QuestionIndex
from exact_retrieval.parser.utils import normalize_pdf_query, normalize_sub_question

logger = logging.getLogger(__name__)

IntentType = Literal["page", "question", "semantic"]
PAGE_RE = re.compile(r"\b(?:what\s+is\s+on|show|open|get|display)?\s*page\s+(\d{1,4})\b", re.IGNORECASE)
EXERCISE_RE = re.compile(r"\b(?:ex(?:ercise)?\s*\.?\s*(?:set\s*)?|exercise\s+set\s+)(\d+(?:\.\d+)?)\b", re.IGNORECASE)
QUESTION_RE = re.compile(
    r"\b(?:q(?:uestion)?\s*\.?|problem\s*(?:no\.?|number)?|question\s*(?:no\.?|number)?|no\.?)\s*(\d{1,3})(?:\s*\(?([ivxlcdm]+)\)?)?\b"
    r"|\bsolve\s+(?:problem|question|q)?\s*(\d{1,3})(?:\s*\(?([ivxlcdm]+)\)?)?\b",
    re.IGNORECASE,
)
PART_RE = re.compile(r"\b(?:part|sub\s*question)\s*\(?([ivxlcdm]+)\)?\b", re.IGNORECASE)
ORDINAL_PART_RE = re.compile(r"\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\s+part\b", re.IGNORECASE)
QUESTION_PART_RE = re.compile(r"\bquestion\s+(\d{1,3})\s*\(?([ivxlcdm]+)\)?\b", re.IGNORECASE)
PDF_RE = re.compile(r"\b(?:pdf|book|file)\s*[:=]?\s*([\w\s().,&'-]+\.pdf)\b", re.IGNORECASE)
ORDINAL_TO_ROMAN = {
    "first": "i",
    "second": "ii",
    "third": "iii",
    "fourth": "iv",
    "fifth": "v",
    "sixth": "vi",
    "seventh": "vii",
    "eighth": "viii",
    "ninth": "ix",
    "tenth": "x",
}


class ExactIntent:
    """Small runtime intent object for exact retrieval."""

    def __init__(
        self,
        *,
        type: IntentType,
        pdf: str | None = None,
        page: int | None = None,
        exercise: str | None = None,
        question_no: str | None = None,
        sub_question: str | None = None,
    ) -> None:
        self.type = type
        self.pdf = pdf
        self.page = page
        self.exercise = exercise
        self.question_no = question_no
        self.sub_question = sub_question


def detect_intent(query: str) -> ExactIntent:
    """Detect exact page/question requests without changing API contracts."""
    value = str(query or "").strip()
    if not value:
        return ExactIntent(type="semantic")

    pdf = _first_group(PDF_RE.search(value))
    page_match = PAGE_RE.search(value)
    if page_match:
        return ExactIntent(type="page", pdf=pdf, page=int(page_match.group(1)))

    exercise = _first_group(EXERCISE_RE.search(value))
    question_no, sub_question = _extract_question_and_subquestion(value)
    if exercise and question_no:
        return ExactIntent(
            type="question",
            pdf=pdf,
            exercise=exercise,
            question_no=question_no,
            sub_question=sub_question,
        )

    return ExactIntent(type="semantic", pdf=pdf)


def _first_group(match: re.Match[str] | None) -> str | None:
    if not match:
        return None
    for group in match.groups():
        if group:
            return group.strip()
    return None


def _extract_question_and_subquestion(query: str) -> tuple[str | None, str | None]:
    direct_part = QUESTION_PART_RE.search(query)
    if direct_part:
        return direct_part.group(1), normalize_sub_question(direct_part.group(2))

    question_match = QUESTION_RE.search(query)
    question_no: str | None = None
    sub_question: str | None = None
    if question_match:
        groups = [group for group in question_match.groups() if group]
        if groups:
            question_no = groups[0]
        if len(groups) > 1:
            sub_question = normalize_sub_question(groups[1])

    explicit_part = PART_RE.search(query)
    if explicit_part:
        sub_question = normalize_sub_question(explicit_part.group(1))

    ordinal_part = ORDINAL_PART_RE.search(query)
    if ordinal_part:
        sub_question = ORDINAL_TO_ROMAN.get(ordinal_part.group(1).lower())

    return question_no, sub_question


def _pdf_matches(record_pdf: str, requested_pdf: str | None) -> bool:
    normalized_request = normalize_pdf_query(requested_pdf)
    if not normalized_request:
        return True
    normalized_record = normalize_pdf_query(record_pdf) or ""
    record_name = normalize_pdf_query(Path(record_pdf).name) or ""
    record_stem = normalize_pdf_query(Path(record_pdf).stem) or ""
    request_stem = normalize_pdf_query(str(requested_pdf or "").removesuffix(".pdf")) or ""
    return (
        normalized_record == normalized_request
        or record_name == normalized_request
        or record_stem == request_stem
        or request_stem in normalized_record
        or request_stem in record_name
    )


def _question_result(
    record: dict[str, Any],
    *,
    requested_pdf: str | None,
    lookup_scope: str,
) -> dict[str, Any]:
    pdf = str(record.get("pdf") or "")
    return {
        "type": "question",
        "pdf": record.get("pdf"),
        "chapter_id": pdf.removesuffix(".pdf"),
        "requested_pdf": requested_pdf,
        "selected_pdf_matched": _pdf_matches(pdf, requested_pdf),
        "lookup_scope": lookup_scope,
        "page": record.get("page"),
        "chapter": record.get("chapter"),
        "exercise": record.get("exercise"),
        "question_no": record.get("question_no"),
        "sub_question": record.get("sub_question"),
        "text": record.get("question_text") or "",
        "markdown": record.get("question_markdown") or "",
        "figures": record.get("figures") or [],
    }


def _page_result(record: dict[str, Any]) -> dict[str, Any]:
    pdf = str(record.get("pdf") or "")
    return {
        "type": "page",
        "pdf": record.get("pdf"),
        "chapter_id": pdf.removesuffix(".pdf"),
        "page": record.get("page"),
        "text": record.get("text") or "",
        "markdown": record.get("markdown") or "",
        "figures": record.get("figures") or [],
    }


def get_page(pdf: str | None = None, page: int | None = None) -> dict[str, Any] | None:
    """Return exact page context from the page index."""
    if not pdf or page is None:
        return None
    record = PageIndex.from_file().get(pdf=pdf, page=page)
    return _page_result(record) if record else None


def get_question(
    pdf: str | None = None,
    exercise: str | None = None,
    question_no: str | None = None,
    sub_question: str | None = None,
) -> dict[str, Any] | None:
    """Return an exact question from the Marker-backed question index."""
    if not exercise or not question_no:
        return None

    index = QuestionIndex.from_file()
    if pdf:
        exact = index.find_pdf_match(
            pdf=pdf,
            exercise=exercise,
            question_no=question_no,
            sub_question=sub_question,
        )
        if exact:
            return _question_result(exact, requested_pdf=pdf, lookup_scope="selected_pdf")

        same_scope = index.find_same_class_subject_unique(
            requested_pdf=pdf,
            exercise=exercise,
            question_no=question_no,
            sub_question=sub_question,
        )
        if same_scope:
            return _question_result(same_scope, requested_pdf=pdf, lookup_scope="same_class_subject")
        return None

    global_matches = [
        record
        for record in index.questions
        if str(record.get("exercise") or "").strip() == str(exercise).strip()
        and str(record.get("question_no") or "").strip().lower() == str(question_no).strip().lower()
        and normalize_sub_question(record.get("sub_question")) == normalize_sub_question(sub_question)
    ]
    if len(global_matches) == 1:
        return _question_result(global_matches[0], requested_pdf=None, lookup_scope="global_unique")
    return None


def route_query(query: str, pdf: str | None = None) -> dict[str, Any] | str | None:
    """Route a query to exact retrieval or semantic fallback."""
    intent = detect_intent(query)
    selected_pdf = pdf or intent.pdf

    if intent.type == "page":
        return get_page(pdf=selected_pdf, page=intent.page)
    if intent.type == "question":
        return get_question(
            pdf=selected_pdf,
            exercise=intent.exercise,
            question_no=intent.question_no,
            sub_question=intent.sub_question,
        )
    return "semantic"


def exact_result_to_context(result: dict[str, Any]) -> str:
    """Format exact retrieval output for the existing Node prompt contract."""
    result_type = result.get("type")
    if result_type == "page":
        return (
            "Exact page match\n"
            f"PDF: {result.get('pdf')}\n"
            f"Page: {result.get('page')}\n"
            f"Figures: {len(result.get('figures') or [])}\n\n"
            f"{result.get('markdown') or result.get('text') or ''}"
        ).strip()

    if result_type == "question":
        mismatch_note = ""
        if result.get("lookup_scope") == "same_class_subject":
            mismatch_note = (
                "\nNote: The selected chapter did not contain this exact exercise question. "
                "A unique exact match was found in another PDF from the same class and subject.\n"
            )
        sub_question = result.get("sub_question")
        sub_line = f"Sub-question: {sub_question}\n" if sub_question else ""
        return (
            "Exact question match\n"
            f"PDF: {result.get('pdf')}\n"
            f"Requested PDF: {result.get('requested_pdf') or ''}\n"
            f"Lookup Scope: {result.get('lookup_scope') or 'selected_pdf'}\n"
            f"Page: {result.get('page')}\n"
            f"Chapter: {result.get('chapter') or ''}\n"
            f"Exercise: {result.get('exercise') or ''}\n"
            f"Question: {result.get('question_no') or ''}\n"
            f"{sub_line}"
            f"Figures: {len(result.get('figures') or [])}"
            f"{mismatch_note}\n\n"
            f"{result.get('markdown') or result.get('text') or ''}"
        ).strip()

    return str(result.get("text") or "")
