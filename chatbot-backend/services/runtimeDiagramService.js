const DIAGRAM_REQUEST_RE = /\b(draw|diagram|figure|sketch|construct|visuali[sz]e|show.*diagram|with diagram|graph|plot|ray diagram|circuit diagram)\b/i;
const VISUAL_MATH_RE = /\b(triangle|circle|quadrilateral|square|rectangle|polygon|pentagon|hexagon|octagon|parallel|perpendicular|bisector|median|altitude|centroid|incenter|incentre|circumcenter|circumcentre|orthocenter|orthocentre|tangent|secant|chord|arc|radius|diameter|coordinate|axis|number line|linear graph|quadratic graph|trigonometry|sine|cosine|tan|cube|cuboid|cylinder|cone|sphere|surface area|volume)\b/i;
const DIAGRAM_METADATA_RE = /\b(?:DIAGRAM\s*_?\s*SPEC|DIAGRAMSPEC|DIAGRAM\s+SPEC)\b/i;
const TEMPLATE_KINDS = new Set([
  "triangle",
  "right_triangle",
  "trigonometry_triangle",
  "circle",
  "regular_polygon",
  "quadrilateral",
  "rectangle",
  "square",
  "cube",
  "cuboid",
  "cylinder",
  "cone",
  "sphere",
  "linear_graph",
  "quadratic_graph",
  "number_line",
  "unit_circle",
]);

const SYSTEM_PROMPT = `
You create one runtime SVG diagram specification for an educational app.
Return only valid JSON. No markdown. No explanation.

For custom 2D geometry use this schema:
{
  "type": "diagram",
  "kind": "geometry_scene",
  "title": "short title",
  "data": {
    "objects": [
      {"type":"point","label":"A","x":120,"y":250,"role":"vertex"},
      {"type":"segment","label":"AB","from":"A","to":"B","role":"side"},
      {"type":"circle","center":"O","radius":"3 cm","radiusPx":80},
      {"type":"polygon","label":"ABCD","points":["A","B","C","D"],"role":"rectangle"},
      {"type":"angle","label":"50 deg","points":["B","A","C"],"role":"given angle"}
    ],
    "relationships": ["ABCD = rectangle", "AC and BD are diagonals"]
  }
}

For surface area and volume figures, you may also use:
- {"type":"diagram","kind":"cube","title":"Cube","data":{"side":"a"}}
- {"type":"diagram","kind":"cuboid","title":"Cuboid","data":{"length":"l","breadth":"b","height":"h"}}
- {"type":"diagram","kind":"cylinder","title":"Cylinder","data":{"radius":"r","height":"h"}}
- {"type":"diagram","kind":"cone","title":"Cone","data":{"radius":"r","height":"h","slantHeight":"l"}}
- {"type":"diagram","kind":"sphere","title":"Sphere","data":{"radius":"r"}}

Rules:
- Match the user's exact request and the tutor answer, not a generic previous diagram.
- Create coordinates inside a 560 by 380 canvas when using geometry_scene.
- Include named labels, given values, important sides, angles, centers, tangents, secants, chords, bisectors, medians, axes, and relationships.
- If a user asks only "draw a rectangle", draw a rectangle only. Do not add diagonals unless requested. If a user asks only "draw a regular pentagon", draw only the pentagon, not a surrounding circle.
- For regular polygons, create all vertices dynamically and connect them as a polygon. Do not add a circle unless the user explicitly asks for an inscribed polygon, circumcircle, or construction circle.
- For irregular or non-regular polygons, create uneven vertex coordinates and label it as irregular. Never use equal spacing, equal-side wording, or regular_polygon for an irregular request.
- For triangle centers, show the triangle, the center, and the defining construction lines.
- For trigonometry, use kind "trigonometry_triangle" or geometry_scene with a right-angle marker, labelled opposite/adjacent/hypotenuse, and the given angle.
- For graphs, include axes and enough points/segments to understand the graph.
- If the request is not visual or a diagram would be misleading, return {"type":"none"}.
`.trim();

const extractJsonObject = (value = "") => {
  const text = String(value).trim();
  if (!text) return null;

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() || text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
};

const hasRenderableObjects = (spec) =>
  Array.isArray(spec?.data?.objects) && spec.data.objects.length > 0;

const isValidDiagramSpec = (spec) => {
  if (spec?.type !== "diagram" || typeof spec?.title !== "string") return false;
  if (spec.kind === "geometry_scene") return hasRenderableObjects(spec);
  return TEMPLATE_KINDS.has(spec.kind);
};

export const shouldRequestRuntimeDiagram = ({ prompt = "", answer = "" }) => {
  if (!prompt) return false;

  const requestedDiagram = DIAGRAM_REQUEST_RE.test(prompt);
  const visualMathQuestion = requestedDiagram && VISUAL_MATH_RE.test(`${prompt}\n${answer}`);

  return requestedDiagram || visualMathQuestion;
};

const stripDiagramMetadata = (answer = "") => {
  const lines = String(answer).split(/\r?\n/);
  const kept = [];
  let skipping = false;

  for (const line of lines) {
    const startsNewAnswerSection = /^\s*(\*\*)?(final answer|final takeaway|summary|key point|note)\b/i.test(
      line,
    );

    if (DIAGRAM_METADATA_RE.test(line)) {
      skipping = true;
      continue;
    }

    if (skipping) {
      if (!line.trim()) {
        skipping = false;
        continue;
      }

      if (startsNewAnswerSection) {
        skipping = false;
        kept.push(line);
      }

      continue;
    }

    kept.push(line);
  }

  return kept.join("\n").trim();
};

export async function appendRuntimeDiagramSpec({
  openai,
  prompt,
  answer,
  model = "gpt-5-nano",
}) {
  if (!shouldRequestRuntimeDiagram({ prompt, answer })) {
    return answer;
  }

  const cleanAnswer = stripDiagramMetadata(answer);

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `User request:\n${prompt}\n\nTutor answer:\n${cleanAnswer}`,
        },
      ],
      max_completion_tokens: 900,
    });

    const raw = response?.choices?.[0]?.message?.content || "";
    const spec = extractJsonObject(raw);

    if (!isValidDiagramSpec(spec)) {
      return answer;
    }

    return `${cleanAnswer.trim()}\n\nDIAGRAM_SPEC: ${JSON.stringify(spec)}`;
  } catch (error) {
    console.warn("[diagram] Runtime diagram generation skipped:", error?.message || error);
    return answer;
  }
}

