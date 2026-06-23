export function getExactExercisePromptInstruction(chapterRagContext) {
  const exactSources = new Set([
    "exercise-question-index",
    "python-exact-question-index",
  ]);

  if (!exactSources.has(chapterRagContext?.source)) {
    return "";
  }

  return [
    "The user asked for a specific exercise question, and exact textbook question context was retrieved.",
    "Use the exact question text below as the primary source.",
    "Start the answer with a clear **Problem Statement:** section that restates the exact question in readable form before solving.",
    "Then use a loose, student-friendly structure. Include sections such as **Given / What We Know:**, **Method / Idea:**, **Step-by-Step Solution:**, and **Final Answer:** when they fit the problem.",
    "Do not force every section if it is unnatural, but always show **Problem Statement:** first and **Final Answer:** at the end for solvable questions.",
    "If the question has multiple subparts, list the problem statement once, then solve each part with labeled subparts.",
    "If the extracted PDF text looks flattened or corrupted, reconstruct the most likely textbook math expression from the selected chapter, exercise number, question number, and surrounding context before solving.",
    "Render all important mathematics in LaTeX delimiters so the UI can display textbook-style notation.",
    "Use displayed equations with $$...$$ for fractions, roots, powers, identities, and multi-step algebra.",
    "Use \\frac{numerator}{denominator} for stacked fractions and clear equation work.",
    "Solve it step by step, with enough detail for a student to follow.",
    "If the question refers to a figure and figure data is unavailable, clearly say that the figure is required before attempting any limited explanation.",
  ].join(" ");
}