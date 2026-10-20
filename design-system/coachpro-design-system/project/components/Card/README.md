The surface everything sits on — an optional header with a title and action slot, over a padded body.

Pass `title` and an `action` node (a Button, Badge or menu) to get the bordered header; omit both for a plain container. `muted` swaps to the `surface-muted` ground with no shadow for secondary panels and empty states; `interactive` makes the whole card a hover-lifting, clickable target (give it an `onClick` and a focusable role). The resting card is `surface` + `border` + `shadow-sm`; elevation comes from the border and paper, not heavy shadow.

Compose cards from the other components — StatTile, ProgressRing, ClientRow — rather than styling content ad hoc. Use `radius-md`, pad with `space-6`, and keep one idea per card. Reach for `shadow-md`/`shadow-lg` only for genuinely floating surfaces (hovered interactive cards, modals).
