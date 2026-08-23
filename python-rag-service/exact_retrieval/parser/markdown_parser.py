from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from exact_retrieval.parser.question_text_normalizer import normalize_exact_question_text
from exact_retrieval.parser.utils import (
    normalize_sub_question,
    slugify,
    split_markdown_pages,
    stable_pdf_key,
    strip_markdown,
)
from exact_retrieval.schemas.models import Page, Question

logger = logging.getLogger(__name__)

CHAPTER_RE = re.compile(r"\b(?:CHAPTER|Chapter)\s+(\d+[A-Za-z]?)\b")
EXERCISE_RE = re.compile(r"\bExercise\s*(?:Set)?\s*(\d+(?:\.\d+)?)\b", re.IGNORECASE)
EXERCISE_HEADING_ONLY_RE = re.compile(r"^\s*(?:#{1,6}\s*)?Exercise\s*(?:Set)?\s*$", re.IGNORECASE)
EXERCISES_HEADING_RE = re.compile(r"^\s*(?:#{1,6}\s*)?Exercises\s*$", re.IGNORECASE)
EXERCISE_NUMBER_ONLY_RE = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*$")
QUESTION_RE = re.compile(r"^\s*(?:#{1,6}\s*)?(?:[-*+]\s*)?(\d{1,3})\s*[\).]\s*(.*)$")
NCERT_EXERCISE_QUESTION_RE = re.compile(
    r"^\s*(?:#{1,6}\s*)?(?:Problem\s+)?(\d{1,2})\.(\d{1,3})\b\s*(.*)$",
    re.IGNORECASE,
)
SUBQUESTION_RE = re.compile(r"^\s*(?:[-*+]\s*)?\(?([ivx]+)\)\s*(.*)$", re.IGNORECASE)
STOP_SECTION_RE = re.compile(r"^\s*(?:\d+(?:\.\d+)*\s+)?(?:summary|hints?|solutions?)\b|^\s*answers\s*$", re.IGNORECASE)


@dataclass(frozen=True)
class MarkdownLine:
    page: int
    text: str


@dataclass(frozen=True)
class QuestionBlock:
    question_no: str
    page: int
    chapter: str | None
    exercise: str | None
    lines: list[MarkdownLine]


class MarkdownParser:
    """Parse Marker Markdown into exact page and question records."""

    def parse(
        self,
        *,
        markdown: str,
        pdf_path: Path,
        pdf_root: Path,
        figures_by_page: dict[int, list[dict[str, Any]]] | None = None,
    ) -> tuple[list[Page], list[Question]]:
        pdf_key = stable_pdf_key(pdf_path, pdf_root)
        figure_map = figures_by_page or {}
        pages = self._parse_pages(pdf_key, markdown, figure_map)
        questions = self._parse_questions(pdf_key, markdown, figure_map)
        return pages, questions

    def _parse_pages(
        self,
        pdf_key: str,
        markdown: str,
        figures_by_page: dict[int, list[dict[str, Any]]],
    ) -> list[Page]:
        pages: list[Page] = []
        for page_no, page_markdown in split_markdown_pages(markdown):
            pages.append(
                Page(
                    pdf=pdf_key,
                    page=page_no,
                    markdown=page_markdown,
                    text=strip_markdown(page_markdown),
                    figures=figures_by_page.get(page_no, []),
                )
            )
        return pages

    def _parse_questions(
        self,
        pdf_key: str,
        markdown: str,
        figures_by_page: dict[int, list[dict[str, Any]]],
    ) -> list[Question]:
        blocks = self._collect_question_blocks(markdown, pdf_key=pdf_key)
        questions: list[Question] = []
        seen_ids: set[str] = set()

        for block in blocks:
            parent = self._question_from_block(
                pdf_key=pdf_key,
                block=block,
                sub_question=None,
                lines=block.lines,
                figures_by_page=figures_by_page,
            )
            if parent.id not in seen_ids:
                questions.append(parent)
                seen_ids.add(parent.id)

            for sub_question, sub_lines in self._split_subquestions(block.lines).items():
                sub_record = self._question_from_block(
                    pdf_key=pdf_key,
                    block=block,
                    sub_question=sub_question,
                    lines=sub_lines,
                    figures_by_page=figures_by_page,
                )
                if sub_record.id not in seen_ids:
                    questions.append(sub_record)
                    seen_ids.add(sub_record.id)

        return questions

    def _collect_question_blocks(self, markdown: str, *, pdf_key: str) -> list[QuestionBlock]:
        blocks: list[QuestionBlock] = []
        current_chapter: str | None = None
        current_exercise: str | None = None
        active: QuestionBlock | None = None
        last_question_number = 0
        pending_exercise_heading = False
        in_numbered_exercises = False
        allow_problem_numbered_questions = "organic chemistry" in pdf_key.lower()

        for page_no, page_markdown in split_markdown_pages(markdown):
            for raw_line in page_markdown.splitlines():
                line = raw_line.rstrip()
                stripped = line.strip()
                if not stripped:
                    if active:
                        active.lines.append(MarkdownLine(page_no, line))
                    continue

                chapter_match = CHAPTER_RE.search(stripped)
                if chapter_match:
                    current_chapter = chapter_match.group(1)

                if pending_exercise_heading:
                    exercise_number_match = EXERCISE_NUMBER_ONLY_RE.match(stripped)
                    if exercise_number_match:
                        if active:
                            blocks.append(active)
                            active = None
                        current_exercise = exercise_number_match.group(1)
                        in_numbered_exercises = False
                        current_chapter = current_exercise.split(".", 1)[0] or current_chapter
                        last_question_number = 0
                        pending_exercise_heading = False
                        continue
                    pending_exercise_heading = False

                if page_no > 2 and EXERCISES_HEADING_RE.match(stripped):
                    if active:
                        blocks.append(active)
                        active = None
                    current_exercise = current_chapter
                    last_question_number = 0
                    in_numbered_exercises = True
                    continue

                if EXERCISE_HEADING_ONLY_RE.match(stripped):
                    pending_exercise_heading = True
                    in_numbered_exercises = False
                    continue

                exercise_match = EXERCISE_RE.search(stripped)
                if exercise_match and exercise_match.start() == 0:
                    if active:
                        blocks.append(active)
                        active = None
                    current_exercise = exercise_match.group(1)
                    in_numbered_exercises = False
                    current_chapter = current_exercise.split(".", 1)[0] or current_chapter
                    last_question_number = 0
                    continue

                if STOP_SECTION_RE.match(stripped):
                    if active:
                        blocks.append(active)
                        active = None
                    current_exercise = None
                    in_numbered_exercises = False
                    last_question_number = 0
                    continue

                ncert_question_match = NCERT_EXERCISE_QUESTION_RE.match(stripped)
                if ncert_question_match and (
                    in_numbered_exercises
                    or (allow_problem_numbered_questions and stripped.lower().startswith("problem "))
                ):
                    exercise_no = ncert_question_match.group(1)
                    question_no = ncert_question_match.group(2)
                    if self._is_ncert_question_start(
                        exercise_no=exercise_no,
                        current_exercise=current_exercise,
                        current_chapter=current_chapter,
                    ):
                        question_number = int(re.match(r"\d+", question_no).group(0))
                        if active:
                            blocks.append(active)
                        current_exercise = exercise_no
                        current_chapter = exercise_no
                        last_question_number = question_number
                        active = QuestionBlock(
                            question_no=question_no,
                            page=page_no,
                            chapter=current_chapter,
                            exercise=current_exercise,
                            lines=[MarkdownLine(page_no, stripped)],
                        )
                        continue

                question_match = QUESTION_RE.match(stripped)
                if (current_exercise or in_numbered_exercises) and question_match:
                    question_no = question_match.group(1).lstrip("*")
                    if question_no.isdigit():
                        question_number = int(question_no)
                        if question_number > last_question_number:
                            if active:
                                blocks.append(active)
                            if not current_exercise:
                                current_exercise = current_chapter or "chapter"
                            last_question_number = question_number
                            active = QuestionBlock(
                                question_no=question_no,
                                page=page_no,
                                chapter=current_chapter,
                                exercise=current_exercise,
                                lines=[MarkdownLine(page_no, stripped)],
                            )
                            continue

                if active:
                    active.lines.append(MarkdownLine(page_no, line))

        if active:
            blocks.append(active)

        return [block for block in blocks if self._is_probable_question(block)]

    def _is_ncert_question_start(
        self,
        *,
        exercise_no: str,
        current_exercise: str | None,
        current_chapter: str | None,
    ) -> bool:
        """Avoid treating wrapped decimal values like `0.1 kg` as question labels."""
        del current_chapter
        if exercise_no == "0":
            return False
        if current_exercise and exercise_no != current_exercise:
            return False
        return True

    def _is_probable_question(self, block: QuestionBlock) -> bool:
        text = strip_markdown("\n".join(line.text for line in block.lines))
        if len(text) < 6:
            return False
        lowered = text.lower()
        return not lowered.startswith(("example ", "solution ", "summary "))

    def _split_subquestions(self, lines: list[MarkdownLine]) -> dict[str, list[MarkdownLine]]:
        subquestions: dict[str, list[MarkdownLine]] = {}
        current_key: str | None = None

        for line in lines:
            match = SUBQUESTION_RE.match(line.text.strip())
            if match:
                key = normalize_sub_question(match.group(1))
                if key:
                    current_key = key
                    subquestions[current_key] = [line]
                    continue
            if current_key:
                subquestions[current_key].append(line)

        return {
            key: value
            for key, value in subquestions.items()
            if len(strip_markdown("\n".join(line.text for line in value))) >= 2
        }

    def _question_from_block(
        self,
        *,
        pdf_key: str,
        block: QuestionBlock,
        sub_question: str | None,
        lines: list[MarkdownLine],
        figures_by_page: dict[int, list[dict[str, Any]]],
    ) -> Question:
        question_markdown = normalize_exact_question_text("\n".join(line.text for line in lines).strip())
        question_text = normalize_exact_question_text(strip_markdown(question_markdown))
        page = lines[0].page if lines else block.page
        question_figures = self._figures_for_lines(lines, figures_by_page)
        question_id = self._question_id(
            pdf_key=pdf_key,
            exercise=block.exercise,
            question_no=block.question_no,
            sub_question=sub_question,
            page=page,
        )
        return Question(
            id=question_id,
            pdf=pdf_key,
            page=page,
            chapter=block.chapter,
            exercise=block.exercise,
            question_no=block.question_no,
            sub_question=sub_question,
            question_markdown=question_markdown,
            question_text=question_text,
            figures=question_figures,
        )

    def _figures_for_lines(
        self,
        lines: list[MarkdownLine],
        figures_by_page: dict[int, list[dict[str, Any]]],
    ) -> list[dict[str, Any]]:
        pages = {line.page for line in lines}
        figures: list[dict[str, Any]] = []
        seen: set[str] = set()
        for page in sorted(pages):
            for figure in figures_by_page.get(page, []):
                key = str(figure.get("path") or figure)
                if key in seen:
                    continue
                seen.add(key)
                figures.append(figure)
        return figures

    def _question_id(
        self,
        *,
        pdf_key: str,
        exercise: str | None,
        question_no: str,
        sub_question: str | None,
        page: int,
    ) -> str:
        parts = [
            slugify(Path(pdf_key).stem),
            exercise or "exercise",
            question_no,
        ]
        if sub_question:
            parts.append(sub_question)
        parts.append(f"p{page}")
        return "_".join(parts)
