import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { StatTile, Delta } from "@/components/ui/stat-tile";
import { Icon } from "@/components/ui/icon";
import { Sparkline } from "@/components/charts/sparkline";
import { GoalProgressBar } from "@/components/goals/goal-progress-bar";
import { getClient } from "@/lib/data/clients";
import { listBodyMetrics } from "@/lib/data/bodyMetrics";
import { listHealthMarkers } from "@/lib/data/healthMarkers";
import { listGoals, computeGoalProgress } from "@/lib/data/goals";
import { listSessions, sessionVolume } from "@/lib/data/training";
import { listPhotos } from "@/lib/data/photos";
import { listDietLogs } from "@/lib/data/diet";
import { getActiveDietPlan } from "@/lib/data/dietPlans";
import { dayTotals, adherenceTone } from "@/lib/nutrition";
import { listClientReminders } from "@/lib/data/reminders";
import { RemindersPanel } from "@/components/reminders/reminders-panel";
import { CopyButton } from "@/components/ui/copy-button";
import { MARKER_BY_KEY, markerLabel } from "@/lib/catalog/markers";
import { computeInsights, generateProgressSummary } from "@/lib/data/insights";
import { formatDate, formatNumber, timeAgo } from "@/lib/format";
import type { BodyMetric, HealthMarker } from "@/lib/types";

const toneClass: Record<string, string> = {
  positive: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  neutral: "bg-muted text-muted-foreground border-border",
};

export default async function ClientOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const [metrics, markers, goals, sessions, photos, reminders, dietLogs, dietPlan] =
    await Promise.all([
      listBodyMetrics(id),
      listHealthMarkers(id),
      listGoals(id),
      listSessions(id),
      listPhotos(id),
      listClientReminders(id),
      listDietLogs(id),
      getActiveDietPlan(id),
    ]);

  const asc = [...metrics].reverse(); // ascending by date
  const latestByMarker = latestPerMarker(markers);
  const activeGoals = goals.filter((g) => g.status === "active");
  const goalProgress = await Promise.all(
    activeGoals.slice(0, 4).map(async (g) => ({ goal: g, progress: await computeGoalProgress(g) })),
  );

  const weight = series(asc, "weight_kg");
  const fat = series(asc, "body_fat_pct");
  const waist = series(asc, "waist_cm");
  const lastSession = sessions[0];

  const lastDietLog = dietLogs[0]; // newest first
  const lastDietTotals = lastDietLog ? dayTotals(lastDietLog.entries) : null;
  const hasNutrition = !!dietPlan || dietLogs.length > 0;

  const hasHero = weight.latest != null || fat.latest != null || waist.latest != null;

  const insights = computeInsights(metrics, markers, goals, sessions);
  const summary = generateProgressSummary(client.full_name, metrics, markers, goals, sessions);

  return (
    <div className="flex flex-col gap-6">
      {/* Insight strip */}
      {insights.length > 0 && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {insights.map((ins, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${toneClass[ins.tone]}`}
              >
                <Icon name={ins.icon} size={13} />
                {ins.text}
              </span>
            ))}
          </div>
          <CopyButton text={summary} label="Copy summary" />
        </div>
      )}

      {/* Hero metric tiles */}
      {hasHero && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {weight.latest != null && (
            <StatTile
              icon="scale"
              label="Weight"
              value={formatNumber(weight.latest, "kg")}
              sub={weight.change != null ? <Delta value={weight.change} unit="kg" good={weight.change < 0} /> : "First reading"}
            >
              <Sparkline data={weight.spark} />
            </StatTile>
          )}
          {fat.latest != null && (
            <StatTile
              icon="pulse"
              label="Body fat"
              accent="sky"
              value={formatNumber(fat.latest, "%")}
              sub={fat.change != null ? <Delta value={fat.change} unit="%" good={fat.change < 0} /> : "First reading"}
            >
              <Sparkline data={fat.spark} color="#0369a1" />
            </StatTile>
          )}
          {waist.latest != null && (
            <StatTile
              icon="ruler"
              label="Waist"
              accent="amber"
              value={formatNumber(waist.latest, "cm")}
              sub={waist.change != null ? <Delta value={waist.change} unit="cm" good={waist.change < 0} /> : "First reading"}
            >
              <Sparkline data={waist.spark} color="#c2410c" />
            </StatTile>
          )}
          <StatTile
            icon="dumbbell"
            label="Training"
            accent="green"
            value={sessions.length}
            sub={lastSession ? `Last ${timeAgo(lastSession.performed_on)}` : "No sessions yet"}
          />
        </div>
      )}

      {/* Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Active goals</CardTitle>
          <Link href={`/clients/${id}/progress`} className="text-sm font-medium text-primary hover:underline">
            Manage →
          </Link>
        </CardHeader>
        <CardBody>
          {goalProgress.length ? (
            <ul className="grid gap-4 sm:grid-cols-2">
              {goalProgress.map(({ goal, progress }) => (
                <li key={goal.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{goal.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {goal.target_value != null
                        ? `Target ${formatNumber(goal.target_value, goal.target_unit)}`
                        : goal.category}
                    </span>
                  </div>
                  <GoalProgressBar progress={progress} goal={goal} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyRow text="No active goals." href={`/clients/${id}/progress`} cta="Set a goal" />
          )}
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Health markers */}
        <Card>
          <CardHeader>
            <CardTitle>Latest health markers</CardTitle>
            <Link href={`/clients/${id}/progress`} className="text-sm font-medium text-primary hover:underline">
              View →
            </Link>
          </CardHeader>
          <CardBody>
            {latestByMarker.length ? (
              <ul className="flex flex-col gap-3">
                {latestByMarker.map((m) => {
                  const tone = rangeTone(m);
                  return (
                    <li key={m.id} className="flex items-center justify-between gap-3">
                      <span className="text-sm">{markerLabel(m.marker_key, m.custom_name)}</span>
                      <span className="flex items-center gap-2">
                        {tone && (
                          <Badge tone={tone}>{tone === "warning" ? "Out of range" : "In range"}</Badge>
                        )}
                        <span className="text-sm font-medium">{formatNumber(m.value, m.unit)}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyRow text="No markers recorded." href={`/clients/${id}/progress`} cta="Add markers" />
            )}
          </CardBody>
        </Card>

        {/* Recent training */}
        <Card>
          <CardHeader>
            <CardTitle>Recent training</CardTitle>
            <Link href={`/clients/${id}/training`} className="text-sm font-medium text-primary hover:underline">
              View →
            </Link>
          </CardHeader>
          <CardBody>
            {sessions.length ? (
              <ul className="flex flex-col gap-3">
                {sessions.slice(0, 3).map((s) => {
                  const vol = sessionVolume(s);
                  return (
                    <li key={s.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{s.title || "Training session"}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(s.performed_on)} · {s.sets.length} sets
                        </p>
                      </div>
                      {vol > 0 && <Badge tone="info">{formatNumber(Math.round(vol))} kg</Badge>}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyRow text="No sessions logged." href={`/clients/${id}/training`} cta="Log session" />
            )}
          </CardBody>
        </Card>
      </div>

      {/* Nutrition */}
      {hasNutrition && (
        <Card>
          <CardHeader>
            <CardTitle>Nutrition</CardTitle>
            <Link href={`/clients/${id}/nutrition`} className="text-sm font-medium text-primary hover:underline">
              View →
            </Link>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-4">
              {dietPlan ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-info-bg text-primary">
                    <Icon name="utensils" size={16} />
                  </span>
                  <span className="text-sm font-medium">{dietPlan.name}</span>
                  <Badge tone="success">Active plan</Badge>
                  {dietPlan.target_calories != null && (
                    <Badge tone="neutral">{formatNumber(dietPlan.target_calories)} kcal / day</Badge>
                  )}
                  {dietPlan.target_protein_g != null && (
                    <Badge tone="neutral">{formatNumber(dietPlan.target_protein_g)} g protein / day</Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No active diet plan set.</p>
              )}

              {lastDietLog && lastDietTotals ? (
                <div className="border-t border-border pt-3">
                  <p className="mb-1.5 text-xs text-muted-foreground">
                    Last logged · {formatDate(lastDietLog.logged_on)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={adherenceTone(lastDietTotals.calories, dietPlan?.target_calories)}>
                      {formatNumber(Math.round(lastDietTotals.calories))}
                      {dietPlan?.target_calories != null ? ` / ${formatNumber(dietPlan.target_calories)}` : ""} kcal
                    </Badge>
                    <Badge tone={adherenceTone(lastDietTotals.protein, dietPlan?.target_protein_g)}>
                      {formatNumber(Math.round(lastDietTotals.protein))}
                      {dietPlan?.target_protein_g != null ? ` / ${formatNumber(dietPlan.target_protein_g)}` : ""} g protein
                    </Badge>
                    {lastDietLog.water_ml != null && (
                      <Badge tone="info">{formatNumber(lastDietLog.water_ml)} ml water</Badge>
                    )}
                  </div>
                </div>
              ) : (
                <EmptyRow text="No food logged yet." href={`/clients/${id}/nutrition`} cta="Log a day" />
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Reminders / follow-ups */}
      <div>
        <h2 className="mb-3 text-sm font-semibold">Follow-ups</h2>
        <RemindersPanel clientId={id} reminders={reminders} />
      </div>

      {/* Progress photos */}
      {photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progress photos</CardTitle>
            <Link href={`/clients/${id}/share`} className="text-sm font-medium text-primary hover:underline">
              View all →
            </Link>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {photos.slice(0, 5).map((p) =>
                p.url ? (
                  <Link
                    key={p.id}
                    href={`/clients/${id}/share`}
                    className="aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={p.caption ?? "Progress"} className="h-full w-full object-cover" loading="lazy" />
                  </Link>
                ) : null,
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {client.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="whitespace-pre-wrap text-sm">{client.notes}</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

// ---- helpers ----
function series(ascMetrics: BodyMetric[], field: keyof BodyMetric) {
  const vals = ascMetrics
    .map((m) => m[field])
    .filter((v): v is number => v != null)
    .map(Number);
  const latest = vals.length ? vals[vals.length - 1] : null;
  const change = vals.length >= 2 ? +(vals[vals.length - 1] - vals[0]).toFixed(1) : null;
  return { latest, change, spark: vals.slice(-8) };
}

function latestPerMarker(markers: HealthMarker[]): HealthMarker[] {
  const seen = new Map<string, HealthMarker>();
  for (const m of markers) {
    const key = m.marker_key === "custom" ? `custom:${m.custom_name}` : m.marker_key;
    if (!seen.has(key)) seen.set(key, m);
  }
  return Array.from(seen.values()).slice(0, 6);
}

function rangeTone(m: HealthMarker): "success" | "warning" | null {
  const def = MARKER_BY_KEY[m.marker_key];
  if (!def) return null;
  const out =
    (def.refLow !== undefined && m.value < def.refLow) ||
    (def.refHigh !== undefined && m.value > def.refHigh);
  if (out) return "warning";
  if (def.refLow !== undefined || def.refHigh !== undefined) return "success";
  return null;
}

function EmptyRow({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">{text}</p>
      <ButtonLink href={href} variant="outline" size="sm">
        {cta}
      </ButtonLink>
    </div>
  );
}
