Compact status and label chips — the product's shared vocabulary for how a client or plan is doing.

The three states map to the status palette: `on-track` (`pos` teal), `at-risk` (`warn` amber), `off-track` (`neg` red). Pass `icon` so each carries its glyph (✓ / △ / ✕) in addition to color — status is never color-only (see Accessibility). The positive state is teal on purpose so on-track vs off-track never relies on green-vs-red. Non-status chips use `brand` (plan/tier), `neutral` (draft, archived) and `info` (new), and take custom `children` text.

Keep labels to one or two words in sentence case. Use a badge to report state, not to act — if it's clickable, it's a Button or a filter chip. Don't invent new status colors; the three states are the whole system.
