import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import wrdsAiLogo from '../../assets/words1.png';
import { fetchMyProgress, fetchTeacherProgress } from './api/progressApi';
import StatCard from './components/StatCard';
import SubjectProgressCard from './components/SubjectProgressCard';
import { DashboardIcon } from './components/ProgressIcons';
import { emptyProgress } from './progressDefaults';
import AppSidebarMenu from '../shared/AppSidebarMenu';
import TopUserMenu from '../shared/TopUserMenu';
import { fetchCurrentUser } from '../auth/authClient';
import './myProgress.css';

const progressPageCopy = {
  student: {
    title: 'My Progress',
    heroTitle: 'Your learning dashboard',
    heroText: 'Monthly test performance and subject-wise question activity.',
    loadingText: 'Loading your progress...',
    totalQuestionsHelper: 'General, Maths and Science questions this month',
    mathsScienceHelper: 'Only Maths and Science questions this month',
  },
  teacher: {
    title: 'Teacher Progress',
    heroTitle: 'Your teaching dashboard',
    heroText: 'Teach-mode question activity from teacher-home only.',
    loadingText: 'Loading teacher progress...',
    totalQuestionsHelper: 'Total questions asked this month (WrdsAI + Teach-mode)',
    mathsScienceHelper: 'Only Teach-mode Maths and Science questions this month',
    primaryStatLabel: 'Lesson planned this month',
    primaryStatHelper: 'Lesson plans created this month',
  },
};

export default function MyProgress({ audience = 'student' }) {
  const [progress, setProgress] = useState(emptyProgress);
  const [loading, setLoading] = useState(true);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const isTeacherProgress = audience === 'teacher';
  const copy = progressPageCopy[isTeacherProgress ? 'teacher' : 'student'];

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const user = await fetchCurrentUser();
        const email = user?.email;

        if (!email) {
          toast.error('Please login to view progress');
          setLoading(false);
          return;
        }

        const fetchProgress = isTeacherProgress ? fetchTeacherProgress : fetchMyProgress;
        const data = await fetchProgress({ apiBaseUrl, email });
        setProgress(data);
      } catch (error) {
        console.error('Failed to load progress:', error);
        toast.error('Unable to load progress data');
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [apiBaseUrl, isTeacherProgress]);

  const summary = progress.summary || emptyProgress.summary;
  const questions = progress.questions || emptyProgress.questions;
  const testStats = progress.testStats || emptyProgress.testStats;
  const mathsTestStats = testStats.maths || emptyProgress.testStats.maths;
  const scienceTestStats = testStats.science || emptyProgress.testStats.science;
  const totalQuestionsAsked =
    summary.totalQuestionsAsked ?? questions.all?.totalQuestionsAsked ?? 0;
  const mathsScienceQuestionsAsked =
    summary.mathsScienceQuestionsAsked ??
    ((questions.maths?.totalQuestionsAsked || 0) +
      (questions.science?.totalQuestionsAsked || 0));
  const primaryStatValue = isTeacherProgress
    ? summary.lessonPlansThisMonth || 0
    : summary.totalTestsTakenThisMonth || 0;

  return (
    <div className="progress-page">
      <header className="progress-header">
        <AppSidebarMenu teacherMode={isTeacherProgress} />
        <img src={wrdsAiLogo} alt="WrdsAI" className="progress-logo" />
        <h1>{copy.title}</h1>
        <TopUserMenu className="progress-top-user-menu" />
      </header>

      <main className="progress-content">
        <section className="progress-hero">
          <p className="progress-eyebrow">{progress.month?.label || 'Current month'}</p>
          <h2>{copy.heroTitle}</h2>
          <DashboardIcon className="progress-card-corner-icon progress-dashboard-corner-icon" />
          <p>{copy.heroText}</p>
        </section>

        {loading ? (
          <div className="progress-loading">{copy.loadingText}</div>
        ) : (
          <>
            <section className="progress-card-grid">
              <StatCard
                label={copy.primaryStatLabel || 'Total tests taken'}
                value={primaryStatValue}
                helper={copy.primaryStatHelper || 'Tests submitted this month'}
              />
              <StatCard
                label="Total questions asked"
                value={totalQuestionsAsked}
                helper={copy.totalQuestionsHelper}
              />
              <StatCard
                label="Maths + Science questions asked"
                value={mathsScienceQuestionsAsked}
                helper={copy.mathsScienceHelper}
              />
            </section>

            {!isTeacherProgress && (
              <section className="progress-subject-grid">
                <SubjectProgressCard
                  title="Maths"
                  average={summary.mathsAverageScore || 0}
                  questionStats={questions.maths || emptyProgress.questions.maths}
                  testStats={mathsTestStats}
                />
                <SubjectProgressCard
                  title="Science"
                  average={summary.scienceAverageScore || 0}
                  questionStats={questions.science || emptyProgress.questions.science}
                  testStats={scienceTestStats}
                />
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
