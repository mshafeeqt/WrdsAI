const MAX_MESSAGES_PER_CHAPTER = 200;

const normalizeMessage = (message) => {
  if (!message || typeof message !== 'object') return null;
  const role = message.role === 'assistant' ? 'assistant' : 'user';
  const createdAt = message.createdAt || new Date().toISOString();

  return {
    id: String(message.id || message.clientMessageId || `${role}-${createdAt}`),
    role,
    text: typeof message.text === 'string' ? message.text : '',
    html: typeof message.html === 'string' ? message.html : '',
    createdAt,
    kind: typeof message.kind === 'string' ? message.kind : '',
    problemText: typeof message.problemText === 'string' ? message.problemText : '',
  };
};

const buildChapterPayload = (chapter) => ({
  chapterId: chapter?.id || '',
  chapterName: chapter?.name || '',
  className: chapter?.className || '',
  subjectName: chapter?.subjectName || '',
});

export const loadPracticeHistory = async ({ apiBaseUrl, chapter }) => {
  if (!apiBaseUrl || !chapter?.id) return [];

  const response = await fetch(`${apiBaseUrl}/api/ai/practice/history`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildChapterPayload(chapter)),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Unable to load practice history');
  }

  return (Array.isArray(data.messages) ? data.messages : [])
    .map(normalizeMessage)
    .filter(Boolean)
    .sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt))
    .slice(-MAX_MESSAGES_PER_CHAPTER);
};

export const savePracticeMessage = async ({ apiBaseUrl, chapter, message }) => {
  if (!apiBaseUrl || !chapter?.id || !message?.id) return null;

  const normalizedMessage = normalizeMessage(message);
  if (!normalizedMessage) return null;

  const response = await fetch(`${apiBaseUrl}/api/ai/practice/history/message`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...buildChapterPayload(chapter),
      message: normalizedMessage,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Unable to save practice history');
  }

  return normalizeMessage(data.message);
};

export const getPracticeHistoryStats = (messages) => {
  const safeMessages = Array.isArray(messages) ? messages : [];
  const problemMessages = safeMessages.filter((message) => message.kind === 'problem');
  return {
    questionCount: problemMessages.length,
    generatedProblems: problemMessages
      .map((message) => message.problemText || message.text)
      .filter(Boolean)
      .slice(-10),
  };
};

export const formatPracticeDateLabel = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatPracticeTimeLabel = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};
