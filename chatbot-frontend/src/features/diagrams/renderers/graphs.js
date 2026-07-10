import { escapeHtml, label, toNumber, wrapDiagram } from './shared.js';

const pointToSvg = (point, bounds) => {
  const x = toNumber(point.x, 0);
  const y = toNumber(point.y, 0);
  const px = bounds.left + ((x - bounds.minX) / (bounds.maxX - bounds.minX)) * bounds.width;
  const py = bounds.top + bounds.height - ((y - bounds.minY) / (bounds.maxY - bounds.minY)) * bounds.height;
  return { x: px, y: py, label: point.label || point.name || '' };
};

const renderAxes = (bounds) => `
  <defs>
    <pattern id="wrds-grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28 0H0V28" fill="none" stroke="#e3e8fb" stroke-width="1" />
    </pattern>
  </defs>
  <rect x="${bounds.left}" y="${bounds.top}" width="${bounds.width}" height="${bounds.height}" fill="url(#wrds-grid)" />
  <line x1="${bounds.left}" y1="${bounds.top + bounds.height / 2}" x2="${bounds.left + bounds.width}" y2="${bounds.top + bounds.height / 2}" stroke="#21144f" stroke-width="3" />
  <line x1="${bounds.left + bounds.width / 2}" y1="${bounds.top}" x2="${bounds.left + bounds.width / 2}" y2="${bounds.top + bounds.height}" stroke="#21144f" stroke-width="3" />
  <text x="${bounds.left + bounds.width - 18}" y="${bounds.top + bounds.height / 2 - 10}" font-size="15" fill="#21144f">x</text>
  <text x="${bounds.left + bounds.width / 2 + 10}" y="${bounds.top + 18}" font-size="15" fill="#21144f">y</text>
`;

export const renderCoordinatePlane = (diagram) => {
  const data = diagram.data || {};
  const points = Array.isArray(data.points) ? data.points : [];
  const bounds = { left: 50, top: 24, width: 420, height: 280, minX: -6, maxX: 6, minY: -5, maxY: 5 };
  const svgPoints = points.map((point) => pointToSvg(point, bounds));

  return wrapDiagram({
    title: diagram.title || 'Coordinate Plane',
    body: `
      <svg viewBox="0 0 520 340" role="img" aria-label="Coordinate plane diagram" style="width:100%;height:auto;display:block;">
        ${renderAxes(bounds)}
        ${svgPoints
          .map(
            (point) => `
              <circle cx="${point.x}" cy="${point.y}" r="6" fill="#2f80ed" />
              <text x="${point.x + 8}" y="${point.y - 8}" font-size="16" font-weight="800" fill="#21144f">${label(point.label)}</text>
            `,
          )
          .join('')}
        ${data.description ? `<text x="58" y="326" font-size="14" font-weight="700" fill="#463b7a">${escapeHtml(data.description)}</text>` : ''}
      </svg>
    `,
  });
};

export const renderLinearGraph = (diagram) => {
  const data = diagram.data || {};
  const m = toNumber(data.m ?? data.slope, 1);
  const b = toNumber(data.b ?? data.intercept, 0);
  const bounds = { left: 50, top: 24, width: 420, height: 280, minX: -6, maxX: 6, minY: -5, maxY: 5 };
  const p1 = pointToSvg({ x: -5.5, y: m * -5.5 + b }, bounds);
  const p2 = pointToSvg({ x: 5.5, y: m * 5.5 + b }, bounds);

  return wrapDiagram({
    title: diagram.title || 'Linear Graph',
    body: `
      <svg viewBox="0 0 520 350" role="img" aria-label="Linear graph diagram" style="width:100%;height:auto;display:block;">
        ${renderAxes(bounds)}
        <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="#2f80ed" stroke-width="4" />
        <text x="64" y="326" font-size="15" font-weight="800" fill="#2f80ed">${escapeHtml(data.equation || `y = ${m}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}`)}</text>
      </svg>
    `,
  });
};

export const renderQuadraticGraph = (diagram) => {
  const data = diagram.data || {};
  const a = toNumber(data.a, 1);
  const b = toNumber(data.b, 0);
  const c = toNumber(data.c, 0);
  const bounds = { left: 50, top: 24, width: 420, height: 280, minX: -6, maxX: 6, minY: -5, maxY: 8 };
  const points = Array.from({ length: 41 }, (_, index) => {
    const x = -5 + index * 0.25;
    return pointToSvg({ x, y: a * x * x + b * x + c }, bounds);
  });
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
  const vx = -b / (2 * a || 1);
  const vertex = pointToSvg({ x: vx, y: a * vx * vx + b * vx + c }, bounds);

  return wrapDiagram({
    title: diagram.title || 'Quadratic Graph',
    body: `
      <svg viewBox="0 0 520 350" role="img" aria-label="Quadratic graph diagram" style="width:100%;height:auto;display:block;">
        ${renderAxes(bounds)}
        <path d="${path}" fill="none" stroke="#2f80ed" stroke-width="4" />
        <circle cx="${vertex.x}" cy="${vertex.y}" r="6" fill="#f59e0b" />
        <text x="${vertex.x + 8}" y="${vertex.y - 8}" font-size="14" font-weight="800" fill="#b7791f">vertex</text>
        <text x="64" y="326" font-size="15" font-weight="800" fill="#2f80ed">${escapeHtml(data.equation || `y = ${a}x^2 + ${b}x + ${c}`)}</text>
      </svg>
    `,
  });
};

export const renderNumberLine = (diagram) => {
  const data = diagram.data || {};
  const min = toNumber(data.min, -5);
  const max = toNumber(data.max, 5);
  const marks = Array.isArray(data.marks) ? data.marks : [];
  const scale = (value) => 56 + ((toNumber(value, min) - min) / (max - min || 1)) * 408;

  return wrapDiagram({
    title: diagram.title || 'Number Line',
    body: `
      <svg viewBox="0 0 520 150" role="img" aria-label="Number line diagram" style="width:100%;height:auto;display:block;">
        <line x1="48" y1="74" x2="472" y2="74" stroke="#21144f" stroke-width="3" />
        <path d="M472 74 L458 66 M472 74 L458 82" stroke="#21144f" stroke-width="3" fill="none" />
        ${Array.from({ length: Math.min(15, Math.floor(max - min) + 1) }, (_, index) => {
          const value = min + index;
          const x = scale(value);
          return `<line x1="${x}" y1="66" x2="${x}" y2="82" stroke="#21144f" stroke-width="2" /><text x="${x - 5}" y="104" font-size="12" fill="#463b7a">${value}</text>`;
        }).join('')}
        ${marks
          .map((mark) => {
            const x = scale(mark.value);
            return `<circle cx="${x}" cy="74" r="7" fill="#2f80ed" /><text x="${x - 10}" y="48" font-size="15" font-weight="800" fill="#21144f">${label(mark.label || mark.value)}</text>`;
          })
          .join('')}
      </svg>
    `,
  });
};

export const renderUnitCircle = (diagram) => {
  const data = diagram.data || {};
  const angle = escapeHtml(data.angle || 'theta');

  return wrapDiagram({
    title: diagram.title || 'Unit Circle',
    body: `
      <svg viewBox="0 0 420 320" role="img" aria-label="Unit circle diagram" style="width:100%;height:auto;display:block;">
        <circle cx="205" cy="160" r="105" fill="#f3f6ff" stroke="#21144f" stroke-width="3" />
        <line x1="70" y1="160" x2="340" y2="160" stroke="#21144f" stroke-width="2" />
        <line x1="205" y1="295" x2="205" y2="25" stroke="#21144f" stroke-width="2" />
        <line x1="205" y1="160" x2="279" y2="86" stroke="#2f80ed" stroke-width="4" />
        <line x1="279" y1="86" x2="279" y2="160" stroke="#f59e0b" stroke-width="3" stroke-dasharray="6 5" />
        <line x1="205" y1="160" x2="279" y2="160" stroke="#22c55e" stroke-width="3" />
        <path d="M236 160 A31 31 0 0 0 227 138" fill="none" stroke="#ef4444" stroke-width="3" />
        <circle cx="279" cy="86" r="6" fill="#2f80ed" />
        <text x="286" y="82" font-size="15" font-weight="800" fill="#21144f">(cos ${angle}, sin ${angle})</text>
        <text x="238" y="145" font-size="15" font-weight="800" fill="#ef4444">${angle}</text>
        <text x="236" y="181" font-size="14" font-weight="800" fill="#22c55e">cos ${angle}</text>
        <text x="286" y="126" font-size="14" font-weight="800" fill="#f59e0b">sin ${angle}</text>
      </svg>
    `,
  });
};
