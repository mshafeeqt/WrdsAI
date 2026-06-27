import React, { useState, useEffect } from 'react';
import TestDashboard from './components/TestDashboard';
import TestInterface from './components/TestInterface';
import TestResults from './components/TestResults';
import TestReview from './components/TestReview';
import wrdsAiLogo from '../../assets/words1.png';
import AppSidebarMenu from '../shared/AppSidebarMenu';
import TopUserMenu from '../shared/TopUserMenu';
import './styles/testStyles.css';
import { toast } from 'react-toastify';
import { fetchCurrentUser } from '../auth/authClient';
import {
  getLockedStudentClass,
  getVisibleSubjectsForStudent,
} from '../curriculum/studentCurriculum';

const TestMain = () => {
  const [view, setView] = useState('class-selection');
  const [chapterStructure, setChapterStructure] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null); // State restored
  const [results, setResults] = useState(null);
  const [recentScores, setRecentScores] = useState([]);
  const [recentScoresLoading, setRecentScoresLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserLoaded, setCurrentUserLoaded] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const lockedStudentClass = getLockedStudentClass(chapterStructure, currentUser);
  const visibleSubjects = selectedClass
    ? (lockedStudentClass ? getVisibleSubjectsForStudent(selectedClass) : selectedClass.subjects || [])
    : [];

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
    const fetchMathChapters = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${apiBaseUrl}/api/ai/math-chapters`, {
          credentials: 'include',
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load chapters");
        }

        setChapterStructure(Array.isArray(data.structure) ? data.structure : []);
      } catch (error) {
        console.error("Failed to fetch math chapters:", error);
        toast.error("Unable to load curriculum data");
      } finally {
        setLoading(false);
      }
    };

    fetchMathChapters();
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!lockedStudentClass) return;

    setSelectedClass((currentValue) =>
      currentValue?.id === lockedStudentClass.id ? currentValue : lockedStudentClass,
    );
    setView((currentView) =>
      currentView === 'class-selection' ? 'subject-selection' : currentView,
    );
  }, [lockedStudentClass]);

  const selectClass = (cls) => {
    setSelectedClass(cls);
    setView('subject-selection');
  };

  const selectSubject = (subject) => {
    setSelectedSubject(subject);
    setView('chapter-selection');
  };

  const selectChapter = (chapter) => {
    setSelectedChapter(chapter);
    setSelectedDifficulty({ id: 'easy', name: 'Easy' });
    setView('active');
  };

  const loadRecentScores = async () => {
    try {
      const user = currentUser || {};
      const email = user?.email;

      if (!email) {
        setRecentScores([]);
        return;
      }

      setRecentScoresLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/ai/test-prep/recent-scores`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          subject: selectedSubject?.name,
          chapterName: selectedChapter?.name
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load recent scores');
      }

      setRecentScores(Array.isArray(data.scores) ? data.scores : []);
    } catch (error) {
      console.error('Failed to load recent scores:', error);
    } finally {
      setRecentScoresLoading(false);
    }
  };

  const finishTest = async (testResults) => {
    setResults(testResults);
    setView('results');
    setRecentScoresLoading(true);

    try {
      const user = currentUser || {};
      const email = user?.email;

      if (!email) {
        console.warn('Test result not saved: no logged-in user email found.');
        setRecentScoresLoading(false);
        return;
      }

      const userName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || '';

      const response = await fetch(`${apiBaseUrl}/api/ai/test-prep/submit`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          userName,
          className: selectedClass?.name,
          chapterId: testResults.chapterId || selectedChapter?.id,
          subject: testResults.subjectName || selectedSubject?.name,
          chapter: testResults.chapterName || selectedChapter?.name,
          difficulty: testResults.difficulty || selectedDifficulty?.name || 'Easy',
          testType: 'chapter-mcq',
          score: testResults.score,
          timeTakenSeconds: testResults.timeTaken,
          startedAt: testResults.startedAt,
          submittedAt: testResults.submittedAt,
          questions: testResults.questions,
          answers: testResults.answers
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save test result');
      }

      setRecentScores(Array.isArray(data.latestScores) ? data.latestScores : []);
    } catch (error) {
      console.error('Failed to save test result:', error);
      toast.error('Test completed, but result was not saved to database.');
      await loadRecentScores();
    } finally {
      setRecentScoresLoading(false);
    }
  };

  const openReview = () => {
    setView('review');
  };

  const reset = () => {
    setView(lockedStudentClass ? 'subject-selection' : 'class-selection');
    setSelectedClass(lockedStudentClass || null);
    setSelectedSubject(null);
    setSelectedChapter(null);
    setSelectedDifficulty(null);
    setResults(null);
  };

  const handleBack = () => {
    if (view === 'subject-selection') {
      if (!lockedStudentClass) {
        setView('class-selection');
        setSelectedClass(null);
      }
    } else if (view === 'chapter-selection') {
      setView('subject-selection');
      setSelectedSubject(null);
    } else if (view === 'active') {
      if (window.confirm('Are you sure you want to leave the test? Progress will be lost.')) {
        setView('chapter-selection');
        setSelectedDifficulty(null);
      }
    } else if (view === 'results') {
      setView('chapter-selection');
      setResults(null);
      setSelectedDifficulty(null);
    } else if (view === 'review') {
      setView('results');
    }
  };

  if (loading || !currentUserLoaded) {
    return (
      <div className="test-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="test-glass-card" style={{ padding: '2rem' }}>
          Loading test...
        </div>
      </div>
    );
  }

  return (
    <div className="test-container">
      <header className="test-header">
        <div className="test-header-side test-header-left">
          <AppSidebarMenu />
          {(view !== 'class-selection' || lockedStudentClass) && view !== 'subject-selection' && (
            <button
              className="secondary-btn"
              style={{ padding: '0.4rem 1.2rem', fontSize: '0.9rem', color: 'var(--test-cyan)', border: '1px solid var(--test-cyan)' }}
              onClick={handleBack}
            >
              Back
            </button>
          )}
          <div className="test-logo">
            <img src={wrdsAiLogo} alt="WrdsAI" className="test-logo-image" />
          </div>
        </div>

        <div className="test-header-title">
          Test
        </div>

        <div className="test-header-side test-header-right">
          <TopUserMenu user={currentUser} />
          {selectedClass && (
            <span style={{ fontSize: '0.9rem', opacity: 0.8, backgroundColor: 'var(--test-glass-border)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
              {selectedClass.name}
            </span>
          )}
          {selectedSubject && (
            <span style={{ fontSize: '0.9rem', opacity: 0.8, backgroundColor: 'var(--test-glass-border)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
              {selectedSubject.name}
            </span>
          )}
          {selectedChapter && ( // Changed from selectedDifficulty to selectedChapter
            <span style={{ fontSize: '0.9rem', opacity: 0.8, backgroundColor: 'var(--test-glass-border)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
              {selectedChapter.name}
            </span>
          )}
          <button
            className="secondary-btn"
            style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
            onClick={() => window.location.href = '/home'}
          >
            Exit
          </button>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minHeight: 0, overflow: 'hidden' }}>
        {view === 'class-selection' && (
          <TestDashboard
            title="Select Class"
            subtitle="Choose your grade level to access relevant practice tests."
            items={chapterStructure}
            onSelectItem={selectClass}
          />
        )}

        {view === 'subject-selection' && selectedClass && (
          <TestDashboard
            title="Select Subject"
            subtitle={
              lockedStudentClass
                ? `Choose a subject from ${selectedClass.name}.`
                : 'Only core subjects are enabled for practice assessments currently.'
            }
            items={visibleSubjects}
            onSelectItem={selectSubject}
          />
        )}

        {view === 'chapter-selection' && selectedSubject && (
          <TestDashboard
            title="Select Chapter"
            subtitle="Select a specific chapter to start your assessment."
            items={selectedSubject.chapters || []}
            onSelectItem={selectChapter}
            isSmall={true}
          />
        )}

        {view === 'active' && selectedChapter && selectedDifficulty && (
          <TestInterface
            subject={selectedSubject}
            chapter={selectedChapter}
            difficulty={selectedDifficulty}
            onFinish={finishTest}
          />
        )}

        {view === 'results' && (
          <TestResults
            results={results}
            recentScores={recentScores}
            recentScoresLoading={recentScoresLoading}
            onRestart={reset}
            onReview={openReview}
          />
        )}

        {view === 'review' && results && (
          <TestReview
            results={results}
            onBackToResults={() => setView('results')}
            onTakeAnotherTest={reset}
          />
        )}
      </main>

      <footer style={{ padding: '1rem 2rem', borderTop: '1px solid var(--test-glass-border)', textAlign: 'center', fontSize: '0.8rem', opacity: 0.5 }}>
        &copy; 2026 Test. All rights reserved.
      </footer>
    </div>
  );
};

export default TestMain;
