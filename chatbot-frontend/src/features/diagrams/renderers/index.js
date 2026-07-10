import { renderGeometryScene } from './geometryScene.js';
import {
  renderCircle,
  renderCircleChordDistance,
  renderCircleChords,
  renderCircleSecant,
  renderCircleTangent,
  renderQuadrilateral,
  renderRegularPolygon,
  renderRightTriangle,
  renderTriangle,
  renderTriangleCentroid,
  renderTriangleCircumcenter,
  renderTriangleIncenter,
  renderTriangleOrthocenter,
} from './geometry.js';
import {
  renderCoordinatePlane,
  renderLinearGraph,
  renderNumberLine,
  renderQuadraticGraph,
  renderUnitCircle,
} from './graphs.js';
import {
  renderCone,
  renderCube,
  renderCuboid,
  renderCylinder,
  renderSphere,
} from './solids.js';

const RENDERERS = {
  geometry_scene: renderGeometryScene,
  triangle: renderTriangle,
  right_triangle: renderRightTriangle,
  trigonometry_triangle: renderRightTriangle,
  triangle_circumcenter: renderTriangleCircumcenter,
  triangle_centroid: renderTriangleCentroid,
  triangle_incenter: renderTriangleIncenter,
  triangle_orthocenter: renderTriangleOrthocenter,
  quadrilateral: renderQuadrilateral,
  regular_polygon: renderRegularPolygon,
  parallelogram: renderQuadrilateral,
  rectangle: renderQuadrilateral,
  square: renderQuadrilateral,
  trapezoid: renderQuadrilateral,
  trapezium: renderQuadrilateral,
  circle: renderCircle,
  circle_tangent: renderCircleTangent,
  circle_secant: renderCircleSecant,
  circle_chords: renderCircleChords,
  circle_chord_distance: renderCircleChordDistance,
  coordinate_plane: renderCoordinatePlane,
  linear_graph: renderLinearGraph,
  quadratic_graph: renderQuadraticGraph,
  number_line: renderNumberLine,
  unit_circle: renderUnitCircle,
  cube: renderCube,
  cuboid: renderCuboid,
  cylinder: renderCylinder,
  cone: renderCone,
  sphere: renderSphere,
};

export const renderDiagramHtml = (diagram) => {
  const renderer = RENDERERS[diagram?.kind];
  return renderer ? renderer(diagram) : '';
};

export const renderDiagramsHtml = (diagrams = []) =>
  diagrams.map(renderDiagramHtml).filter(Boolean).join('');
