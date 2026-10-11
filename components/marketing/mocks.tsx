import { Avatar } from "@/components/ui/avatar";
import { Icon, type IconName } from "@/components/ui/icon";
import { Sparkline } from "@/components/charts/sparkline";

/* Beautified, true-to-product mockups built from the app's own design tokens. */

function MiniStat({
  icon,
  label,
  value,
  accent,
  spark,
  color,
}: {
  icon: IconName;
  label: string;
  value: string;
  accent: string;
  spark?: number[];
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className={`flex h-5 w-5 items-center justify-center rounded-md ${accent}`}>
          <Icon name={icon} size={12} />
        </span>
        {label}
      </div>
      <div className="mt-1.5 flex items-end justify-between">
        <span className="text-lg font-semibold tracking-tight">{value}</span>
        {spark && <Sparkline data={spark} color={color ?? "#4f46e5"} width={64} height={26} />}
      </div>
    </div>
  );
}

function ClientRow({
  name,
  meta,
  weight,
  delta,
  spark,
}: {
  name: string;
  meta: string;
  weight: string;
  delta: string;
  spark: number[];
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2">
      <Avatar name={name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{name}</p>
        <p className="text-[11px] text-muted-foreground">{meta}</p>
      </div>
      <Sparkline data={spark} width={56} height={22} />
      <div className="text-right">
        <p className="text-xs font-semibold">{weight}</p>
        <p className="text-[11px] font-medium text-success">{delta}</p>
      </div>
    </div>
  );
}

export function MockDashboard({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full rounded-2xl border border-border bg-card p-4 shadow-xl ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar name="Jordan Fox" />
          <div>
            <p className="text-sm font-semibold leading-tight">Jordan Fox</p>
            <p className="text-[11px] text-muted-foreground">Peak Form Coaching</p>
          </div>
        </div>
        <span className="rounded-full bg-success-bg px-2.5 py-0.5 text-[11px] font-medium text-success">
          Pro
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <MiniStat icon="users" label="Active clients" value="24" accent="bg-info-bg text-primary" />
        <MiniStat
          icon="dumbbell"
          label="Sessions / wk"
          value="18"
          accent="bg-[#e0f2fe] text-[#0369a1]"
          spark={[8, 11, 9, 14, 12, 18]}
          color="#0369a1"
        />
      </div>

      <div className="mt-3 rounded-xl border border-border p-1.5">
        <p className="px-2 pt-1 text-[11px] font-semibold text-muted-foreground">
          Recently active
        </p>
        <ClientRow name="Aarav Sharma" meta="34 · half-marathon" weight="79.3 kg" delta="−4.7" spark={[84, 83, 82, 81, 80, 79.3]} />
        <ClientRow name="Priya Nair" meta="29 · fat loss" weight="63.8 kg" delta="−4.2" spark={[68, 67, 66.5, 65, 64.2, 63.8]} />
        <ClientRow name="Ananya Iyer" meta="27 · marathon" weight="58.0 kg" delta="−6.0" spark={[64, 62.5, 61, 60, 59, 58]} />
      </div>
    </div>
  );
}

export function MockChart({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-4 shadow-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-muted-foreground">
            <Icon name="scale" size={15} />
          </span>
          Weight trend
        </div>
        <span className="text-xs font-medium text-success">−4.7 kg</span>
      </div>
      <svg viewBox="0 0 320 130" className="mt-3 h-32 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mockArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[26, 60, 94].map((y) => (
          <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="#eef2f6" strokeWidth="1" />
        ))}
        <path d="M0,34 L64,46 L128,58 L192,74 L256,88 L320,104 L320,130 L0,130 Z" fill="url(#mockArea)" />
        <path
          d="M0,34 L64,46 L128,58 L192,74 L256,88 L320,104"
          fill="none"
          stroke="#4f46e5"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {[[0, 34], [64, 46], [128, 58], [192, 74], [256, 88], [320, 104]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#4f46e5" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span>
      </div>
    </div>
  );
}

export function MockGoals({ className = "" }: { className?: string }) {
  const goals = [
    { title: "Reach 77 kg", pct: 68, now: "79.3 kg" },
    { title: "Fasting glucose < 95", pct: 83, now: "99 mg/dL" },
  ];
  return (
    <div className={`rounded-2xl border border-border bg-card p-4 shadow-lg ${className}`}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-info-bg text-primary">
          <Icon name="target" size={14} />
        </span>
        Active goals
      </div>
      <ul className="mt-3 flex flex-col gap-3">
        {goals.map((g) => (
          <li key={g.title}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium">{g.title}</span>
              <span className="text-muted-foreground">{g.now}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full origin-left rounded-full bg-primary"
                style={{ width: `${g.pct}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MockMarkers({ className = "" }: { className?: string }) {
  const rows = [
    { name: "Total cholesterol", value: "188 mg/dL", tone: "ok" },
    { name: "Blood pressure", value: "138 mmHg", tone: "warn" },
    { name: "Vitamin D", value: "41 ng/mL", tone: "ok" },
  ];
  return (
    <div className={`rounded-2xl border border-border bg-card p-4 shadow-lg ${className}`}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#e0f2fe] text-[#0369a1]">
          <Icon name="pulse" size={14} />
        </span>
        Health markers
      </div>
      <ul className="mt-3 flex flex-col gap-2.5 text-xs">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between">
            <span>{r.name}</span>
            <span className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  r.tone === "ok" ? "bg-success-bg text-success" : "bg-warning-bg text-warning"
                }`}
              >
                {r.tone === "ok" ? "In range" : "Watch"}
              </span>
              <span className="font-semibold">{r.value}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MockPhotos({ className = "" }: { className?: string }) {
  const shots = [
    { hue: 210, label: "Wk 1" },
    { hue: 265, label: "Wk 4" },
    { hue: 160, label: "Wk 8" },
  ];
  return (
    <div className={`rounded-2xl border border-border bg-card p-4 shadow-lg ${className}`}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-info-bg text-primary">
          <Icon name="camera" size={14} />
        </span>
        Progress photos
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {shots.map((s) => (
          <div
            key={s.label}
            className="relative aspect-[3/4] overflow-hidden rounded-lg"
            style={{
              background: `linear-gradient(160deg, hsl(${s.hue},70%,82%), hsl(${s.hue + 20},65%,60%))`,
            }}
          >
            <span className="absolute inset-x-0 bottom-0 bg-black/30 px-2 py-1 text-[10px] font-medium text-white">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
