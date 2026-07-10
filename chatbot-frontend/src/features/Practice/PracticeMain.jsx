import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import wrdsAiLogo from '../../assets/words1.png';
import { formatChatResponseHtml } from '../chat/utils/responseFormatting';
import { extractDiagramSpecs } from '../diagrams/diagramSpecs';
import AppSidebarMenu from '../shared/AppSidebarMenu';
import TopUserMenu from '../shared/TopUserMenu';
import { fetchCurrentUser } from '../auth/authClient';
import {
  getLockedStudentClass,
  getVisibleSubjectsForStudent,
} from '../curriculum/studentCurriculum';
import {
  formatPracticeDateLabel,
  formatPracticeTimeLabel,
  getPracticeHistoryStats,
  loadPracticeHistory,
  savePracticeMessage,
} from './practiceHistoryStorage';
import './practice.css';

const getLocalPracticeReply = (prompt, chapter) => {
  const normalizedPrompt = prompt.toLowerCase().trim();
  const chapterPath = [
    chapter?.className,
    chapter?.subjectName,
    chapter?.name,
  ].filter(Boolean).join(' / ');

  if (/^(hi|hii|hello|hey|namaste|yo)\b/.test(normalizedPrompt)) {
    return `Hi! You are in Practice mode for ${chapterPath}. Ask any question from this selected chapter and I will help you practice it.`;
  }

  if (/^(what is this|what is this about|help|how does this work|how to use)/.test(normalizedPrompt)) {
    return `This is Practice mode. You selected ${chapterPath}, so answers are limited to this chapter. Change the dropdowns if you want to practice another chapter.`;
  }

  return '';
};

const PRACTICE_PROBLEM_STYLES = [
  'basic concept check',
  'direct numerical problem',
  'word problem/application',
  'multi-step reasoning problem',
  'common mistake/trick problem',
  'exam-style short answer problem',
  'higher-order challenge problem',
];

const PRACTICE_CHAPTER_CONCEPT_TARGETS = [
  'definition or property recall',
  'direct formula/theorem use',
  'reverse calculation or missing value',
  'word problem/application',
  'reasoning/proof-style question',
  'mixed concept problem from another section of the chapter',
];

const PRACTICE_VISUAL_PROBLEM_INSTRUCTION = 'If the generated problem genuinely needs a figure, construction, graph, geometry sketch, or visual reasoning, append one valid DIAGRAM_SPEC JSON line after the question text. Do not include the answer, hint, solution, or prose explaining the spec.';

const normalizePracticeProblem = (value = '') =>
  value.toLowerCase().replace(/\s+/g, ' ').replace(/[^\w\s]/g, '').trim();

const stripPracticeProblemLabel = (value = '') => {
  let cleaned = String(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  for (let index = 0; index < 4; index += 1) {
    const next = cleaned
      .replace(/^\s*(?:\*\*)?\s*(?:Question|Problem)\s*(?:\*\*)?\s*(?:no\.?|number)?\s*\d*\s*[:.)-]?\s*(?:\*\*)?\s*/i, '')
      .replace(/^\s*(?:\*\*)?\s*\d+\s*[:.)-]\s*(?:\*\*)?\s*/i, '')
      .replace(/^\s*\*\*\s*\d+\s*[:.)-]\s*\*\*\s*/i, '')
      .trim();

    if (next === cleaned) break;
    cleaned = next;
  }

  return cleaned;
};

const stripPracticeProblemLabelForDisplay = (value = '') => {
  let cleaned = String(value)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  for (let index = 0; index < 4; index += 1) {
    const next = cleaned
      .replace(/^\s*(?:\*\*)?\s*(?:Question|Problem)\s*(?:\*\*)?\s*(?:no\.?|number)?\s*\d*\s*[:.)-]?\s*(?:\*\*)?\s*/i, '')
      .replace(/^\s*(?:\*\*)?\s*\d+\s*[:.)-]\s*(?:\*\*)?\s*/i, '')
      .replace(/^\s*\*\*\s*\d+\s*[:.)-]\s*\*\*\s*/i, '')
      .trim();

    if (next === cleaned) break;
    cleaned = next;
  }

  return cleaned;
};
const stripPracticeDiagrams = (value = '') => extractDiagramSpecs(String(value || '')).text || '';

const cleanPracticeProblemText = (value = '') =>
  stripPracticeProblemLabel(stripPracticeDiagrams(value));

const getProblemTextFromMessage = (message) =>
  cleanPracticeProblemText(message?.problemText || message?.text || message?.html || '');

const getLatestPracticeProblem = (messages, activePracticeProblem = '', generatedPracticeProblems = []) => {
  const active = cleanPracticeProblemText(activePracticeProblem);
  if (active) return active;

  const latestProblemFromHistory = [...messages]
    .reverse()
    .find((message) => message.kind === 'problem' && getProblemTextFromMessage(message));

  return getProblemTextFromMessage(latestProblemFromHistory) || generatedPracticeProblems.at(-1) || '';
};

const buildRecentPracticeProblemBlock = (generatedPracticeProblems, limit = 6) => {
  const recentProblems = generatedPracticeProblems
    .slice(-limit)
    .map(cleanPracticeProblemText)
    .filter(Boolean);

  return recentProblems.length
    ? `Recent questions already asked in this chapter:\n${recentProblems
        .map((item, index) => `${index + 1}. ${item}`)
        .join('\n')}`
    : 'No recent generated questions yet.';
};

const normalizePracticeMessageText = (message) => {
  const text = message?.text || message?.html || '';
  const isQuestionLike = message?.kind === 'problem'
    || (/\bsubmit your answer\.?\s*$/i.test(text) && /^\s*(?:\*\*)?\s*(?:Question|Problem|\d+\s*[:.)-])/i.test(text.replace(/<[^>]+>/g, ' ')));

  if (!isQuestionLike) return text;

  const withoutOuterLabel = text.replace(
    /^\s*(?:\*\*)?\s*Question\s*\d*\s*(?:\*\*)?\s*\n+/i,
    '',
  );
  const body = stripPracticeProblemLabelForDisplay(withoutOuterLabel);
  return `**Question**\n\n${body}`;
};
export default function PracticeMain() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const [structure, setStructure] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activePracticeProblem, setActivePracticeProblem] = useState('');
  const [activePracticeMessageId, setActivePracticeMessageId] = useState('');
  const [hintUsed, setHintUsed] = useState(false);
  const [practiceQuestionCount, setPracticeQuestionCount] = useState(0);
  const [generatedPracticeProblems, setGeneratedPracticeProblems] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserLoaded, setCurrentUserLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchCurrentUser()
      .then((user) => {
        if (!cancelled) setCurrentUser(user);
      })
      .catch(() => {
        if (!cancelled) setCurrentUser(null);
      })
      .finally(() => {
        if (!cancelled) setCurrentUserLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const loadChapters = async () => {
      setLoadingChapters(true);
      try {
        const response = await fetch(`${apiBaseUrl}/api/ai/math-chapters`, {
          credentials: 'include',
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to load chapters');
        }
        setStructure(Array.isArray(data.structure) ? data.structure : []);
      } catch (error) {
        console.error('Practice chapter load failed:', error);
        toast.error('Unable to load practice chapters');
      } finally {
        setLoadingChapters(false);
      }
    };

    loadChapters();
  }, [apiBaseUrl]);

  const selectedClass = useMemo(
    () => structure.find((item) => item.id === selectedClassId) || null,
    [structure, selectedClassId],
  );
  const selectedSubject = useMemo(
    () => selectedClass?.subjects?.find((item) => item.id === selectedSubjectId) || null,
    [selectedClass, selectedSubjectId],
  );
  const selectedChapter = useMemo(
    () => selectedSubject?.chapters?.find((item) => item.id === selectedChapterId) || null,
    [selectedSubject, selectedChapterId],
  );
  const lockedStudentClass = useMemo(
    () => getLockedStudentClass(structure, currentUser),
    [structure, currentUser],
  );
  const visibleSubjects = useMemo(
    () => (lockedStudentClass ? getVisibleSubjectsForStudent(lockedStudentClass) : selectedClass?.subjects || []),
    [lockedStudentClass, selectedClass],
  );

  useEffect(() => {
    if (!lockedStudentClass) return;

    setSelectedClassId((currentValue) =>
      currentValue === lockedStudentClass.id ? currentValue : lockedStudentClass.id,
    );
  }, [lockedStudentClass]);

  useEffect(() => {
    if (!currentUserLoaded) return;

    let cancelled = false;

    if (!selectedChapter) {
      setMessages([]);
      setActivePracticeProblem('');
      setActivePracticeMessageId('');
      setHintUsed(false);
      setPracticeQuestionCount(0);
      setGeneratedPracticeProblems([]);
      setIsLoadingHistory(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoadingHistory(true);
    setMessages([]);
    setActivePracticeProblem('');
    setActivePracticeMessageId('');
    setHintUsed(false);

    loadPracticeHistory({
      apiBaseUrl,
      chapter: selectedChapter,
    })
      .then((historyMessages) => {
        if (cancelled) return;
        const historyStats = getPracticeHistoryStats(historyMessages);

        setMessages(historyMessages);
        setPracticeQuestionCount(historyStats.questionCount);
        setGeneratedPracticeProblems(historyStats.generatedProblems);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Practice history load failed:', error);
        toast.error(error.message || 'Unable to load practice history');
        setMessages([]);
        setPracticeQuestionCount(0);
        setGeneratedPracticeProblems([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, currentUserLoaded, selectedChapter]);

  useEffect(() => {
    if (isLoadingHistory) return;

    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    });
  }, [isLoadingHistory, messages.length, selectedChapterId]);

  const displayMessages = useMemo(() => {
    const entries = [];
    let currentDateLabel = '';

    messages.forEach((message) => {
      const nextDateLabel = formatPracticeDateLabel(message.createdAt);
      if (nextDateLabel && nextDateLabel !== currentDateLabel) {
        entries.push({
          type: 'date',
          id: `date-${message.createdAt}-${nextDateLabel}`,
          label: nextDateLabel,
        });
        currentDateLabel = nextDateLabel;
      }

      entries.push({
        type: 'message',
        id: message.id,
        message,
      });
    });

    return entries;
  }, [messages]);

  const resetSubjectAndChapter = () => {
    setSelectedSubjectId('');
    setSelectedChapterId('');
    setMessages([]);
    setActivePracticeProblem('');
    setActivePracticeMessageId('');
    setHintUsed(false);
    setPracticeQuestionCount(0);
    setGeneratedPracticeProblems([]);
  };

  const resetChapter = () => {
    setSelectedChapterId('');
    setMessages([]);
    setActivePracticeProblem('');
    setActivePracticeMessageId('');
    setHintUsed(false);
    setPracticeQuestionCount(0);
    setGeneratedPracticeProblems([]);
  };

  const callPracticeApi = async (prompt) => {
    const email = currentUser?.email || '';
    if (!email) {
      throw new Error('Please login again to use Practice');
    }

    const response = await fetch(`${apiBaseUrl}/api/ai/practice/ask`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        prompt,
        sessionId: '',
        botName: 'gpt-5-nano',
        type: 'practice',
        isCBSEActive: true,
        selectedChapter: selectedChapter.id,
        selectedChapterName: selectedChapter.name,
        selectedClassName: selectedChapter.className,
        selectedSubjectName: selectedChapter.subjectName,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Practice response failed');
    }

    return data.response || '';
  };

  const persistPracticeMessage = (message) => {
    if (!selectedChapter) return;

    savePracticeMessage({
      apiBaseUrl,
      chapter: selectedChapter,
      message,
    }).catch((error) => {
      console.error('Practice history save failed:', error);
      toast.error('Practice history could not be saved. Please check your connection.');
    });
  };

  const addAssistantMessage = (content, idPrefix = 'assistant', metadata = {}) => {
    const message = {
      id: `${idPrefix}-${Date.now()}`,
      role: 'assistant',
      text: content,
      html: formatChatResponseHtml(content),
      createdAt: new Date().toISOString(),
      ...metadata,
    };

    setMessages((prev) => [...prev, message]);
    persistPracticeMessage(message);
    return message.id;
  };

  const generatePracticeProblem = async () => {
    if (!selectedChapter) {
      toast.error('Please select class, subject, and chapter first');
      return;
    }
    if (isSending) return;

    setIsSending(true);
    setActivePracticeProblem('');
    setActivePracticeMessageId('');
    setHintUsed(false);

    try {
      const nextQuestionNo = practiceQuestionCount + 1;
      const problemStyle = PRACTICE_PROBLEM_STYLES[
        (nextQuestionNo - 1) % PRACTICE_PROBLEM_STYLES.length
      ];
      const conceptTarget = PRACTICE_CHAPTER_CONCEPT_TARGETS[
        (nextQuestionNo - 1) % PRACTICE_CHAPTER_CONCEPT_TARGETS.length
      ];
      const mostRecentProblem = getLatestPracticeProblem(
        messages,
        activePracticeProblem,
        generatedPracticeProblems,
      );
      const recentProblemText = buildRecentPracticeProblemBlock(generatedPracticeProblems, 8);
      const problemPrompt = [
        `Create exactly one NEW practice problem from the selected chapter "${selectedChapter.name}".`,
        `Question number in this practice session: ${nextQuestionNo}.`,
        `Required variation style: ${problemStyle}.`,
        `Required concept target: ${conceptTarget}.`,
        'This button means: PRACTICE PROBLEM FROM THIS CHAPTER.',
        'So the new problem must test a DIFFERENT concept/subtopic/skill from the most recent practiced problem, while staying inside the same selected chapter.',
        'Do not make a same-concept value variation. That behavior belongs only to the Practice similar problem button.',
        mostRecentProblem
          ? `Most recent practiced problem. Avoid its concept, setup, method, and question goal:\n${mostRecentProblem}`
          : 'No most recent problem to avoid yet.',
        recentProblemText,
        'Pick another available chapter concept: a different theorem, formula, representation, proof idea, construction, graph/table interpretation, or application type.',
        'The numbers and wording must also be different, but the main requirement is concept difference.',
        'Do not repeat the same diagram setup, tangent/chord/angle/polynomial/sequence pattern, givens-to-find structure, values, or wording from recent questions unless the chapter truly has no other concept.',
        'Make it a complete question/problem that a student can answer in chat.',
        'Do not give the answer, hints, explanation, or solution.',
        PRACTICE_VISUAL_PROBLEM_INSTRUCTION,
        'Return only the question text. Do not start with Question number, Question:, Problem number, Problem:, heading, answer, hint, or solution.',
      ].join('\n');

      let problem = await callPracticeApi(problemPrompt);
      let displayProblem = stripPracticeProblemLabelForDisplay(problem, nextQuestionNo);
      let cleanProblem = cleanPracticeProblemText(problem);
      const generatedSet = new Set(generatedPracticeProblems.map(normalizePracticeProblem));

      if (generatedSet.has(normalizePracticeProblem(cleanProblem))) {
        problem = await callPracticeApi([
          problemPrompt,
          'The previous output repeated or stayed too close to an old question. Generate a new problem from a DIFFERENT concept/subtopic/skill in this chapter. Do not only change values.',
        ].join(' '));
        displayProblem = stripPracticeProblemLabelForDisplay(problem, nextQuestionNo);
        cleanProblem = cleanPracticeProblemText(problem);
      }

      const problemWithInstruction = `**Question**\n\n${displayProblem}\n\nSubmit your answer.`;
      setPracticeQuestionCount(nextQuestionNo);
      setActivePracticeProblem(cleanProblem);
      setHintUsed(false);
      setGeneratedPracticeProblems((prev) => [...prev, cleanProblem].slice(-10));
      const problemMessageId = addAssistantMessage(problemWithInstruction, 'assistant-problem', {
        kind: 'problem',
        problemText: cleanProblem,
      });
      setActivePracticeMessageId(problemMessageId);
    } catch (error) {
      console.error('Practice problem generation failed:', error);
      addAssistantMessage(error.message || 'Sorry, something went wrong.', 'assistant-error');
    } finally {
      setIsSending(false);
    }
  };

  const generateSimilarPracticeProblem = async () => {
    if (!selectedChapter) {
      toast.error('Please select class, subject, and chapter first');
      return;
    }
    if (isSending) return;

    const sourceProblem = getLatestPracticeProblem(
      messages,
      activePracticeProblem,
      generatedPracticeProblems,
    );

    setIsSending(true);
    setActivePracticeProblem('');
    setActivePracticeMessageId('');
    setHintUsed(false);

    try {
      const nextQuestionNo = practiceQuestionCount + 1;
      const recentProblemText = buildRecentPracticeProblemBlock(generatedPracticeProblems, 5);
      const similarPrompt = sourceProblem
        ? [
            `Create exactly one NEW practice problem similar to the most recent practiced problem from "${selectedChapter.name}".`,
            `Question number in this practice session: ${nextQuestionNo}.`,
            `Source problem to transform:\n${sourceProblem}`,
            'This button means: PRACTICE SIMILAR PROBLEM.',
            'You must keep the SAME concept and SAME problem type as the source problem. Only change the values.',
            'Keep the exact same core concept, theorem/formula, givens-to-find structure, diagram type if any, and solution method as the source problem.',
            'Change the numerical values enough that the final answer changes, and keep the changed values mathematically consistent and solvable.',
            'You may lightly change names, units, or surface wording, but do not introduce a new concept, new theorem, new diagram type, new formula, or new question goal.',
            'If the source problem asks tangent length from OP and radius, ask the same type of tangent-length problem with different OP/radius values.',
            'Do not change the topic, chapter, concept family, or core skill being practiced.',
            'Use only this selected chapter context.',
            recentProblemText,
            'Do not give the answer, hints, explanation, or solution.',
            PRACTICE_VISUAL_PROBLEM_INSTRUCTION,
            'Return only the question text. Do not start with Question number, Question:, Problem number, Problem:, heading, answer, hint, or solution.',
          ].join('\n')
        : [
            `Create exactly one NEW practice problem from the selected chapter "${selectedChapter.name}".`,
            `Question number in this practice session: ${nextQuestionNo}.`,
            'No previous problem exists in this chapter history yet, so create a direct chapter practice problem.',
            'Use only this selected chapter context.',
            'Do not give the answer, hints, explanation, or solution.',
            PRACTICE_VISUAL_PROBLEM_INSTRUCTION,
            'Return only the question text. Do not start with Question number, Question:, Problem number, Problem:, heading, answer, hint, or solution.',
          ].join('\n');

      let problem = await callPracticeApi(similarPrompt);
      let displayProblem = stripPracticeProblemLabelForDisplay(problem, nextQuestionNo);
      let cleanProblem = cleanPracticeProblemText(problem);
      const generatedSet = new Set(generatedPracticeProblems.map(normalizePracticeProblem));

      if (generatedSet.has(normalizePracticeProblem(cleanProblem))) {
        problem = await callPracticeApi([
          similarPrompt,
          'The previous output repeated an old question. Keep the same concept and structure as the source problem, but change the numerical values enough to make a genuinely new solvable problem.',
        ].join('\n'));
        displayProblem = stripPracticeProblemLabelForDisplay(problem, nextQuestionNo);
        cleanProblem = cleanPracticeProblemText(problem);
      }

      const problemWithInstruction = `**Question**\n\n${displayProblem}\n\nSubmit your answer.`;
      setPracticeQuestionCount(nextQuestionNo);
      setActivePracticeProblem(cleanProblem);
      setHintUsed(false);
      setGeneratedPracticeProblems((prev) => [...prev, cleanProblem].slice(-10));
      const problemMessageId = addAssistantMessage(problemWithInstruction, 'assistant-problem', {
        kind: 'problem',
        problemText: cleanProblem,
      });
      setActivePracticeMessageId(problemMessageId);
    } catch (error) {
      console.error('Similar practice problem generation failed:', error);
      addAssistantMessage(error.message || 'Sorry, something went wrong.', 'assistant-error');
    } finally {
      setIsSending(false);
    }
  };

  const giveHintForCurrentProblem = async () => {
    if (!selectedChapter) {
      toast.error('Please select class, subject, and chapter first');
      return;
    }
    if (!activePracticeProblem) {
      toast.info('Generate a practice problem first');
      return;
    }
    if (hintUsed || isSending) return;

    setHintUsed(true);
    setIsSending(true);

    try {
      const hintPrompt = [
        'Give exactly one helpful hint for this practice problem.',
        `Problem: ${activePracticeProblem}`,
        'Use only the selected chapter context.',
        'Do not solve the problem.',
        'Do not give the final answer.',
        'Do not include multiple hints.',
        'Keep the hint short and focused on the next useful step.',
      ].join('\n');

      const hint = await callPracticeApi(hintPrompt);
      addAssistantMessage(`Hint\n\n${hint}`, 'assistant-hint', { kind: 'hint' });
    } catch (error) {
      console.error('Practice hint failed:', error);
      addAssistantMessage(error.message || 'Sorry, something went wrong.', 'assistant-error');
    } finally {
      setIsSending(false);
    }
  };

  const sendPracticeQuestion = async () => {
    const prompt = input.trim();
    if (!selectedChapter) {
      toast.error('Please select class, subject, and chapter first');
      return;
    }
    if (!prompt || isSending) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: prompt,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    persistPracticeMessage(userMessage);
    setInput('');

    const localReply = !activePracticeProblem ? getLocalPracticeReply(prompt, selectedChapter) : '';
    if (localReply) {
      addAssistantMessage(localReply, 'assistant-local');
      return;
    }

    try {
      setIsSending(true);
      const apiPrompt = activePracticeProblem
        ? [
            'Check the student answer for this practice problem.',
            `Problem: ${activePracticeProblem}`,
            `Student answer: ${prompt}`,
            'If the answer is correct, reply only: Correct.',
            'If the answer is wrong or incomplete, first write exactly: "Your submitted answer is wrong."',
            'Then write "Solution:" and give the step-by-step solution/explanation.',
            'If the problem is geometry or a visual concept, include a useful diagram for the actual reasoning, not a generic shape.',
          ].join('\n')
        : prompt;

      const reply = await callPracticeApi(apiPrompt);
      addAssistantMessage(reply);
      if (activePracticeProblem) {
        setActivePracticeProblem('');
        setActivePracticeMessageId('');
        setHintUsed(false);
      }
    } catch (error) {
      console.error('Practice send failed:', error);
      addAssistantMessage(error.message || 'Sorry, something went wrong.', 'assistant-error');
    } finally {
      setIsSending(false);
    }
  };

  if (!currentUserLoaded || loadingChapters) {
    return (
      <div className="practice-page">
        <header className="practice-header">
          <AppSidebarMenu />
          <img src={wrdsAiLogo} alt="WrdsAI" className="practice-logo" />
          <h1>Practice</h1>
          <TopUserMenu className="practice-top-user-menu" user={currentUser} />
        </header>
        <main className="practice-shell">
          <section className="practice-chat-panel">
            <div className="practice-empty">Loading practice...</div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="practice-page">
      <header className="practice-header">
        <AppSidebarMenu />
        <img src={wrdsAiLogo} alt="WrdsAI" className="practice-logo" />
        <h1>Practice</h1>
        <TopUserMenu className="practice-top-user-menu" user={currentUser} />
      </header>

      <main className="practice-shell">
        <section className="practice-picker">
          <div>
            <p className="practice-kicker">
              {lockedStudentClass ? `${lockedStudentClass.name} curriculum` : 'Select chapter first'}
            </p>
            <h2>Chapter Practice</h2>
          </div>
          <div
            className="practice-select-grid"
            style={{
              gridTemplateColumns: lockedStudentClass ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
            }}
          >
            {!lockedStudentClass && (
              <select
                value={selectedClassId}
                disabled={loadingChapters}
                onChange={(event) => {
                  setSelectedClassId(event.target.value);
                  resetSubjectAndChapter();
                }}
              >
                <option value="" disabled hidden>Class</option>
                {structure.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            )}
            <select
              value={selectedSubjectId}
              disabled={!(lockedStudentClass || selectedClass)}
              onChange={(event) => {
                setSelectedSubjectId(event.target.value);
                resetChapter();
              }}
            >
              <option value="" disabled hidden>Subject</option>
              {visibleSubjects.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <select
              value={selectedChapterId}
              disabled={!selectedSubject}
              onChange={(event) => {
                setSelectedChapterId(event.target.value);
                setMessages([]);
                setActivePracticeProblem('');
                setActivePracticeMessageId('');
                setHintUsed(false);
                setPracticeQuestionCount(0);
                setGeneratedPracticeProblems([]);
              }}
            >
              <option value="" disabled hidden>Chapter</option>
              {(selectedSubject?.chapters || []).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="practice-chat-panel">
          <div className="practice-chat-header">
            <span>{selectedChapter ? selectedChapter.name : 'Select a chapter to start practice'}</span>
          </div>
          <div className="practice-messages">
            {isLoadingHistory ? (
              <div className="practice-empty">Loading chapter history...</div>
            ) : messages.length === 0 ? (
              <div className="practice-empty">
                {selectedChapter
                  ? 'No practice history for this chapter yet. Ask a practice question to start.'
                  : `${lockedStudentClass ? 'Subject and chapter' : 'Class, subject, and chapter'} selection is required.`}
              </div>
            ) : (
              displayMessages.map((entry) => {
                if (entry.type === 'date') {
                  return (
                    <div key={entry.id} className="practice-date-divider">
                      <span>{entry.label}</span>
                    </div>
                  );
                }

                const { message } = entry;
                return (
                  <div key={message.id} className={`practice-message practice-message-${message.role}`}>
                    {message.role === 'assistant' ? (
                      <>
                        <div dangerouslySetInnerHTML={{ __html: formatChatResponseHtml(normalizePracticeMessageText(message)) }} />
                        {message.id === activePracticeMessageId && activePracticeProblem && (
                          <button
                            type="button"
                            className={`practice-hint-link practice-hint-inline ${hintUsed ? 'practice-hint-link-used' : ''}`}
                            disabled={hintUsed || isSending}
                            onClick={giveHintForCurrentProblem}
                          >
                            Hint
                          </button>
                        )}
                      </>
                    ) : (
                      message.text
                    )}
                    <div className="practice-message-time">{formatPracticeTimeLabel(message.createdAt)}</div>
                  </div>
                );
              })
            )}
            {isSending && <div className="practice-message practice-message-assistant">Thinking...</div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="practice-problem-row">
            <button
              type="button"
              className="practice-similar-problem-link"
              disabled={!selectedChapter || isSending}
              onClick={generateSimilarPracticeProblem}
            >
              Practice similar problem
            </button>
            <button
              type="button"
              className="practice-problem-link"
              disabled={!selectedChapter || isSending}
              onClick={generatePracticeProblem}
            >
              Practice problem from this chapter
            </button>
          </div>
          <div className="practice-input-row">
            <input
              value={input}
              disabled={!selectedChapter || isSending}
              placeholder={
                selectedChapter
                  ? activePracticeProblem
                    ? 'Submit your answer...'
                    : 'Ask a practice question...'
                  : 'Select chapter first'
              }
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  sendPracticeQuestion();
                }
              }}
            />
            <button disabled={!selectedChapter || !input.trim() || isSending} onClick={sendPracticeQuestion}>
              Send
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}




