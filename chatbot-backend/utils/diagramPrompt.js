export const DIAGRAM_SPEC_INSTRUCTIONS = `
Visual diagrams:
- When a simple diagram would make a math explanation, question, hint, or solution clearer, add exactly one DIAGRAM_SPEC block at the end of the answer.
- The diagram must explain the actual concept in the answer, not draw a generic unrelated shape.
- Do not add optional objects that the user did not request. Example: if the user asks only "draw a rectangle", draw rectangle ABCD only; do not add diagonals unless the user asks for diagonals.
- For question-specific geometry or any user request to draw/show a specific figure, use kind "geometry_scene" with objects, relationships, and x/y coordinates. Use fixed template kinds only for generic standard concept sketches.
- The DIAGRAM_SPEC line is hidden metadata for the app. Never tell the user to refer to it.
- Use valid JSON only. Do not use markdown tables, comments, trailing commas, or data as a string.
- Use the exact prefix DIAGRAM_SPEC: and put it as the final line after the answer.
- Never write DIAGRAMSPEC, DIAGRAM SPEC, or malformed key/value text.
- Never draw ASCII diagrams in the answer. Use DIAGRAM_SPEC instead so the app can render a real figure.
- Keep diagram labels and numbers consistent with the explanation.
- For geometry_scene, include every important named object from the question: points, center, tangent/secant/chord/radius/median/altitude/angle labels, and given values.
- Include naming whenever it helps: e.g. EA = tangent, OA = radius, AB = chord, OM = perpendicular distance, G = centroid, O = circumcenter. Prefer putting labels in the diagram data so the UI can render them as a figure legend.
- If the answer is not visual, or a diagram would be misleading, do not add a diagram.

Preferred question-specific diagram kind:
0. geometry_scene: use this for custom diagrams that must match the question. Data must include objects and relationships.
   Objects can be: point, circle, line, segment, ray, triangle, polygon, angle.
   Object fields: type, label, role, x, y, center, radius, radiusPx, from, to, points. For point objects, include x/y coordinates in the 560 by 380 SVG space whenever possible.
   Relationships are short readable facts like "OT perpendicular PT", "PAB intersects circle at A and B", "PT = tangent".
   Example:
DIAGRAM_SPEC: {"type":"diagram","kind":"geometry_scene","title":"Tangent and Secant from P","data":{"objects":[{"type":"circle","center":"O","radius":"5 cm","radiusPx":86},{"type":"point","label":"P","x":470,"y":185,"role":"external point"},{"type":"point","label":"T","x":282,"y":93,"role":"point of contact"},{"type":"point","label":"A","x":315,"y":145,"role":"near secant intersection"},{"type":"point","label":"B","x":145,"y":105,"role":"far secant intersection"},{"type":"segment","label":"PT","from":"P","to":"T","role":"tangent"},{"type":"line","label":"PAB","points":["P","A","B"],"role":"secant"},{"type":"segment","label":"OT","from":"O","to":"T","role":"radius"}],"relationships":["PT = tangent","PAB = secant","OT perpendicular PT","PAB intersects circle at A and B"]}}

Supported fallback template diagram kinds:
1. triangle: vertexA, vertexB, vertexC, relation
2. right_triangle / trigonometry_triangle: vertexA, vertexB, vertexC, base, height, hypotenuse, angle
3. triangle_circumcenter: vertexA, vertexB, vertexC, center, bisector1, bisector2, radiusLabel
4. triangle_centroid: vertexA, vertexB, vertexC, center
5. triangle_incenter: vertexA, vertexB, vertexC, center
6. triangle_orthocenter: vertexA, vertexB, vertexC, center
7. quadrilateral / parallelogram / rectangle / square / trapezium / trapezoid: vertexA, vertexB, vertexC, vertexD, relation, shape
8. regular_polygon: sides, name, center, showCircle, diagonals, description. Use for regular pentagon/hexagon/octagon/n-gon requests.
8. circle: center, radius, pointOnCircle, points, description
9. circle_tangent: center, externalPoint, touchPointA, touchPointB, radius, distanceOP
10. circle_secant: center, externalPoint, secantPointA, secantPointB, secant, touchPoint, tangent, radius
11. circle_chords: center, chord1A, chord1B, chord2A, chord2B, chord1, chord2, relation, angle1, angle2
12. circle_chord_distance: center, chordA, chordB, midpoint, chord, chordLength, distanceFromCenter, halfChord, radius
13. coordinate_plane: points array like [{"label":"A","x":2,"y":3}], description
14. linear_graph: m, b, equation
15. quadratic_graph: a, b, c, equation
16. number_line: min, max, marks array like [{"label":"x","value":3}]
17. unit_circle: angle
18. cube: side
19. cuboid: length, breadth, height
20. cylinder: radius, height
21. cone: radius, height, slantHeight
22. sphere: radius

Examples:
DIAGRAM_SPEC: {"type":"diagram","kind":"triangle","title":"Triangle ABC with Angle Markings","data":{"vertexA":"A","vertexB":"B","vertexC":"C","angleA":"50°","angleB":"60°","angleC":"70°","relation":"angle A + angle B + angle C = 180°, so angle B = 60°"}}
DIAGRAM_SPEC: {"type":"diagram","kind":"triangle_circumcenter","title":"Circumcenter of Triangle ABC","data":{"vertexA":"A","vertexB":"B","vertexC":"C","center":"O","bisector1":"Perpendicular bisector of AB","bisector2":"Perpendicular bisector of AC","radiusLabel":"OA = OB = OC"}}
DIAGRAM_SPEC: {"type":"diagram","kind":"triangle_centroid","title":"Centroid of Triangle ABC","data":{"vertexA":"A","vertexB":"B","vertexC":"C","center":"G"}}
DIAGRAM_SPEC: {"type":"diagram","kind":"triangle_incenter","title":"Incenter and Incircle","data":{"vertexA":"A","vertexB":"B","vertexC":"C","center":"I"}}
DIAGRAM_SPEC: {"type":"diagram","kind":"triangle_orthocenter","title":"Orthocenter of Triangle ABC","data":{"vertexA":"A","vertexB":"B","vertexC":"C","center":"H"}}
DIAGRAM_SPEC: {"type":"diagram","kind":"circle_chord_distance","title":"Chord at Distance from Centre","data":{"center":"O","chordA":"A","chordB":"B","midpoint":"M","chord":"AB","chordLength":"6 cm","distanceFromCenter":"3 cm","halfChord":"3 cm","radius":"3 sqrt(2) cm"}}
DIAGRAM_SPEC: {"type":"diagram","kind":"circle","title":"Circle of Radius 3 cm","data":{"center":"O","radius":"3 cm","pointOnCircle":"A","description":"OA = 3 cm"}}
DIAGRAM_SPEC: {"type":"diagram","kind":"regular_polygon","title":"Regular Pentagon ABCDE","data":{"sides":5,"name":"pentagon","showCircle":false,"diagonals":false,"description":"Five equal sides and five equal angles"}}
DIAGRAM_SPEC: {"type":"diagram","kind":"circle_secant","title":"Secant and Tangent from External Point","data":{"center":"O","externalPoint":"E","secantPointA":"F","secantPointB":"G","secant":"EFG","touchPoint":"A","tangent":"EA","radius":"r"}}
DIAGRAM_SPEC: {"type":"diagram","kind":"circle_chords","title":"Equal Chords Give Equal Central Angles","data":{"center":"O","chord1A":"A","chord1B":"B","chord2A":"D","chord2B":"E","chord1":"AB","chord2":"DE","relation":"AB = DE","angle1":"angle AOB","angle2":"angle DOE"}}
DIAGRAM_SPEC: {"type":"diagram","kind":"linear_graph","title":"Graph of y = 2x + 1","data":{"m":2,"b":1,"equation":"y = 2x + 1"}}
DIAGRAM_SPEC: {"type":"diagram","kind":"unit_circle","title":"Sine and Cosine on the Unit Circle","data":{"angle":"theta"}}
DIAGRAM_SPEC: {"type":"diagram","kind":"cylinder","title":"Cylinder","data":{"radius":"r","height":"h"}}
DIAGRAM_SPEC: {"type":"diagram","kind":"cuboid","title":"Cuboid","data":{"length":"l","breadth":"b","height":"h"}}

Kind-selection rules:
- Circumcenter/circumcentre, perpendicular bisectors, or circumcircle through triangle vertices -> triangle_circumcenter.
- Centroid or medians -> triangle_centroid.
- Incenter/incentre, incircle, or angle bisectors -> triangle_incenter.
- Orthocenter/orthocentre or altitudes -> triangle_orthocenter.
- Sine/cosine/tangent in a right triangle -> trigonometry_triangle with opposite, adjacent, hypotenuse, and the given angle labelled.
- Sine/cosine on a circle -> unit_circle.
- Chord length with distance from center -> circle_chord_distance.
- Circle with a given radius or diameter, such as "draw a circle of 3 cm" -> circle.
- Regular polygon requests, such as regular pentagon/hexagon/octagon/n-gon -> regular_polygon with sides. Draw only the polygon unless the user explicitly asks for an inscribed polygon, circumcircle, or construction circle. Do not tell the student to draw a circle for a plain regular polygon request.
- Equal chords or equal central angles -> circle_chords.
- Tangents from an external point -> circle_tangent.
- Secant line crossing a circle, or tangent plus secant from an external point -> circle_secant. Include secantPointA/secantPointB and names like EFG = secant, EA = tangent.
- Surface area and volume figures -> cube, cuboid, cylinder, cone, or sphere with dimensions labelled.
- Straight-line graph -> linear_graph. Parabola/quadratic -> quadratic_graph.
- Triangle angle-sum/draw-triangle questions, such as "In triangle ABC, angle A = 50 and angle C = 70", -> triangle with angleA/angleB/angleC labels.
- If the user asks "draw", "show with diagram", "make a figure", or gives a specific construction/problem, use geometry_scene with coordinates so the figure changes according to the input. Do not use a reusable template unless the request is only generic concept explanation.
`;







