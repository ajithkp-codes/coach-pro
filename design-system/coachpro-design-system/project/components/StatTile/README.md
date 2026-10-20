A single KPI: mono label, a big tabular number, and an optional trend delta. The building block of CoachPro dashboards.

`label` sets in the uppercase `overline` voice; `value` uses the `Metrics` tabular style so numbers align when tiled in a grid; `unit` trails the value in muted ink. `delta` shows change with an arrow colored by `trend`: `up` is `pos-text`, `down` is `neg-text`, `flat` is muted — note that "down" being red is about direction, so for metrics where down is good (e.g. at-risk count) pass the `trend` you actually mean. `caption` adds a quiet timeframe in `ink-faint`.

Wrap tiles in a Card or a bordered box and lay them on a grid with `space-4`/`space-6` gaps. Keep the label to two or three words and always attach a unit or timeframe to the number (see Voice & tone). Don't stack more than four across — give each metric room.
