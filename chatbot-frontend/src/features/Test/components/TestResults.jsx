import React from 'react';
import '../styles/testStyles.css';

const getFeedback = (score) => {
  if (score >= 90) {
    return {
      line1: "Outstanding! You've mastered this chapter. 🌟",
      line2: "Continue practising more, keep up the momentum, don't be overconfident!"
    };
  } else if (score >= 70) {
    return {
      line1: "Great work! You're getting really strong at this. 💪",
      line2: "Review the 1-2 questions you missed and try again – you're almost there!"
    };
  } else if (score >= 40) {
    return {
      line1: "Good effort! You got some solid answers today. 😊",
      line2: "Pick any one question you found tricky and re-read that concept – small steps add up!"
    };
  } else if (score >= 20) {
    return {
      line1: "You showed up and that's what matters most. ✨",
      line2: "Try just one concept from this chapter today – even one question practised counts!"
    };
  } else {
    return {
      line1: "Every student started exactly where you are right now. 🙌",
      line2: "Start again, you've got this, one step at a time. Spend 30 minutes each day, practice more - I'm always here to help!"
    };
  }
};

const TestResults = ({
  results,
  recentScores = [],
  recentScoresLoading = false,
  onRestart,
  onReview
}) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatScoreDate = (value) => {
    if (!value) {
      return 'No date';
    }

    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  };

  const feedback = getFeedback(results.score);

  return (
    <div className="results-container">
      <div className="results-layout">
        <div className="test-glass-card results-main-card">
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Test Completed!</h1>

        <div className="score-circle" style={{ margin: '1.5rem auto' }}>
          {results.score}%
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>
            You scored <strong>{results.correctCount}</strong> out of <strong>{results.totalCount}</strong>
          </p>
          <p style={{ color: 'var(--test-text-muted)', marginBottom: '1.5rem' }}>
            Time taken: {formatTime(results.timeTaken)}
          </p>

          <div style={{ padding: '1.2rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid var(--test-glass-border)' }}>
            <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.6rem', color: '#fff' }}>
              {feedback.line1}
            </p>
            <p style={{ color: 'var(--test-text-muted)', fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>
              {feedback.line2}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: 'auto' }}>
          <button className="primary-btn" onClick={onRestart}>
            Take Another Test
          </button>
          <button className="secondary-btn" onClick={onReview}>
            Review Test
          </button>
        </div>
      </div>

        <aside className="test-glass-card recent-scores-card">
          <div className="recent-scores-heading">
            <div>
              <h2>Your Recent Scores</h2>
              <p className="recent-scores-subtitle">
                This chapter only
              </p>
            </div>
          </div>

          {recentScoresLoading && (
            <div className="recent-scores-empty">Loading latest scores...</div>
          )}

          {!recentScoresLoading && recentScores.length === 0 && (
            <div className="recent-scores-empty">No saved tests for this chapter yet.</div>
          )}

          {!recentScoresLoading && recentScores.length > 0 && (
            <div className="recent-scores-list">
              {recentScores.map((item) => (
                <div className="recent-score-row" key={item.id}>
                  <div>
                    <div className="recent-score-chapter">
                      {item.chapterName || 'Chapter test'}
                    </div>
                    <div className="recent-score-date">
                      {formatScoreDate(item.submittedAt || item.createdAt)}
                    </div>
                  </div>
                  <div className="recent-score-pill">
                    {Number(item.score || 0).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default TestResults;
