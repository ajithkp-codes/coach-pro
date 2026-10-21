/**
 * CoachPro brand mark — "The Breakaway."
 *
 * A near-complete ring whose stroke lifts off and overshoots the loop:
 * the coach's circle of attention, and the point of coaching — helping
 * people break past their own baseline. One continuous stroke, round caps.
 * Path copied verbatim from the CoachPro design system (coachpro-mark.svg);
 * never redraw by hand.
 *
 * Rendered inline so the stroke follows `--brand` (vermilion in light,
 * the warm vermilion in dark). On photography/vermilion fills, pass
 * tone="paper"; for single-ink light contexts, tone="ink".
 */

const MARK_PATH =
  "M30.37 37.22 A13.6 13.6 0 1 1 33.28 18.90 C37.78 16.90 39.28 11.90 43.50 5.50";

type Tone = "brand" | "paper" | "ink";

const STROKE: Record<Tone, string> = {
  brand: "var(--brand)",
  paper: "#f7f4ef",
  ink: "#17150f",
};

export function LogoMark({
  size = 32,
  className,
  tone = "brand",
}: {
  size?: number;
  className?: string;
  tone?: Tone;
  /** @deprecated kept for call-site compatibility; the mark no longer uses gradient ids */
  id?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      role="img"
      aria-label="CoachPro"
    >
      <path
        d={MARK_PATH}
        fill="none"
        stroke={STROKE[tone]}
        strokeWidth="5.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LogoWordmark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-[0.55em] ${className ?? ""}`}>
      <LogoMark size={size} />
      <span
        className="font-display font-bold leading-none tracking-[-0.02em]"
        style={{ fontSize: size * 0.62 }}
      >
        CoachPro
      </span>
    </span>
  );
}

/** Stacked lockup — mark above the wordmark, for square/narrow placements. */
export function LogoStandalone({
  width = 120,
  className,
}: {
  width?: number;
  className?: string;
}) {
  const mark = Math.round(width * 0.42);
  return (
    <span className={`inline-flex flex-col items-center gap-[0.3em] ${className ?? ""}`}>
      <LogoMark size={mark} />
      <span
        className="font-display font-bold leading-none tracking-[-0.02em]"
        style={{ fontSize: width * 0.2 }}
      >
        CoachPro
      </span>
    </span>
  );
}
