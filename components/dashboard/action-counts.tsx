import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type Tone = "red" | "amber" | "sky" | "green";

const TONES: Record<Tone, { bg: string; fg: string }> = {
  red: { bg: "bg-danger-bg", fg: "text-danger" },
  amber: { bg: "bg-warning-bg", fg: "text-warning" },
  sky: { bg: "bg-sky-bg", fg: "text-sky" },
  green: { bg: "bg-success-bg", fg: "text-success" },
};

function CountTile({
  href,
  icon,
  label,
  value,
  tone,
}: {
  href: string;
  icon: IconName;
  label: string;
  value: string;
  tone: Tone;
}) {
  const t = TONES[tone];
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[var(--radius)] border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/60"
    >
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)]", t.bg, t.fg)}>
        <Icon name={icon} size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-none tabular-nums">{value}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </Link>
  );
}

/** A slim strip of only actionable numbers — each links to where you act on it. */
export function ActionCounts({
  needsAttention,
  toReview,
  sessionsDone,
  sessionsTotal,
}: {
  needsAttention: number;
  toReview: number;
  sessionsDone: number;
  sessionsTotal: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <CountTile
        href="#needs-attention"
        icon="alert"
        label={needsAttention === 0 ? "Everyone on track" : "Clients need attention"}
        value={String(needsAttention)}
        tone={needsAttention === 0 ? "green" : "red"}
      />
      <CountTile
        href="#review"
        icon="utensils"
        label={toReview === 0 ? "No check-ins waiting" : "Check-ins to review"}
        value={String(toReview)}
        tone={toReview === 0 ? "green" : "amber"}
      />
      <CountTile
        href="#today"
        icon="dumbbell"
        label="Sessions logged today"
        value={`${sessionsDone}/${sessionsTotal}`}
        tone="sky"
      />
    </div>
  );
}
