import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import wrdsAiLogo from '../../assets/wrdsai1.png';
import { fetchMyProgress } from './api/progressApi';
import StatCard from './components/StatCard';
import SubjectProgressCard from './components/SubjectProgressCard';
import { emptyProgress } from './progressDefaults';
import './myProgress.css';

export default function MyProgress() {
  const [progress, setProgress] = useState(emptyProgress);
  const [loading, setLoading] = useState(true);
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const email = user?.email;

        if (!email) {
          toast.error('Please login to view progress');
          setLoading(false);
          return;
        }

        const data = await fetchMyProgress({ apiBaseUrl, email });
        setProgress(data);
      } catch (error) {
        console.error('Failed to load progress:', error);
        toast.error('Unable to load progress data');
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [apiBaseUrl]);

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

  return (
    <div className="progress-page">
      <header className="progress-header">
        <button className="progress-back-btn" onClick={() => window.location.href = '/home'}>
          Back
        </button>
        <img src={wrdsAiLogo} alt="WrdsAI" className="progress-logo" />
        <h1>My Progress</h1>
      </header>

      <main className="progress-content">
        <section className="progress-hero">
          <p className="progress-eyebrow">{progress.month?.label || 'Current month'}</p>
          <h2>Your learning dashboard</h2>
          <p>Monthly test performance and subject-wise question activity.</p>
        </section>

        {loading ? (
          <div className="progress-loading">Loading your progress...</div>
        ) : (
          <>
            <section className="progress-card-grid">
              <StatCard
                label="Total tests taken"
                value={summary.totalTestsTakenThisMonth || 0}
                helper="Tests submitted this month"
              />
              <StatCard
                label="Total questions asked"
                value={totalQuestionsAsked}
                helper="General, Maths and Science questions"
              />
              <StatCard
                label="Maths + Science questions asked"
                value={mathsScienceQuestionsAsked}
                helper="Only Maths and Science questions"
              />
            </section>

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
          </>
        )}
      </main>
    </div>
  );
}
