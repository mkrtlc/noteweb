import React from 'react';

/** NoteWeb mark: three linked notes forming an "N" on an iris tile. */
const Logo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="nw-logo-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#7c7cf0" />
        <stop offset="1" stopColor="#4a48b8" />
      </linearGradient>
    </defs>
    <rect width="32" height="32" rx="8" fill="url(#nw-logo-g)" />
    <path d="M10 22.5V9.5L22 22.5V9.5" fill="none" stroke="#fff" strokeOpacity="0.9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="10" cy="9.5" r="2.6" fill="#fff" />
    <circle cx="10" cy="22.5" r="2.6" fill="#fff" />
    <circle cx="22" cy="9.5" r="2.6" fill="#fff" />
    <circle cx="22" cy="22.5" r="2.6" fill="#fff" />
  </svg>
);

export default Logo;
