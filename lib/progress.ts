/**
 * Pure goal-progress math (no I/O) so it can be unit-tested directly.
 *
 * - With a start value: progress is how far `current` has moved from `start`
 *   toward `target`, as a 0–100% clamped figure (direction-agnostic).
 * - Without a start value: 100% once the target is met in the right direction
 *   (lowerIsBetter → current <= target; else current >= target), otherwise null.
 */
export function progressPct(
  start: number | null,
  target: number | null,
  current: number | null,
  lowerIsBetter: boolean,
): number | null {
  if (target === null || current === null) return null;

  if (start !== null && start !== target) {
    const span = target - start;
    const done = current - start;
    return clamp(Math.round((done / span) * 100));
  }

  const met = lowerIsBetter ? current <= target : current >= target;
  return met ? 100 : null;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}
