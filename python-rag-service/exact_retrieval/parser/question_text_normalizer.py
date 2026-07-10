from __future__ import annotations

import re

OPTION_LABEL_RE = re.compile(r"^\s*(\([A-D]\))\s*$", re.IGNORECASE)
OPTION_LINE_RE = re.compile(r"^\s*(\([A-D]\))\s+(.+?)\s*$", re.IGNORECASE)
QUESTION_NUMBER_RE = re.compile(r"^\s*\d{1,3}\s*[\).]\s+")
SIMPLE_FRACTION_TERM_RE = re.compile(r"^[+-]?(?:\d+(?:\.\d+)?|[A-Za-z])$")

SYMBOL_REPLACEMENTS = {
    "\uf020": " ",
    "\uf02b": "+",
    "\uf02d": "-",
    "\uf02e": ".",
    "\uf030": "0",
    "\uf031": "1",
    "\uf032": "2",
    "\uf033": "3",
    "\uf034": "4",
    "\uf035": "5",
    "\uf036": "6",
    "\uf037": "7",
    "\uf038": "8",
    "\uf039": "9",
    "\uf03c": "<",
    "\uf03d": "=",
    "\uf03e": ">",
    "\uf040": "\u2245",
    "\uf044": "\u0394",
    "\uf04b": "K",
    "\uf04e": "N",
    "\uf05b": "[",
    "\uf05d": "]",
    "\uf05e": "\u22a5",
    "\uf061": "\u03b1",
    "\uf062": "\u03b2",
    "\uf067": "+",
    "\uf06f": "o",
    "\uf070": "\u03c0",
    "\uf071": "\u03b8",
    "\uf0a2": "'",
    "\uf0a3": "\u2264",
    "\uf0ab": "\u2265",
    "\uf0b0": "\u00b0",
    "\uf0b1": "\u00b1",
    "\uf0b4": "\u00d7",
    "\uf0b9": "\u2260",
    "\uf0d0": "\u2220",
    "\uf0d7": "\u00d7",
    "\uf0e6": "",
    "\uf0e7": "",
    "\uf0e8": "",
    "\uf0f6": "",
    "\uf0f7": "",
    "\uf0f8": "",
    "\uf8eb": "",
    "\uf8ec": "",
    "\uf8ed": "",
    "\uf8f6": "",
    "\uf8f7": "",
    "\uf8f8": "",
    "\u2215": "/",
    "\u2044": "/",
}


def normalize_exact_question_text(value: str) -> str:
    """Clean deterministic PDF extraction artifacts in exact question text.

    The goal is not to solve OCR in general. It fixes common textbook layout
    artifacts while preserving the original question wording: option labels
    split from their values, odd symbol glyphs, and noisy whitespace.
    """
    text = _replace_symbols(str(value or ""))
    text = _join_orphan_option_labels(text)
    text = _trim_trailing_caption_footer(text)
    text = _join_stacked_option_fractions(text)
    text = _compact_inline_options(text)
    text = _normalize_spacing(text)
    return text.strip()


def _replace_symbols(value: str) -> str:
    text = value
    for source, replacement in SYMBOL_REPLACEMENTS.items():
        text = text.replace(source, replacement)
    return text


def _join_orphan_option_labels(value: str) -> str:
    lines = value.splitlines()
    joined: list[str] = []
    index = 0
    while index < len(lines):
        line = lines[index].rstrip()
        option_match = OPTION_LABEL_RE.match(line)
        if option_match:
            next_index = _next_non_empty_line_index(lines, index + 1)
            if next_index is not None:
                next_line = lines[next_index].strip()
                if not OPTION_LINE_RE.match(next_line) and not QUESTION_NUMBER_RE.match(next_line):
                    joined.append(f"{option_match.group(1).upper()} {next_line}")
                    index = next_index + 1
                    continue
        joined.append(line)
        index += 1
    return "\n".join(joined)



def _trim_trailing_caption_footer(value: str) -> str:
    lines = value.splitlines()
    for index, line in enumerate(lines):
        if not re.match(r"^\s*Fig\.?\s*\d+(?:\.\d+)?\s*$", line, re.IGNORECASE):
            continue
        tail = "\n".join(lines[index + 1 :]).strip()
        if not tail or re.search(r"\b(?:Reprint|MATHEMATICS|SCIENCE)\b|^\d{1,4}$", tail, re.IGNORECASE | re.MULTILINE):
            return "\n".join(lines[:index]).rstrip()
    return value

def _join_stacked_option_fractions(value: str) -> str:
    lines = value.splitlines()
    joined: list[str] = []
    index = 0
    while index < len(lines):
        line = lines[index].rstrip()
        option_match = OPTION_LINE_RE.match(line)
        if option_match and _is_simple_fraction_term(option_match.group(2).strip()):
            next_index = _next_non_empty_line_index(lines, index + 1)
            if next_index is not None:
                denominator = lines[next_index].strip()
                if _is_simple_fraction_term(denominator):
                    joined.append(f"{option_match.group(1).upper()} {option_match.group(2).strip()}/{denominator}")
                    index = next_index + 1
                    continue
        joined.append(line)
        index += 1
    return "\n".join(joined)


def _is_simple_fraction_term(value: str) -> bool:
    return bool(SIMPLE_FRACTION_TERM_RE.match(value.strip()))

def _next_non_empty_line_index(lines: list[str], start: int) -> int | None:
    for index in range(start, len(lines)):
        if lines[index].strip():
            return index
    return None


def _compact_inline_options(value: str) -> str:
    lines = [line.strip() for line in value.splitlines()]
    compacted: list[str] = []
    option_buffer: list[str] = []

    def flush_options() -> None:
        nonlocal option_buffer
        if option_buffer:
            compacted.append(" ".join(option_buffer))
            option_buffer = []

    for line in lines:
        if not line:
            flush_options()
            compacted.append("")
            continue
        if OPTION_LINE_RE.match(line):
            option_buffer.append(line)
            continue
        flush_options()
        compacted.append(line)

    flush_options()
    return "\n".join(compacted)


def _normalize_spacing(value: str) -> str:
    text = value.replace("\t", " ")
    text = re.sub(r"[ \u00a0]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"\s+([,.;:])", r"\1", text)
    text = re.sub(r"(\([A-D]\))\s+", r"\1 ", text, flags=re.IGNORECASE)
    return text
