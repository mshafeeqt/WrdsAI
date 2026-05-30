import React from 'react';

export default function ChapterInsight({ label, chapter }) {
  return (
    <div className="progress-chapter-insight">
      <p>{label}</p>
      <strong>{chapter?.chapterName || 'No chapter data yet'}</strong>
      {chapter?.chapterName && (
        <span>
          {chapter.testsTaken || 0} tests - {chapter.averageScore || 0}% avg
        </span>
      )}
    </div>
  );
}
