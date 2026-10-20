# CoachPro Brand Design System

## Brand Identity

**CoachPro** is a client-tracking platform for personal trainers in India.
The brand communicates: professional, energetic, trustworthy, modern.

**Tagline:** Track progress. Keep clients.
**Audience:** Indian personal trainers (ages 24–40) managing 5–50+ clients.
**Tone:** Direct, empathetic, energetic — never corporate or cold.

---

## Logo — "Pulse to Peak"

The CoachPro mark is a heartbeat/pulse line that transitions into an
upward trend, enclosed in a gradient rounded square. It tells the brand
story in a single stroke: health data becoming visible, trackable progress.

The gradient flows from Electric Violet (effort / input) to Electric Mint
(results / output). The endpoint dot represents the goal — always ahead,
always reachable.

### Brand philosophy

Inspired by the idea that every client's journey looks like a heartbeat
turning into a rising trend. The coach makes that transformation visible.
CoachPro is the tool that captures it.

### Usage rules

- **Minimum size:** 24×24px.
- **Clear space:** At least 50% of the mark's width on all sides.
- **On dark backgrounds:** Use the gradient mark (default).
- **On light backgrounds:** Use the gradient mark.
- **Never** stretch, rotate, recolor, or add drop shadows to the mark.
- **Wordmark:** "CoachPro" where "Pro" renders in the brand gradient.
- **The pulse-to-peak motif** (the standalone line) can be used as a
  decorative element in backgrounds, section dividers, and illustrations.

### Components

- `<LogoMark />` — The square mark (favicon, nav, small contexts)
- `<LogoWordmark />` — Mark + "CoachPro" text
- `<LogoStandalone />` — The pulse-to-peak line only (decorative)

Source: `@/components/brand/logo`.

---

## Color System

### Brand palette

| Token              | Light           | Dark            | Role                           |
|--------------------|-----------------|-----------------|--------------------------------|
| `--primary`        | `#6D5CFF`       | `#8B7DFF`       | Primary actions, focus rings   |
| `--accent`         | `#00F5D4`       | `#00FFE0`       | Secondary accent, growth cue   |
| `--energy`         | `#FF6B6B`       | `#FF8585`       | Alerts, energy, urgency        |
| `--gold`           | `#FFB800`       | `#FFD93D`       | Achievements, highlights       |

### Landing page scope

The marketing/landing page uses `[data-landing]` attribute to force
dark-mode tokens regardless of user theme preference. This ensures
the premium dark aesthetic is always visible to new visitors.

### Brand gradients

| Name          | Value                                              | Usage                     |
|---------------|---------------------------------------------------|---------------------------|
| `brand`       | `135deg, #6D5CFF 0%, #00F5D4 100%`               | Primary gradient (CTAs, hero, logo) |
| `energy`      | `135deg, #FF6B6B 0%, #FFB800 100%`               | Energy/urgency (badges, alerts)     |
| `premium`     | `135deg, #6D5CFF 0%, #FF6B6B 100%`               | Premium features                    |
| `aurora`      | Multi-stop radial mesh                             | Hero/marketing backgrounds          |

### Surface palette

| Token              | Light           | Dark            |
|--------------------|-----------------|-----------------|
| `--background`     | `#F8FAFC`       | `#050810`       |
| `--card`           | `#FFFFFF`       | `#0A0F1C`       |
| `--elevated`       | `#FFFFFF`       | `#10162A`       |
| `--muted`          | `#F1F5F9`       | `#131B30`       |
| `--border`         | `#E2E8F0`       | `#1A2540`       |

### Status palette (reserved — never used for series/brand color)

| Token       | Color     | Usage                |
|-------------|-----------|----------------------|
| `--success` | `#10B981` | Positive/in-range    |
| `--warning` | `#F59E0B` | Needs attention      |
| `--danger`  | `#EF4444` | Critical/out-of-range|

---

## Typography

**Primary font:** Geist Sans (variable, system fallback: system-ui, sans-serif).
**Mono font:** Geist Mono (for data/code).

### Scale

| Name    | Size     | Weight    | Tracking | Usage                        |
|---------|----------|-----------|----------|------------------------------|
| `hero`  | 3.5rem+  | 800       | -0.03em  | Landing page headlines       |
| `h1`    | 2.25rem  | 700       | -0.025em | Page titles                  |
| `h2`    | 1.75rem  | 700       | -0.02em  | Section headings             |
| `h3`    | 1.25rem  | 600       | -0.01em  | Card titles                  |
| `body`  | 0.875rem | 400       | 0        | Body text                    |
| `small` | 0.75rem  | 500       | 0.01em   | Labels, captions             |
| `micro` | 0.6875rem| 500       | 0.02em   | Badges, tags                 |

---

## Spacing

Use a 4px base unit. Key stops: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128.

Section padding: `py-20` (80px) minimum, `py-28` (112px) for hero/dramatic sections.
Card padding: `p-6` (24px) standard, `p-8` (32px) for featured cards.
Max content width: `max-w-6xl` (72rem / 1152px).

---

## Radius

| Token          | Value    | Usage                      |
|----------------|----------|----------------------------|
| `--radius-sm`  | `0.5rem` | Badges, small inputs       |
| `--radius`     | `0.875rem`| Cards, buttons, modals    |
| `--radius-lg`  | `1.25rem`| Featured cards, sections   |
| `--radius-xl`  | `1.5rem` | Hero cards, marketing      |
| `--radius-full`| `9999px` | Pills, avatars             |

---

## Effects

### Glass morphism
```css
background: color-mix(in srgb, var(--card) 65%, transparent);
backdrop-filter: blur(20px) saturate(180%);
border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
```

### Card shadow
```css
box-shadow:
  0 1px 2px hsl(var(--shadow-color) / 0.04),
  0 4px 12px hsl(var(--shadow-color) / 0.03),
  0 0 0 1px hsl(var(--shadow-color) / 0.03);
```

### Glow
```css
box-shadow: 0 0 24px var(--primary-glow), 0 0 48px color-mix(in srgb, var(--primary) 10%, transparent);
```

### Aurora background (marketing pages)
Multi-stop radial gradient mesh with animated blob overlays.
Use the `.aurora-bg` utility class.

---

## Animation

All animations respect `prefers-reduced-motion: reduce`.

| Name             | Duration | Easing                           | Usage               |
|------------------|----------|----------------------------------|----------------------|
| `reveal`         | 500ms    | `cubic-bezier(0.22, 1, 0.36, 1)` | Scroll entrance     |
| `float`          | 6–8s     | `ease-in-out`                     | Ambient floating    |
| `glow-pulse`     | 2.5s     | `ease-in-out`                     | CTA emphasis        |
| `gradient-shift` | 4s       | `ease`                            | Gradient animation  |
| `marquee`        | 30–40s   | `linear`                          | Scrolling text      |
| `slide-up`       | 350ms    | `cubic-bezier(0.22, 1, 0.36, 1)` | Stagger entrance    |
| `count-up`       | 2s       | `cubic-bezier(0, 0, 0.2, 1)`     | Number animation    |

---

## Component patterns

### Marketing pages
- Use `<Logo />` for brand mark, never raw text "CP"
- Use `<Reveal />` for scroll-triggered entrance animations
- Use `<CountUp />` for animated statistics
- Use `<Marquee />` for scrolling strips
- Hero sections: dark aurora background with gradient blobs
- Cards: glass effect with subtle border, hover glow transition
- CTAs: gradient background with glow-pulse animation
- Mock components render product previews with the dark-mode aesthetic

### Dashboard pages
- Use the standard token palette (light/dark auto-switching)
- Cards: `shadow-card` class, `rounded-[var(--radius)]`
- Buttons: standard variants from `<Button />`
- Stat tiles: icon + number + sparkline pattern
- Skeletons: shimmer animation for loading states

---

## File reference

| File                                | Purpose                        |
|-------------------------------------|--------------------------------|
| `brand/README.md`                   | This document                  |
| `brand/tokens.ts`                   | Exportable JS design tokens    |
| `components/brand/logo.tsx`         | Logo React component (SVG)     |
| `components/marketing/mocks.tsx`    | Product mock-up components     |
| `components/marketing/reveal.tsx`   | Scroll-triggered reveal        |
| `components/marketing/animations.tsx`| CountUp, Marquee, etc.        |
| `components/marketing/illustrations.tsx` | Custom SVG illustrations  |
| `app/globals.css`                   | CSS design tokens + utilities  |
| `public/icon.svg`                   | Favicon/PWA icon               |
| `public/icon-maskable.svg`          | Maskable PWA icon              |
