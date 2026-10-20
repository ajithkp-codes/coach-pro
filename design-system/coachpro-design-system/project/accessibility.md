# Accessibility

Accessibility is part of the brand's promise of clarity. The contract below is the floor, not the aspiration.

## Contrast

All text in the `ink` ramp — `ink`, `ink-secondary`, `ink-muted` — meets **4.5:1** on `surface` and `bg` in both light and dark themes. `ink-faint` is **3:1 only**: use it for placeholders, disabled text and timestamps at 24px+ or bold weight, never for body copy. The `-text` status tokens (`pos-text`, `warn-text`, `neg-text`, `info-text`, `accent-text`) are tuned to pass 4.5:1 on `surface` and on their matching `-tint`.

`brand` on light grounds is **3.6:1** against white — a graphic/large-text color, not a body-text color. For vermilion text use `accent-text`. On a `brand` fill, use `on-brand` (dark ink), which clears 4.5:1; white on vermilion only passes at 24px+/bold, so avoid it for standard labels. `border-strong` and `focus` meet 3:1 wherever they carry meaning.

## Color-vision safety

Status is **never carried by color alone** — every `pos`/`warn`/`neg` use is paired with a word and an icon (✓ on track, △ at risk, ✕ off track). The positive state is **teal** (`pos`), deliberately off the red–green axis, so on-track vs off-track never depends on telling green from red. `neg` red is reserved for negative and destructive states; `brand` vermilion never signals error, keeping the one red-adjacent hue that *does* mean "bad" unambiguous.

## Focus

Every interactive element shows a visible `focus` ring: 2px solid, 2px offset, ≥3:1 on every surface it lands on in both themes. Focus is never removed without an equivalent replacement. Keyboard order follows reading order; modals and sheets trap focus and restore it on close.

## Targets & input

Touch targets are at least **44×44px** (`space-11`-equivalent paired padding); controls that look smaller keep an invisible hit area. Don't rely on hover alone — anything available on hover is also reachable by focus/tap. All form controls have a persistent visible `label` (not placeholder-as-label); errors use `neg-text` plus text, not red borders alone.

## Motion & media

Honor `prefers-reduced-motion` (see Motion): final-state rendering, opacity-only fades, no parallax or autoplay. Images carry alt text; charts carry a text summary or accessible table; icon-only buttons carry an accessible name.

## Adding an accessibility theme

If a **high-contrast** theme is requested, add it as a *new* theme beside `light`/`dark` (every text color ≥7:1, AAA; surfaces and controls separated by 3:1 borders) — do not re-tint the brand in place. The existing status palette is already color-vision-safe via teal + icons + labels, so no separate color-blind theme is required.
