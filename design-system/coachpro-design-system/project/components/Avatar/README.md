Client and coach avatars — a photo when there is one, tidy initials when there isn't.

Pass `src` for a photo or `name` to auto-derive initials (override with `initials`). Initial avatars use `brand-tint` with `accent-text`, keeping them on-brand and legible. Sizes are `sm` (28px, dense rows), `md` (40px, default lists) and `lg` (56px, profile headers). The optional `status` dot (`pos`/`warn`/`neg`) mirrors the client's state and is bordered with `surface` so it reads on any ground.

Always provide a `name` for the accessible label even when showing a photo. The status dot supplements a Badge, it doesn't replace it — color alone isn't a status (see Accessibility).
