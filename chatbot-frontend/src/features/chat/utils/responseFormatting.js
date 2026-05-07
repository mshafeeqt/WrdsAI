const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeModelResponseText = (value = "") =>
  String(value)
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

const formatInlineText = (value = "") =>
  escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(
      /^((?:[\u{1F300}-\u{1FAFF}]\s*)?[^:\n]{2,50}:)(\s*)/u,
      "<strong>$1</strong>$2",
    );

export const formatChatResponseHtml = (value = "") => {
  const normalized = normalizeModelResponseText(value);
  const lines = normalized.split("\n");
  const htmlParts = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      htmlParts.push('<div style="height: 12px;"></div>');
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
      /^(Definition|Answer|Summary|Key Points|Examples|Concept|Formula|Solution|Steps|Explanation|Important Note|Quick Recap)\s*:\s*(.*)$/i,
    );
    if (sectionMatch) {
      const [, label, rest] = sectionMatch;
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
      htmlParts.push(
        `<div style="margin: 6px 0 6px 16px;">&bull; ${formatInlineText(
          bulletMatch[1],
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
