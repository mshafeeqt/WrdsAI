import { diagramLegend, escapeHtml, firstValue, label, svgPoint, svgSegment, wrapDiagram } from './shared.js';

export const renderRightTriangle = (diagram) => {
  const data = diagram.data || {};
  const a = label(data.vertexA, 'A');
  const b = label(data.vertexB, 'B');
  const c = label(data.vertexC, 'C');
  const base = data.base ? escapeHtml(data.base) : '';
  const height = data.height ? escapeHtml(data.height) : '';
  const hypotenuse = data.hypotenuse ? escapeHtml(data.hypotenuse) : '';
  const angle = data.angle ? escapeHtml(data.angle) : '';

  return wrapDiagram({
    title: diagram.title || 'Right Triangle',
    body: `
      <svg viewBox="0 0 420 240" role="img" aria-label="Right triangle diagram" style="width:100%;height:auto;display:block;">
        ${svgSegment({ x1: 72, y1: 188, x2: 334, y2: 188 })}
        ${svgSegment({ x1: 72, y1: 188, x2: 72, y2: 50 })}
        ${svgSegment({ x1: 72, y1: 50, x2: 334, y2: 188 })}
        <path d="M72 164 L96 164 L96 188" fill="none" stroke="#6b5fd3" stroke-width="2" />
        <text x="54" y="207" font-size="18" font-weight="800" fill="#21144f">${a}</text>
        <text x="52" y="43" font-size="18" font-weight="800" fill="#21144f">${b}</text>
        <text x="342" y="207" font-size="18" font-weight="800" fill="#21144f">${c}</text>
        ${base ? `<text x="184" y="218" font-size="15" fill="#463b7a">${base}</text>` : ''}
        ${height ? `<text x="20" y="124" font-size="15" fill="#463b7a">${height}</text>` : ''}
        ${hypotenuse ? `<text x="206" y="104" font-size="15" fill="#463b7a">${hypotenuse}</text>` : ''}
        ${angle ? `<path d="M292 188 A46 46 0 0 0 253 166" fill="none" stroke="#2f80ed" stroke-width="2" /><text x="256" y="177" font-size="14" fill="#2f80ed">${angle}</text>` : ''}
      </svg>
    `,
  });
};

export const renderTriangle = (diagram) => {
  const data = diagram.data || {};
  const a = label(data.vertexA, 'A');
  const b = label(data.vertexB, 'B');
  const c = label(data.vertexC, 'C');
  const angleA = data.angleA ? escapeHtml(data.angleA) : '';
  const angleB = data.angleB ? escapeHtml(data.angleB) : '';
  const angleC = data.angleC ? escapeHtml(data.angleC) : '';
  const relation = data.relation ? escapeHtml(data.relation) : '';
  const legend = diagramLegend([
    angleA ? `angle ${a} = ${angleA}` : '',
    angleB ? `angle ${b} = ${angleB}` : '',
    angleC ? `angle ${c} = ${angleC}` : '',
    relation,
  ]);

  return wrapDiagram({
    title: diagram.title || 'Triangle',
    body: `
      <svg viewBox="0 0 520 330" role="img" aria-label="Triangle diagram" style="width:100%;height:auto;display:block;">
        <polygon points="110,255 420,255 248,58" fill="rgba(47,128,237,0.06)" stroke="#21144f" stroke-width="3" />
        ${svgPoint({ x: 110, y: 255, name: a, dx: -24, dy: 26 })}
        ${svgPoint({ x: 420, y: 255, name: b, dx: 10, dy: 26 })}
        ${svgPoint({ x: 248, y: 58, name: c, dx: -8, dy: -14 })}
        <path d="M145 255 A36 36 0 0 1 130 218" fill="none" stroke="#f59e0b" stroke-width="3" />
        <path d="M388 255 A38 38 0 0 0 402 217" fill="none" stroke="#f59e0b" stroke-width="3" />
        <path d="M229 80 A34 34 0 0 0 270 82" fill="none" stroke="#f59e0b" stroke-width="3" />
        ${angleA ? `<text x="146" y="232" font-size="15" font-weight="800" fill="#b7791f">${angleA}</text>` : ''}
        ${angleB ? `<text x="357" y="232" font-size="15" font-weight="800" fill="#b7791f">${angleB}</text>` : ''}
        ${angleC ? `<text x="241" y="102" font-size="15" font-weight="800" fill="#b7791f">${angleC}</text>` : ''}
        ${relation ? `<text x="90" y="310" font-size="15" font-weight="800" fill="#463b7a">${relation}</text>` : ''}
      </svg>
      ${legend}
    `,
  });
};

export const renderTriangleCircumcenter = (diagram) => {
  const data = diagram.data || {};
  const a = label(data.vertexA, 'A');
  const b = label(data.vertexB, 'B');
  const c = label(data.vertexC, 'C');
  const center = label(data.center, 'O');
  const bisector1 = data.bisector1 ? escapeHtml(data.bisector1) : 'Perpendicular bisector of AB';
  const bisector2 = data.bisector2 ? escapeHtml(data.bisector2) : 'Perpendicular bisector of AC';
  const radiusLabel = data.radiusLabel ? escapeHtml(data.radiusLabel) : `${center}${a} = ${center}${b} = ${center}${c}`;

  return wrapDiagram({
    title: diagram.title || 'Circumcenter of a Triangle',
    body: `
      <svg viewBox="0 0 520 360" role="img" aria-label="Triangle circumcenter diagram" style="width:100%;height:auto;display:block;">
        <circle cx="267" cy="174" r="123" fill="#f3f6ff" stroke="#8fb7ff" stroke-width="3" stroke-dasharray="7 6" />
        <polygon points="145,252 390,242 248,64" fill="rgba(47,128,237,0.06)" stroke="#21144f" stroke-width="3" />
        ${svgSegment({ x1: 267, y1: 174, x2: 145, y2: 252, color: '#6b5fd3', width: 2.5 })}
        ${svgSegment({ x1: 267, y1: 174, x2: 390, y2: 242, color: '#6b5fd3', width: 2.5 })}
        ${svgSegment({ x1: 267, y1: 174, x2: 248, y2: 64, color: '#6b5fd3', width: 2.5 })}
        ${svgSegment({ x1: 118, y1: 131, x2: 417, y2: 363, color: '#f59e0b', width: 2.5, dash: '8 6' })}
        ${svgSegment({ x1: 75, y1: 216, x2: 334, y2: -20, color: '#f59e0b', width: 2.5, dash: '8 6' })}
        ${svgPoint({ x: 145, y: 252, name: a, dx: -21, dy: 24 })}
        ${svgPoint({ x: 390, y: 242, name: b, dx: 10, dy: 8 })}
        ${svgPoint({ x: 248, y: 64, name: c, dx: -6, dy: -14 })}
        ${svgPoint({ x: 267, y: 174, name: center, color: '#f59e0b', dx: 10, dy: -4 })}
        <text x="302" y="118" font-size="14" font-weight="800" fill="#6b5fd3">circumcircle</text>
        <text x="310" y="194" font-size="14" font-weight="800" fill="#6b5fd3">${radiusLabel}</text>
        <text x="46" y="118" font-size="13" font-weight="800" fill="#b7791f">${bisector1}</text>
        <text x="42" y="202" font-size="13" font-weight="800" fill="#b7791f">${bisector2}</text>
        <text x="116" y="326" font-size="15" font-weight="800" fill="#463b7a">${center} is where perpendicular bisectors meet.</text>
      </svg>
    `,
  });
};

export const renderTriangleCentroid = (diagram) => {
  const data = diagram.data || {};
  const a = label(data.vertexA, 'A');
  const b = label(data.vertexB, 'B');
  const c = label(data.vertexC, 'C');
  const center = label(data.center || data.centroid, 'G');

  return wrapDiagram({
    title: diagram.title || 'Centroid of a Triangle',
    body: `
      <svg viewBox="0 0 520 340" role="img" aria-label="Triangle centroid diagram" style="width:100%;height:auto;display:block;">
        <polygon points="110,260 420,260 230,62" fill="rgba(47,128,237,0.06)" stroke="#21144f" stroke-width="3" />
        ${svgPoint({ x: 110, y: 260, name: a, dx: -22, dy: 26 })}
        ${svgPoint({ x: 420, y: 260, name: b, dx: 10, dy: 26 })}
        ${svgPoint({ x: 230, y: 62, name: c, dx: -8, dy: -14 })}
        <circle cx="325" cy="161" r="5" fill="#f59e0b" />
        <circle cx="170" cy="161" r="5" fill="#f59e0b" />
        <circle cx="265" cy="260" r="5" fill="#f59e0b" />
        ${svgSegment({ x1: 110, y1: 260, x2: 325, y2: 161, color: '#f59e0b', dash: '7 6' })}
        ${svgSegment({ x1: 420, y1: 260, x2: 170, y2: 161, color: '#f59e0b', dash: '7 6' })}
        ${svgSegment({ x1: 230, y1: 62, x2: 265, y2: 260, color: '#f59e0b', dash: '7 6' })}
        ${svgPoint({ x: 253, y: 194, name: center, color: '#22c55e', dx: 10, dy: -4 })}
        <text x="330" y="154" font-size="14" font-weight="800" fill="#b7791f">midpoint of ${b}${c}</text>
        <text x="30" y="154" font-size="14" font-weight="800" fill="#b7791f">midpoint of ${a}${c}</text>
        <text x="254" y="285" font-size="14" font-weight="800" fill="#b7791f">midpoint of ${a}${b}</text>
        <text x="108" y="318" font-size="15" font-weight="800" fill="#463b7a">${center} is where the three medians meet.</text>
      </svg>
    `,
  });
};

export const renderTriangleIncenter = (diagram) => {
  const data = diagram.data || {};
  const center = label(data.center, 'I');
  return wrapDiagram({
    title: diagram.title || 'Incenter of a Triangle',
    body: `
      <svg viewBox="0 0 520 340" role="img" aria-label="Triangle incenter diagram" style="width:100%;height:auto;display:block;">
        <polygon points="110,258 420,258 255,60" fill="rgba(47,128,237,0.06)" stroke="#21144f" stroke-width="3" />
        <circle cx="262" cy="184" r="67" fill="rgba(34,197,94,0.08)" stroke="#22c55e" stroke-width="3" />
        ${svgSegment({ x1: 110, y1: 258, x2: 262, y2: 184, color: '#f59e0b', dash: '7 6' })}
        ${svgSegment({ x1: 420, y1: 258, x2: 262, y2: 184, color: '#f59e0b', dash: '7 6' })}
        ${svgSegment({ x1: 255, y1: 60, x2: 262, y2: 184, color: '#f59e0b', dash: '7 6' })}
        ${svgPoint({ x: 110, y: 258, name: 'A', dx: -22, dy: 24 })}
        ${svgPoint({ x: 420, y: 258, name: 'B', dx: 10, dy: 24 })}
        ${svgPoint({ x: 255, y: 60, name: 'C', dx: -8, dy: -14 })}
        ${svgPoint({ x: 262, y: 184, name: center, color: '#22c55e', dx: 11, dy: -5 })}
        <text x="112" y="314" font-size="15" font-weight="800" fill="#463b7a">${center} is the intersection of angle bisectors and center of the incircle.</text>
      </svg>
    `,
  });
};

export const renderTriangleOrthocenter = (diagram) => {
  const data = diagram.data || {};
  const center = label(data.center, 'H');
  return wrapDiagram({
    title: diagram.title || 'Orthocenter of a Triangle',
    body: `
      <svg viewBox="0 0 520 340" role="img" aria-label="Triangle orthocenter diagram" style="width:100%;height:auto;display:block;">
        <polygon points="105,260 420,260 245,58" fill="rgba(47,128,237,0.06)" stroke="#21144f" stroke-width="3" />
        ${svgSegment({ x1: 245, y1: 58, x2: 245, y2: 260, color: '#f59e0b', dash: '7 6' })}
        ${svgSegment({ x1: 105, y1: 260, x2: 294, y2: 114, color: '#f59e0b', dash: '7 6' })}
        ${svgSegment({ x1: 420, y1: 260, x2: 203, y2: 109, color: '#f59e0b', dash: '7 6' })}
        ${svgPoint({ x: 105, y: 260, name: 'A', dx: -22, dy: 24 })}
        ${svgPoint({ x: 420, y: 260, name: 'B', dx: 10, dy: 24 })}
        ${svgPoint({ x: 245, y: 58, name: 'C', dx: -8, dy: -14 })}
        ${svgPoint({ x: 245, y: 166, name: center, color: '#ef4444', dx: 10, dy: -5 })}
        <text x="118" y="314" font-size="15" font-weight="800" fill="#463b7a">${center} is where the three altitudes meet.</text>
      </svg>
    `,
  });
};

const polygonPointLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const renderRegularPolygon = (diagram) => {
  const data = diagram.data || {};
  const sides = Math.min(20, Math.max(3, Number.parseInt(data.sides || data.n || 5, 10) || 5));
  const centerX = 260;
  const centerY = 160;
  const radius = 105;
  const labels = Array.isArray(data.labels) && data.labels.length >= sides
    ? data.labels.slice(0, sides).map((value) => label(value))
    : polygonPointLabels.slice(0, sides);
  const points = labels.map((pointLabel, index) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / sides;
    return {
      label: pointLabel,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });
  const polygonName = escapeHtml(data.name || `${sides}-gon`);
  const circleHint = `${diagram.title || ''} ${data.description || ''}`.toLowerCase();
  const showCircle = data.showCircle === true || /inscribed|circumcircle|on a circle|inside a circle|in a circle/.test(circleHint);
  const showDiagonals = data.diagonals === true || Array.isArray(data.diagonals);
  const diagonals = Array.isArray(data.diagonals) ? data.diagonals : [];
  const defaultDiagonals = showDiagonals && !diagonals.length && sides >= 5
    ? [[0, 2], [1, 3]]
    : [];
  const diagonalPairs = diagonals
    .map((item) => String(item).match(/[A-Z]/g)?.slice(0, 2))
    .filter((item) => item?.length === 2)
    .map(([start, end]) => [labels.indexOf(start), labels.indexOf(end)])
    .filter(([start, end]) => start >= 0 && end >= 0);
  const renderedDiagonals = [...defaultDiagonals, ...diagonalPairs];
  const polygonPoints = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  const edgeNames = labels.map((pointLabel, index) => `${pointLabel}${labels[(index + 1) % sides]}`).join(', ');

  return wrapDiagram({
    title: diagram.title || `Regular ${polygonName}`,
    body: `
      <svg viewBox="0 0 520 340" role="img" aria-label="Regular polygon diagram" style="width:100%;height:auto;display:block;">
        ${showCircle ? `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="rgba(47,128,237,0.04)" stroke="#8fb7ff" stroke-width="2.5" stroke-dasharray="7 6" />` : ''}
        <polygon points="${polygonPoints}" fill="rgba(47,128,237,0.07)" stroke="#21144f" stroke-width="3" />
        ${renderedDiagonals.map(([start, end]) => svgSegment({ x1: points[start].x, y1: points[start].y, x2: points[end].x, y2: points[end].y, color: '#f59e0b', width: 2.5 })).join('')}
        ${svgPoint({ x: centerX, y: centerY, name: data.center || 'O', color: '#22c55e', dx: 10, dy: -8 })}
        ${points.map((point) => svgPoint({ x: point.x, y: point.y, name: point.label, dx: point.x < centerX ? -24 : 10, dy: point.y < centerY ? -10 : 24 })).join('')}
        <text x="132" y="316" font-size="15" font-weight="800" fill="#463b7a">${sides} equal sides: ${escapeHtml(edgeNames)}</text>
      </svg>
      ${diagramLegend([`Regular ${polygonName} = ${sides} equal sides`, showCircle ? 'Vertices lie on the same circle' : '', renderedDiagonals.length ? 'Requested diagonals are shown' : ''])}
    `,
  });
};
export const renderQuadrilateral = (diagram) => {
  const data = diagram.data || {};
  const kind = String(data.shape || diagram.kind || 'quadrilateral').replace(/_/g, ' ');
  const a = label(data.vertexA, 'A');
  const b = label(data.vertexB, 'B');
  const c = label(data.vertexC, 'C');
  const d = label(data.vertexD, 'D');
  const hint = `${diagram.title || ''} ${data.relation || ''} ${data.description || ''} ${kind}`.toLowerCase();
  const showDiagonals = /diagonal/.test(hint) || data.diagonals === true || Array.isArray(data.diagonals);
  const points = /square|rectangle/.test(kind)
    ? { ax: 150, ay: 245, bx: 370, by: 245, cx: 370, cy: 65, dx: 150, dy: 65 }
    : { ax: 120, ay: 220, bx: 390, by: 220, cx: 430, cy: 90, dx: 165, dy: 78 };
  const legend = diagramLegend([
    `${a}${b}${c}${d} = ${kind}`,
    showDiagonals ? `${a}${c} and ${b}${d} = diagonals` : '',
    data.relation || '',
  ]);

  return wrapDiagram({
    title: diagram.title || `${kind.charAt(0).toUpperCase()}${kind.slice(1)}`,
    body: `
      <svg viewBox="0 0 520 320" role="img" aria-label="Quadrilateral diagram" style="width:100%;height:auto;display:block;">
        <polygon points="${points.ax},${points.ay} ${points.bx},${points.by} ${points.cx},${points.cy} ${points.dx},${points.dy}" fill="rgba(47,128,237,0.06)" stroke="#21144f" stroke-width="3" />
        ${showDiagonals ? svgSegment({ x1: points.ax, y1: points.ay, x2: points.cx, y2: points.cy, color: '#f59e0b', width: 3 }) : ''}
        ${showDiagonals ? svgSegment({ x1: points.bx, y1: points.by, x2: points.dx, y2: points.dy, color: '#f59e0b', width: 3 }) : ''}
        ${showDiagonals ? svgPoint({ x: (points.ax + points.cx) / 2, y: (points.ay + points.cy) / 2, name: 'O', color: '#22c55e', dx: 10, dy: -8 }) : ''}
        ${svgPoint({ x: points.ax, y: points.ay, name: a, dx: -22, dy: 24 })}
        ${svgPoint({ x: points.bx, y: points.by, name: b, dx: 10, dy: 24 })}
        ${svgPoint({ x: points.cx, y: points.cy, name: c, dx: 10, dy: -8 })}
        ${svgPoint({ x: points.dx, y: points.dy, name: d, dx: -22, dy: -8 })}
        ${showDiagonals ? `<text x="236" y="143" font-size="15" font-weight="800" fill="#b7791f">${a}${c}</text><text x="236" y="179" font-size="15" font-weight="800" fill="#b7791f">${b}${d}</text>` : ''}
        <text x="170" y="292" font-size="15" font-weight="800" fill="#463b7a">${escapeHtml(data.relation || kind)}</text>
      </svg>
      ${legend}
    `,
  });
};

export const renderCircle = (diagram) => {
  const data = diagram.data || {};
  const center = label(data.center, 'O');
  const points = Array.isArray(data.points) ? data.points : [];
  const pointA = label(points[0]?.label || data.pointA || data.pointOnCircle || data.point, 'A');
  const pointB = label(points[1]?.label || data.pointB, 'B');
  const radius = data.radius ? escapeHtml(data.radius) : '';
  const description = String(data.description || diagram.title || '').toLowerCase();
  const showDiameter = points.length >= 2 || /diameter|through\s+cent(?:er|re)/.test(description);
  const legend = showDiameter
    ? diagramLegend([`${pointA}${pointB} = diameter`, `${center}${pointA} and ${center}${pointB} = radii${radius ? ` = ${radius}` : ''}`])
    : diagramLegend([`${center}${pointA} = radius${radius ? ` = ${radius}` : ''}`]);

  return wrapDiagram({
    title: diagram.title || (showDiameter ? 'Circle with Diameter AB' : 'Circle'),
    body: `
      <svg viewBox="0 0 460 280" role="img" aria-label="Circle diagram" style="width:100%;height:auto;display:block;">
        <circle cx="230" cy="140" r="88" fill="#f3f6ff" stroke="#21144f" stroke-width="3" />
        ${svgPoint({ x: 230, y: 140, name: center, color: '#21144f', dx: -20, dy: -8 })}
        ${showDiameter
          ? `${svgSegment({ x1: 142, y1: 140, x2: 318, y2: 140, color: '#2f80ed', width: 4 })}
             ${svgPoint({ x: 142, y: 140, name: pointA, dx: -20, dy: -10 })}
             ${svgPoint({ x: 318, y: 140, name: pointB, dx: 10, dy: -10 })}
             <text x="201" y="122" font-size="15" font-weight="800" fill="#2f80ed">${pointA}${pointB} = diameter</text>
             <text x="174" y="248" font-size="15" font-weight="800" fill="#463b7a">${center} is the midpoint, so ${center}${pointA} = ${center}${pointB}${radius ? ` = ${radius}` : ''}</text>`
          : `${svgPoint({ x: 318, y: 140, name: pointA, dx: 10, dy: -10 })}
             ${svgSegment({ x1: 230, y1: 140, x2: 318, y2: 140, color: '#2f80ed' })}`}
        ${radius ? `<text x="246" y="162" font-size="14" font-weight="800" fill="#2f80ed">r = ${radius}</text>` : ''}
      </svg>
      ${legend}
    `,
  });
};

export const renderCircleTangent = (diagram) => {
  const data = diagram.data || {};
  const center = label(data.center, 'O');
  const external = label(data.externalPoint, 'P');
  const touchA = label(data.touchPointA || data.touchPoints?.[0], 'A');
  const touchB = label(data.touchPointB || data.touchPoints?.[1], 'B');
  const radius = data.radius ? escapeHtml(data.radius) : '';
  const distance = data.distanceOP ? escapeHtml(data.distanceOP) : '';
  const legend = diagramLegend([
    `${external}${touchA} and ${external}${touchB} = tangents`,
    `${center}${touchA} and ${center}${touchB} = radii${radius ? ` = ${radius}` : ''}`,
    `${center}${external} = distance from center to external point${distance ? ` = ${distance}` : ''}`,
  ]);

  return wrapDiagram({
    title: diagram.title || 'Circle Tangents',
    body: `
      <svg viewBox="0 0 460 260" role="img" aria-label="Circle tangent diagram" style="width:100%;height:auto;display:block;">
        <circle cx="170" cy="130" r="78" fill="#f3f6ff" stroke="#21144f" stroke-width="3" />
        ${svgPoint({ x: 170, y: 130, name: center, color: '#21144f', dx: -20, dy: -7 })}
        ${svgPoint({ x: 330, y: 130, name: external, color: '#21144f', dx: 10, dy: 6 })}
        ${svgSegment({ x1: 330, y1: 130, x2: 197, y2: 57 })}
        ${svgSegment({ x1: 330, y1: 130, x2: 197, y2: 203 })}
        ${svgSegment({ x1: 170, y1: 130, x2: 197, y2: 57, color: '#6b5fd3', width: 2, dash: '5 5' })}
        ${svgSegment({ x1: 170, y1: 130, x2: 197, y2: 203, color: '#6b5fd3', width: 2, dash: '5 5' })}
        ${svgSegment({ x1: 170, y1: 130, x2: 330, y2: 130, color: '#2f80ed', width: 2, dash: '6 5' })}
        <text x="190" y="47" font-size="18" font-weight="800" fill="#21144f">${touchA}</text>
        <text x="190" y="223" font-size="18" font-weight="800" fill="#21144f">${touchB}</text>
        ${radius ? `<text x="118" y="90" font-size="14" fill="#463b7a">r = ${radius}</text>` : ''}
        ${distance ? `<text x="229" y="122" font-size="14" fill="#2f80ed">OP = ${distance}</text>` : ''}
      </svg>
      ${legend}
    `,
  });
};

export const renderCircleSecant = (diagram) => {
  const data = diagram.data || {};
  const center = label(data.center, 'O');
  const external = label(data.externalPoint, 'E');
  const nearPoint = label(data.secantPointA || data.pointF || data.nearPoint, 'F');
  const farPoint = label(data.secantPointB || data.pointG || data.farPoint, 'G');
  const touchPoint = label(data.touchPoint || data.touchPointA, 'A');
  const secant = escapeHtml(data.secant || `${external}${nearPoint}${farPoint}`);
  const tangent = data.tangent ? escapeHtml(data.tangent) : (data.touchPoint || data.touchPointA ? `${external}${touchPoint}` : '');
  const radius = data.radius ? escapeHtml(data.radius) : '';
  const hasTangent = Boolean(tangent || data.touchPoint || data.touchPointA);
  const legend = diagramLegend([
    `${secant} = secant line crossing the circle at ${nearPoint} and ${farPoint}`,
    hasTangent ? `${tangent || `${external}${touchPoint}`} = tangent touching the circle at ${touchPoint}` : '',
    `${center}${nearPoint} and ${center}${farPoint} = radii${radius ? ` = ${radius}` : ''}`,
  ]);

  return wrapDiagram({
    title: diagram.title || 'Secant from External Point',
    body: `
      <svg viewBox="0 0 520 300" role="img" aria-label="Circle secant diagram" style="width:100%;height:auto;display:block;">
        <circle cx="205" cy="150" r="88" fill="#f3f6ff" stroke="#21144f" stroke-width="3" />
        ${svgPoint({ x: 205, y: 150, name: center, color: '#21144f', dx: -20, dy: -7 })}
        ${svgPoint({ x: 430, y: 150, name: external, color: '#21144f', dx: 10, dy: 6 })}
        ${svgSegment({ x1: 430, y1: 150, x2: 130, y2: 94, color: '#2f80ed', width: 4 })}
        ${svgPoint({ x: 292, y: 124, name: nearPoint, color: '#2f80ed', dx: 8, dy: -9 })}
        ${svgPoint({ x: 130, y: 94, name: farPoint, color: '#2f80ed', dx: -22, dy: -8 })}
        ${svgSegment({ x1: 205, y1: 150, x2: 292, y2: 124, color: '#6b5fd3', width: 2, dash: '6 5' })}
        ${svgSegment({ x1: 205, y1: 150, x2: 130, y2: 94, color: '#6b5fd3', width: 2, dash: '6 5' })}
        ${hasTangent ? `${svgSegment({ x1: 430, y1: 150, x2: 240, y2: 69, color: '#21144f', width: 3 })}${svgPoint({ x: 240, y: 69, name: touchPoint, color: '#21144f', dx: 8, dy: -10 })}` : ''}
        <text x="296" y="110" font-size="15" font-weight="800" fill="#2f80ed">${secant}</text>
        ${hasTangent ? `<text x="322" y="92" font-size="15" font-weight="800" fill="#21144f">${tangent || `${external}${touchPoint}`} tangent</text>` : ''}
        ${radius ? `<text x="150" y="133" font-size="14" font-weight="800" fill="#6b5fd3">r = ${radius}</text>` : ''}
      </svg>
      ${legend}
    `,
  });
};
export const renderCircleChords = (diagram) => {
  const data = diagram.data || {};
  const hasSecondChord = Boolean(data.chord2 || data.chord2A || data.chord2B || data.pointD || data.pointE);
  if (!hasSecondChord) return renderCircleChordDistance({ ...diagram, kind: 'circle_chord_distance' });
  const center = label(data.center, 'O');
  const a = label(data.chord1A || data.pointA, 'A');
  const b = label(data.chord1B || data.pointB, 'B');
  const d = label(data.chord2A || data.pointD, 'D');
  const e = label(data.chord2B || data.pointE, 'E');
  const chord1 = escapeHtml(data.chord1 || `${a}${b}`);
  const chord2 = escapeHtml(data.chord2 || `${d}${e}`);
  const relation = escapeHtml(data.relation || `${chord1} = ${chord2}`);
  const angle1 = escapeHtml(data.angle1 || `angle ${a}${center}${b}`);
  const angle2 = escapeHtml(data.angle2 || `angle ${d}${center}${e}`);
  const legend = diagramLegend([`${chord1} and ${chord2} = chords`, `${center}${a}, ${center}${b}, ${center}${d}, ${center}${e} = radii`, `${angle1} and ${angle2} = central angles`, relation]);

  return wrapDiagram({
    title: diagram.title || 'Equal Chords and Central Angles',
    body: `
      <svg viewBox="0 0 520 330" role="img" aria-label="Equal chords and central angles diagram" style="width:100%;height:auto;display:block;">
        <circle cx="250" cy="150" r="105" fill="#f3f6ff" stroke="#21144f" stroke-width="3" />
        ${svgPoint({ x: 250, y: 150, name: center, color: '#21144f', dx: -14, dy: -6 })}
        ${svgSegment({ x1: 169, y1: 83, x2: 331, y2: 83, color: '#2f80ed', width: 4 })}
        ${svgSegment({ x1: 169, y1: 217, x2: 331, y2: 217, color: '#2f80ed', width: 4 })}
        ${svgSegment({ x1: 250, y1: 150, x2: 169, y2: 83, color: '#6b5fd3', width: 2.5 })}
        ${svgSegment({ x1: 250, y1: 150, x2: 331, y2: 83, color: '#6b5fd3', width: 2.5 })}
        ${svgSegment({ x1: 250, y1: 150, x2: 169, y2: 217, color: '#6b5fd3', width: 2.5 })}
        ${svgSegment({ x1: 250, y1: 150, x2: 331, y2: 217, color: '#6b5fd3', width: 2.5 })}
        <path d="M225 129 A35 35 0 0 1 275 129" fill="none" stroke="#f59e0b" stroke-width="3" />
        <path d="M225 171 A35 35 0 0 0 275 171" fill="none" stroke="#f59e0b" stroke-width="3" />
        <text x="150" y="78" font-size="18" font-weight="800" fill="#21144f">${a}</text>
        <text x="338" y="78" font-size="18" font-weight="800" fill="#21144f">${b}</text>
        <text x="150" y="237" font-size="18" font-weight="800" fill="#21144f">${d}</text>
        <text x="338" y="237" font-size="18" font-weight="800" fill="#21144f">${e}</text>
        <text x="218" y="68" font-size="15" font-weight="800" fill="#2f80ed">${chord1}</text>
        <text x="218" y="244" font-size="15" font-weight="800" fill="#2f80ed">${chord2}</text>
        <text x="300" y="152" font-size="14" fill="#f59e0b">${angle1}</text>
        <text x="300" y="174" font-size="14" fill="#f59e0b">${angle2}</text>
        <text x="132" y="296" font-size="15" font-weight="800" fill="#463b7a">${relation} means ${angle1} = ${angle2}</text>
      </svg>
      ${legend}
    `,
  });
};

export const renderCircleChordDistance = (diagram) => {
  const data = diagram.data || {};
  const center = label(data.center, 'O');
  const chordA = label(data.chordA || data.pointA || data.chord1A, 'A');
  const chordB = label(data.chordB || data.pointB || data.chord1B, 'B');
  const midpoint = label(data.midpoint || 'M', 'M');
  const chord = escapeHtml(data.chord || data.chord1 || `${chordA}${chordB}`);
  const chordLength = data.chordLength ? escapeHtml(data.chordLength) : '';
  const distance = escapeHtml(firstValue(data.distanceFromCenter, data.distance, data.perpendicular, data.om, '3 cm'));
  const radius = escapeHtml(firstValue(data.radius, data.radiusLength, '3 sqrt(2) cm'));
  const halfChord = escapeHtml(firstValue(data.halfChord, data.halfChordLength, chordLength === '6 cm' ? '3 cm' : 'half chord'));
  const legend = diagramLegend([
    `${chord} = chord${chordLength ? ` = ${chordLength}` : ''}`,
    `${center}${midpoint} = perpendicular distance${distance ? ` = ${distance}` : ''}`,
    `${center}${chordA} = radius${radius ? ` = ${radius}` : ''}`,
    `${chordA}${midpoint} = half chord${halfChord ? ` = ${halfChord}` : ''}`,
  ]);

  return wrapDiagram({
    title: diagram.title || 'Chord at a Fixed Distance from the Centre',
    body: `
      <svg viewBox="0 0 520 330" role="img" aria-label="Circle chord distance diagram" style="width:100%;height:auto;display:block;">
        <circle cx="250" cy="165" r="112" fill="#f3f6ff" stroke="#21144f" stroke-width="3" />
        ${svgSegment({ x1: 160, y1: 98, x2: 340, y2: 98, color: '#2f80ed', width: 4 })}
        ${svgSegment({ x1: 250, y1: 165, x2: 250, y2: 98, color: '#f59e0b' })}
        ${svgSegment({ x1: 250, y1: 165, x2: 160, y2: 98, color: '#6b5fd3' })}
        ${svgSegment({ x1: 250, y1: 165, x2: 340, y2: 98, color: '#6b5fd3', width: 2, dash: '6 5' })}
        <path d="M250 98 L266 98 L266 114 L250 114" fill="none" stroke="#f59e0b" stroke-width="2" />
        ${svgPoint({ x: 250, y: 165, name: center, color: '#21144f', dx: -14, dy: 23 })}
        ${svgPoint({ x: 250, y: 98, name: midpoint, color: '#f59e0b', dx: 8, dy: -6 })}
        ${svgPoint({ x: 160, y: 98, name: chordA, dx: -16, dy: -8 })}
        ${svgPoint({ x: 340, y: 98, name: chordB, dx: 8, dy: -8 })}
        <text x="222" y="76" font-size="15" font-weight="800" fill="#2f80ed">${chord}${chordLength ? ` = ${escapeHtml(chordLength)}` : ''}</text>
        <text x="263" y="134" font-size="15" font-weight="800" fill="#f59e0b">${center}${midpoint} = ${distance}</text>
        <text x="165" y="138" font-size="15" font-weight="800" fill="#6b5fd3">${center}${chordA} = ${radius}</text>
        <text x="176" y="118" font-size="14" fill="#2f80ed">${chordA}${midpoint} = ${halfChord}</text>
        <text x="94" y="292" font-size="15" font-weight="800" fill="#463b7a">Right triangle ${center}${midpoint}${chordA}: radius^2 = distance^2 + half-chord^2</text>
      </svg>
      ${legend}
    `,
  });
};

