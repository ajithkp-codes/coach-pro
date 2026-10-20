# Logo & mark

The CoachPro mark is **"The Breakaway"**: a near-complete ring whose stroke lifts off and overshoots the loop. The ring is the coach's circle of attention — the full picture kept on every client, a dial always in view. The breakaway is the point of it all: coaching exists to get people to **break past their own baseline**. It reads at once as a confident *C*, a dial, and an upbeat. Keep it a single continuous stroke with round caps — it is drawn, not constructed from parts.

The files live in the **Logos** asset group: `coachpro-mark.svg` (vermilion, the default), `coachpro-mark-ink.svg` and `coachpro-mark-paper.svg` (single-ink versions), and `coachpro-appicon.svg` (the ink tile). Copy these files — never redraw the mark by hand.

## Color

The mark is **`brand` vermilion** by default and works on `bg`, `surface` and dark grounds alike. On photography or a vermilion fill, use the `paper` version (`coachpro-mark-paper.svg`). For single-color contexts — embossing, a partner's monochrome footer — use `coachpro-mark-ink.svg` on light and the paper version on dark. Because an SVG placed via `<img>` can't inherit `currentColor`, each single-ink file carries its ink baked in; pick the file, don't recolor it in CSS.

## Wordmark & lockups

The wordmark sets **"CoachPro"** in `display` (Bricolage Grotesque) at 700, tracking `-0.02em`, in `ink`. It is one word, camel-cased — never "Coach Pro," "COACHPRO" or "coachpro." The default **horizontal lockup** places the mark left of the wordmark, mark height ≈ the cap height × 1.6, separated by a gap equal to half the mark's width. A **stacked lockup** (mark above wordmark) is for square and narrow placements. The mark alone is the app icon, avatar, favicon and loading state.

Keep **clear space** around any lockup equal to the height of the mark's stroke weight × 2 (roughly the ring's stroke) on all sides; nothing — type, edges, other logos — intrudes.

## Sizing

Minimum mark size is **16px** (favicon/row); minimum horizontal-lockup width is **104px**. Below that, use the mark alone. The mark's internal proportions are tuned for small sizes — do not add a keyline, container or drop shadow to make it "sit."

## Misuse

Do not rotate, skew, or flip the mark; do not close the ring or straighten the breakaway; do not change the stroke weight or swap round caps for square; do not recolor it outside the provided files; do not place the vermilion mark on a busy mid-tone photo (use the paper version on a darkened crop); do not lock the wordmark in a second typeface; do not add a tagline inside the clear space.

![CoachPro mark](data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 48'><rect width='160' height='48' fill='%23f5f3ef'/><path d='M30.37 37.22 A13.6 13.6 0 1 1 33.28 18.90 C37.78 16.90 39.28 11.90 43.50 5.50' fill='none' stroke='%23f04e28' stroke-width='5.4' stroke-linecap='round' stroke-linejoin='round'/><text x='56' y='31' font-family='Verdana,sans-serif' font-size='21' font-weight='700' fill='%231a1713' letter-spacing='-0.5'>CoachPro</text></svg>)

*(Reference only — the live wordmark is set in Bricolage Grotesque; see the Logo component preview.)*
