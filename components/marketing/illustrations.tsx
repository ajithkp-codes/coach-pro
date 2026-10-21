/**
 * Rich SVG illustrations for the landing page.
 * Human figures in motion, gym environments, depth layers —
 * detailed vector art with gradients, blur, and motion effects.
 */

/* ------------------------------------------------------------------ */
/*  Hero illustration: runner in motion with speed lines               */
/* ------------------------------------------------------------------ */

export function HeroRunner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 500" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="hr-brand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff6a43" />
          <stop offset="100%" stopColor="#ff8a66" />
        </linearGradient>
        <linearGradient id="hr-warm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff6a43" />
          <stop offset="100%" stopColor="#ff8a66" />
        </linearGradient>
        <filter id="hr-motionBlur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8,0" />
        </filter>
        <filter id="hr-glow">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="hr-softBlur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
      </defs>

      {/* Atmospheric background glow */}
      <ellipse cx="300" cy="350" rx="280" ry="120" fill="url(#hr-brand)" opacity="0.06" filter="url(#hr-softBlur)" />

      {/* Ground plane */}
      <ellipse cx="300" cy="420" rx="260" ry="18" fill="white" opacity="0.03" />
      <line x1="40" y1="420" x2="560" y2="420" stroke="white" strokeOpacity="0.06" strokeWidth="1" />

      {/* Speed/motion lines behind runner */}
      <g opacity="0.15">
        <line x1="60" y1="200" x2="200" y2="200" stroke="url(#hr-brand)" strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="250" x2="220" y2="250" stroke="#ff6a43" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="80" y1="300" x2="190" y2="300" stroke="#ff8a66" strokeWidth="1" strokeLinecap="round" />
        <line x1="50" y1="340" x2="210" y2="340" stroke="#ff6a43" strokeWidth="2" strokeLinecap="round" />
        <line x1="90" y1="170" x2="180" y2="170" stroke="#ff8a66" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Motion-blurred trailing ghost */}
      <g opacity="0.12" filter="url(#hr-motionBlur)" transform="translate(240, 160)">
        <circle cx="0" cy="0" r="18" fill="#ff6a43" />
        <path d="M0 18 L-12 80 L12 80 Z" fill="#ff6a43" />
        <path d="M-5 30 L-45 10" stroke="#ff6a43" strokeWidth="8" strokeLinecap="round" fill="none" />
        <path d="M5 30 L40 65" stroke="#ff6a43" strokeWidth="8" strokeLinecap="round" fill="none" />
        <path d="M-5 78 L-50 130 L-65 180" stroke="#ff6a43" strokeWidth="10" strokeLinecap="round" fill="none" />
        <path d="M5 78 L45 140 L80 120" stroke="#ff6a43" strokeWidth="10" strokeLinecap="round" fill="none" />
      </g>

      {/* Main runner figure */}
      <g filter="url(#hr-glow)" transform="translate(300, 160)">
        {/* Head */}
        <circle cx="0" cy="0" r="18" fill="url(#hr-brand)" />
        {/* Torso - leaning forward */}
        <path d="M0 18 L-12 80 L12 80 Z" fill="url(#hr-brand)" />
        {/* Leading arm (forward) */}
        <path d="M-5 30 L-45 10 L-50 15" stroke="url(#hr-brand)" strokeWidth="8" strokeLinecap="round" fill="none" />
        {/* Trailing arm (back) */}
        <path d="M5 30 L40 65 L45 60" stroke="url(#hr-brand)" strokeWidth="8" strokeLinecap="round" fill="none" />
        {/* Leading leg (extended forward) */}
        <path d="M-5 78 L-50 130 L-65 180" stroke="url(#hr-brand)" strokeWidth="10" strokeLinecap="round" fill="none" />
        <path d="M-65 180 L-40 185" stroke="url(#hr-brand)" strokeWidth="7" strokeLinecap="round" fill="none" />
        {/* Trailing leg (kicked back) */}
        <path d="M5 78 L45 140 L80 120" stroke="url(#hr-brand)" strokeWidth="10" strokeLinecap="round" fill="none" />
        <path d="M80 120 L95 125" stroke="url(#hr-brand)" strokeWidth="7" strokeLinecap="round" fill="none" />
      </g>

      {/* Energy particles */}
      <g opacity="0.6">
        <circle cx="220" cy="190" r="2" fill="#ff8a66" />
        <circle cx="200" cy="260" r="1.5" fill="#ff6a43" />
        <circle cx="240" cy="310" r="2.5" fill="#ff8a66" />
        <circle cx="180" cy="350" r="1" fill="#ff6a43" />
        <circle cx="420" cy="180" r="1.5" fill="#ff8a66" />
        <circle cx="440" cy="280" r="2" fill="#ff6a43" />
        <circle cx="460" cy="220" r="1" fill="#ff8a66" />
      </g>

      {/* Pulse-to-peak line (subtle) */}
      <path
        d="M50 380 L150 380 L170 360 L190 400 L210 340 L240 380 L280 320 L340 280 L400 240 L460 200 L520 160 L560 140"
        stroke="url(#hr-brand)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.15"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Lifting figure: person doing dumbbell curl                         */
/* ------------------------------------------------------------------ */

export function LiftingFigure({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 400" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="lf-brand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff6a43" />
          <stop offset="100%" stopColor="#ff8a66" />
        </linearGradient>
        <linearGradient id="lf-warm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff6a43" />
          <stop offset="100%" stopColor="#ff8a66" />
        </linearGradient>
        <filter id="lf-softBlur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
      </defs>

      <ellipse cx="150" cy="200" rx="120" ry="180" fill="#ff6a43" opacity="0.04" filter="url(#lf-softBlur)" />

      {/* Figure - standing curl */}
      <g transform="translate(150, 60)">
        <circle cx="0" cy="0" r="22" fill="url(#lf-brand)" />
        <rect x="-6" y="20" width="12" height="12" rx="4" fill="url(#lf-brand)" />
        <path d="M-28 32 L-22 120 L22 120 L28 32 Z" fill="url(#lf-brand)" />
        {/* Left arm curling up */}
        <path d="M-28 40 L-42 75 L-35 35" stroke="url(#lf-brand)" strokeWidth="10" strokeLinecap="round" fill="none" />
        {/* Dumbbell */}
        <rect x="-48" y="20" width="26" height="8" rx="4" fill="url(#lf-warm)" />
        <rect x="-52" y="16" width="8" height="16" rx="2" fill="url(#lf-warm)" />
        <rect x="-22" y="16" width="8" height="16" rx="2" fill="url(#lf-warm)" />
        {/* Right arm at side */}
        <path d="M28 40 L38 90 L35 120" stroke="url(#lf-brand)" strokeWidth="10" strokeLinecap="round" fill="none" />
        {/* Legs */}
        <path d="M-10 120 L-18 200 L-22 270" stroke="url(#lf-brand)" strokeWidth="12" strokeLinecap="round" fill="none" />
        <path d="M10 120 L15 200 L18 270" stroke="url(#lf-brand)" strokeWidth="12" strokeLinecap="round" fill="none" />
        <path d="M-22 270 L-38 275" stroke="url(#lf-brand)" strokeWidth="8" strokeLinecap="round" fill="none" />
        <path d="M18 270 L34 275" stroke="url(#lf-brand)" strokeWidth="8" strokeLinecap="round" fill="none" />
      </g>

      {/* Energy arcs */}
      <path d="M90 60 Q75 45 95 35" stroke="#ff8a66" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M85 50 Q70 40 88 28" stroke="#ff6a43" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.3" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Stretching figure: warrior pose                                    */
/* ------------------------------------------------------------------ */

export function StretchingFigure({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 400" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="sf-mint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff8a66" />
          <stop offset="100%" stopColor="#ff8a66" stopOpacity="0.3" />
        </linearGradient>
        <filter id="sf-softBlur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
      </defs>

      <ellipse cx="150" cy="200" rx="120" ry="180" fill="#ff8a66" opacity="0.03" filter="url(#sf-softBlur)" />

      <g transform="translate(150, 50)">
        <circle cx="0" cy="0" r="20" fill="url(#sf-mint)" />
        <path d="M-22 22 L-18 110 L18 110 L22 22 Z" fill="url(#sf-mint)" />
        <path d="M-22 35 L-80 30 L-100 28" stroke="url(#sf-mint)" strokeWidth="9" strokeLinecap="round" fill="none" />
        <path d="M22 35 L80 30 L100 28" stroke="url(#sf-mint)" strokeWidth="9" strokeLinecap="round" fill="none" />
        <path d="M-10 110 L-50 180 L-52 260" stroke="url(#sf-mint)" strokeWidth="11" strokeLinecap="round" fill="none" />
        <path d="M-52 260 L-70 265" stroke="url(#sf-mint)" strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d="M10 110 L60 160 L110 200" stroke="url(#sf-mint)" strokeWidth="11" strokeLinecap="round" fill="none" />
        <path d="M110 200 L125 198" stroke="url(#sf-mint)" strokeWidth="7" strokeLinecap="round" fill="none" />
      </g>

      <path d="M40 100 Q100 80 160 90 Q220 100 260 80" stroke="#ff8a66" strokeWidth="1" fill="none" opacity="0.15" />
      <path d="M30 130 Q100 110 170 120 Q240 130 270 110" stroke="#ff6a43" strokeWidth="1" fill="none" opacity="0.1" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Gym environment: equipment silhouettes                             */
/* ------------------------------------------------------------------ */

export function GymScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 400" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="gs-brand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff6a43" />
          <stop offset="100%" stopColor="#ff8a66" />
        </linearGradient>
        <linearGradient id="gs-warm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff6a43" />
          <stop offset="100%" stopColor="#ff8a66" />
        </linearGradient>
        <radialGradient id="gs-spotlight" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="white" stopOpacity="0.12" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Spotlight */}
      <rect x="0" y="0" width="800" height="400" fill="url(#gs-spotlight)" />

      {/* Floor */}
      <rect x="0" y="340" width="800" height="60" fill="white" opacity="0.02" />
      <line x1="0" y1="340" x2="800" y2="340" stroke="white" strokeOpacity="0.06" />

      {/* Barbell rack */}
      <g opacity="0.15">
        <rect x="60" y="120" width="8" height="220" rx="2" fill="white" />
        <rect x="120" y="120" width="8" height="220" rx="2" fill="white" />
        <rect x="50" y="200" width="88" height="6" rx="3" fill="white" />
        <rect x="42" y="185" width="14" height="36" rx="3" fill="url(#gs-brand)" opacity="0.7" />
        <rect x="132" y="185" width="14" height="36" rx="3" fill="url(#gs-brand)" opacity="0.7" />
      </g>

      {/* Treadmill */}
      <g opacity="0.12" transform="translate(250, 180)">
        <rect x="0" y="80" width="100" height="80" rx="4" fill="white" />
        <rect x="10" y="0" width="6" height="80" rx="2" fill="white" />
        <rect x="84" y="0" width="6" height="80" rx="2" fill="white" />
        <rect x="10" y="0" width="80" height="20" rx="4" fill="white" opacity="0.8" />
        <rect x="30" y="3" width="40" height="14" rx="2" fill="#ff8a66" opacity="0.3" />
      </g>

      {/* Kettlebell */}
      <g opacity="0.2" transform="translate(430, 280)">
        <circle cx="20" cy="30" r="22" fill="white" />
        <path d="M8 12 Q20 -5 32 12" stroke="white" strokeWidth="6" strokeLinecap="round" fill="none" />
      </g>

      {/* Cable machine */}
      <g opacity="0.12" transform="translate(560, 100)">
        <rect x="0" y="0" width="12" height="240" rx="3" fill="white" />
        <rect x="80" y="0" width="12" height="240" rx="3" fill="white" />
        <rect x="0" y="0" width="92" height="20" rx="4" fill="white" />
        <path d="M46 20 L46 120 L20 160" stroke="#ff6a43" strokeWidth="2" opacity="0.5" fill="none" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x="30" y={180 + i * 10} width="32" height="8" rx="1" fill="white" opacity={0.3 + i * 0.08} />
        ))}
      </g>

      {/* Dumbbells */}
      <g opacity="0.18" transform="translate(700, 310)">
        <rect x="0" y="0" width="40" height="8" rx="4" fill="white" />
        <rect x="-6" y="-4" width="12" height="16" rx="2" fill="url(#gs-warm)" opacity="0.6" />
        <rect x="34" y="-4" width="12" height="16" rx="2" fill="url(#gs-warm)" opacity="0.6" />
      </g>

      {/* Person silhouette working out */}
      <g opacity="0.08" transform="translate(380, 100)">
        <circle cx="0" cy="0" r="14" fill="white" />
        <path d="M0 14 L0 65" stroke="white" strokeWidth="8" strokeLinecap="round" />
        <path d="M0 25 L-30 50" stroke="white" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M0 25 L30 50" stroke="white" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M0 65 L-20 120" stroke="white" strokeWidth="7" strokeLinecap="round" />
        <path d="M0 65 L20 120" stroke="white" strokeWidth="7" strokeLinecap="round" />
      </g>

      {/* Particles */}
      <circle cx="200" cy="80" r="1" fill="#ff8a66" opacity="0.4" />
      <circle cx="500" cy="60" r="1.5" fill="#ff6a43" opacity="0.3" />
      <circle cx="650" cy="90" r="1" fill="#ff8a66" opacity="0.4" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Grid pattern                                                       */
/* ------------------------------------------------------------------ */

export function GridPattern({ className }: { className?: string }) {
  return (
    <svg className={className} aria-hidden="true">
      <defs>
        <pattern id="grid-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.8" fill="currentColor" opacity="0.15" />
        </pattern>
        <radialGradient id="grid-fade" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="grid-mask"><rect width="100%" height="100%" fill="url(#grid-fade)" /></mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-dots)" mask="url(#grid-mask)" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Floating orbs                                                      */
/* ------------------------------------------------------------------ */

export function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div
        className="animate-blob absolute -left-32 -top-20 h-[500px] w-[500px] rounded-full opacity-60 blur-[100px]"
        style={{ background: "radial-gradient(circle, rgba(255,106,67,0.35), transparent 70%)" }}
      />
      <div
        className="animate-blob absolute -right-24 top-1/4 h-[400px] w-[400px] rounded-full opacity-40 blur-[100px]"
        style={{ background: "radial-gradient(circle, rgba(255,138,102,0.25), transparent 70%)", animationDelay: "-7s" }}
      />
      <div
        className="animate-blob absolute -bottom-20 left-1/3 h-[350px] w-[350px] rounded-full opacity-30 blur-[100px]"
        style={{ background: "radial-gradient(circle, rgba(255,106,67,0.2), transparent 70%)", animationDelay: "-4s" }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pulse line (decorative)                                            */
/* ------------------------------------------------------------------ */

export function HeroPulseLine({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 120" fill="none" className={className} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="pulse-line-grad" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff6a43" stopOpacity="0" />
          <stop offset="20%" stopColor="#ff6a43" />
          <stop offset="80%" stopColor="#ff8a66" />
          <stop offset="100%" stopColor="#ff8a66" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="pulse-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff6a43" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ff6a43" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 80 L200 80 L250 60 L300 100 L350 30 L420 80 L500 55 L600 40 L720 30 L850 22 L1000 16 L1200 10 L1200 120 L0 120 Z"
        fill="url(#pulse-area-grad)"
      />
      <path
        d="M0 80 L200 80 L250 60 L300 100 L350 30 L420 80 L500 55 L600 40 L720 30 L850 22 L1000 16 L1200 10"
        stroke="url(#pulse-line-grad)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        className="animate-draw"
      />
    </svg>
  );
}
