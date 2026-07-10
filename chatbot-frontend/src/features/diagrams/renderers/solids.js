import { diagramLegend, escapeHtml, label, wrapDiagram } from './shared.js';

const dimensionText = (value, fallback = '') => escapeHtml(value || fallback);

export const renderCube = (diagram) => {
  const data = diagram.data || {};
  const side = dimensionText(data.side || data.edge || data.a, 'a');
  const A = label(data.vertexA, 'A');
  const B = label(data.vertexB, 'B');
  const C = label(data.vertexC, 'C');
  const D = label(data.vertexD, 'D');
  const E = label(data.vertexE, 'E');
  const F = label(data.vertexF, 'F');
  const G = label(data.vertexG, 'G');
  const H = label(data.vertexH, 'H');

  return wrapDiagram({
    title: diagram.title || 'Cube',
    body: `
      <svg viewBox="0 0 520 330" role="img" aria-label="Cube diagram" style="width:100%;height:auto;display:block;">
        <polygon points="150,245 335,245 335,80 150,80" fill="rgba(47,128,237,0.08)" stroke="#21144f" stroke-width="3" />
        <polygon points="215,205 400,205 400,40 215,40" fill="rgba(47,128,237,0.04)" stroke="#21144f" stroke-width="3" />
        <line x1="150" y1="245" x2="215" y2="205" stroke="#21144f" stroke-width="3" />
        <line x1="335" y1="245" x2="400" y2="205" stroke="#21144f" stroke-width="3" />
        <line x1="335" y1="80" x2="400" y2="40" stroke="#21144f" stroke-width="3" />
        <line x1="150" y1="80" x2="215" y2="40" stroke="#21144f" stroke-width="3" />
        <text x="135" y="266" font-size="17" font-weight="800" fill="#21144f">${A}</text>
        <text x="340" y="266" font-size="17" font-weight="800" fill="#21144f">${B}</text>
        <text x="342" y="78" font-size="17" font-weight="800" fill="#21144f">${C}</text>
        <text x="126" y="78" font-size="17" font-weight="800" fill="#21144f">${D}</text>
        <text x="205" y="226" font-size="17" font-weight="800" fill="#21144f">${E}</text>
        <text x="406" y="226" font-size="17" font-weight="800" fill="#21144f">${F}</text>
        <text x="408" y="38" font-size="17" font-weight="800" fill="#21144f">${G}</text>
        <text x="202" y="34" font-size="17" font-weight="800" fill="#21144f">${H}</text>
        <text x="232" y="273" font-size="15" font-weight="800" fill="#2f80ed">side = ${side}</text>
        <text x="28" y="304" font-size="14" font-weight="800" fill="#463b7a">Cube has 6 equal square faces, 12 equal edges, and 8 vertices.</text>
      </svg>
      ${diagramLegend([`edge = ${side}`, 'TSA = 6a^2', 'Volume = a^3'])}
    `,
  });
};

export const renderCuboid = (diagram) => {
  const data = diagram.data || {};
  const length = dimensionText(data.length || data.l, 'l');
  const breadth = dimensionText(data.breadth || data.width || data.b, 'b');
  const height = dimensionText(data.height || data.h, 'h');

  return wrapDiagram({
    title: diagram.title || 'Cuboid',
    body: `
      <svg viewBox="0 0 540 330" role="img" aria-label="Cuboid diagram" style="width:100%;height:auto;display:block;">
        <polygon points="120,250 370,250 370,105 120,105" fill="rgba(47,128,237,0.08)" stroke="#21144f" stroke-width="3" />
        <polygon points="200,205 450,205 450,60 200,60" fill="rgba(47,128,237,0.04)" stroke="#21144f" stroke-width="3" />
        <line x1="120" y1="250" x2="200" y2="205" stroke="#21144f" stroke-width="3" />
        <line x1="370" y1="250" x2="450" y2="205" stroke="#21144f" stroke-width="3" />
        <line x1="370" y1="105" x2="450" y2="60" stroke="#21144f" stroke-width="3" />
        <line x1="120" y1="105" x2="200" y2="60" stroke="#21144f" stroke-width="3" />
        <text x="232" y="280" font-size="15" font-weight="800" fill="#2f80ed">length = ${length}</text>
        <text x="408" y="232" font-size="15" font-weight="800" fill="#2f80ed">breadth = ${breadth}</text>
        <text x="83" y="180" font-size="15" font-weight="800" fill="#2f80ed">height = ${height}</text>
        <text x="36" y="306" font-size="14" font-weight="800" fill="#463b7a">Cuboid has rectangular faces; opposite faces are equal.</text>
      </svg>
      ${diagramLegend([`l = ${length}`, `b = ${breadth}`, `h = ${height}`, 'TSA = 2(lb + bh + hl)', 'Volume = lbh'])}
    `,
  });
};

export const renderCylinder = (diagram) => {
  const data = diagram.data || {};
  const radius = dimensionText(data.radius || data.r, 'r');
  const height = dimensionText(data.height || data.h, 'h');

  return wrapDiagram({
    title: diagram.title || 'Cylinder',
    body: `
      <svg viewBox="0 0 520 330" role="img" aria-label="Cylinder diagram" style="width:100%;height:auto;display:block;">
        <ellipse cx="260" cy="70" rx="105" ry="34" fill="rgba(47,128,237,0.08)" stroke="#21144f" stroke-width="3" />
        <path d="M155 70 L155 240" stroke="#21144f" stroke-width="3" fill="none" />
        <path d="M365 70 L365 240" stroke="#21144f" stroke-width="3" fill="none" />
        <ellipse cx="260" cy="240" rx="105" ry="34" fill="rgba(47,128,237,0.06)" stroke="#21144f" stroke-width="3" />
        <path d="M155 240 A105 34 0 0 0 365 240" fill="none" stroke="#21144f" stroke-width="3" />
        <line x1="260" y1="70" x2="350" y2="70" stroke="#2f80ed" stroke-width="3" />
        <line x1="390" y1="70" x2="390" y2="240" stroke="#f59e0b" stroke-width="3" stroke-dasharray="7 6" />
        <text x="292" y="62" font-size="15" font-weight="800" fill="#2f80ed">r = ${radius}</text>
        <text x="400" y="162" font-size="15" font-weight="800" fill="#b7791f">h = ${height}</text>
        <text x="210" y="302" font-size="14" font-weight="800" fill="#463b7a">Two circular faces and one curved surface.</text>
      </svg>
      ${diagramLegend([`radius = ${radius}`, `height = ${height}`, 'CSA = 2pi rh', 'Volume = pi r^2 h'])}
    `,
  });
};

export const renderCone = (diagram) => {
  const data = diagram.data || {};
  const radius = dimensionText(data.radius || data.r, 'r');
  const height = dimensionText(data.height || data.h, 'h');
  const slantHeight = dimensionText(data.slantHeight || data.l, 'l');

  return wrapDiagram({
    title: diagram.title || 'Cone',
    body: `
      <svg viewBox="0 0 520 330" role="img" aria-label="Cone diagram" style="width:100%;height:auto;display:block;">
        <ellipse cx="260" cy="245" rx="115" ry="36" fill="rgba(47,128,237,0.08)" stroke="#21144f" stroke-width="3" />
        <line x1="260" y1="45" x2="145" y2="245" stroke="#21144f" stroke-width="3" />
        <line x1="260" y1="45" x2="375" y2="245" stroke="#21144f" stroke-width="3" />
        <line x1="260" y1="45" x2="260" y2="245" stroke="#f59e0b" stroke-width="3" stroke-dasharray="7 6" />
        <line x1="260" y1="245" x2="375" y2="245" stroke="#2f80ed" stroke-width="3" />
        <text x="270" y="150" font-size="15" font-weight="800" fill="#b7791f">h = ${height}</text>
        <text x="305" y="235" font-size="15" font-weight="800" fill="#2f80ed">r = ${radius}</text>
        <text x="318" y="138" font-size="15" font-weight="800" fill="#6b5fd3">l = ${slantHeight}</text>
      </svg>
      ${diagramLegend([`radius = ${radius}`, `height = ${height}`, `slant height = ${slantHeight}`, 'CSA = pi rl', 'Volume = (1/3)pi r^2 h'])}
    `,
  });
};

export const renderSphere = (diagram) => {
  const data = diagram.data || {};
  const radius = dimensionText(data.radius || data.r, 'r');

  return wrapDiagram({
    title: diagram.title || 'Sphere',
    body: `
      <svg viewBox="0 0 520 320" role="img" aria-label="Sphere diagram" style="width:100%;height:auto;display:block;">
        <circle cx="260" cy="150" r="105" fill="rgba(47,128,237,0.08)" stroke="#21144f" stroke-width="3" />
        <ellipse cx="260" cy="150" rx="105" ry="32" fill="none" stroke="#8fb7ff" stroke-width="3" stroke-dasharray="7 6" />
        <line x1="260" y1="150" x2="365" y2="150" stroke="#2f80ed" stroke-width="3" />
        <circle cx="260" cy="150" r="5" fill="#22c55e" />
        <text x="300" y="140" font-size="15" font-weight="800" fill="#2f80ed">r = ${radius}</text>
        <text x="218" y="285" font-size="14" font-weight="800" fill="#463b7a">Every point on the surface is distance r from the centre.</text>
      </svg>
      ${diagramLegend([`radius = ${radius}`, 'Surface area = 4pi r^2', 'Volume = (4/3)pi r^3'])}
    `,
  });
};
