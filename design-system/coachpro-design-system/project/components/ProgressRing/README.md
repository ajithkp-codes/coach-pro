A circular gauge that echoes the logo's ring — CoachPro's signature way to show a single 0–100 value.

Pass `value` (0–100); the arc animates from zero on mount (~600ms, ease-out) like a stroke being drawn (see Motion). Default arc color is `brand`; set `status` to `pos`/`warn`/`neg` to color it by state — pair with a nearby label since the ring color alone isn't a status. `num` overrides the center text (defaults to `${value}%`) and `sublabel` adds a mono caption beneath. `size` and `stroke` scale it; the track is `surface-sunken` so it reads on any surface.

Use it for adherence, program completion and goal progress — one ring per idea. For many values at once use StatTile or a bar chart instead; a wall of rings competes with itself. Under `prefers-reduced-motion`, render at final value with no draw animation.
