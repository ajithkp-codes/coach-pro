A labeled text input with hint and error states — the base of every CoachPro form.

Always pass a persistent visible `label` (placeholder is example text, never the label). `placeholder` shows in `ink-faint`; `hint` adds quiet helper text in `ink-muted`; `error` replaces the hint, reddens the border with `neg`, and shows an icon plus message in `neg-text`. The focus state draws the shared `focus` ring. The label is wired to the input via `htmlFor`/`id` for screen readers.

Keep labels in sentence case and short. Report errors in words and the `neg` color together, never color alone (see Accessibility), and write them with the fix ("Enter a number between 1 and 14"). For choices use a select or segmented control built on the same `border-strong` + `radius-sm` + `focus` recipe.
