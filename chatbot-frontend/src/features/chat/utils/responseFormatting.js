const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatSqrtContent = (content = "") => {
  const value = content.trim();
  return /[\s+\-*/=]/.test(value) ? `\u221A(${value})` : `\u221A${value}`;
};

const normalizeBalancedSqrtCalls = (value = "") => {
  const source = String(value);
  let output = "";
  let index = 0;

  while (index < source.length) {
    const matchIndex = source.toLowerCase().indexOf("sqrt", index);
    if (matchIndex === -1) {
      output += source.slice(index);
      break;
    }

    const before = source[matchIndex - 1] || "";
    if (/[A-Za-z0-9_]/.test(before)) {
      output += source.slice(index, matchIndex + 4);
      index = matchIndex + 4;
      continue;
    }

    let cursor = matchIndex + 4;
    while (/\s/.test(source[cursor] || "")) cursor += 1;

    if (source[cursor] !== "(") {
      output += source.slice(index, cursor);
      index = cursor;
      continue;
    }

    let depth = 0;
    let end = -1;
    for (let scan = cursor; scan < source.length; scan += 1) {
      const char = source[scan];
      if (char === "(") depth += 1;
      if (char === ")") depth -= 1;
      if (depth === 0) {
        end = scan;
        break;
      }
    }

    if (end === -1) {
      output += source.slice(index);
      break;
    }

    const content = normalizeBalancedSqrtCalls(source.slice(cursor + 1, end));
    output += source.slice(index, matchIndex);
    output += formatSqrtContent(content);
    index = end + 1;
  }

  return output;
};

const repairCommonMathMojibake = (value = "") =>
  String(value)
    .replace(/\u00C2(?=[\u00B0-\u00B3\u00B9\u00BC-\u00BE\u2070-\u209F])/g, "")
    .replace(/\u00E2\u201A[\u20AC\u0080]/g, "\u2080")
    .replace(/\u00E2\u201A[\u0081\uFFFD]/g, "\u2081")
    .replace(/\u00E2\u201A\u201A/g, "\u2082")
    .replace(/\u00E2\u201A\u0192/g, "\u2083")
    .replace(/\u00E2\u201A\u201E/g, "\u2084")
    .replace(/\u00E2\u201A\u2026/g, "\u2085")
    .replace(/\u00E2\u201A\u2020/g, "\u2086")
    .replace(/\u00E2\u201A\u2021/g, "\u2087")
    .replace(/\u00E2\u201A\u02C6/g, "\u2088")
    .replace(/\u00E2\u201A\u2030/g, "\u2089")
    .replace(/\u00E2\u201A\u2122/g, "\u2099")
    .replace(/\u00E2\u0081[\u00B0\uFFFD]/g, "\u2070")
    .replace(/\u00E2\u0081\u00B4/g, "\u2074")
    .replace(/\u00E2\u0081\u00B5/g, "\u2075")
    .replace(/\u00E2\u0081\u00B6/g, "\u2076")
    .replace(/\u00E2\u0081\u00B7/g, "\u2077")
    .replace(/\u00E2\u0081\u00B8/g, "\u2078")
    .replace(/\u00E2\u0081\u00B9/g, "\u2079")
    .replace(/\u00E2\u0081\u00BF/g, "\u207F");
const normalizeLooseLatexText = (value = "") =>
  normalizeBalancedSqrtCalls(repairCommonMathMojibake(value))
    .replace(/\\text\s*\{([^{}]*)\}/g, "$1")
    .replace(/\\(?:left|right|bigl|bigr|Bigl|Bigr|big|Big|bigg|Bigg)\s*([()[\]{}|.])/g, "$1")
    .replace(/\\[,;:!]\s*/g, " ")
    .replace(/\\sqrt\s*\{([^{}]+)\}/g, (_, content) => formatSqrtContent(content))
    .replace(/\\sqrt\s*\(([^()]+)\)/g, (_, content) => formatSqrtContent(content))
    .replace(/\bsqrt\s*\{([^{}]+)\}/gi, (_, content) => formatSqrtContent(content))
    .replace(/\bsqrt\s*\(([^()]+)\)/gi, (_, content) => formatSqrtContent(content))
    .replace(/\bsqrt\s*([A-Za-z0-9\u03B8]+)/gi, (_, content) => formatSqrtContent(content))
    .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "$1/$2")
    .replace(/\\angle\b/g, "\u2220")
    .replace(/\\triangle\b/g, "\u25B3")
    .replace(/\\degree\b/g, "\u00B0")
    .replace(/\\circ\b/g, "\u00B0")
    .replace(/\\cdotp?s?\b/g, "\u00B7")
    .replace(/\\times\b/g, "\u00D7")
    .replace(/\\div\b/g, "\u00F7")
    .replace(/\\pm\b/g, "\u00B1")
    .replace(/\\neq\b/g, "\u2260")
    .replace(/\\leq\b/g, "\u2264")
    .replace(/\\geq\b/g, "\u2265")
    .replace(/\\rightarrow\b/g, "\u2192")
    .replace(/\\leftarrow\b/g, "\u2190")
    .replace(/\\to\b/g, "\u2192")
    .replace(/\\infty\b/g, "\u221E")
    .replace(/\\(sin|cos|tan|cot|sec|cosec|log|ln|lim)\b/g, "$1")
    .replace(/\{\s*([^{}\n]+?)\s*\}/g, "$1")
    .replace(/\s+([,.;:)])/g, "$1")
    .replace(/([(])\s+/g, "$1")
    .replace(/\s{2,}/g, " ");

const buildQuestionLabel = (questionNo) =>
  `<div style="margin: 8px 0 10px; font-weight: 900;">Question ${escapeHtml(questionNo)}</div>`;

const buildSolutionLabel = () =>
  '<div style="margin: 8px 0 10px; font-weight: 900;">Solution</div>';

const enhanceHtmlLabels = (value = "") =>
  String(value)
    .replace(
      /(^|>)(\s*)Question\s*(?:no\.?|number)?\s*(\d+)\s*:?\s*(?=<|$)/gim,
      (_, prefix, space, questionNo) => `${prefix}${space}${buildQuestionLabel(questionNo)}`,
    )
    .replace(
      /(^|>)(\s*)(Solution|Soln)\s*:?\s*(?=<|$)/gim,
      (_, prefix, space) => `${prefix}${space}${buildSolutionLabel()}`,
    );

const normalizeModelResponseText = (value = "") =>
  normalizeLooseLatexText(value)
    .replace(/\r\n/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<\/?(p|div|section|article)>/gi, "\n")
    .replace(/<li>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/?(ul|ol)>/gi, "\n")
    .replace(/<(strong|b)>(.*?)<\/\1>/gi, "**$2**")
    .replace(/<(em|i)>(.*?)<\/\1>/gi, "*$2*")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const renderFraction = (numerator, denominator) =>
  `<span class="math-frac"><span class="math-num">${numerator.trim()}</span><span class="math-den">${denominator.trim()}</span></span>`;

const SUPER_GLYPHS = {
  "\u00B9": "1",
  "\u00B2": "2",
  "\u00B3": "3",
  "\u2070": "0",
  "\u2074": "4",
  "\u2075": "5",
  "\u2076": "6",
  "\u2077": "7",
  "\u2078": "8",
  "\u2079": "9",
  "\u207A": "+",
  "\u207B": "-",
};

const fromSuperscriptGlyphs = (value = "") =>
  String(value)
    .split("")
    .map((char) => SUPER_GLYPHS[char] || char)
    .join("");
const SUB_GLYPHS = {
  "\u2080": "0",
  "\u2081": "1",
  "\u2082": "2",
  "\u2083": "3",
  "\u2084": "4",
  "\u2085": "5",
  "\u2086": "6",
  "\u2087": "7",
  "\u2088": "8",
  "\u2089": "9",
  "\u2099": "n",
};

const fromSubscriptGlyphs = (value = "") =>
  String(value)
    .split("")
    .map((char) => SUB_GLYPHS[char] || char)
    .join("");
const renderMathScripts = (value = "") =>
  String(value)
    .replace(/([A-Za-z0-9)\]])([\u2080-\u2089\u2099]+)/g, (_, base, subscript) => `${base}<sub>${fromSubscriptGlyphs(subscript)}</sub>`)
    .replace(/([A-Za-z0-9)\]])([\u00B9\u00B2\u00B3\u2070\u2074-\u2079\u207A\u207B]+)/g, (_, base, power) => `${base}<sup>${fromSuperscriptGlyphs(power)}</sup>`)
    .replace(/([A-Za-z0-9)\]])_\{([^{}\n]{1,24})\}/g, "$1<sub>$2</sub>")
    .replace(/([A-Za-z0-9)\]])_([A-Za-z0-9]{1,12})\b/g, "$1<sub>$2</sub>")
    .replace(/([A-Za-z0-9)\]])\^\{([^{}\n]{1,24})\}/g, "$1<sup>$2</sup>")
    .replace(/([A-Za-z0-9)\]])\^([+-]?[A-Za-z0-9]{1,12})\b/g, "$1<sup>$2</sup>");
const renderReadableMath = (value = "") => {
  const fractions = [];
  let text = renderMathScripts(String(value));

  const stashFraction = (numerator, denominator) => {
    const token = `@@MATH_FRAC_${fractions.length}@@`;
    fractions.push(renderFraction(numerator, denominator));
    return token;
  };

  text = text
    .replace(
      /(\u221A\([^()\n]+\)|\u221A[A-Za-z0-9\u03B8]+|\d+(?:\.\d+)?)\s*\/\s*(\u221A\([^()\n]+\)|\u221A[A-Za-z0-9\u03B8]+|\d+(?:\.\d+)?)/g,
      (_, numerator, denominator) => stashFraction(numerator, denominator),
    )
    .replace(
      /\((@@MATH_FRAC_\d+@@)\)\s*\/\s*\((@@MATH_FRAC_\d+@@)\)/g,
      (_, numerator, denominator) => stashFraction(numerator, denominator),
    );

  const resolveFractionTokens = (input, depth = 0) => {
    if (depth > 8) return input;
    return input.replace(/@@MATH_FRAC_(\d+)@@/g, (_, tokenIndex) => {
      const fraction = fractions[Number(tokenIndex)] || "";
      return resolveFractionTokens(fraction, depth + 1);
    });
  };

  return resolveFractionTokens(text);
};

const formatInlineText = (value = "") =>
  renderReadableMath(escapeHtml(normalizeLooseLatexText(value)))
    .replace(/^\*([^*]{2,70}:)\*\s*/g, "<strong>$1</strong> ")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(
      /^((?:[\u{1F300}-\u{1FAFF}]\s*)?[^:\n]{2,50}:)(\s*)/u,
      "<strong>$1</strong>$2",
    );

const lessonPlanSectionPattern =
  /^(Class\s+\d+.*Lesson Plan|Lesson Plan|Topic|Chapter|Focus|Learning Objectives|Learning Outcomes|Prerequisite Knowledge|Prerequisites?|Teaching Flow(?:\s*\([^)]*\))?|Board Examples(?:\s+to\s+include)?|Student Activities|Quick Checks?|Homework(?:\s+Tasks?)?|Wrap-up(?:\s*\/\s*Summary)?|Summary|Assessment|Materials Needed|Differentiation|Teacher Notes?|Key Vocabulary|Exit Ticket)(\s*[\u{1F300}-\u{1FAFF}])?\s*:?\s*(.*)$/iu;

const lessonPlanNumberedSectionPattern =
  /^\d+[.)]\s+(Class\s+\d+.*Lesson Plan|Lesson Plan|Topic|Chapter|Focus|Learning Objectives|Learning Outcomes|Prerequisite Knowledge|Prerequisites?|Teaching Flow(?:\s*\([^)]*\))?|Board Examples(?:\s+to\s+include)?|Student Activities|Quick Checks?|Homework(?:\s+Tasks?)?|Wrap-up(?:\s*\/\s*Summary)?|Summary|Assessment|Materials Needed|Differentiation|Teacher Notes?|Key Vocabulary|Exit Ticket)(\s*[\u{1F300}-\u{1FAFF}])?\s*:?\s*(.*)$/iu;

const formatSectionHeading = (label = "", emoji = "", rest = "") =>
  `<div style="margin: 16px 0 8px 0;"><strong>${formatInlineText(
    `${label}${emoji || ""}${rest ? ":" : ""}`,
  )}</strong>${rest ? ` ${formatInlineText(rest)}` : ""}</div>`;

export const formatChatResponseHtml = (value = "") => {
  if (/<(?:table|pre|code|math|mfrac|msup|msub|msubsup)\b/i.test(String(value))) {
    return enhanceHtmlLabels(normalizeLooseLatexText(value));
  }

  const normalized = normalizeModelResponseText(value);
  const lines = normalized.split("\n");
  const htmlParts = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      htmlParts.push('<div style="height: 12px;"></div>');
      continue;
    }

    const questionLabelMatch = line.match(/^Question\s*(?:no\.?|number)?\s*(\d+)\s*:?$/i);
    if (questionLabelMatch) {
      htmlParts.push(buildQuestionLabel(questionLabelMatch[1]));
      continue;
    }

    const solutionOnlyMatch = line.match(/^(Solution|Soln)\s*:?$/i);
    if (solutionOnlyMatch) {
      htmlParts.push(buildSolutionLabel());
      continue;
    }

    const lessonPlanSectionMatch = line.match(lessonPlanSectionPattern);
    if (lessonPlanSectionMatch) {
      const [, label, emoji = "", rest = ""] = lessonPlanSectionMatch;
      htmlParts.push(formatSectionHeading(label, emoji, rest));
      continue;
    }

    const lessonPlanNumberedSectionMatch = line.match(lessonPlanNumberedSectionPattern);
    if (lessonPlanNumberedSectionMatch) {
      const [, label, emoji = "", rest = ""] = lessonPlanNumberedSectionMatch;
      htmlParts.push(formatSectionHeading(label, emoji, rest));
      continue;
    }

    const exampleMatch = line.match(
      /^(Example|Case|Method|Approach|Step)\s*(\d+)\s*:\s*(.*)$/i,
    );
    if (exampleMatch) {
      const [, kind, number, rest] = exampleMatch;
      htmlParts.push(
        `<div style="margin: 14px 0 8px 0;"><strong>${escapeHtml(
          `${kind} ${number}:`,
        )}</strong>${rest ? ` ${formatInlineText(rest)}` : ""}</div>`,
      );
      continue;
    }

    const sectionMatch = line.match(
      /^(Definition|Answer|Summary|Key Points|Examples|Concept|Formula|Solution|Soln|Steps|Explanation|Important Note|Quick Recap|Prompt|Quick Check|Activity|Teacher Action|Student Action|Board Work|Practice|Homework)\s*:\s*(.*)$/i,
    );
    if (sectionMatch) {
      const [, label, rest] = sectionMatch;
      if (/^(Solution|Soln)$/i.test(label)) {
        htmlParts.push(
          `${buildSolutionLabel()}${
            rest ? `<div style="margin: 6px 0; line-height: 1.8;">${formatInlineText(rest)}</div>` : ""
          }`,
        );
        continue;
      }
      htmlParts.push(
        `<div style="margin: 14px 0 8px 0;"><strong>${escapeHtml(
          `${label}:`,
        )}</strong>${rest ? ` ${formatInlineText(rest)}` : ""}</div>`,
      );
      continue;
    }

    if (/^#{1,3}\s+/.test(line)) {
      const headerText = line.replace(/^#{1,3}\s+/, "");
      htmlParts.push(
        `<div style="margin: 14px 0 8px 0;"><strong>${formatInlineText(
          headerText,
        )}</strong></div>`,
      );
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      const bulletContent = bulletMatch[1].trim();
      const startsWithLabel =
        /^\*\*[^*]{2,70}:\*\*/.test(bulletContent) ||
        /^\*[^*]{2,70}:\*\s+/.test(bulletContent);

      if (startsWithLabel) {
        htmlParts.push(
          `<div style="margin: 6px 0; line-height: 1.8;">${formatInlineText(
            bulletContent,
          )}</div>`,
        );
        continue;
      }

      htmlParts.push(
        `<div style="margin: 6px 0 6px 16px;">&bull; ${formatInlineText(
          bulletContent,
        )}</div>`,
      );
      continue;
    }

    const numberedHeadingMatch = line.match(/^(\d+[.)])\s+(.+)$/);
    if (numberedHeadingMatch && numberedHeadingMatch[2].length < 90) {
      htmlParts.push(
        `<div style="margin: 14px 0 8px 0;"><strong>${formatInlineText(
          `${numberedHeadingMatch[1]} ${numberedHeadingMatch[2]}`,
        )}</strong></div>`,
      );
      continue;
    }

    htmlParts.push(
      `<div style="margin: 6px 0; line-height: 1.8;">${formatInlineText(
        line,
      )}</div>`,
    );
  }

  return htmlParts.join("");
};
