import React, { useEffect, useRef, useState } from 'react';
import '../styles/testStyles.css';
import MathText from './MathText';

const TEST_DURATION_SECONDS = 600;

const TestInterface = ({ subject, chapter, difficulty, onFinish }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION_SECONDS);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startedAt, setStartedAt] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const lastRequestKeyRef = useRef('');
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const requestKey = `${chapter.id}::${chapter.name}::${difficulty?.id || difficulty?.name || 'easy'}`;

  useEffect(() => {
    let isMounted = true;

    const fetchQuestions = async () => {
      if (lastRequestKeyRef.current === requestKey) {
        return;
      }
      lastRequestKeyRef.current = requestKey;
      setLoading(true);
      setError('');
      setQuestions([]);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setTimeLeft(TEST_DURATION_SECONDS);
      setStartedAt(new Date().toISOString());
      setIsFinished(false);

      try {
        const response = await fetch(`${apiBaseUrl}/api/ai/test-prep/questions`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chapterId: chapter.id,
            chapterName: chapter.name,
            difficulty: difficulty?.id || difficulty?.name || 'easy'
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to generate test questions');
        }

        if (isMounted) {
          setQuestions(Array.isArray(data.questions) ? data.questions : []);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError.message || 'Unable to load test questions');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchQuestions();

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl, chapter.id, chapter.name, difficulty, requestKey]);

  useEffect(() => {
    if (loading || !questions.length) {
      return undefined;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, questions.length]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optionIndex) => {
    setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: optionIndex }));
  };

  const finishTest = () => {
    if (isFinished) {
      return;
    }

    setIsFinished(true);

    let correctCount = 0;
    questions.forEach((question, idx) => {
      const selectedIndex =
        answers[idx] === null || answers[idx] === undefined ? null : Number(answers[idx]);
      const correctIndex = Number(question.correct ?? question.correctIndex);
      if (
        Number.isInteger(selectedIndex) &&
        Number.isInteger(correctIndex) &&
        selectedIndex === correctIndex
      ) {
        correctCount++;
      }
    });

    onFinish({
      score: Math.round((correctCount / questions.length) * 100),
      correctCount,
      totalCount: questions.length,
      timeTaken: TEST_DURATION_SECONDS - timeLeft,
      difficulty: difficulty?.name || null,
      questions,
      answers: questions.map((_, index) => ({
        selectedIndex: answers[index] ?? null
      })),
      startedAt,
      submittedAt: new Date().toISOString(),
      chapterId: chapter.id,
      chapterName: chapter.name,
      subjectName: subject.name
    });
  };

  useEffect(() => {
    if (!loading && questions.length > 0 && timeLeft === 0) {
      finishTest();
    }
  }, [loading, questions, timeLeft]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      finishTest();
    }
  };

  if (loading) {
    return (
      <div className="test-interface">
        <div className="test-glass-card question-card" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '1rem', color: 'var(--test-cyan)', fontWeight: 600 }}>
            Preparing your test
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 500, marginBottom: '1rem' }}>
            Generating 10 chapter-based questions from {chapter.name}
          </h2>
          <p style={{ color: 'var(--test-text-muted)', margin: 0 }}>
            Please wait while we build your question paper.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="test-interface">
        <div className="test-glass-card question-card" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '1rem', color: '#f87171', fontWeight: 600 }}>
            Unable to load test
          </div>
          <p style={{ color: 'var(--test-text-muted)', marginBottom: '1.5rem' }}>
            {error}
          </p>
          <button className="primary-btn" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className="test-interface">
      <div className="test-glass-card" style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--test-text-muted)' }}>{subject.name}:</span>
          <span style={{ marginLeft: '0.5rem', fontWeight: 600, fontSize: '1rem' }}>{chapter.name}</span>
        </div>
        <div className="timer">
          Time Remaining: {formatTime(timeLeft)}
        </div>
      </div>

      <div className="question-stage">
        <div className="test-glass-card question-card">
          <div style={{ marginBottom: '1.5rem', color: 'var(--test-cyan)', fontWeight: 600 }}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 500, marginBottom: '2rem', lineHeight: 1.4 }}>
            <MathText text={currentQuestion.question} className="math-text" />
          </h2>

        <div className="options-container">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                className={`option-btn ${answers[currentQuestionIndex] === idx ? 'selected' : ''}`}
                onClick={() => handleSelectOption(idx)}
              >
                <MathText text={`${String.fromCharCode(65 + idx)}. ${option}`} className="math-text" />
              </button>
            ))}
          </div>
        </div>

        <button
          className="secondary-btn side-nav-btn side-nav-btn-left"
          disabled={currentQuestionIndex === 0}
          onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
        >
          Previous Question
        </button>

        <button className="primary-btn side-nav-btn side-nav-btn-right" onClick={handleNext}>
          {currentQuestionIndex === questions.length - 1 ? 'Finish Test' : 'Next Question'}
        </button>
      </div>
    </div>
  );
};

export default TestInterface;
