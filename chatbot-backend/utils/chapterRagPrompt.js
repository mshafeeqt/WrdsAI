export function getExactExercisePromptInstruction(chapterRagContext) {
  if (chapterRagContext?.source !== "exercise-question-index") {
    return "";
  }

  return [
    "The user asked for a specific exercise question.",
    "Use the exact question text below as the primary source.",
    "If the extracted PDF text looks flattened or corrupted, reconstruct the most likely textbook math expression from the selected chapter, exercise number, question number, and surrounding context before solving.",
    "Render all important mathematics in LaTeX delimiters so the UI can display textbook-style notation.",
    "Use displayed equations with $$...$$ for fractions, limits, derivatives, integrals, roots, powers, and multi-step work.",
    "Use \\frac{numerator}{denominator} for stacked fractions, \\lim_{x \\to a} for limits, \\frac{d}{dx} or \\frac{dy}{dx} for derivatives, and \\int for integrals.",
    "Solve it step-by-step.",
    "If the question refers to a figure and figure data is unavailable, clearly say that the figure is required.",
  ].join(" ");
}
