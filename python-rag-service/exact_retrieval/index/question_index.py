from __future__ import annotations

from pathlib import Path
from typing import Any

from exact_retrieval.parser.utils import (
    QUESTION_INDEX_DIR,
    class_subject_key,
    normalize_pdf_query,
    normalize_question_no,
    normalize_sub_question,
    read_json,
)


class QuestionIndex:
    """O(1) exact question lookup over `all_questions.json`."""

    def __init__(self, questions: list[dict[str, Any]]) -> None:
        self.questions = questions
        self._by_key: dict[tuple[str, str, str, str | None], dict[str, Any]] = {}
        for record in questions:
            pdf = normalize_pdf_query(str(record.get("pdf") or "")) or ""
            exercise = str(record.get("exercise") or "").strip()
            question_no = normalize_question_no(str(record.get("question_no") or ""))
            sub_question = normalize_sub_question(record.get("sub_question"))
            if pdf and exercise and question_no:
                self._by_key[(pdf, exercise, question_no, sub_question)] = record

    @classmethod
    def from_file(cls, path: Path | None = None) -> "QuestionIndex":
        return cls(read_json(path or QUESTION_INDEX_DIR / "all_questions.json", []))

    def get(
        self,
        *,
        pdf: str,
        exercise: str,
        question_no: str,
        sub_question: str | None = None,
    ) -> dict[str, Any] | None:
        normalized_pdf = normalize_pdf_query(pdf) or ""
        return self._by_key.get(
            (
                normalized_pdf,
                str(exercise).strip(),
                normalize_question_no(question_no),
                normalize_sub_question(sub_question),
            )
        )

    def find_pdf_match(
        self,
        *,
        pdf: str | None,
        exercise: str,
        question_no: str,
        sub_question: str | None = None,
    ) -> dict[str, Any] | None:
        if not pdf:
            return None
        normalized_request = normalize_pdf_query(pdf) or ""
        request_stem = normalize_pdf_query(str(pdf).removesuffix(".pdf")) or ""
        for record in self.questions:
            record_pdf = str(record.get("pdf") or "")
            normalized_record = normalize_pdf_query(record_pdf) or ""
            record_stem = normalize_pdf_query(str(Path(record_pdf).with_suffix(""))) or ""
            if not (
                normalized_record == normalized_request
                or record_stem == request_stem
                or request_stem in normalized_record
            ):
                continue
            if self._matches_question(record, exercise, question_no, sub_question):
                return record
        return None

    def find_same_class_subject_unique(
        self,
        *,
        requested_pdf: str,
        exercise: str,
        question_no: str,
        sub_question: str | None = None,
    ) -> dict[str, Any] | None:
        requested_scope = class_subject_key(requested_pdf)
        if not requested_scope:
            return None
        matches = [
            record
            for record in self.questions
            if class_subject_key(str(record.get("pdf") or "")) == requested_scope
            and self._matches_question(record, exercise, question_no, sub_question)
        ]
        return matches[0] if len(matches) == 1 else None

    def _matches_question(
        self,
        record: dict[str, Any],
        exercise: str,
        question_no: str,
        sub_question: str | None,
    ) -> bool:
        return (
            str(record.get("exercise") or "").strip() == str(exercise).strip()
            and normalize_question_no(str(record.get("question_no") or "")) == normalize_question_no(question_no)
            and normalize_sub_question(record.get("sub_question")) == normalize_sub_question(sub_question)
        )
