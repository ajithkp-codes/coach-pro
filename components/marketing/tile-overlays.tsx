/**
 * Discipline-tile vector overlays, companions to RouteOverlay. Each sits on top
 * of a MediaPhoto inside a relative tile and self-draws once on mount with a
 * pure-CSS animation, in the CoachPro vermilion accent, then holds. A small mono
 * chip sells the "logged data" read — matching the Endurance route treatment.
 *
 *  • LoadLineOverlay      — Strength: a rising load-progression sparkline.
 *  • MobilityRadialOverlay — Movement: a mobility radar across the joints.
 */

const ACCENT = "#ef4a33";
const GLOW = "rgba(239,74,51,.45)";

/* ───────────────────────── Strength — load progression ───────────────────── */

// weight-lifted-per-session, climbing left → right into the dark upper half.
const LOAD_PTS: [number, number][] = [
  [36, 232],
  [85, 214],
  [134, 190],
  [183, 158],
  [232, 126],
  [284, 92],
];
const LOAD_LINE = "M " + LOAD_PTS.map(([x, y]) => `${x} ${y}`).join(" L ");
const LOAD_AREA = `${LOAD_LINE} L 284 250 L 36 250 Z`;

export function LoadLineOverlay({ label = "140 KG · +12%" }: { label?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      <style>{`
        @keyframes cp-load-draw { to { stroke-dashoffset: 0; } }
        @keyframes cp-load-fade { to { opacity: 1; } }
        .cp-load-line {
          stroke-dasharray: 100; stroke-dashoffset: 100;
          animation: cp-load-draw 1.9s cubic-bezier(.4,0,.2,1) .3s forwards;
        }
        .cp-load-fill { opacity: 0; animation: cp-load-fade 1s ease 1.5s forwards; }
        .cp-load-dot  { opacity: 0; animation: cp-load-fade .5s ease forwards; }
        @media (prefers-reduced-motion: reduce) {
          .cp-load-line { animation: none; stroke-dashoffset: 0; }
          .cp-load-fill, .cp-load-dot { animation: none; opacity: 1; }
        }
      `}</style>

      <svg
        viewBox="0 0 320 400"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cp-load-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity="0.26" />
            <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* area under the curve */}
        <path className="cp-load-fill" d={LOAD_AREA} fill="url(#cp-load-grad)" stroke="none" />

        {/* soft outer glow */}
        <path
          d={LOAD_LINE}
          fill="none"
          stroke={GLOW}
          strokeWidth={9}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "blur(5px)" }}
        />
        {/* crisp progression line */}
        <path
          className="cp-load-line"
          d={LOAD_LINE}
          fill="none"
          stroke={ACCENT}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={100}
          style={{ filter: "drop-shadow(0 0 4px rgba(239,74,51,.55))" }}
        />
        {/* session nodes — pop in as the line passes */}
        {LOAD_PTS.map(([x, y], i) => {
          const last = i === LOAD_PTS.length - 1;
          return (
            <circle
              key={i}
              className="cp-load-dot"
              cx={x}
              cy={y}
              r={last ? 5 : 3}
              fill={last ? ACCENT : "#0a0a0a"}
              stroke={last ? "#f6f3ee" : ACCENT}
              strokeWidth={last ? 2 : 2}
              style={{ animationDelay: `${0.5 + i * 0.24}s` }}
            />
          );
        })}
      </svg>

      {/* load chip */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 backdrop-blur-sm ring-1 ring-white/10">
        <span className="h-1.5 w-1.5 rounded-full bg-[#ef4a33]" />
        <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#f1ede6]">
          {label}
        </span>
      </div>
    </div>
  );
}

/* ───────────────────────── Movement — mobility radar ──────────────────────── */

const R_CX = 226;
const R_CY = 198;
const R_RAD = 66;
const AXES = [-90, -30, 30, 90, 150, 210];
const JOINTS = ["SPINE", "SHLDR", "WRIST", "ANKLE", "KNEE", "HIP"];
const SCORES = [0.72, 0.9, 0.6, 0.78, 0.66, 0.84];

function hex(cx: number, cy: number, r: number, fr?: number[]) {
  return AXES.map((d, i) => {
    const a = (d * Math.PI) / 180;
    const rr = r * (fr ? fr[i] : 1);
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr] as [number, number];
  });
}
const pts = (p: [number, number][]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

const RING_OUTER = hex(R_CX, R_CY, R_RAD);
const RING_MID = hex(R_CX, R_CY, R_RAD * 0.66);
const RING_IN = hex(R_CX, R_CY, R_RAD * 0.33);
const DATA = hex(R_CX, R_CY, R_RAD, SCORES);
const LABELS = hex(R_CX, R_CY, R_RAD + 13);

const ANCHOR = ["middle", "start", "start", "middle", "end", "end"] as const;

export function MobilityRadialOverlay({ label = "MOBILITY" }: { label?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      <style>{`
        @keyframes cp-radial-in { to { opacity: 1; transform: scale(1); } }
        .cp-radial {
          opacity: 0; transform: scale(.55);
          transform-box: fill-box; transform-origin: center;
          animation: cp-radial-in 1.2s cubic-bezier(.34,1.25,.5,1) .3s forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .cp-radial { animation: none; opacity: 1; transform: none; }
        }
      `}</style>

      <svg
        viewBox="0 0 320 400"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <g className="cp-radial">
          {/* grid rings */}
          {[RING_OUTER, RING_MID, RING_IN].map((ring, i) => (
            <polygon
              key={i}
              points={pts(ring)}
              fill="none"
              stroke="rgba(246,243,238,.16)"
              strokeWidth={1}
            />
          ))}
          {/* axes */}
          {RING_OUTER.map(([x, y], i) => (
            <line
              key={i}
              x1={R_CX}
              y1={R_CY}
              x2={x}
              y2={y}
              stroke="rgba(246,243,238,.12)"
              strokeWidth={1}
            />
          ))}

          {/* mobility shape — glow then crisp */}
          <polygon
            points={pts(DATA)}
            fill="none"
            stroke={GLOW}
            strokeWidth={8}
            strokeLinejoin="round"
            style={{ filter: "blur(5px)" }}
          />
          <polygon
            points={pts(DATA)}
            fill="rgba(239,74,51,.16)"
            stroke={ACCENT}
            strokeWidth={2.4}
            strokeLinejoin="round"
            style={{ filter: "drop-shadow(0 0 4px rgba(239,74,51,.5))" }}
          />
          {/* vertex nodes */}
          {DATA.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={2.6} fill={ACCENT} stroke="#f6f3ee" strokeWidth={1} />
          ))}

          {/* joint labels */}
          {LABELS.map(([x, y], i) => (
            <text
              key={i}
              x={x}
              y={y + 2}
              textAnchor={ANCHOR[i]}
              fill="rgba(241,237,230,.62)"
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "6.5px",
                letterSpacing: "0.12em",
                fontWeight: 600,
              }}
            >
              {JOINTS[i]}
            </text>
          ))}
        </g>
      </svg>

      {/* mobility chip */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 backdrop-blur-sm ring-1 ring-white/10">
        <span className="h-1.5 w-1.5 rounded-full bg-[#ef4a33]" />
        <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#f1ede6]">
          {label}
        </span>
      </div>
    </div>
  );
}
