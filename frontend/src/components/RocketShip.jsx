const RocketShip = ({ thrusting = true, className = "", style }) => (
  <svg viewBox="-12 4 140 72" className={className} style={style} data-testid="rocket-ship">
    <defs>
      <linearGradient id="rs-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F1F5F9" />
        <stop offset="45%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#3B4763" />
      </linearGradient>
      <linearGradient id="rs-nose" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#22D3EE" />
        <stop offset="100%" stopColor="#2563EB" />
      </linearGradient>
      <radialGradient id="rs-canopy" cx="0.35" cy="0.3" r="0.9">
        <stop offset="0%" stopColor="#E0F2FE" />
        <stop offset="55%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </radialGradient>
      <linearGradient id="rs-fin" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="100%" stopColor="#0EA5E9" />
      </linearGradient>
      <filter id="rs-glow" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="2.2" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {thrusting && (
      <g className="flame-flicker" filter="url(#rs-glow)">
        <path d="M17 40 C7 30 -6 34 -10 40 C-6 46 7 50 17 40 Z" fill="#22D3EE" opacity="0.4" />
        <path d="M17 40 C10 33 1 36 -3 40 C1 44 10 47 17 40 Z" fill="#67E8F9" opacity="0.75" />
        <path d="M17 40 C12 36 6 37 3 40 C6 43 12 44 17 40 Z" fill="#FFFFFF" />
      </g>
    )}

    <path d="M44 29 L28 9 L62 23 Z" fill="url(#rs-fin)" stroke="#0B0D12" strokeWidth="0.75" />
    <path d="M44 51 L28 71 L62 57 Z" fill="url(#rs-fin)" stroke="#0B0D12" strokeWidth="0.75" />
    <path d="M84 28 L76 19 L94 26 Z" fill="url(#rs-fin)" stroke="#0B0D12" strokeWidth="0.6" opacity="0.9" />
    <path d="M84 52 L76 61 L94 54 Z" fill="url(#rs-fin)" stroke="#0B0D12" strokeWidth="0.6" opacity="0.9" />

    <path d="M18 32 L29 30 L29 50 L18 48 Z" fill="#111827" stroke="#334155" strokeWidth="0.75" />
    <ellipse cx="18.5" cy="40" rx="2.4" ry="6" fill="#22D3EE" opacity="0.9" filter="url(#rs-glow)" />

    <path
      d="M28 40 C28 31 46 25 68 23 L94 25 C105 27 114 34 118 40 C114 46 105 53 94 55 L68 57 C46 55 28 49 28 40 Z"
      fill="url(#rs-body)"
      stroke="#0B0D12"
      strokeWidth="1"
    />
    <path d="M98 26 C108 29 115 34 118 40 C115 46 108 51 98 54 C102 46 102 34 98 26 Z" fill="url(#rs-nose)" opacity="0.95" />

    <ellipse cx="82" cy="32.5" rx="13" ry="6" fill="url(#rs-canopy)" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" />
    <ellipse cx="77.5" cy="30.2" rx="4" ry="1.6" fill="#FFFFFF" opacity="0.55" />

    <path d="M36 40 L108 40" stroke="#00E575" strokeWidth="1.6" opacity="0.85" filter="url(#rs-glow)" />
    <path d="M52 26.5 C48 35 48 45 52 53.5" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" fill="none" />
    <path d="M72 24.5 C68 35 68 45 72 55.5" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8" fill="none" />
    <circle cx="60" cy="33" r="0.9" fill="#0B0D12" opacity="0.5" />
    <circle cx="60" cy="47" r="0.9" fill="#0B0D12" opacity="0.5" />
    <circle cx="44" cy="40" r="0.9" fill="#0B0D12" opacity="0.5" />
  </svg>
);

export default RocketShip;
