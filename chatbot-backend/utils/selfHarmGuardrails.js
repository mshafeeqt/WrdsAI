const SELF_HARM_PATTERNS = [
  /\b(i want to|i wanna|i feel like i should|i am going to|i'm going to|i will|plan to|thinking about|how do i|how can i)\b[\s\S]{0,80}\b(kill myself|end my life|hurt myself|harm myself|self harm|self-harm|selfharm|commit suicide|die|suicide)\b/i,
  /\b(kill myself|end my life|hurt myself|harm myself|self harm|self-harm|selfharm|commit suicide)\b/i,
  /\b(i don't want to live|i dont want to live|i do not want to live|i want to die|i wish i was dead|i wish i were dead|i'm suicidal|im suicidal|i am suicidal)\b/i,
];

export function shouldTriggerSelfHarmGuardrail(text = "") {
  const normalized = String(text || "").trim();
  if (!normalized) return false;

  return SELF_HARM_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function buildSelfHarmSupportPayload() {
  return {
    success: false,
    allowed: false,
    error: "SELF_HARM_SUPPORT",
    restrictedCategory: "self-harm",
    safetyType: "self-harm",
    message:
      "I'm really sorry you're going through this. You deserve immediate support from a real person right now.\n\nIf you might act on these thoughts or feel unsafe, call emergency help right now. In India, you can call 112 for emergency support.\n\nFor mental health support in India, you can also contact:\n- Tele-MANAS: 14416 or 1-800-89-14416\n- AASRA: +91 22 2754 6669\n\nPlease reach out to someone you trust right away and tell them you need them to stay with you. If you want, send a simple message like: \"I'm not safe being alone right now. Please stay with me or call for help with me.\"\n\nI can stay with you while you take that next step.",
  };
}
