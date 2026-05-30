import React from 'react';

export default function StatCard({ label, value, helper }) {
  return (
    <div className="progress-card">
      <p className="progress-card-label">{label}</p>
      <div className="progress-card-value">{value}</div>
      {helper && <p className="progress-card-helper">{helper}</p>}
    </div>
  );
}
