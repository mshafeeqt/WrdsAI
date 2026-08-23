from __future__ import annotations

import re

OPTION_LABEL_RE = re.compile(r"^\s*(\([A-D]\))\s*$", re.IGNORECASE)
OPTION_LINE_RE = re.compile(r"^\s*(\([A-D]\))\s+(.+?)\s*$", re.IGNORECASE)
CUSTOM_FONT_OPTION_LABEL_RE = re.compile(r"^\s*([D-I])\s*$")
QUESTION_NUMBER_RE = re.compile(r"^\s*\d{1,3}\s*[\).]\s+")
QUESTION_NUMBER_ONLY_RE = re.compile(r"^\s*(\d{1,3})\s*[\).]\s*$")
SIMPLE_FRACTION_TERM_RE = re.compile(r"^[+-]?(?:\d+(?:\.\d+)?|[A-Za-z])$")
ENCODED_ORGANIC_TEXT_RE = re.compile(r"(?:\:KDW|WKH|HDFK|IROORZLQJ|FRPSRXQGV|FK|QL|DQVZHU)")
REACTION_FORMULA_LINE_RE = re.compile(r"^[0-9A-Z][A-Za-z0-9().+\-\s]+$")

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
    "\u2212": "-",
    "\u2013": "-",
    "\u2014": "-",
    "â†’": "\u2192",
    "â‡Œ": "\u21cc",
    "â€“": "-",
    "Â°": "\u00b0",
}

CUSTOM_FONT_REPLACEMENTS = {
    "\x0b": "(",
    "\x0c": ")",
    "\x0f": " ",
    "\x13": "0",
    "\x14": "1",
    "\x15": "2",
    "\x16": "3",
    "\x17": "4",
    "\x18": "5",
    "\x19": "6",
    "\x1a": "7",
    "\x1b": "8",
    "\x1c": "9",
    "\x1d": "=",
    "\x9d": "\u2261",
    '"': "?",
    ":": "W",
    ";": "X",
    "[": "x",
    "\\": "y",
    "]": "z",
}

CUSTOM_FONT_UPPERCASE_MAP = str.maketrans(
    {
        "A": "x",
        "B": "y",
        "C": "z",
        "D": "a",
        "E": "b",
        "F": "c",
        "G": "d",
        "H": "e",
        "I": "f",
        "J": "g",
        "K": "h",
        "L": "i",
        "M": "j",
        "N": "k",
        "O": "l",
        "P": "m",
        "Q": "n",
        "R": "o",
        "S": "p",
        "T": "q",
        "U": "r",
        "V": "s",
        "W": "t",
        "X": "u",
        "Y": "v",
        "Z": "w",
    }
)

CUSTOM_FONT_LOWERCASE_MAP = str.maketrans(
    {
        "a": "A",
        "b": "B",
        "c": "C",
        "d": "D",
        "e": "E",
        "f": "F",
        "g": "G",
        "h": "H",
        "i": "I",
        "j": "J",
        "k": "K",
        "l": "L",
        "m": "M",
        "n": "N",
        "o": "O",
        "p": "P",
        "q": "Q",
        "r": "R",
        "s": "S",
        "t": "T",
        "u": "U",
        "v": "V",
        "w": "W",
        "x": "X",
        "y": "Y",
        "z": "Z",
    }
)


def normalize_exact_question_text(value: str) -> str:
    """Clean deterministic PDF extraction artifacts in exact question text.

    The goal is not to solve OCR in general. It fixes common textbook layout
    artifacts while preserving the original question wording: option labels
    split from their values, odd symbol glyphs, and noisy whitespace.
    """
    text = _decode_custom_pdf_font_text(str(value or ""))
    text = _replace_symbols(text)
    text = _repair_stacked_expression_options(text)
    text = _remove_page_furniture(text)
    text = _join_orphan_question_numbers(text)
    text = _join_orphan_option_labels(text)
    text = _repair_split_organic_formulae(text)
    text = _repair_split_reaction_lines(text)
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


def _decode_custom_pdf_font_text(value: str) -> str:
    """Decode NCERT Chemistry custom-font extraction artifacts.

    Some organic chemistry pages use a PDF font without usable Unicode mapping.
    PyMuPDF extracts those lines as Caesar-like glyph codes such as
    ``:KDW LV WKH`` for ``What is the`` and control characters for digits.
    Decode only lines that clearly match that artifact so normal text remains
    untouched.
    """
    decoded_lines: list[str] = []
    for line in value.split("\n"):
        if _looks_like_custom_pdf_font_line(line):
            decoded_lines.append(_decode_custom_pdf_font_line(line))
        else:
            decoded_lines.append(line)
    return "\n".join(decoded_lines)


def _looks_like_custom_pdf_font_line(line: str) -> bool:
    if any(char in line for char in ("\x0b", "\x0c", "\x13", "\x14", "\x15", "\x16", "\x17", "\x18", "\x19", "\x1a", "\x1b", "\x1c", "\x1d", "\x9d")):
        return True
    if ENCODED_ORGANIC_TEXT_RE.search(line):
        return True
    encoded_upper = sum(1 for char in line if "D" <= char <= "Z")
    return encoded_upper >= 6 and bool(re.search(r"\b(?:LV|RI|LQ|DQG|DUH|WKH)\b", line))


def _decode_custom_pdf_font_line(line: str) -> str:
    decoded_chars: list[str] = []
    for char in line:
        replacement = CUSTOM_FONT_REPLACEMENTS.get(char)
        if replacement is not None:
            decoded_chars.append(replacement)
        elif "A" <= char <= "Z":
            decoded_chars.append(char.translate(CUSTOM_FONT_UPPERCASE_MAP))
        elif "a" <= char <= "z":
            decoded_chars.append(char.translate(CUSTOM_FONT_LOWERCASE_MAP))
        else:
            decoded_chars.append(char)
    decoded = "".join(decoded_chars)
    return _restore_common_chemistry_formula_case(decoded)


def _restore_common_chemistry_formula_case(value: str) -> str:
    text = value
    formula_replacements = {
        "CH3": "CH3",
        "CH2": "CH2",
        "CH4": "CH4",
        "C2": "C2",
        "C3": "C3",
        "C6": "C6",
        "H2": "H2",
        "H3": "H3",
        "H5": "H5",
        "H6": "H6",
        "H2O": "H2O",
        "H2SO4": "H2SO4",
        "NAOH": "NaOH",
        "AGCL": "AgCl",
        "CCL4": "CCl4",
        "CARIUS": "Carius",
        "DUMAS": "Dumas",
        "KJELDAHL": "Kjeldahl",
        "LASSAIGNE": "Lassaigne",
        "IUPAC": "IUPAC",
    }
    for source, replacement in formula_replacements.items():
        text = re.sub(rf"\b{re.escape(source)}\b", replacement, text)
    return text


def _remove_page_furniture(value: str) -> str:
    cleaned: list[str] = []
    for line in value.splitlines():
        stripped = line.strip()
        if not stripped:
            cleaned.append(line.rstrip())
            continue
        if re.fullmatch(r"(?:PHYSICS|MATHEMATICS|SCIENCE)", stripped, re.IGNORECASE):
            continue
        if re.fullmatch(r"[A-Z][A-Z\s,&-]{4,}", stripped) and not re.search(r"\bEXERCISES?\b", stripped, re.IGNORECASE):
            continue
        if re.fullmatch(r"Reprint\s+\d{4}-\d{2}", stripped, re.IGNORECASE):
            continue
        if re.fullmatch(r"\d{1,4}", stripped):
            continue
        cleaned.append(line.rstrip())
    return "\n".join(cleaned)


def _join_orphan_question_numbers(value: str) -> str:
    lines = value.splitlines()
    joined: list[str] = []
    index = 0
    while index < len(lines):
        line = lines[index].rstrip()
        question_match = QUESTION_NUMBER_ONLY_RE.match(line)
        if question_match:
            next_index = _next_non_empty_line_index(lines, index + 1)
            if next_index is not None:
                next_line = lines[next_index].strip()
                if not QUESTION_NUMBER_ONLY_RE.match(next_line):
                    joined.append(f"{question_match.group(1)}. {next_line}")
                    index = next_index + 1
                    continue
        joined.append(line)
        index += 1
    return "\n".join(joined)


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
        custom_option_match = CUSTOM_FONT_OPTION_LABEL_RE.match(line)
        if custom_option_match:
            next_index = _next_non_empty_line_index(lines, index + 1)
            if next_index is not None:
                next_line = lines[next_index].strip()
                if not QUESTION_NUMBER_RE.match(next_line):
                    option_char = chr(ord("a") + ord(custom_option_match.group(1)) - ord("D"))
                    joined.append(f"({option_char}) {next_line}")
                    index = next_index + 1
                    continue
        joined.append(line)
        index += 1
    return "\n".join(joined)


def _repair_split_organic_formulae(value: str) -> str:
    text = value
    text = re.sub(r"\bCH3\s*\n\s*(\d+[A-Z][A-Za-z0-9]*)", r"(CH3)\1", text)
    text = re.sub(r"\bC6H5\s*\n\s*([A-Z][A-Za-z0-9+-]*)", r"C6H5-\1", text)
    return text


def _repair_split_reaction_lines(value: str) -> str:
    lines = value.splitlines()
    repaired: list[str] = []
    index = 0

    while index < len(lines):
        line = lines[index].strip()
        next_line = lines[index + 1].strip() if index + 1 < len(lines) else ""
        if _is_reaction_formula_line(line) and _is_reaction_formula_line(next_line):
            repaired.append(f"{line} \u21cc {next_line}")
            index += 2
            continue
        repaired.append(lines[index].rstrip())
        index += 1

    return "\n".join(repaired)


def _is_reaction_formula_line(value: str) -> bool:
    if not value or QUESTION_NUMBER_RE.match(value) or OPTION_LINE_RE.match(value):
        return False
    if not REACTION_FORMULA_LINE_RE.match(value):
        return False
    return bool(re.search(r"[A-Z][a-z]?\d*", value)) and not bool(
        re.search(r"\b(?:Calculate|Find|Assign|What|Which|The|At|Problem)\b", value)
    )



def _trim_trailing_caption_footer(value: str) -> str:
    lines = value.splitlines()
    for index, line in enumerate(lines):
        if not re.match(r"^\s*Fig\.?\s*\d+(?:\.\d+)?\s*$", line, re.IGNORECASE):
            continue
        tail = "\n".join(lines[index + 1 :]).strip()
        if not tail or re.search(r"\b(?:Reprint|MATHEMATICS|SCIENCE)\b|^\d{1,4}$", tail, re.IGNORECASE | re.MULTILINE):
            return "\n".join(lines[:index]).rstrip()
    return value


def _repair_stacked_expression_options(value: str) -> str:
    """Repair common visual fractions split across lines in MCQ options.

    PyMuPDF sometimes emits a stacked expression like ``T - mv^2/l`` as:
    denominator, numerator letters, base term, exponent/sign lines. Keeping
    this deterministic avoids hallucinating problem text while recovering the
    exact mathematical intent visible in the PDF.
    """
    lines = value.splitlines()
    repaired: list[str] = []
    index = 0

    while index < len(lines):
        line = lines[index].rstrip()
        option_match = re.search(r"(\([ivx]+\)|\([A-D]\))\s*$", line, re.IGNORECASE)
        if option_match:
            expression = _read_stacked_signed_fraction(lines, index + 1)
            if expression:
                consumed, option_text = expression
                prefix = line[: option_match.start(1)].rstrip()
                label = option_match.group(1)
                connector = " " if not prefix or prefix.endswith((",", ":", ";")) else " "
                repaired.append(f"{prefix}{connector}{label} {option_text}".strip())
                index += consumed + 1
                continue
        repaired.append(line)
        index += 1

    return "\n".join(repaired)


def _read_stacked_signed_fraction(lines: list[str], start: int) -> tuple[int, str] | None:
    tokens: list[str] = []
    index = start

    while index < len(lines) and len(tokens) < 6:
        token = lines[index].strip()
        if token:
            tokens.append(token)
        index += 1

    if len(tokens) < 4:
        return None

    denominator, numerator = tokens[:2]

    if not (
        re.fullmatch(r"[A-Za-z]+", denominator)
        and re.fullmatch(r"[A-Za-z]+", numerator)
    ):
        return None

    if re.fullmatch(r"[A-Za-z]+", tokens[2] if len(tokens) > 2 else ""):
        base = tokens[2]
        exponent_or_sign = tokens[3]
        sign = tokens[4] if len(tokens) > 4 else ""
        tail = tokens[5] if len(tokens) > 5 else ""
        if exponent_or_sign[:1] in {"+", "-"}:
            operator = exponent_or_sign[:1]
            exponent = ""
            consumed = 4
            tail = exponent_or_sign[1:].strip() or sign
        elif re.fullmatch(r"\d+", exponent_or_sign) and sign[:1] in {"+", "-"}:
            operator = sign[:1]
            exponent = exponent_or_sign
            consumed = 5
            tail = sign[1:].strip() or tail
        else:
            return None
    elif (
        (tokens[2] if len(tokens) > 2 else "")[:1] in {"+", "-"}
        and re.fullmatch(r"[A-Za-z]+(?:.*)?", tokens[3] if len(tokens) > 3 else "")
    ):
        operator = tokens[2][:1]
        base = re.match(r"[A-Za-z]+", tokens[3]).group(0)
        inline_tail = tokens[3][len(base) :].strip()
        exponent_or_tail = tokens[4] if len(tokens) > 4 else ""
        exponent = ""
        consumed = 4
        tail = inline_tail or exponent_or_tail
        if re.fullmatch(r"\d+", exponent_or_tail):
            exponent = exponent_or_tail
            consumed = 5
            tail = tokens[5] if len(tokens) > 5 else ""
    else:
        return None

    fraction = f"{numerator}{'^' + exponent if exponent else ''}/{denominator}"
    expression = f"{base} {operator} {fraction}"

    if tail:
        inline_tail = tail
        if re.match(r"^,\s*\([ivx]+\)\s*$", inline_tail, re.IGNORECASE):
            return consumed, expression
        if re.match(r"^,\s*\(", inline_tail):
            expression = f"{expression}{inline_tail}"
            consumed += 1

    return consumed, expression

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
