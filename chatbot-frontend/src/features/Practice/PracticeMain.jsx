import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import wrdsAiLogo from '../../assets/words1.png';
import { formatChatResponseHtml } from '../chat/utils/responseFormatting';
import AppSidebarMenu from '../shared/AppSidebarMenu';
import { fetchCurrentUser } from '../auth/authClient';
import {
  getLockedStudentClass,
  getVisibleSubjectsForStudent,
} from '../curriculum/studentCurriculum';
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

const normalizePracticeProblem = (value = '') =>
  value.toLowerCase().replace(/\s+/g, ' ').replace(/[^\w\s]/g, '').trim();

export default function PracticeMain() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const [structure, setStructure] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
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

  const addAssistantMessage = (content, idPrefix = 'assistant') => {
    const messageId = `${idPrefix}-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: messageId,
        role: 'assistant',
        html: formatChatResponseHtml(content),
      },
    ]);
    return messageId;
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
      const recentProblemText = generatedPracticeProblems.length
        ? `Recent questions already asked:\n${generatedPracticeProblems
            .slice(-5)
            .map((item, index) => `${index + 1}. ${item}`)
            .join('\n')}`
        : 'No recent generated questions yet.';
      const problemPrompt = [
        `Create exactly one NEW practice problem from the selected chapter "${selectedChapter.name}".`,
        `Question number in this practice session: ${nextQuestionNo}.`,
        `Required variation style: ${problemStyle}.`,
        'Use only this chapter context, but vary the numbers, wording, and skill being tested.',
        'Do not repeat the same triangle, polynomial, example, values, or wording from recent questions.',
        recentProblemText,
        'Make it a complete question/problem that a student can answer in chat.',
        'Do not give the answer, hints, explanation, or solution.',
        'If the chapter supports it, rotate across definitions, calculations, applications, proof/reasoning, and word problems.',
        'Return only the question text.',
      ].join(' ');

      let problem = await callPracticeApi(problemPrompt);
      let cleanProblem = problem.trim();
      const generatedSet = new Set(generatedPracticeProblems.map(normalizePracticeProblem));

      if (generatedSet.has(normalizePracticeProblem(cleanProblem))) {
        problem = await callPracticeApi([
          problemPrompt,
          'The previous output repeated an old question. Generate a completely different question now.',
        ].join(' '));
        cleanProblem = problem.trim();
      }

      const problemWithInstruction = `Question ${nextQuestionNo}\n\n${cleanProblem}\n\nSubmit your answer.`;
      setPracticeQuestionCount(nextQuestionNo);
      setActivePracticeProblem(cleanProblem);
      setHintUsed(false);
      setGeneratedPracticeProblems((prev) => [...prev, cleanProblem].slice(-10));
      const problemMessageId = addAssistantMessage(problemWithInstruction, 'assistant-problem');
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
    const sourceProblem = activePracticeProblem || generatedPracticeProblems.at(-1) || '';
    if (!sourceProblem) {
      toast.info('Generate a practice problem first');
      return;
    }
    if (isSending) return;

    setIsSending(true);
    setActivePracticeProblem('');
    setActivePracticeMessageId('');
    setHintUsed(false);

    try {
      const nextQuestionNo = practiceQuestionCount + 1;
      const recentProblemText = generatedPracticeProblems.length
        ? `Recent questions already asked:\n${generatedPracticeProblems
            .slice(-5)
            .map((item, index) => `${index + 1}. ${item}`)
            .join('\n')}`
        : 'No recent generated questions yet.';
      const similarPrompt = [
        `Create exactly one NEW practice problem similar to this problem from "${selectedChapter.name}".`,
        `Question number in this practice session: ${nextQuestionNo}.`,
        `Original problem to imitate:\n${sourceProblem}`,
        'Keep the same chapter concept and similar difficulty.',
        'Change the numbers, names, setting, wording, and final ask enough that it is not a repeat.',
        'Use only this selected chapter context.',
        recentProblemText,
        'Do not give the answer, hints, explanation, or solution.',
        'Return only the question text.',
      ].join('\n');

      let problem = await callPracticeApi(similarPrompt);
      let cleanProblem = problem.trim();
      const generatedSet = new Set(generatedPracticeProblems.map(normalizePracticeProblem));

      if (generatedSet.has(normalizePracticeProblem(cleanProblem))) {
        problem = await callPracticeApi([
          similarPrompt,
          'The previous output repeated an old question. Generate a different similar question now.',
        ].join('\n'));
        cleanProblem = problem.trim();
      }

      const problemWithInstruction = `Question ${nextQuestionNo}\n\n${cleanProblem}\n\nSubmit your answer.`;
      setPracticeQuestionCount(nextQuestionNo);
      setActivePracticeProblem(cleanProblem);
      setHintUsed(false);
      setGeneratedPracticeProblems((prev) => [...prev, cleanProblem].slice(-10));
      const problemMessageId = addAssistantMessage(problemWithInstruction, 'assistant-problem');
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
      addAssistantMessage(`Hint\n\n${hint}`, 'assistant-hint');
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

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        text: prompt,
      },
    ]);
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
                <option value="">Class</option>
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
              <option value="">Subject</option>
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
              <option value="">Chapter</option>
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
            {messages.length === 0 ? (
              <div className="practice-empty">
                {selectedChapter
                  ? 'Ask a practice question from this chapter.'
                  : `${lockedStudentClass ? 'Subject and chapter' : 'Class, subject, and chapter'} selection is required.`}
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`practice-message practice-message-${message.role}`}>
                  {message.role === 'assistant' ? (
                    <>
                      <div dangerouslySetInnerHTML={{ __html: message.html }} />
                      {message.id === activePracticeMessageId && activePracticeProblem && (
                        <button
                          type="button"
                          className={`practice-hint-link practice-hint-inline ${hintUsed ? 'practice-hint-link-used' : ''}`}
                          disabled={hintUsed || isSending}
                          onClick={giveHintForCurrentProblem}
                        >
                          Hint 💡
                        </button>
                      )}
                    </>
                  ) : (
                    message.text
                  )}
                </div>
              ))
            )}
            {isSending && <div className="practice-message practice-message-assistant">Thinking...</div>}
          </div>
          <div className="practice-problem-row">
            <button
              type="button"
              className="practice-similar-problem-link"
              disabled={!selectedChapter || isSending || (!activePracticeProblem && generatedPracticeProblems.length === 0)}
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
