import type { ReportPoint } from "@/lib/data/report-public";

/** Print-friendly static area chart (pure SVG, no client JS). */
export function ReportChart({
  data,
  color = "#f04e28",
  unit,
  id,
}: {
  data: ReportPoint[];
  color?: string;
  unit?: string;
  id: string;
}) {
  if (data.length < 2) {
    return (
      <div className="flex h-44 items-center justify-center rounded-xl bg-muted/40 text-sm text-muted-foreground">
        Not enough data to chart yet.
      </div>
    );
  }

  const W = 640;
  const H = 220;
  const padL = 44;
  const padR = 12;
  const padT = 14;
  const padB = 26;

  const min = Math.min(...data.map((d) => d.value));
  const max = Math.max(...data.map((d) => d.value));
  const span = max - min || 1;
  const pad = span * 0.12;
  const lo = min - pad;
  const hi = max + pad;

  const x = (i: number) => padL + (i / (data.length - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);

  const line = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const area = `${padL},${H - padB} ${line} ${W - padR},${H - padB}`;

  const fmt = (v: number) => (Number.isInteger(v) ? v.toString() : v.toFixed(1));
  const first = data[0].date;
  const last = data[data.length - 1].date;
  const niceDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img">
      <defs>
        <linearGradient id={`ra-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t) => {
        const gv = hi - t * (hi - lo);
        const gy = y(gv);
        return (
          <g key={t}>
            <line x1={padL} y1={gy} x2={W - padR} y2={gy} stroke="#eef2f6" strokeWidth="1" />
            <text x={padL - 8} y={gy + 3} textAnchor="end" fontSize="11" fill="#94a3b8">
              {fmt(gv)}
            </text>
          </g>
        );
      })}
      <polygon points={area} fill={`url(#ra-${id})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.value)} r="3" fill={color} />
      ))}
      <text x={padL} y={H - 6} fontSize="11" fill="#94a3b8">{niceDate(first)}</text>
      <text x={W - padR} y={H - 6} textAnchor="end" fontSize="11" fill="#94a3b8">
        {niceDate(last)}{unit ? ` · ${unit}` : ""}
      </text>
    </svg>
  );
}
