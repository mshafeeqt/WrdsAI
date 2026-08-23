from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any, Literal

from exact_retrieval.index.page_index import PageIndex
from exact_retrieval.index.question_index import QuestionIndex
from exact_retrieval.parser.question_text_normalizer import normalize_exact_question_text
from exact_retrieval.parser.utils import PAGE_INDEX_DIR, normalize_pdf_query, normalize_sub_question, read_json

logger = logging.getLogger(__name__)

IntentType = Literal["page", "question", "semantic"]
PAGE_RE = re.compile(r"\b(?:what\s+is\s+on|show|open|get|display)?\s*page\s+(\d{1,4})\b", re.IGNORECASE)
EXERCISE_RE = re.compile(r"\b(?:ex(?:ercise)?\s*\.?\s*(?:set\s*)?|exercise\s+set\s+)(\d+(?:\.\d+)?)\b", re.IGNORECASE)
QUESTION_RE = re.compile(
    r"\b(?:q(?:uestion)?\s*\.?|problem\s*(?:no\.?|number)?|question\s*(?:no\.?|number)?|no\.?)\s*(\d{1,3})(?:\s*\(?([ivxlcdm]+)\)?)?\b"
    r"|\bsolve\s+(?:problem|question|q)?\s*(\d{1,3})(?:\s*\(?([ivxlcdm]+)\)?)?\b",
    re.IGNORECASE,
)
NCERT_NUMBERED_QUESTION_RE = re.compile(
    r"\b(?:q(?:uestion)?|que|ques|problem|prob)\s*(?:no\.?|number)?\s*([A-Z]?\d{1,2})\.(\d{1,3}[a-z]?)(?:\s*\(?([ivxlcdm]+)\)?)?\b",
    re.IGNORECASE,
)
BARE_NCERT_NUMBERED_QUESTION_RE = re.compile(
    r"(?:\b(?:solve|answer|do|find|explain|show)\s+(?:the\s+)?)"
    r"([A-Z]?\d{1,2})\.(\d{1,3}[a-z]?)(?:\s*\(?([ivxlcdm]+)\)?)?\b"
    r"|\b([A-Z]?\d{1,2})\.(\d{1,3}[a-z]?)(?:\s*\(?([ivxlcdm]+)\)?)?\s+from\s+exercises?\b",
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

    numbered_question = _extract_ncert_numbered_question(value)
    if numbered_question:
        exercise, question_no, sub_question = numbered_question
        return ExactIntent(
            type="question",
            pdf=pdf,
            exercise=exercise,
            question_no=question_no,
            sub_question=sub_question,
        )

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


def _extract_ncert_numbered_question(query: str) -> tuple[str, str, str | None] | None:
    """Parse Physics-style labels like question 2.1 as chapter/exercise 2, question 1."""
    match = NCERT_NUMBERED_QUESTION_RE.search(query)
    if match:
        exercise = match.group(1).upper()
        question_no = match.group(2).lower()
        sub_question = normalize_sub_question(match.group(3))
        return exercise, question_no, sub_question

    bare_match = BARE_NCERT_NUMBERED_QUESTION_RE.search(query)
    if not bare_match:
        return None
    groups = [group for group in bare_match.groups() if group]
    if len(groups) < 2:
        return None
    exercise = groups[0].upper()
    question_no = groups[1].lower()
    sub_question = normalize_sub_question(groups[2] if len(groups) > 2 else None)
    return exercise, question_no, sub_question


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

        chapter_number_match = _find_chapter_numbered_question(
            index=index,
            pdf=pdf,
            exercise=exercise,
            question_no=question_no,
            sub_question=sub_question,
        )
        if chapter_number_match:
            return _question_result(
                chapter_number_match,
                requested_pdf=pdf,
                lookup_scope="selected_pdf_chapter_numbered",
            )

        page_text_match = _find_question_from_page_text(
            pdf=pdf,
            exercise=exercise,
            question_no=question_no,
            sub_question=sub_question,
        )
        if page_text_match:
            return _question_result(
                page_text_match,
                requested_pdf=pdf,
                lookup_scope="selected_pdf_page_text",
            )

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


def get_pdf_question_unique(
    *,
    pdf: str,
    question_no: str,
    sub_question: str | None = None,
) -> dict[str, Any] | None:
    """Return a question by number when the selected PDF makes it unambiguous."""
    index = QuestionIndex.from_file()
    matches = [
        record
        for record in index.questions
        if _pdf_matches(str(record.get("pdf") or ""), pdf)
        and str(record.get("question_no") or "").strip().lower() == str(question_no).strip().lower()
        and normalize_sub_question(record.get("sub_question")) == normalize_sub_question(sub_question)
    ]
    return _question_result(matches[0], requested_pdf=pdf, lookup_scope="selected_pdf_unique_question") if len(matches) == 1 else None


def _find_question_from_page_text(
    *,
    pdf: str,
    exercise: str,
    question_no: str,
    sub_question: str | None,
) -> dict[str, Any] | None:
    """Fallback exact extraction from page text for NCERT labels such as 4.3."""
    if sub_question:
        return None
    exercise_value = str(exercise or "").strip()
    question_value = str(question_no or "").strip().lower()
    if not exercise_value or not question_value:
        return None

    label = f"{exercise_value}.{question_value}"
    pages = [
        record
        for record in read_json(PAGE_INDEX_DIR / "all_pages.json", [])
        if _pdf_matches(str(record.get("pdf") or ""), pdf)
    ]
    if not pages:
        return None

    pages.sort(key=lambda item: int(item.get("page") or 0))
    page_offsets: list[tuple[int, int]] = []
    chunks: list[str] = []
    cursor = 0
    for page in pages:
        marker = f"\n[[PAGE:{int(page.get('page') or 0)}]]\n"
        text = str(page.get("text") or page.get("markdown") or "")
        chunks.append(marker)
        cursor += len(marker)
        page_offsets.append((cursor, int(page.get("page") or 0)))
        chunks.append(text)
        cursor += len(text)
    combined = "".join(chunks)

    label_regex = re.compile(rf"(?m)^\s*{re.escape(label)}\b", re.IGNORECASE)
    exercises_heading = re.compile(r"(?m)^\s*EXERCISES\s*$", re.IGNORECASE)
    heading_matches = list(exercises_heading.finditer(combined))
    if not heading_matches:
        return None
    exercise_section_start = heading_matches[-1].end()
    start_match = next(
        (candidate for candidate in label_regex.finditer(combined, exercise_section_start)),
        None,
    )
    if not start_match:
        return None

    end_index = len(combined)
    label_pattern = re.compile(r"(?m)^\s*([A-Z]?\d{1,2})\.(\d{1,3}[a-z]?)\b", re.IGNORECASE)
    for match in label_pattern.finditer(combined, start_match.end()):
        next_exercise = match.group(1)
        next_question = match.group(2).lower()
        if next_exercise == "0":
            continue
        if next_exercise == exercise_value and next_question == question_value:
            continue
        end_index = match.start()
        break

    raw_question_text = re.sub(r"\s*\[\[PAGE:\d+\]\]\s*", "\n", combined[start_match.start():end_index])
    text = normalize_exact_question_text(raw_question_text).strip()
    if len(text) < len(label) + 4:
        return None

    page_number = pages[0].get("page")
    for offset, page in page_offsets:
        if offset <= start_match.start():
            page_number = page
        else:
            break

    record_pdf = str(pages[0].get("pdf") or pdf)
    return {
        "id": f"{Path(record_pdf).stem}_{exercise_value}_{question_value}_page_text",
        "pdf": record_pdf,
        "page": page_number,
        "chapter": exercise_value,
        "exercise": exercise_value,
        "question_no": question_value,
        "sub_question": None,
        "question_markdown": text,
        "question_text": text,
        "figures": [],
    }


def _find_chapter_numbered_question(
    *,
    index: QuestionIndex,
    pdf: str,
    exercise: str,
    question_no: str,
    sub_question: str | None,
) -> dict[str, Any] | None:
    """Support chapter-numbered textbooks where question 2.1 means chapter 2, no. 1."""
    exercise_value = str(exercise or "").strip()
    if not re.fullmatch(r"\d+\.\d+", exercise_value):
        return None

    chapter_no, embedded_question_no = exercise_value.split(".", 1)
    if embedded_question_no != str(question_no).strip():
        return None

    return index.find_pdf_match(
        pdf=pdf,
        exercise=chapter_no,
        question_no=question_no,
        sub_question=sub_question,
    )


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
    if selected_pdf:
        question_no, sub_question = _extract_question_and_subquestion(query)
        if question_no:
            pdf_question = get_pdf_question_unique(
                pdf=selected_pdf,
                question_no=question_no,
                sub_question=sub_question,
            )
            if pdf_question:
                return pdf_question
    return "semantic"



def exact_result_to_context(result: dict[str, Any]) -> str:
    """Format exact retrieval output for the existing Node prompt contract."""
    result_type = result.get("type")
    if result_type == "page":
        return (
            "Exact page match\n"
            f"PDF: {result.get('pdf')}\n"
            f"Page: {result.get('page')}\n\n"
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
            f"{mismatch_note}\n"
            f"{result.get('markdown') or result.get('text') or ''}"
        ).strip()

    return str(result.get("text") or "")
