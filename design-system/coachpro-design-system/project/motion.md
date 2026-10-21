# Motion

Motion in CoachPro is **quick, purposeful and physical** — it shows where things come from and confirms what happened, then disappears. Because the brand is restrained, movement is a tool for clarity, not delight for its own sake. If an animation doesn't help someone understand a change, cut it.

## Timing

Use a small, consistent set of durations. Micro feedback (button press, toggle, hover) is **120ms**; standard transitions (menus, tabs, cards expanding, toasts) are **200ms**; larger surfaces (modals, sheets, route changes) are **320ms**. Nothing in the product UI runs longer than 400ms. Marketing hero moments may run to ~700ms but still resolve, never loop distractingly.

## Easing

Default easing is a confident ease-out: `cubic-bezier(0.2, 0.8, 0.2, 1)` — fast to start, gentle to settle, matching the breakaway's launch-and-settle. Use ease-out for things entering and for most UI. Use `cubic-bezier(0.4, 0, 1, 1)` (ease-in) only for things leaving the screen. Avoid linear except for continuous progress, and avoid springy overshoot on data — numbers and charts settle, they don't bounce.

## Signature behaviors

**Count-up.** Dashboard metrics (`metric-xl` / `metric`) count up to their value on first load over ~500ms, ease-out — the sense of progress accumulating. They do not re-animate on every re-render.

**Ring draw.** `ProgressRing` and the logo-echoing arcs animate their stroke from 0 to the value over ~600ms ease-out, as if being drawn. This is the one place a slightly longer motion is welcome.

**Reveal on scroll (site).** Sections rise 16px and fade in over 320ms as they enter; stagger grouped items by ~60ms. One reveal per element — never replay on scroll-back.

**Attention, not alarm.** A newly at-risk client row tints to `warn-tint` over 200ms once; it does not pulse or flash.

## Reduced motion

Honor `prefers-reduced-motion: reduce`: replace movement and count-ups with instant state changes and simple opacity fades (≤120ms), and render rings and metrics at their final value immediately. No parallax, no auto-playing hero motion, no scroll-jacking under reduced motion.
