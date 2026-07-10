const FENCED_DIAGRAM_RE = /```(?:diagram|diagram_spec|json)?\s*([\s\S]*?)```/gi;
const INLINE_DIAGRAM_RE = /^\s*(?:<p[^>]*>)?\s*DIAGRAM(?:[_\s-]*SPEC)?\s*:\s*(.+?)\s*(?:<\/p>)?\s*$/gim;
const LOOSE_DIAGRAM_BLOCK_RE = /^\s*(?:<p[^>]*>)?\s*DIAGRAM(?:[_\s-]*SPEC)?\s*:?\s*(?:<\/p>)?\s*\n\s*(\{[\s\S]*?\})\s*\.?\s*$/gim;
const MULTILINE_KEY_VALUE_DIAGRAM_RE = /^\s*(?:<p[^>]*>)?\s*(?:\*\*)?\s*DIAGRAM(?:[_\s-]*SPEC)?\s*(?:\*\*)?\s*:\s*([\s\S]*?)(?=^\s*(?:Optional\b|Final\s+Answer\b|If\s+you\b|Quick\s+check\b|Summary\b|Key\s+Point\b|\*\*\s*(?:Optional|Final\s+Answer|Summary)|$))/gim;
const BROKEN_INLINE_DIAGRAM_RE = /^.*?DIAGRAM(?:[_\s-]*SPEC)?\s*:\s*([\s\S]*?)(?=^\s*(?:Final\s+(?:Answer|takeaway)\b|If\s+you\b|Quick\s+check\b|Summary\b|Key\s+Point\b|$))/gim;
const MAX_DIAGRAMS = 3;

const SUPPORTED_KINDS = new Set([
  'geometry_scene',
  'triangle',
  'right_triangle',
  'trigonometry_triangle',
  'triangle_circumcenter',
  'triangle_centroid',
  'triangle_incenter',
  'triangle_orthocenter',
  'quadrilateral',
  'regular_polygon',
  'parallelogram',
  'rectangle',
  'square',
  'trapezoid',
  'trapezium',
  'circle_tangent',
  'circle_secant',
  'circle_chords',
  'circle_chord_distance',
  'circle',
  'coordinate_plane',
  'linear_graph',
  'number_line',
  'unit_circle',
  'quadratic_graph',
  'cube',
  'cuboid',
  'cylinder',
  'cone',
  'sphere',
]);

const KIND_ALIASES = {
  geometryscene: 'geometry_scene',
  geometry_diagram: 'geometry_scene',
  dynamic_geometry: 'geometry_scene',
  geometry_scene_diagram: 'geometry_scene',
  centroid: 'triangle_centroid',
  trianglecentroid: 'triangle_centroid',
  triangle_centroid: 'triangle_centroid',
  median: 'triangle_centroid',
  medians: 'triangle_centroid',
  circumcenter: 'triangle_circumcenter',
  circumcentre: 'triangle_circumcenter',
  trianglecircumcenter: 'triangle_circumcenter',
  triangle_circumcentre: 'triangle_circumcenter',
  trianglecircumcentre: 'triangle_circumcenter',
  circumcircle: 'triangle_circumcenter',
  incenter: 'triangle_incenter',
  incentre: 'triangle_incenter',
  triangleincenter: 'triangle_incenter',
  triangleincentre: 'triangle_incenter',
  incircle: 'triangle_incenter',
  anglebisector: 'triangle_incenter',
  anglebisectors: 'triangle_incenter',
  angle_bisectors: 'triangle_incenter',
  orthocenter: 'triangle_orthocenter',
  orthocentre: 'triangle_orthocenter',
  triangleorthocenter: 'triangle_orthocenter',
  triangleorthocentre: 'triangle_orthocenter',
  altitude: 'triangle_orthocenter',
  altitudes: 'triangle_orthocenter',
  righttriangle: 'right_triangle',
  trigtriangle: 'trigonometry_triangle',
  trig_triangle: 'trigonometry_triangle',
  trigonometrytriangle: 'trigonometry_triangle',
  quadrangle: 'quadrilateral',
four_sided_figure: 'quadrilateral',
circlechords: 'circle_chords',
  chorddistance: 'circle_chord_distance',
  chord_distance: 'circle_chord_distance',
  circlechorddistance: 'circle_chord_distance',
  circle_chord_distance: 'circle_chord_distance',
  equalchords: 'circle_chords',
  equal_chords: 'circle_chords',
  circle_chord: 'circle_chords',
  circlechord: 'circle_chords',
  circle_chords_equal_angles: 'circle_chords',
  circlechordsequalangles: 'circle_chords',
  tangent: 'circle_tangent',
  tangents: 'circle_tangent',
  circletangent: 'circle_tangent',
  circle_tangents: 'circle_tangent',
  secant: 'circle_secant',
  secants: 'circle_secant',
  circlesecant: 'circle_secant',
  circle_secants: 'circle_secant',
  tangent_secant: 'circle_secant',
  secant_tangent: 'circle_secant',
  lineargraph: 'linear_graph',
  linegraph: 'linear_graph',
  straightlinegraph: 'linear_graph',
  straight_line_graph: 'linear_graph',
  numberline: 'number_line',
  unitcircle: 'unit_circle',
  trigonometriccircle: 'unit_circle',
  trigonometric_circle: 'unit_circle',
  quadraticgraph: 'quadratic_graph',
  parabola: 'quadratic_graph',
  rectangular_prism: 'cuboid',
  prism: 'cuboid',
  circular_cylinder: 'cylinder',
};

const decodeHtmlEntities = (value = '') =>
  String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const normalizeDiagramMarkers = (value = '') =>
  decodeHtmlEntities(value)
    .replace(/<\/?(?:strong|b)[^>]*>/gi, '')
    .replace(/DIAGRAM\s*<sub[^>]*>\s*SPEC\s*<\/sub>\s*:?/gi, 'DIAGRAM_SPEC:')
    .replace(/DIAGRAM[\u2090-\u209C]+[A-Za-z]*\s*:?/gi, 'DIAGRAM_SPEC:')
    .replace(/DIAGRAM\s*SPEC\s*:?/gi, 'DIAGRAM_SPEC:')
    .replace(/DIAGRAMSPEC(?:ification)?\s*:?/gi, 'DIAGRAM_SPEC:');

const normalizeKind = (value = '') => {
  const normalized = String(value).trim().toLowerCase().replace(/[\s-]+/g, '_');
  return KIND_ALIASES[normalized] || normalized;
};
const POLYGON_SIDE_WORDS = {
  triangle: 3,
  quadrilateral: 4,
  square: 4,
  rectangle: 4,
  pentagon: 5,
  hexagon: 6,
  heptagon: 7,
  septagon: 7,
  octagon: 8,
  nonagon: 9,
  decagon: 10,
  hendecagon: 11,
  undecagon: 11,
  dodecagon: 12,
};

const polygonSidesFromText = (value = '') => {
  const text = String(value).toLowerCase();
  const numericMatch = text.match(/regular\s+(\d{1,2})\s*-?\s*(?:gon|sided\s+polygon|sided\s+figure)/i);
  if (numericMatch) {
    const sides = Number.parseInt(numericMatch[1], 10);
    if (sides >= 3 && sides <= 20) return sides;
  }

  for (const [word, sides] of Object.entries(POLYGON_SIDE_WORDS)) {
    if (new RegExp(`\\b(?:regular\\s+)?${word}\\b`, 'i').test(text)) return sides;
  }
  return null;
};

const polygonNameFromSides = (sides) =>
  Object.entries(POLYGON_SIDE_WORDS).find(([, value]) => value === sides)?.[0] || `${sides}-gon`;

const isIrregularPolygonText = (value = '') => /\b(?:irregular|non-regular|not\s+regular|unequal\s+sides?|different\s+sides?)\b/i.test(String(value));

const buildIrregularPolygonScene = (sides = 5) => {
  const safeSides = Math.min(10, Math.max(4, Number.parseInt(sides, 10) || 5));
  const name = polygonNameFromSides(safeSides);
  const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, safeSides);
  const coordinates = [
    { x: 132, y: 250 },
    { x: 260, y: 285 },
    { x: 425, y: 230 },
    { x: 384, y: 92 },
    { x: 205, y: 72 },
    { x: 92, y: 160 },
    { x: 145, y: 330 },
    { x: 330, y: 332 },
    { x: 470, y: 160 },
    { x: 300, y: 42 },
  ];

  return {
    type: 'diagram',
    kind: 'geometry_scene',
    title: `Irregular ${name} with ${safeSides} sides`,
    data: {
      objects: [
        ...labels.map((pointLabel, index) => ({
          type: 'point',
          label: pointLabel,
          x: coordinates[index].x,
          y: coordinates[index].y,
          role: 'vertex',
        })),
        { type: 'polygon', label: labels.join(''), points: labels, role: `irregular ${name}` },
      ],
      relationships: [`${labels.join('')} = irregular ${name}`, 'Side lengths and angles are not all equal'],
    },
  };
};

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const inferKindFromHint = (rawKind, hint) => {
  const polygonSides = polygonSidesFromText(hint);
  if (polygonSides && isIrregularPolygonText(hint)) {
    return 'geometry_scene';
  }
  if (polygonSides && /regular|polygon|pentagon|hexagon|heptagon|septagon|octagon|nonagon|decagon|gon\b/.test(hint)) {
    return 'regular_polygon';
  }

  if (rawKind === 'coordinate_plane') {
    if (/circumcent(?:er|re)|circumcircle|perpendicular\s+bisectors?/.test(hint)) return 'triangle_circumcenter';
    if (/centroid|median|midpoint/.test(hint)) return 'triangle_centroid';
    if (/incent(?:er|re)|incircle|angle\s+bisectors?/.test(hint)) return 'triangle_incenter';
    if (/orthocent(?:er|re)|altitudes?/.test(hint)) return 'triangle_orthocenter';
  }
  if (rawKind === 'circle_tangent' && /secant/.test(hint)) return 'circle_secant';
  return rawKind;
};

const normalizeDiagram = (candidate) => {
  if (!candidate || typeof candidate !== 'object') return null;

  const declaredType = normalizeKind(candidate.type);
  const declaredKind = normalizeKind(candidate.kind);
  const rawKind = declaredType === 'diagram' ? declaredKind : declaredKind || declaredType;
  const title = typeof candidate.title === 'string' ? candidate.title : '';
  const data = candidate.data && typeof candidate.data === 'object' ? { ...candidate.data } : {};

  for (const [key, value] of Object.entries(candidate)) {
    if (!['type', 'kind', 'title', 'data'].includes(key)) data[key] = value;
  }

  const hint = `${title.toLowerCase()} ${JSON.stringify(data).toLowerCase()}`;
  const irregularSides = polygonSidesFromText(hint);
  if (irregularSides && isIrregularPolygonText(hint)) {
    return buildIrregularPolygonScene(irregularSides);
  }
  const kind = inferKindFromHint(rawKind, hint);
  if (!SUPPORTED_KINDS.has(kind)) return null;

  if (kind === 'regular_polygon' && !data.sides) {
    data.sides = polygonSidesFromText(hint) || 5;
  }
  if (kind === 'regular_polygon' && !data.name) {
    data.name = polygonNameFromSides(Number(data.sides));
  }

  return { type: 'diagram', kind, title, data };
};

const stripDiagramPrefix = (value = '') =>
  normalizeDiagramMarkers(value).trim().replace(/^DIAGRAM(?:[_\s-]*SPEC)?\s*:?\s*/i, '').trim();

const ensureObjectJson = (value = '') => {
  const trimmed = value.trim().replace(/[.;,]\s*$/, '');
  return trimmed.startsWith('{') ? trimmed : `{${trimmed}}`;
};

const closeMalformedDataObject = (value = '') => {
  const dataIndex = value.indexOf('"data":{');
  if (dataIndex === -1) return value;
  const lastBraceIndex = value.lastIndexOf('}');
  if (lastBraceIndex === -1) return `${value}}`;
  const beforeLastBrace = value.slice(0, lastBraceIndex);
  if (beforeLastBrace.trimEnd().endsWith('}')) return value;
  return `${beforeLastBrace}}${value.slice(lastBraceIndex)}`;
};

const repairMalformedDataObject = (value = '') => {
  const repaired = value
    .replace(/"data"\s*:\s*"([A-Za-z0-9_]+)"\s*:/, '"data":{"$1":')
    .replace(/"data"\s*:\s*(?="[A-Za-z0-9_]"\s*:)/, '"data":{');
  return closeMalformedDataObject(repaired);
};

const parseKeyValueDiagramSpec = (rawValue = '') => {
  const pairs = [...normalizeDiagramMarkers(rawValue).matchAll(/"([A-Za-z0-9_]+)"\s*:\s*"([^"\n]*)"/g)];
  if (!pairs.length) return null;

  const candidate = { data: {} };
  for (const [, key, value] of pairs) {
    if (key === 'type' || key === 'kind' || key === 'title') candidate[key] = value;
    else if (key !== 'data') candidate.data[key] = value;
  }
  return candidate.type || candidate.kind ? candidate : null;
};

const parseDiagramJson = (rawValue = '') => {
  const withoutPrefix = stripDiagramPrefix(rawValue);
  const objectJson = ensureObjectJson(withoutPrefix);
  const candidates = [withoutPrefix, objectJson, repairMalformedDataObject(objectJson)];

  for (const candidate of candidates) {
    const parsed = safeJsonParse(candidate);
    if (parsed) return parsed;
  }
  return parseKeyValueDiagramSpec(withoutPrefix);
};

const extractJsonFromFence = (value = '') => {
  const trimmed = stripDiagramPrefix(value);
  if (!trimmed.includes('"type"') && !trimmed.includes('"kind"')) return null;
  return trimmed;
};

const collectDiagram = (rawJson, diagrams) => {
  if (diagrams.length >= MAX_DIAGRAMS) return null;
  const diagram = normalizeDiagram(parseDiagramJson(rawJson));
  if (!diagram) return null;
  diagrams.push(diagram);
  return '';
};

const buildTriangleCenterScene = ({ title, centerLabel, centerRole, circle, connectors, relationships }) =>
  normalizeDiagram({
    type: 'diagram',
    kind: 'geometry_scene',
    title,
    data: {
      objects: [
        { type: 'point', label: 'A', x: 118, y: 292, role: 'vertex' },
        { type: 'point', label: 'B', x: 438, y: 292, role: 'vertex' },
        { type: 'point', label: 'C', x: 258, y: 62, role: 'vertex' },
        { type: 'point', label: centerLabel, x: 270, y: 188, role: centerRole },
        { type: 'triangle', label: 'ABC', points: ['A', 'B', 'C'], role: 'triangle' },
        ...(circle ? [circle] : []),
        ...connectors,
      ],
      relationships,
    },
  });

const extractDimension = (text, names, fallback = '') => {
  const source = String(text);
  for (const name of names) {
    const escapedName = name.replace(/\s+/g, '\\s+');
    const match = source.match(new RegExp(`\\b${escapedName}\\s*(?:=|is|of)?\\s*(\\d+(?:\\.\\d+)?)\\s*(cm|mm|m|units?)?`, 'i'));
    if (match) return `${match[1]} ${match[2] || ''}`.trim();
  }
  return fallback;
};

const inferSolidDiagram = (value = '') => {
  const text = String(value);
  if (!/draw|diagram|figure|sketch|construct|surface|volume|area|show/i.test(text)) return null;
  const lower = text.toLowerCase();
  if (/\bcube\b/.test(lower)) {
    return normalizeDiagram({ type: 'diagram', kind: 'cube', title: 'Cube', data: { side: extractDimension(text, ['side', 'edge'], 'a') } });
  }
  if (/\b(cuboid|rectangular\s+prism)\b/.test(lower)) {
    return normalizeDiagram({ type: 'diagram', kind: 'cuboid', title: 'Cuboid', data: { length: extractDimension(text, ['length'], 'l'), breadth: extractDimension(text, ['breadth', 'width'], 'b'), height: extractDimension(text, ['height'], 'h') } });
  }
  if (/\bcylinder\b/.test(lower)) {
    return normalizeDiagram({ type: 'diagram', kind: 'cylinder', title: 'Cylinder', data: { radius: extractDimension(text, ['radius'], 'r'), height: extractDimension(text, ['height'], 'h') } });
  }
  if (/\bcone\b/.test(lower)) {
    return normalizeDiagram({ type: 'diagram', kind: 'cone', title: 'Cone', data: { radius: extractDimension(text, ['radius'], 'r'), height: extractDimension(text, ['height'], 'h'), slantHeight: extractDimension(text, ['slant height', 'slantheight'], 'l') } });
  }
  if (/\bsphere\b/.test(lower)) {
    return normalizeDiagram({ type: 'diagram', kind: 'sphere', title: 'Sphere', data: { radius: extractDimension(text, ['radius'], 'r') } });
  }
  return null;
};

const inferIrregularPolygonDiagram = (value = '') => {
  const text = String(value);
  if (!isIrregularPolygonText(text)) return null;
  const sides = polygonSidesFromText(text);
  if (!sides || sides < 4) return null;
  if (!/draw|diagram|figure|sketch|construct|polygon|pentagon|hexagon|heptagon|septagon|octagon|nonagon|decagon|gon\b/i.test(text)) return null;
  return buildIrregularPolygonScene(sides);
};

const inferRegularPolygonDiagram = (value = '') => {
  const text = String(value);
  if (isIrregularPolygonText(text)) return null;
  const sides = polygonSidesFromText(text);
  if (!sides || sides < 5) return null;
  if (!/draw|diagram|figure|sketch|construct|regular|polygon|pentagon|hexagon|heptagon|septagon|octagon|nonagon|decagon|gon\b/i.test(text)) return null;

  const optionalDiagonals = /\boptional(?:ly)?\b[^.\n]*\bdiagonals?\b/i.test(text);
  const requestedDiagonals = /\bdiagonals?\b/i.test(text) && !optionalDiagonals;
  const name = polygonNameFromSides(sides);
  return normalizeDiagram({
    type: 'diagram',
    kind: 'regular_polygon',
    title: `Regular ${name} with ${sides} sides`,
    data: {
      sides,
      name,
      center: 'O',
      showCircle: /inscrib|circle/i.test(text),
      diagonals: requestedDiagonals,
      description: /inscrib|circle/i.test(text) ? `Regular ${name} inscribed in a circle` : `Regular ${name}`,
    },
  });
};
const buildRectangleScene = ({ includeDiagonals = false } = {}) => {
  const connectors = includeDiagonals
    ? [
        { type: 'segment', label: 'AC', from: 'A', to: 'C', role: 'diagonal' },
        { type: 'segment', label: 'BD', from: 'B', to: 'D', role: 'diagonal' },
        { type: 'point', label: 'O', x: 280, y: 170, role: 'intersection of diagonals' },
      ]
    : [];

  return normalizeDiagram({
    type: 'diagram',
    kind: 'geometry_scene',
    title: includeDiagonals ? 'Rectangle ABCD with Diagonals AC and BD' : 'Rectangle ABCD',
    data: {
      objects: [
        { type: 'point', label: 'A', x: 145, y: 260, role: 'vertex' },
        { type: 'point', label: 'B', x: 415, y: 260, role: 'vertex' },
        { type: 'point', label: 'C', x: 415, y: 85, role: 'vertex' },
        { type: 'point', label: 'D', x: 145, y: 85, role: 'vertex' },
        { type: 'rectangle', label: 'ABCD', points: ['A', 'B', 'C', 'D'], role: 'rectangle' },
        ...connectors,
      ],
      relationships: includeDiagonals
        ? ['ABCD = rectangle', 'AC and BD = diagonals', 'Opposite sides are parallel and equal']
        : ['ABCD = rectangle', 'Opposite sides are parallel and equal', 'Each angle is 90 degrees'],
    },
  });
};

const inferRectangleDiagram = (value = '') => {
  const text = String(value);
  if (!/\brectangle\b/i.test(text)) return null;
  if (!/draw|diagram|figure|sketch|diagonal/i.test(text)) return null;

  const includeDiagonals = /\bdiagonals?\b/i.test(text) && !/\boptional(?:ly)?\b[^.\n]*\bdiagonals?\b/i.test(text);
  return buildRectangleScene({ includeDiagonals });
};
const inferSquareDiagram = (value = '') => {
  const text = String(value);
  if (!/\bsquare\b/i.test(text)) return null;
  if (!/draw|diagram|figure|sketch|diagonal/i.test(text)) return null;

  const includeDiagonals = /diagonal/i.test(text);
  const connectors = includeDiagonals
    ? [
        { type: 'segment', label: 'AC', from: 'A', to: 'C', role: 'diagonal' },
        { type: 'segment', label: 'BD', from: 'B', to: 'D', role: 'diagonal' },
        { type: 'point', label: 'O', x: 280, y: 170, role: 'intersection of diagonals' },
      ]
    : [];

  return normalizeDiagram({
    type: 'diagram',
    kind: 'geometry_scene',
    title: includeDiagonals ? 'Square ABCD with Diagonals AC and BD' : 'Square ABCD',
    data: {
      objects: [
        { type: 'point', label: 'A', x: 170, y: 280, role: 'vertex' },
        { type: 'point', label: 'B', x: 390, y: 280, role: 'vertex' },
        { type: 'point', label: 'C', x: 390, y: 60, role: 'vertex' },
        { type: 'point', label: 'D', x: 170, y: 60, role: 'vertex' },
        { type: 'quadrilateral', label: 'ABCD', points: ['A', 'B', 'C', 'D'], role: 'square' },
        ...connectors,
      ],
      relationships: includeDiagonals
        ? ['ABCD = square', 'AC and BD = diagonals', 'O = intersection of diagonals']
        : ['ABCD = square', 'All sides are equal', 'All angles are 90 degrees'],
    },
  });
};
const inferTriangleCenterDiagram = (value = '') => {
  const lowerText = String(value).toLowerCase();

  if (/\bincent(?:er|re)\b|\bincircle\b|angle\s+bisectors?/i.test(lowerText)) {
    return buildTriangleCenterScene({
      title: 'Triangle ABC with Incenter and Incircle',
      centerLabel: 'I',
      centerRole: 'incenter',
      circle: { type: 'circle', center: 'I', radius: 'r', radiusPx: 48, role: 'incircle tangent to all three sides' },
      connectors: [
        { type: 'segment', label: 'AI', from: 'A', to: 'I', role: 'angle bisector' },
        { type: 'segment', label: 'BI', from: 'B', to: 'I', role: 'angle bisector' },
        { type: 'segment', label: 'CI', from: 'C', to: 'I', role: 'angle bisector' },
      ],
      relationships: ['I = incenter', 'AI, BI, CI = angle bisectors', 'Incircle touches all three sides'],
    });
  }

  if (/\bcircumcent(?:er|re)\b|\bcircumcircle\b|perpendicular\s+bisectors?/i.test(lowerText)) {
    return buildTriangleCenterScene({
      title: 'Triangle ABC with Circumcenter',
      centerLabel: 'O',
      centerRole: 'circumcenter',
      circle: { type: 'circle', center: 'O', radius: 'R', radiusPx: 142, role: 'circumcircle through A, B, C' },
      connectors: [
        { type: 'segment', label: 'OA', from: 'O', to: 'A', role: 'radius' },
        { type: 'segment', label: 'OB', from: 'O', to: 'B', role: 'radius' },
        { type: 'segment', label: 'OC', from: 'O', to: 'C', role: 'radius' },
      ],
      relationships: ['O = circumcenter', 'OA = OB = OC', 'Circumcircle passes through A, B, C'],
    });
  }

  if (/\bcentroid\b|\bmedians?\b/i.test(lowerText)) {
    return buildTriangleCenterScene({
      title: 'Triangle ABC with Centroid',
      centerLabel: 'G',
      centerRole: 'centroid',
      circle: null,
      connectors: [
        { type: 'point', label: 'M', x: 348, y: 177, role: 'midpoint of BC' },
        { type: 'point', label: 'N', x: 188, y: 177, role: 'midpoint of AC' },
        { type: 'point', label: 'P', x: 278, y: 292, role: 'midpoint of AB' },
        { type: 'segment', label: 'AM', from: 'A', to: 'M', role: 'median' },
        { type: 'segment', label: 'BN', from: 'B', to: 'N', role: 'median' },
        { type: 'segment', label: 'CP', from: 'C', to: 'P', role: 'median' },
      ],
      relationships: ['G = centroid', 'AM, BN, CP = medians', 'M, N, P are side midpoints'],
    });
  }

  if (/\borthocent(?:er|re)\b|\baltitudes?\b/i.test(lowerText)) {
    return buildTriangleCenterScene({
      title: 'Triangle ABC with Orthocenter',
      centerLabel: 'H',
      centerRole: 'orthocenter',
      circle: null,
      connectors: [
        { type: 'segment', label: 'CH', from: 'C', to: 'H', role: 'altitude' },
        { type: 'segment', label: 'AH', from: 'A', to: 'H', role: 'altitude' },
        { type: 'segment', label: 'BH', from: 'B', to: 'H', role: 'altitude' },
      ],
      relationships: ['H = orthocenter', 'Altitudes meet at H', 'Each altitude is perpendicular to the opposite side'],
    });
  }

  return null;
};
const extractTriangleAngles = (value = '') => {
  const angles = {};
  const symbolicPattern = /(?:\\angle|\u2220)\s*([A-Z])([A-Z])?([A-Z])?\s*=\s*(\d+(?:\.\d+)?)\s*\u00B0?/giu;
  const namedPattern = /\bangle\s+([A-Z])\s*=\s*(\d+(?:\.\d+)?)\s*\u00B0?/giu;

  for (const match of String(value).matchAll(symbolicPattern)) {
    const key = (match[2] || match[1]).toUpperCase();
    if (!angles[key]) angles[key] = `${match[4]}\u00B0`;
  }

  for (const match of String(value).matchAll(namedPattern)) {
    const key = match[1].toUpperCase();
    if (!angles[key]) angles[key] = `${match[2]}\u00B0`;
  }

  return angles;
};

const inferTriangleAngleDiagram = (value = '') => {
  const text = String(value);
  if (!/\btriangle\b|\u25B3|\bABC\b/iu.test(text)) return null;
  if (!/draw|diagram|figure|sketch|\u2220|\\angle|angle/iu.test(text)) return null;

  const angles = extractTriangleAngles(text);
  const knownAngles = ['A', 'B', 'C'].filter((key) => angles[key]);
  if (!knownAngles.length && !/draw|diagram|figure|sketch/iu.test(text)) return null;

  if (!angles.B && angles.A && angles.C) {
    const angleAValue = Number.parseFloat(angles.A);
    const angleCValue = Number.parseFloat(angles.C);
    if (Number.isFinite(angleAValue) && Number.isFinite(angleCValue)) {
      angles.B = `${180 - angleAValue - angleCValue}\u00B0`;
    }
  }

  const relation = angles.A && angles.B && angles.C
    ? `\u2220A + \u2220B + \u2220C = 180\u00B0, so \u2220B = ${angles.B}`
    : 'Angles in a triangle add up to 180\u00B0';

  return normalizeDiagram({
    type: 'diagram',
    kind: 'triangle',
    title: 'Triangle ABC with Angle Markings',
    data: {
      vertexA: 'A',
      vertexB: 'B',
      vertexC: 'C',
      angleA: angles.A || '',
      angleB: angles.B || '',
      angleC: angles.C || '',
      relation,
    },
  });
};
const inferCircleChordDistanceDiagram = (value = '') => {
  const match = String(value).match(
    /\bchord\b[\s\S]{0,80}?(\d+(?:\.\d+)?)\s*(cm|mm|m|units?)?[\s\S]{0,80}?\bdistance\b[\s\S]{0,40}?(\d+(?:\.\d+)?)\s*(cm|mm|m|units?)?/i,
  );
  if (!match) return null;

  const chordLength = `${match[1]} ${match[2] || 'units'}`.trim();
  const distance = `${match[3]} ${match[4] || match[2] || 'units'}`.trim();
  return normalizeDiagram({
    type: 'diagram',
    kind: 'circle_chord_distance',
    title: `Circle with chord ${chordLength}`,
    data: {
      center: 'O',
      chordA: 'A',
      chordB: 'B',
      midpoint: 'M',
      chord: 'AB',
      chordLength,
      distanceFromCenter: distance,
    },
  });
};

const inferSimpleCircleDiagram = (value = '') => {
  const text = String(value);
  if (polygonSidesFromText(text) && /polygon|pentagon|hexagon|heptagon|septagon|octagon|nonagon|decagon|gon\b/i.test(text)) return null;
  const diameterMatch = text.match(
    /\bcircle\b[\s\S]{0,80}?\bdiameter\s*(?:=|is|of)?\s*(\d+(?:\.\d+)?)\s*(cm|mm|m|units?)?/i,
  );
  if (diameterMatch) {
    const diameter = `${diameterMatch[1]} ${diameterMatch[2] || 'units'}`.trim();
    return normalizeDiagram({
      type: 'diagram',
      kind: 'circle',
      title: `Circle with diameter ${diameter}`,
      data: {
        center: 'O',
        radius: `half of ${diameter}`,
        points: [{ label: 'A' }, { label: 'B' }],
        description: `Circle with diameter AB = ${diameter} through centre O`,
      },
    });
  }

  const radiusMatch = text.match(
    /\b(?:draw|construct|make|show)?\s*(?:a\s+)?circle\b[\s\S]{0,80}?(?:radius\s*(?:=|is|of)?\s*)?(\d+(?:\.\d+)?)\s*(cm|mm|m|units?)\b/i,
  );
  if (!radiusMatch) return null;

  const radius = `${radiusMatch[1]} ${radiusMatch[2]}`.trim();
  return normalizeDiagram({
    type: 'diagram',
    kind: 'circle',
    title: `Circle of radius ${radius}`,
    data: {
      center: 'O',
      radius,
      pointOnCircle: 'A',
      description: `OA = ${radius}`,
    },
  });
};

const removeOptionalDiagonals = (diagram) => {
  const cleanTitle = String(diagram.title || '').replace(/\s+with\s+diagonals?.*$/i, '').trim();
  const data = diagram.data && typeof diagram.data === 'object' ? { ...diagram.data } : {};

  if (diagram.kind === 'geometry_scene') {
    const objects = Array.isArray(data.objects) ? data.objects : [];
    const relationships = Array.isArray(data.relationships) ? data.relationships : [];
    return {
      ...diagram,
      title: cleanTitle || diagram.title,
      data: {
        ...data,
        objects: objects.filter((object) => !/diagonal/i.test(`${object.label || ''} ${object.role || ''}`)),
        relationships: relationships.filter((relationship) => !/diagonal/i.test(String(relationship))),
      },
    };
  }

  if (['rectangle', 'square', 'quadrilateral'].includes(diagram.kind)) {
    return {
      ...diagram,
      title: cleanTitle || diagram.title,
      data: {
        ...data,
        diagonals: false,
        relation: String(data.relation || '').replace(/(?:,?\s*)?(?:and\s+)?(?:optionally\s+)?(?:its\s+)?diagonals?.*$/i, '').trim(),
        description: String(data.description || '').replace(/(?:,?\s*)?(?:and\s+)?(?:optionally\s+)?(?:its\s+)?diagonals?.*$/i, '').trim(),
      },
    };
  }

  return diagram;
};

const sanitizeDiagramsForText = (diagrams = [], sourceText = '') => {
  if (!/\boptional(?:ly)?\b[^.\n]*\bdiagonals?\b/i.test(sourceText)) return diagrams;
  return diagrams.map(removeOptionalDiagonals);
};
const inferDiagramSpecsFromText = (value = '') => {
  const solidDiagram = inferSolidDiagram(value);
  if (solidDiagram) return [solidDiagram];

  const irregularPolygonDiagram = inferIrregularPolygonDiagram(value);
  if (irregularPolygonDiagram) return [irregularPolygonDiagram];

  const regularPolygonDiagram = inferRegularPolygonDiagram(value);
  if (regularPolygonDiagram) return [regularPolygonDiagram];

  const rectangleDiagram = inferRectangleDiagram(value);
  if (rectangleDiagram) return [rectangleDiagram];

  const squareDiagram = inferSquareDiagram(value);
  if (squareDiagram) return [squareDiagram];

  const triangleCenterDiagram = inferTriangleCenterDiagram(value);
  if (triangleCenterDiagram) return [triangleCenterDiagram];

  const triangleAngleDiagram = inferTriangleAngleDiagram(value);
  if (triangleAngleDiagram) return [triangleAngleDiagram];

  const chordDistanceDiagram = inferCircleChordDistanceDiagram(value);
  if (chordDistanceDiagram) return [chordDistanceDiagram];

  const simpleCircleDiagram = inferSimpleCircleDiagram(value);
  return simpleCircleDiagram ? [simpleCircleDiagram] : [];
};

export const extractDiagramSpecs = (value = '') => {
  const diagrams = [];
  let text = normalizeDiagramMarkers(value || '');

  text = text.replace(FENCED_DIAGRAM_RE, (match, content) => {
    const json = extractJsonFromFence(content);
    if (!json) return match;
    const replacement = collectDiagram(json, diagrams);
    return replacement === null ? match : replacement;
  });

  text = text.replace(LOOSE_DIAGRAM_BLOCK_RE, (match, json) => {
    const replacement = collectDiagram(json, diagrams);
    return replacement === null ? match : replacement;
  });

  text = text.replace(MULTILINE_KEY_VALUE_DIAGRAM_RE, (match, spec) => {
    const replacement = collectDiagram(spec, diagrams);
    return replacement === null ? match : replacement;
  });

  text = text.replace(BROKEN_INLINE_DIAGRAM_RE, (match, spec) => {
    const replacement = collectDiagram(spec, diagrams);
    return replacement === null ? match : replacement;
  });

  text = text.replace(INLINE_DIAGRAM_RE, (match, json) => {
    const replacement = collectDiagram(json, diagrams);
    return replacement === null ? match : replacement;
  });

  return {
    text: text
      .replace(/^\s*(?:<p[^>]*>)?\s*(?:\*\*)?\s*(?:ASCII\s+)?Diagram\s*\(?[^\n)]*\)?\s*:?\s*.*(?:<\/p>)?\s*$/gim, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
    diagrams: diagrams.length ? sanitizeDiagramsForText(diagrams, text) : inferDiagramSpecsFromText(text),
  };
};









