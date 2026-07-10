export const escapeHtml = (value = '') =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const label = (value, fallback = '') => escapeHtml(value || fallback);

export const wrapDiagram = ({ title = 'Diagram', body }) => `
  <div class="wrds-diagram-card" style="margin:14px 0;padding:12px;border:1px solid #d9def8;border-radius:8px;background:#fbfbff;max-width:580px;overflow:hidden;">
    <div style="font-weight:800;margin:0 0 8px;color:#221652;">${escapeHtml(title || 'Diagram')}</div>
    ${body}
  </div>
`;

export const svgPoint = ({ x, y, name, color = '#2f80ed', dx = 8, dy = -8 }) => `
  <circle cx="${x}" cy="${y}" r="6" fill="${color}" />
  <text x="${x + dx}" y="${y + dy}" font-size="18" font-weight="800" fill="#21144f">${label(name)}</text>
`;

export const svgSegment = ({ x1, y1, x2, y2, color = '#21144f', width = 3, dash = '' }) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" ${dash ? `stroke-dasharray="${dash}"` : ''} />`;

export const firstValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== '') || '';
export const diagramLegend = (items = []) => {
  const visibleItems = items.filter(Boolean).map(escapeHtml);
  if (!visibleItems.length) return '';

  return `
    <div style="margin-top:8px;padding:8px 10px;border-radius:7px;background:#f3f6ff;color:#463b7a;font-size:14px;font-weight:700;line-height:1.5;">
      ${visibleItems.join(' &nbsp; | &nbsp; ')}
    </div>
  `;
};
