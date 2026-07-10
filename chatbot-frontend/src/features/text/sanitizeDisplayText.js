const MOJIBAKE_REPLACEMENTS = [
  ["\u00CE\u00B1", "\u03b1"],
  ["\u00CE\u00B2", "\u03b2"],
  ["\u00CE\u00B3", "\u03b3"],
  ["\u00CE\u00B4", "\u03b4"],
  ["\u00CE\u00B8", "\u03b8"],
  ["\u00CE\u00BB", "\u03bb"],
  ["\u00CE\u00BC", "\u03bc"],
  ["\u00CF\u20AC", "\u03c0"],
  ["\u00CF\u2020", "\u03c6"],
  ["\u00CE\u201D", "\u0394"],
  ["\u00C2\u00B0", "\u00b0"],
  ["\u00C2\u00B2", "\u00b2"],
  ["\u00C2\u00B3", "\u00b3"],
  ["\u00C2\u00B1", "\u00b1"],
  ["\u00C2\u00B7", "\u00b7"],
  ["\u00C3\u2014", "\u00d7"],
  ["\u00C3\u00B7", "\u00f7"],
  ["\u00E2\u02C6\u0161", "\u221a"],
  ["\u00E2\u02C6\u2019", "\u2212"],
  ["\u00E2\u2030\u00A4", "\u2264"],
  ["\u00E2\u2030\u00A5", "\u2265"],
  ["\u00E2\u2030\u00A0", "\u2260"],
  ["\u00E2\u2020\u2019", "\u2192"],
  ["\u00E2\u2020\u0090", "\u2190"],
  ["\u00E2\u02C6\u00A0", "\u2220"],
  ["\u00E2\u02C6\u2020", "\u2206"],
  ["\u00E2\u02C6\u017E", "\u221e"],
  ["\u00E2\u20AC\u2122", "'"],
  ["\u00E2\u20AC\u02DC", "'"],
  ["\u00E2\u20AC\u0153", '"'],
  ["\u00E2\u20AC\u009D", '"'],
  ["\u00E2\u20AC\u201C", "-"],
  ["\u00E2\u20AC\u201D", "-"],
  ["\u00E2\u20AC\u00A2", "\u2022"],
  ["\u00C3\u201A", ""],
  ["\u00C2", ""],
];

const PRIVATE_USE_RE = /[\uE000-\uF8FF]/g;
const controlChars = (from, to) => Array.from({ length: to - from + 1 }, (_, index) => String.fromCharCode(from + index)).join("");
const CONTROL_RE = new RegExp(`[${controlChars(0, 8)}${String.fromCharCode(11)}${String.fromCharCode(12)}${controlChars(14, 31)}${controlChars(127, 159)}]`, "g");
const DIRECTIONAL_MARK_RE = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
const REPLACEMENT_CHAR_RE = /\uFFFD/g;
const CJK_LEAK_RE = /[\u3040-\u30FF\u3400-\u9FFF\uF900-\uFAFF\uAC00-\uD7AF]+/g;
const BROKEN_LATIN_CLUSTER = /([A-Za-z])[\u00A0-\u00FF\u0100-\u017F\u0180-\u024F\u201A-\u201E\u2020-\u2022\u20AC\u2122\uFFFD]{2,}/g;
const LOOSE_BROKEN_CLUSTER = /[\u00C3\u00C2\u00E2\u00A0-\u00FF\u0100-\u017F\u0180-\u024F\u201A-\u201E\u2020-\u2022\u20AC\u2122\uFFFD]{3,}/g;

export function sanitizeDisplayText(value = "") {
  let text = String(value ?? "");

  for (const [broken, fixed] of MOJIBAKE_REPLACEMENTS) {
    text = text.split(broken).join(fixed);
  }

  return text
    .replace(BROKEN_LATIN_CLUSTER, "$1")
    .replace(LOOSE_BROKEN_CLUSTER, "")
    .replace(CONTROL_RE, "")
    .replace(DIRECTIONAL_MARK_RE, "")
    .replace(REPLACEMENT_CHAR_RE, "")
    .replace(PRIVATE_USE_RE, "")
    .replace(CJK_LEAK_RE, "")
    .replace(/[ \t]{2,}/g, " ");
}


