export const SYMBOLS = [
  { type: "blueberry", label: "Blaubeere", pays: [0.4, 0.9, 4] },
  { type: "lemon", label: "Zitrone", pays: [0.4, 1, 4.5] },
  { type: "kiwi", label: "Kiwi", pays: [0.5, 1.1, 5] },
  { type: "watermelon", label: "Wassermelone", pays: [0.6, 1.3, 6] },
  { type: "orange", label: "Orange", pays: [0.7, 1.5, 7] },
  { type: "plum", label: "Pflaume", pays: [0.8, 1.8, 8] },
  { type: "jelly", label: "Rotes Gelee", pays: [1, 2, 10] },
  { type: "donut", label: "Pinker Donut", pays: [1.5, 3, 15] },
  { type: "cupcake", label: "Cupcake", pays: [2.5, 6, 25] },
];

const Shadow = () => <ellipse cx="40" cy="73" rx="20" ry="4.5" fill="#4A1D5E" opacity="0.14" />;

const KiwiSeeds = () => (
  <>
    {Array.from({ length: 12 }).map((_, i) => {
      const a = (i * 30 * Math.PI) / 180;
      return (
        <ellipse
          key={i}
          cx={40 + 13.5 * Math.cos(a)}
          cy={40 + 13.5 * Math.sin(a)}
          rx="1.6"
          ry="2.6"
          fill="#3F3A1E"
          transform={`rotate(${(i * 30 + 90)} ${40 + 13.5 * Math.cos(a)} ${40 + 13.5 * Math.sin(a)})`}
        />
      );
    })}
  </>
);

const DonutSprinkles = () => {
  const colors = ["#FDE047", "#60A5FA", "#4ADE80", "#FFFFFF", "#A78BFA", "#FB7185", "#34D399", "#FDBA74"];
  return (
    <>
      {[[28, 28, 20], [46, 25, 70], [54, 36, -30], [33, 47, 45], [48, 48, 10], [24, 40, -60], [40, 33, 90], [55, 27, 130]].map(([x, y, r], i) => (
        <rect key={i} x={x} y={y} width="6" height="2.2" rx="1.1" fill={colors[i]} transform={`rotate(${r} ${x} ${y})`} />
      ))}
    </>
  );
};

const JarCandies = ({ multi }) => {
  const cols = multi ? ["#F43F5E", "#FACC15", "#4ADE80", "#60A5FA", "#A78BFA", "#FB923C"] : ["#F43F5E", "#F472B6", "#F43F5E", "#FBCFE8", "#EC4899"];
  const pos = [[28, 47], [37, 51], [46, 47], [32, 58], [48, 57], [40, 42]];
  return (
    <>
      {cols.map((c, i) => (
        <circle key={i} cx={pos[i][0]} cy={pos[i][1]} r="4.6" fill={c} stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" />
      ))}
    </>
  );
};

const Jar = ({ labelTop, labelBottom, multi }) => (
  <svg viewBox="0 0 80 80" className="w-full h-full">
    <defs>
      <linearGradient id={`jar-glass-${multi ? "m" : "s"}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E0F2FE" />
        <stop offset="100%" stopColor="#BAE6FD" />
      </linearGradient>
    </defs>
    <Shadow />
    <rect x="25" y="8" width="30" height="9" rx="4" fill={multi ? "#A78BFA" : "#F472B6"} stroke="#BE185D" strokeWidth="1" />
    {[29, 35, 41, 47].map((x) => (
      <rect key={x} x={x} y="8" width="3" height="9" fill="#FFFFFF" opacity="0.65" />
    ))}
    <rect x="23" y="16" width="34" height="6" rx="3" fill={multi ? "#8B5CF6" : "#EC4899"} />
    <path
      d="M24 22 C21 28 18 33 18 41 L18 56 C18 65 25 70 32 70 L48 70 C55 70 62 65 62 56 L62 41 C62 33 59 28 56 22 Z"
      fill={`url(#jar-glass-${multi ? "m" : "s"})`}
      fillOpacity="0.72"
      stroke="#7DD3FC"
      strokeWidth="2"
    />
    <JarCandies multi={multi} />
    <path d="M24 26 C22 33 21 44 22 55" stroke="#FFFFFF" strokeWidth="3.5" fill="none" opacity="0.55" strokeLinecap="round" />
    <rect x="21" y="30" width="38" height="16" rx="5" fill="#FFFFFF" stroke={multi ? "#8B5CF6" : "#EC4899"} strokeWidth="1.6" />
    <text x="40" y="37.5" textAnchor="middle" fontSize="6.4" fontWeight="800" fill={multi ? "#7C3AED" : "#DB2777"} fontFamily="Outfit, sans-serif" letterSpacing="0.4">
      {labelTop}
    </text>
    <text x="40" y="44" textAnchor="middle" fontSize="6.4" fontWeight="800" fill={multi ? "#7C3AED" : "#DB2777"} fontFamily="Outfit, sans-serif" letterSpacing="0.4">
      {labelBottom}
    </text>
  </svg>
);

const CandySymbol = ({ type }) => {
  switch (type) {
    case "blueberry":
      return (
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <defs>
            <radialGradient id="s-bb" cx="0.35" cy="0.28" r="0.95">
              <stop offset="0%" stopColor="#C7D2FE" />
              <stop offset="55%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#312E81" />
            </radialGradient>
          </defs>
          <Shadow />
          <circle cx="40" cy="42" r="24" fill="url(#s-bb)" />
          <path d="M40 16 L35 24 L40 21 L45 24 Z M40 16 L31 20 L37 26 Z M40 16 L49 20 L43 26 Z" fill="#312E81" />
          <circle cx="40" cy="22" r="4" fill="#312E81" />
          <ellipse cx="30" cy="32" rx="7" ry="4.5" fill="#FFFFFF" opacity="0.5" transform="rotate(-24 30 32)" />
        </svg>
      );
    case "lemon":
      return (
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <defs>
            <radialGradient id="s-le" cx="0.35" cy="0.3" r="0.95">
              <stop offset="0%" stopColor="#FEF9C3" />
              <stop offset="55%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#CA8A04" />
            </radialGradient>
          </defs>
          <Shadow />
          <circle cx="15" cy="42" r="4" fill="#EAB308" />
          <circle cx="65" cy="42" r="4" fill="#EAB308" />
          <ellipse cx="40" cy="42" rx="26" ry="20" fill="url(#s-le)" transform="rotate(-14 40 42)" />
          {[[32, 48], [44, 50], [38, 36], [50, 40], [28, 40]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.1" fill="#CA8A04" opacity="0.5" />
          ))}
          <ellipse cx="30" cy="30" rx="8" ry="4.5" fill="#FFFFFF" opacity="0.55" transform="rotate(-22 30 30)" />
        </svg>
      );
    case "kiwi":
      return (
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <defs>
            <radialGradient id="s-ki" cx="0.4" cy="0.35" r="0.9">
              <stop offset="0%" stopColor="#D9F99D" />
              <stop offset="70%" stopColor="#84CC16" />
              <stop offset="100%" stopColor="#4D7C0F" />
            </radialGradient>
          </defs>
          <Shadow />
          <circle cx="40" cy="40" r="25" fill="#65A30D" />
          <circle cx="40" cy="40" r="22.5" fill="url(#s-ki)" />
          <KiwiSeeds />
          <circle cx="40" cy="40" r="8.5" fill="#F7FEE7" />
          <ellipse cx="31" cy="28" rx="7" ry="4" fill="#FFFFFF" opacity="0.5" transform="rotate(-24 31 28)" />
        </svg>
      );
    case "watermelon":
      return (
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <defs>
            <linearGradient id="s-wm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FB7185" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>
          </defs>
          <Shadow />
          <path d="M10 52 Q40 78 70 52 L70 60 Q40 86 10 60 Z" fill="#15803D" />
          <path d="M10 52 Q40 78 70 52" stroke="#F0FDF4" strokeWidth="4" fill="none" />
          <path d="M40 14 L13 54 Q40 76 67 54 Z" fill="url(#s-wm)" />
          {[[40, 34], [31, 44], [49, 44], [40, 52], [26, 52], [54, 52]].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="1.7" ry="2.6" fill="#1F2937" />
          ))}
          <ellipse cx="34" cy="26" rx="6" ry="3.4" fill="#FFFFFF" opacity="0.45" transform="rotate(-20 34 26)" />
        </svg>
      );
    case "orange":
      return (
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <defs>
            <radialGradient id="s-or" cx="0.35" cy="0.3" r="0.95">
              <stop offset="0%" stopColor="#FED7AA" />
              <stop offset="55%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#C2410C" />
            </radialGradient>
          </defs>
          <Shadow />
          <circle cx="40" cy="43" r="24" fill="url(#s-or)" />
          <path d="M40 19 C42 11 50 8 55 11 C53 17 46 21 40 19 Z" fill="#4ADE80" stroke="#15803D" strokeWidth="1" />
          {[[33, 52], [47, 54], [52, 42], [30, 40], [42, 33]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.1" fill="#C2410C" opacity="0.45" />
          ))}
          <ellipse cx="31" cy="32" rx="7" ry="4.2" fill="#FFFFFF" opacity="0.5" transform="rotate(-24 31 32)" />
        </svg>
      );
    case "plum":
      return (
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <defs>
            <radialGradient id="s-pm" cx="0.35" cy="0.28" r="0.95">
              <stop offset="0%" stopColor="#E9D5FF" />
              <stop offset="55%" stopColor="#9333EA" />
              <stop offset="100%" stopColor="#581C87" />
            </radialGradient>
          </defs>
          <Shadow />
          <circle cx="40" cy="43" r="24" fill="url(#s-pm)" />
          <path d="M40 20 C36 32 36 52 40 66" stroke="#581C87" strokeWidth="2" fill="none" opacity="0.5" />
          <path d="M40 19 C44 11 52 10 56 14 C52 19 45 21 40 19 Z" fill="#4ADE80" stroke="#15803D" strokeWidth="1" />
          <ellipse cx="30" cy="32" rx="7" ry="4.2" fill="#FFFFFF" opacity="0.5" transform="rotate(-24 30 32)" />
        </svg>
      );
    case "jelly":
      return (
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <defs>
            <linearGradient id="s-je" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FCA5A5" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
          </defs>
          <Shadow />
          <path d="M17 62 L17 42 C17 27 27 17 40 17 C53 17 63 27 63 42 L63 62 Q40 70 17 62 Z" fill="url(#s-je)" opacity="0.92" />
          <path d="M24 52 Q40 58 56 52" stroke="#FFFFFF" strokeWidth="2.4" fill="none" opacity="0.4" />
          <path d="M26 60 Q40 65 54 60" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.3" />
          <ellipse cx="31" cy="31" rx="7" ry="4.5" fill="#FFFFFF" opacity="0.6" transform="rotate(-26 31 31)" />
          <ellipse cx="48" cy="26" rx="3.4" ry="2" fill="#FFFFFF" opacity="0.4" />
        </svg>
      );
    case "donut":
      return (
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <defs>
            <radialGradient id="s-do" cx="0.4" cy="0.35" r="0.9">
              <stop offset="0%" stopColor="#FDE0B2" />
              <stop offset="100%" stopColor="#D97706" />
            </radialGradient>
            <radialGradient id="s-fr" cx="0.4" cy="0.3" r="0.95">
              <stop offset="0%" stopColor="#FBCFE8" />
              <stop offset="100%" stopColor="#EC4899" />
            </radialGradient>
          </defs>
          <Shadow />
          <circle cx="40" cy="42" r="26" fill="url(#s-do)" />
          <circle cx="40" cy="40" r="21.5" fill="url(#s-fr)" />
          <circle cx="25" cy="50" r="5" fill="url(#s-fr)" />
          <circle cx="55" cy="49" r="5.5" fill="url(#s-fr)" />
          <circle cx="40" cy="40" r="8" fill="#8A4B1F" />
          <circle cx="40" cy="40" r="8" fill="none" stroke="#6B3410" strokeWidth="1.5" />
          <DonutSprinkles />
          <ellipse cx="30" cy="26" rx="7" ry="4" fill="#FFFFFF" opacity="0.5" transform="rotate(-24 30 26)" />
        </svg>
      );
    case "cupcake":
      return (
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <defs>
            <linearGradient id="s-cu" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F9A8D4" />
            </linearGradient>
          </defs>
          <Shadow />
          <path d="M23 46 L57 46 L53 69 L27 69 Z" fill="#F472B6" stroke="#DB2777" strokeWidth="1.2" />
          {[31, 38, 45, 52].map((x) => (
            <line key={x} x1={x} y1="47" x2={x - 1.5} y2="68" stroke="#FBCFE8" strokeWidth="2.4" />
          ))}
          <circle cx="28" cy="42" r="9.5" fill="url(#s-cu)" stroke="#F472B6" strokeWidth="1" />
          <circle cx="52" cy="42" r="9.5" fill="url(#s-cu)" stroke="#F472B6" strokeWidth="1" />
          <circle cx="40" cy="35" r="11.5" fill="url(#s-cu)" stroke="#F472B6" strokeWidth="1" />
          <circle cx="40" cy="24" r="7.5" fill="url(#s-cu)" stroke="#F472B6" strokeWidth="1" />
          <circle cx="40" cy="13.5" r="4.6" fill="#DC2626" />
          <circle cx="38.5" cy="12" r="1.4" fill="#FFFFFF" opacity="0.7" />
          <path d="M40 9 C41 6 43 5 45 5" stroke="#15803D" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "jar":
      return <Jar labelTop="GRATIS" labelBottom="SPINS" multi={false} />;
    case "multijar":
      return <Jar labelTop="MULTI" labelBottom="× ×" multi />;
    default:
      return null;
  }
};

export default CandySymbol;
