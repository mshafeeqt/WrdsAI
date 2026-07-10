import { diagramLegend, escapeHtml, label, toNumber, wrapDiagram } from './shared.js';

const WIDTH = 560;
const HEIGHT = 380;
const DEFAULT_POINTS = {
  A: { x: 120, y: 285 },
  B: { x: 430, y: 285 },
  C: { x: 260, y: 70 },
  D: { x: 380, y: 105 },
  E: { x: 470, y: 185 },
  F: { x: 315, y: 145 },
  G: { x: 145, y: 105 },
  H: { x: 260, y: 185 },
  I: { x: 266, y: 196 },
  M: { x: 275, y: 285 },
  O: { x: 220, y: 185 },
  P: { x: 470, y: 185 },
  Q: { x: 470, y: 185 },
  R: { x: 145, y: 260 },
  S: { x: 315, y: 260 },
  T: { x: 282, y: 93 },
};

const ROLE_POINT_OVERRIDES = [
  [/external/i, { x: 470, y: 185 }],
  [/cent(?:er|re)|circumcenter|incenter|orthocenter/i, { x: 220, y: 185 }],
  [/centroid/i, { x: 270, y: 215 }],
  [/touch|tangent/i, { x: 282, y: 93 }],
  [/midpoint|foot/i, { x: 275, y: 285 }],
];

const normalizeObjects = (data) => {
  if (Array.isArray(data.objects)) return data.objects;
  if (Array.isArray(data.elements)) return data.elements;
  return [];
};

const normalizeRelationships = (data) => {
  if (Array.isArray(data.relationships)) return data.relationships.map(String);
  if (Array.isArray(data.notes)) return data.notes.map(String);
  if (typeof data.relationships === 'string') return [data.relationships];
  return [];
};

const objectLabel = (object) => String(object.label || object.name || object.id || '').trim();

const pointFromExplicitCoordinates = (object) => {
  if (!Number.isFinite(Number(object.x)) || !Number.isFinite(Number(object.y))) return null;
  const x = toNumber(object.x, 0);
  const y = toNumber(object.y, 0);

  if (x >= 0 && x <= WIDTH && y >= 0 && y <= HEIGHT) return { x, y };
  return {
    x: 60 + ((x + 10) / 20) * 440,
    y: 330 - ((y + 10) / 20) * 280,
  };
};

const pointFromRole = (object) => {
  const hint = `${object.role || ''} ${object.type || ''} ${objectLabel(object)}`;
  const match = ROLE_POINT_OVERRIDES.find(([pattern]) => pattern.test(hint));
  return match ? { ...match[1] } : null;
};

const ensurePoint = (points, labelValue, fallback) => {
  const cleanLabel = String(labelValue || '').trim();
  if (!cleanLabel) return fallback;
  if (!points.has(cleanLabel)) points.set(cleanLabel, fallback || DEFAULT_POINTS[cleanLabel] || { x: 280, y: 190 });
  return points.get(cleanLabel);
};

const buildPointMap = (objects) => {
  const points = new Map();

  for (const object of objects) {
    if (String(object.type || '').toLowerCase() !== 'point') continue;
    const name = objectLabel(object);
    if (!name) continue;
    points.set(name, pointFromExplicitCoordinates(object) || pointFromRole(object) || DEFAULT_POINTS[name] || { x: 280, y: 190 });
  }

  for (const object of objects) {
    const type = String(object.type || '').toLowerCase();
    if (type === 'circle' && object.center) {
      ensurePoint(points, object.center, DEFAULT_POINTS[object.center] || DEFAULT_POINTS.O);
    }

    for (const key of ['from', 'to', 'start', 'end', 'center', 'through', 'touchPoint']) {
      if (object[key]) ensurePoint(points, object[key], DEFAULT_POINTS[object[key]] || { x: 280, y: 190 });
    }

    if (Array.isArray(object.points)) {
      for (const point of object.points) {
        const pointLabel = typeof point === 'string' ? point : objectLabel(point);
        if (pointLabel) ensurePoint(points, pointLabel, pointFromExplicitCoordinates(point) || DEFAULT_POINTS[pointLabel] || { x: 280, y: 190 });
      }
    }
  }

  return points;
};

const parseEndpointLabels = (object) => {
  if (Array.isArray(object.points) && object.points.length >= 2) {
    return object.points.map((point) => (typeof point === 'string' ? point : objectLabel(point))).filter(Boolean).slice(0, 2);
  }

  const start = object.from || object.start || object.pointA || object.a;
  const end = object.to || object.end || object.pointB || object.b;
  if (start && end) return [start, end];

  const name = objectLabel(object);
  const letters = name.match(/[A-Z]/g);
  if (letters?.length >= 2) return [letters[0], letters[letters.length - 1]];

  return [];
};

const lineStyle = (role = '') => {
  if (/secant/i.test(role)) return { color: '#2f80ed', width: 4, dash: '' };
  if (/tangent/i.test(role)) return { color: '#21144f', width: 4, dash: '' };
  if (/radius/i.test(role)) return { color: '#6b5fd3', width: 2.5, dash: '7 6' };
  if (/bisector|median|altitude|perpendicular/i.test(role)) return { color: '#f59e0b', width: 3, dash: '7 6' };
  if (/chord/i.test(role)) return { color: '#2f80ed', width: 4, dash: '' };
  return { color: '#21144f', width: 3, dash: '' };
};

const renderLineObject = (object, points) => {
  const [startLabel, endLabel] = parseEndpointLabels(object);
  const start = ensurePoint(points, startLabel, DEFAULT_POINTS[startLabel] || { x: 120, y: 250 });
  const end = ensurePoint(points, endLabel, DEFAULT_POINTS[endLabel] || { x: 430, y: 160 });
  const role = object.role || object.type || '';
  const style = lineStyle(role);
  const name = objectLabel(object);
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  return `
    <line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="${style.color}" stroke-width="${style.width}" ${style.dash ? `stroke-dasharray="${style.dash}"` : ''} />
    ${name ? `<text x="${midX + 8}" y="${midY - 8}" font-size="14" font-weight="800" fill="${style.color}">${label(name)}</text>` : ''}
  `;
};

const renderCircleObject = (object, points) => {
  const centerLabel = object.center || object.centerLabel || 'O';
  const center = ensurePoint(points, centerLabel, DEFAULT_POINTS[centerLabel] || DEFAULT_POINTS.O);
  const radius = Number.isFinite(Number(object.radiusPx)) ? Number(object.radiusPx) : 92;
  const radiusLabel = object.radius || object.radiusLabel || '';

  return `
    <circle cx="${center.x}" cy="${center.y}" r="${radius}" fill="#f3f6ff" stroke="#21144f" stroke-width="3" />
    ${radiusLabel ? `<text x="${center.x - radius + 20}" y="${center.y - 18}" font-size="14" font-weight="800" fill="#6b5fd3">r = ${escapeHtml(radiusLabel)}</text>` : ''}
  `;
};

const renderPolygonObject = (object, points) => {
  const polygonPoints = Array.isArray(object.points) ? object.points : [];
  const labels = polygonPoints.map((point) => (typeof point === 'string' ? point : objectLabel(point))).filter(Boolean);
  if (labels.length < 3) return '';
  const svgPoints = labels.map((pointLabel) => ensurePoint(points, pointLabel, DEFAULT_POINTS[pointLabel] || { x: 280, y: 190 }));

  return `<polygon points="${svgPoints.map((point) => `${point.x},${point.y}`).join(' ')}" fill="rgba(47,128,237,0.06)" stroke="#21144f" stroke-width="3" />`;
};

const renderAngleObject = (object, points) => {
  const vertexLabel = object.vertex || object.center || objectLabel(object) || 'O';
  const vertex = ensurePoint(points, vertexLabel, DEFAULT_POINTS[vertexLabel] || DEFAULT_POINTS.O);
  const angleLabel = object.measure || object.label || object.name || 'angle';

  return `
    <path d="M${vertex.x + 34} ${vertex.y} A34 34 0 0 0 ${vertex.x + 22} ${vertex.y - 26}" fill="none" stroke="#ef4444" stroke-width="3" />
    <text x="${vertex.x + 36}" y="${vertex.y - 18}" font-size="14" font-weight="800" fill="#ef4444">${label(angleLabel)}</text>
  `;
};

const renderRightAngleMarker = (relationship, points) => {
  const match = String(relationship).match(/([A-Z])\s*(?:perpendicular|\u22A5|\u27C2)\s*([A-Z])/i);
  if (!match) return '';
  const vertex = points.get(match[1]) || DEFAULT_POINTS[match[1]] || { x: 280, y: 190 };
  return `<path d="M${vertex.x} ${vertex.y - 18} L${vertex.x + 18} ${vertex.y - 18} L${vertex.x + 18} ${vertex.y}" fill="none" stroke="#f59e0b" stroke-width="2" />`;
};

const renderPointLabels = (points) =>
  [...points.entries()]
    .map(([name, point]) => `
      <circle cx="${point.x}" cy="${point.y}" r="6" fill="#2f80ed" />
      <text x="${point.x + 8}" y="${point.y - 8}" font-size="18" font-weight="800" fill="#21144f">${label(name)}</text>
    `)
    .join('');

const buildLegendItems = (objects, relationships) => {
  const objectItems = objects
    .map((object) => {
      const name = objectLabel(object);
      const role = object.role || object.description || '';
      if (!name || !role) return '';
      return `${name} = ${role}`;
    })
    .filter(Boolean);

  return [...objectItems, ...relationships].slice(0, 8);
};

export const renderGeometryScene = (diagram) => {
  const data = diagram.data || {};
  const objects = normalizeObjects(data);
  const relationships = normalizeRelationships(data);
  const points = buildPointMap(objects);
  const hasCircle = objects.some((object) => String(object.type || '').toLowerCase() === 'circle');
  const hasPolygon = objects.some((object) => ['polygon', 'triangle', 'quadrilateral', 'square', 'rectangle'].includes(String(object.type || '').toLowerCase()));

  if (!objects.length) return '';

  const circleObjects = objects.filter((object) => String(object.type || '').toLowerCase() === 'circle');
  const polygonObjects = objects.filter((object) => ['polygon', 'triangle', 'quadrilateral', 'square', 'rectangle'].includes(String(object.type || '').toLowerCase()));
  const lineObjects = objects.filter((object) => ['line', 'segment', 'ray'].includes(String(object.type || '').toLowerCase()));
  const angleObjects = objects.filter((object) => String(object.type || '').toLowerCase() === 'angle');

  const fallbackShape = !hasCircle && !hasPolygon && points.size >= 3
    ? `<polygon points="${[...points.values()].slice(0, 3).map((point) => `${point.x},${point.y}`).join(' ')}" fill="rgba(47,128,237,0.06)" stroke="#21144f" stroke-width="3" />`
    : '';

  return wrapDiagram({
    title: diagram.title || data.title || 'Geometry Diagram',
    body: `
      <svg viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="Geometry scene diagram" style="width:100%;height:auto;display:block;">
        ${circleObjects.map((object) => renderCircleObject(object, points)).join('')}
        ${polygonObjects.map((object) => renderPolygonObject(object, points)).join('')}
        ${fallbackShape}
        ${lineObjects.map((object) => renderLineObject(object, points)).join('')}
        ${angleObjects.map((object) => renderAngleObject(object, points)).join('')}
        ${relationships.map((relationship) => renderRightAngleMarker(relationship, points)).join('')}
        ${renderPointLabels(points)}
      </svg>
      ${diagramLegend(buildLegendItems(objects, relationships))}
    `,
  });
};
