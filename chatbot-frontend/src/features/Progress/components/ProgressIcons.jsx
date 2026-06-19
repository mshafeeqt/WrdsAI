import React from 'react';

export function DashboardIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 96 96" aria-hidden="true" focusable="false">
      <defs>
        <filter id="dashboardIconShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#160d40" floodOpacity="0.24" />
        </filter>
        <linearGradient id="dashboardPink" x1="8" y1="18" x2="48" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffb1bc" />
          <stop offset="1" stopColor="#df6674" />
        </linearGradient>
        <linearGradient id="dashboardCyan" x1="45" y1="5" x2="82" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#66d4e6" />
          <stop offset="1" stopColor="#28a9bf" />
        </linearGradient>
        <linearGradient id="dashboardGold" x1="49" y1="61" x2="72" y2="91" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffd46f" />
          <stop offset="1" stopColor="#e4a230" />
        </linearGradient>
        <linearGradient id="dashboardLens" x1="53" y1="42" x2="84" y2="73" gradientUnits="userSpaceOnUse">
          <stop stopColor="#baf6ff" />
          <stop offset="1" stopColor="#4fd0df" />
        </linearGradient>
        <linearGradient id="dashboardRing" x1="48" y1="35" x2="93" y2="86" gradientUnits="userSpaceOnUse">
          <stop stopColor="#b98aff" />
          <stop offset="1" stopColor="#7047dd" />
        </linearGradient>
      </defs>

      <g filter="url(#dashboardIconShadow)">
        <path
          d="M43 13 A35 35 0 0 0 12 38 L31 48 A14 14 0 0 1 45 34 Z"
          fill="url(#dashboardPink)"
        />
        <path
          d="M49 13 A35 35 0 0 1 82 49 L61 49 A14 14 0 0 0 50 34 Z"
          fill="url(#dashboardCyan)"
        />
        <path
          d="M12 45 A35 35 0 0 0 32 81 L40 61 A14 14 0 0 1 31 52 Z"
          fill="#f4c3bf"
        />
        <path
          d="M42 84 A35 35 0 0 0 69 73 L55 58 A14 14 0 0 1 45 63 Z"
          fill="url(#dashboardGold)"
        />
        <circle cx="65" cy="58" r="21" fill="url(#dashboardLens)" stroke="url(#dashboardRing)" strokeWidth="8" />
        <path
          d="M78 74 L88 88"
          fill="none"
          stroke="url(#dashboardRing)"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M53 51 C57 44 68 42 75 49"
          fill="none"
          stroke="#d8fbff"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.55"
        />
      </g>
    </svg>
  );
}

export function MathsIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 96 64" aria-hidden="true" focusable="false">
      <path
        d="M10 54 C3 38 4 22 14 8 M24 16 L42 48 M42 16 L24 48 M52 31 H72 M62 20 V42 M82 8 C94 22 94 40 82 56 M80 17 C84 10 89 7 92 10 C96 14 89 20 82 23 M79 50 C85 50 91 50 94 47"
        fill="none"
        stroke="#ffffff"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ScienceIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path
        d="M23 50 C23 39 29 31 39 27 C48 31 54 40 54 50"
        fill="none"
        stroke="#e9e2d1"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <rect x="14" y="46" width="36" height="6" fill="#3b4650" />
      <rect x="18" y="52" width="28" height="4" fill="#4f5b66" />
      <rect x="25" y="10" width="20" height="26" fill="#e9e2d1" transform="rotate(45 35 23)" />
      <rect x="38" y="3" width="9" height="14" fill="#4f5b66" transform="rotate(45 42.5 10)" />
      <rect x="43" y="0" width="12" height="12" fill="#37414b" transform="rotate(45 49 6)" />
      <rect x="13" y="36" width="9" height="14" fill="#4f5b66" transform="rotate(45 17.5 43)" />
      <circle cx="36" cy="29" r="7" fill="#4f5b66" />
      <circle cx="36" cy="29" r="2.5" fill="#7b858f" />
      <rect x="8" y="56" width="44" height="6" fill="#e9e2d1" />
    </svg>
  );
}
