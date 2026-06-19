import React from 'react';
import '../styles/testStyles.css';
import MathText from './MathText';

const getSelectedIndex = (answers, questionIndex) => {
  const answer = Array.isArray(answers) ? answers[questionIndex] : answers?.[questionIndex];
  const rawValue =
    answer && typeof answer === 'object'
      ? answer.selectedIndex ?? answer.answerIndex ?? answer.index
      : answer;

  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return null;
  }

  const numericValue = Number(rawValue);
  return Number.isInteger(numericValue) ? numericValue : null;
};

const TestReview = ({ results, onBackToResults, onTakeAnotherTest }) => {
  const questions = Array.isArray(results?.questions) ? results.questions : [];
  const answers = results?.answers || [];

  return (
    <div className="test-review">
      <div className="test-review-header">
        <div className="test-glass-card review-summary-card">
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.75rem' }}>Review Test</h1>
          <p style={{ color: 'var(--test-text-muted)', marginBottom: '1rem' }}>
            Correct answers are highlighted in green. Incorrect selected answers are highlighted in red.
          </p>
          <p style={{ margin: 0, fontSize: '1rem' }}>
            Score: <strong>{results.correctCount}</strong> / <strong>{results.totalCount}</strong>
          </p>
        </div>
      </div>

      <div className="review-question-list">
        {questions.map((question, questionIndex) => {
          const selectedAnswer = getSelectedIndex(answers, questionIndex);
          const correctAnswer = Number(question.correct ?? question.correctIndex);
          const isAnswered = selectedAnswer !== null;
          const hasValidCorrectAnswer = Number.isInteger(correctAnswer);
          const isCorrectlyAnswered = isAnswered && hasValidCorrectAnswer && selectedAnswer === correctAnswer;
          const awardedMarks = isCorrectlyAnswered ? 1 : 0;

          return (
            <div key={question.id || questionIndex} className="test-glass-card review-question-card">
              <div className="review-question-header">
                <div className="review-question-meta">Question {questionIndex + 1}</div>
                <div className={`review-question-marks ${awardedMarks === 1 ? 'review-question-marks-correct' : 'review-question-marks-zero'}`}>
                  {awardedMarks} mark
                </div>
              </div>
              <h2 className="review-question-title">
                <MathText text={question.question} className="math-text" />
              </h2>

              <div className="options-container">
                {question.options.map((option, optionIndex) => {
                  const isCorrect = hasValidCorrectAnswer && optionIndex === correctAnswer;
                  const isSelected = selectedAnswer === optionIndex;
                  const isWrongSelection = isSelected && !isCorrect;

                  const buttonClassName = [
                    'option-btn',
                    'review-option-btn',
                    isCorrect ? 'review-option-correct' : '',
                    isWrongSelection ? 'review-option-wrong' : '',
                    isSelected && isCorrect ? 'review-option-correct-selected' : ''
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <div key={optionIndex} className={buttonClassName}>
                      <div className="review-option-row">
                        <div className="review-option-content">
                          <MathText
                            text={`${String.fromCharCode(65 + optionIndex)}. ${option}`}
                            className="math-text"
                          />
                          <div className="review-option-badges">
                            {isCorrect && (
                              <span className="review-option-badge review-option-badge-correct">
                                {isAnswered ? 'Correct Answer' : 'Correct'}
                              </span>
                            )}
                            {isWrongSelection && (
                              <span className="review-option-badge review-option-badge-wrong">
                                Your Response
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!isAnswered && (
                <div className="review-unanswered-note">
                  Unanswered
                </div>
              )}

              {question.explanation && (
                <div className="review-explanation">
                  <span className="review-explanation-label">Explanation:</span>{' '}
                  <MathText text={question.explanation} className="math-text" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="review-actions">
        <button className="secondary-btn" onClick={onBackToResults}>
          Back to Results
        </button>
        <button className="primary-btn" onClick={onTakeAnotherTest}>
          Take Another Test
        </button>
      </div>
    </div>
  );
};

export default TestReview;
