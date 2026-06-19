import React from 'react';
import ChapterInsight from './ChapterInsight';

export default function SubjectProgressCard({
  title,
  average,
  questionStats,
  testStats
}) {
  return (
    <div className="progress-subject-card">
      <div>
        <p className="progress-subject-kicker">Subject</p>
        <h2 className={String(title || '').toLowerCase() === 'maths' ? 'progress-maths-title' : ''}>
          <span>{title}</span>
        </h2>
      </div>
      <div className="progress-subject-score-row">
        <div className="progress-subject-score">{average}%</div>
        <p className="progress-subject-score-helper">{title} average test score</p>
      </div>
      <div className="progress-subject-mini-grid">
        <div className="progress-question-single">
          <span>{testStats.testsTaken || 0}</span>
          <p>Total tests taken</p>
        </div>
        <div className="progress-question-single">
          <span>{questionStats.totalQuestionsAsked || 0}</span>
          <p>Questions asked</p>
        </div>
      </div>
      <div className="progress-chapter-highlight">
        <p>Most asked chapter</p>
        <strong>{questionStats.mostAskedChapter?.chapterName || 'No chapter data yet'}</strong>
      </div>
      <div className="progress-chapter-grid">
        <ChapterInsight label="Highest chapter test taken" chapter={testStats.mostTestedChapter} />
        <ChapterInsight label="Strongest chapter" chapter={testStats.strongestChapter} />
        <ChapterInsight label="Weakest chapter" chapter={testStats.weakestChapter} />
      </div>
    </div>
  );
}
