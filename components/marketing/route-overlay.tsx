/**
 * Strava-style GPS route trace, drawn as crisp vector in the CoachPro accent
 * (vermilion — which also happens to be almost exactly Strava's brand red, so
 * it reads as a real activity route while staying on-brand). Sits on top of a
 * MediaPhoto inside a relative tile. The line self-draws once on mount via a
 * pure-CSS stroke-dashoffset animation (no JS), then holds. A small mono chip
 * sells the "logged run" read.
 */

const ROUTE_D =
  "M 206 372 C 201 362.7 174.7 332 176 316 C 177.3 300 198.7 283.7 214 276 " +
  "C 229.3 268.3 256 280.3 268 270 C 280 259.7 289 230.7 286 214 " +
  "C 283 197.3 251.7 185.7 250 170 C 248.3 154.3 278 134 276 120 " +
  "C 274 106 252.3 88.7 238 86 C 223.7 83.3 195.3 92.3 190 104 " +
  "C 184.7 115.7 209.7 141.3 206 156 C 202.3 170.7 169.3 177.7 168 192 " +
  "C 166.7 206.3 197.3 224 198 242 C 198.7 260 172 281.7 172 300 " +
  "C 172 318.3 193.7 343.3 198 352";

export function RouteOverlay({ label = "12.4 KM" }: { label?: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      <style>{`
        @keyframes cp-route-draw { to { stroke-dashoffset: 0; } }
        .cp-route-line {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: cp-route-draw 2.2s cubic-bezier(.4,0,.2,1) .25s forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .cp-route-line { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>

      <svg
        viewBox="0 0 320 400"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {/* soft outer glow */}
        <path
          d={ROUTE_D}
          fill="none"
          stroke="rgba(239,74,51,.45)"
          strokeWidth={9}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "blur(5px)" }}
        />
        {/* crisp route */}
        <path
          className="cp-route-line"
          d={ROUTE_D}
          fill="none"
          stroke="#ef4a33"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={100}
          style={{ filter: "drop-shadow(0 0 4px rgba(239,74,51,.55))" }}
        />
        {/* start node — hollow ring */}
        <circle cx={206} cy={372} r={5} fill="#0a0a0a" stroke="#f6f3ee" strokeWidth={2.5} />
        {/* finish node — filled accent with ring */}
        <circle cx={198} cy={352} r={5.5} fill="#ef4a33" stroke="#f6f3ee" strokeWidth={2} />
      </svg>

      {/* distance chip */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 backdrop-blur-sm ring-1 ring-white/10">
        <span className="h-1.5 w-1.5 rounded-full bg-[#ef4a33]" />
        <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#f1ede6]">
          {label}
        </span>
      </div>
    </div>
  );
}
