# CoachPro Design System — package

This is the full source of the CoachPro design system, the same content published to the
live artifact. Everything lives under `project/`.

## What's inside

```
project/
  design-system.json      Index / manifest (title, libraries, asset records)
  tokens.json             Source of truth for all design tokens
  tokens.css              ⭐ Compiled CSS — drop this in and use the variables
  README.md               Brand book (foundations + how to use the system)
  logo.md                 Logo & mark rules
  voice.md                Voice & tone
  motion.md               Motion (durations, easings, signature behaviors)
  photography.md          Imagery & graphics direction
  accessibility.md        Full accessibility contract
  assets/Logos/           Logo SVGs (mark, ink, paper, app icon) + notes
  components/
    tokens…               bundle.css, bundle.js (window.CoachPro), index.d.ts
    <Component>/           README.md (guidelines) + preview.html (live demo)
    Cover/preview.html     The system cover
```

## Fast start (web)

1. Add the fonts (Google Fonts):
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Hanken+Grotesk:wght@400..700&family=JetBrains+Mono:wght@400..600&display=swap">
   ```
2. Include the tokens:
   ```html
   <link rel="stylesheet" href="project/tokens.css">
   ```
3. Use the variables and type classes:
   ```html
   <button style="background:var(--brand);color:var(--on-brand);
     border:none;border-radius:var(--radius-sm);padding:10px 16px;
     font-family:var(--font-sans);font-weight:600">Add client</button>
   <h1 class="display-md">This week's focus</h1>
   ```
4. Dark mode: set `<html data-theme="dark">`. Every token flips automatically.

## Components

`components/bundle.js` defines `window.CoachPro` (React 18 classic script; expects
`window.React` and `window.ReactDOM`). Load `project/tokens.css` then
`components/bundle.css`, then the bundle. Each component's `preview.html` is a working
example; its `README.md` lists props and usage. `components/index.d.ts` documents the
TypeScript props.

Tokens are the contract — build the product UI on the CSS variables, not hard-coded values,
so a token change propagates everywhere.
