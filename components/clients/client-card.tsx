import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Delta } from "@/components/ui/stat-tile";
import { Icon } from "@/components/ui/icon";
import { Sparkline } from "@/components/charts/sparkline";
import { ageFromDob, formatNumber } from "@/lib/format";
import type { ClientCardData } from "@/lib/data/dashboard";

function sessionInsight(lastSessionDate: string | null): { text: string; warn: boolean } {
  if (!lastSessionDate) return { text: "No sessions yet", warn: false };
  const days = Math.round(
    (Date.now() - new Date(lastSessionDate).getTime()) / 86_400_000,
  );
  if (days === 0) return { text: "Trained today", warn: false };
  if (days === 1) return { text: "Trained yesterday", warn: false };
  if (days <= 7) return { text: `Trained ${days}d ago`, warn: false };
  if (days <= 14) return { text: `No training in ${days}d`, warn: true };
  return { text: `Inactive ${days}d`, warn: true };
}

const sexLabel: Record<string, string> = {
  male: "M",
  female: "F",
  other: "–",
  unspecified: "–",
};

export function ClientCard({ c }: { c: ClientCardData }) {
  const age = ageFromDob(c.date_of_birth);
  const meta = [age !== null ? `${age} yrs` : null, sexLabel[c.sex] !== "–" ? sexLabel[c.sex] : null]
    .filter(Boolean)
    .join(" · ");
  const insight = sessionInsight(c.lastSessionDate);

  return (
    <Link href={`/clients/${c.id}`} className="group block">
      <Card className="h-full transition-all duration-200 group-hover:shadow-card-hover group-hover:border-primary/20">
        <CardBody className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={c.full_name} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{c.full_name}</p>
              <p className="text-xs text-muted-foreground">{meta || "No details"}</p>
            </div>
            <Icon
              name="chevronRight"
              size={16}
              className="text-muted-foreground transition-transform duration-200 group-hover:translate-x-1"
            />
          </div>

          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Weight</p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight">
                {c.latestWeight != null ? formatNumber(c.latestWeight, "kg") : "–"}
              </p>
              {c.weightDelta != null && c.weightDelta !== 0 && (
                <div className="mt-0.5">
                  <Delta value={c.weightDelta} unit="kg" good={c.weightDelta < 0} />
                </div>
              )}
            </div>
            {c.weightSpark.length >= 2 && (
              <Sparkline data={c.weightSpark} color="var(--primary)" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 text-xs">
            {c.activeGoals > 0 ? (
              <Badge tone="info">
                {c.activeGoals} goal{c.activeGoals === 1 ? "" : "s"}
              </Badge>
            ) : (
              <span className="text-muted-foreground">No goals</span>
            )}
            {!c.consent_given && <Badge tone="warning">No consent</Badge>}
            <span className={`ml-auto font-medium ${insight.warn ? "text-warning" : "text-muted-foreground"}`}>
              {insight.text}
            </span>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
