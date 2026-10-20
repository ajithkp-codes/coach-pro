CoachPro is the workspace personal trainers use to watch every client progress — adherence, workouts, check-ins and trends — in one calm, confident place. The brand is **light and editorial**: warm paper, near-black ink, generous space, and a single signal color — **vermilion** — spent deliberately. It should feel less like a loud fitness app and more like a premium instrument: quiet until something needs attention, then unmistakably clear.

Three ideas drive every decision: **clarity** (the coach sees the truth at a glance), **momentum** (the product is about progress over time), and **restraint** (color and motion mean something because they are rare).

## How to use this system

Set the product on `bg` and float content on `surface`. Keep text in the `ink` ramp. Reserve `brand` for the logo, primary actions, and the one thing on a screen that matters most — never as a general-purpose "make it pop." Let `border` and space carry structure; add `shadow` only when something truly lifts off the page. Status is communicated by the `pos` / `warn` / `neg` families **always paired with a word and an icon**, never color alone.

## Color

**Grounds.** `bg` is the warm paper canvas; `surface` is the raised ground for cards, tables and panels; `surface-muted` is for zebra rows and hover; `surface-sunken` is for wells and progress tracks. In dark mode these invert to warm near-blacks — never pure `#000`.

**Ink.** Text runs `ink` → `ink-secondary` → `ink-muted`, all meeting 4.5:1 on `surface` and `bg` in both themes. `ink-faint` is 3:1 only — use it for placeholders, disabled text and timestamps at 24px+ or bold, never for body copy. On inverted/ink fills use `ink-inverse`.

**Brand.** `brand` (#f04e28 light, #ff6a43 dark) is CoachPro's one ownable color. Use it for the mark, the primary button, selected/active states, and headline data points. On light grounds it is a *graphic* color, not a text color — for vermilion text or links use `accent-text`. Text and icons sitting **on** a `brand` fill use `on-brand` — dark ink on vermilion, the editorial signature that keeps us off the default white-on-orange look. `brand-strong` is hover/pressed and the dense-accent variant; `brand-tint` is the faint wash for selected rows and brand badges.

**Status.** `pos` is "on track," `warn` is "at risk," `neg` is "off track / missed / destructive." Each has a `-text` variant (passes 4.5:1 for labels and links) and a `-tint` variant (badge and cell backgrounds). The positive state is **teal, not green**, so it never relies on a green-vs-red distinction (see Accessibility). `info` / `info-text` is for neutral, non-brand information. Never use `brand` to signal an error, and never use `neg` as decoration.

## Typography

Three families, each with a job. **`display`** (Bricolage Grotesque) is for display and headings only — tight, confident, set at negative tracking and leading near 1. **`sans`** (Hanken Grotesk) carries all body, UI and labels, and all metric numbers with tabular figures. **`mono`** (JetBrains Mono) is the data voice: uppercase `overline` eyebrows, `data` deltas/units/timestamps, and chart tick labels — it gives dashboards a precise, instrument-panel texture.

Set page and card titles in `display-md` / `headline`; body in `body`; the big dashboard numbers in `metric-xl` / `metric`. Use `overline` sparingly as a kicker above a heading. Headlines own the space — pair a large `display` line with plenty of air rather than filling the width. Never set long-form body in `display`, and never set a metric in anything but the `Metrics` styles (tabular alignment matters when numbers stack in a column).

## Space, radius, elevation

Spacing is a 4px system (`space-1`…`space-20`); `space-6` is the default card padding and the grid gap. Compose with air — the editorial feel comes from letting panels breathe, not from dense packing.

Radii are moderate and consistent: `radius-sm` for buttons and inputs, `radius-md` for cards, `radius-lg` for modals and feature cards, `radius-pill` for chips, avatars and progress caps. Keep one radius per component family; don't mix.

Elevation is mostly **borders and paper**, not shadow. A resting card is `surface` + `border`; use `shadow-sm` for the lightest lift, `shadow-md` on hover for interactive cards, `shadow-lg` for modals, and `shadow-pop` for menus and tooltips. In dark mode, lean on `border` for separation because shadows recede.

## Shape, motion and imagery — in brief

The brand shape language is the **arc**: the open progress ring of the logo, circular `ProgressRing` gauges, and quarter-circle crops. Echo it rather than inventing new motifs. Motion is purposeful and quick (see Motion). Imagery is high-contrast, grainy black-and-white training photography with the vermilion reserved for the interface on top (see Imagery). Full logo rules live in Logo; voice in Voice & tone; the complete accessibility contract in Accessibility.
