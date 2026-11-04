import { Icon } from "@/components/ui/icon";
import { resolvePlanShare, recordPlanView } from "@/lib/data/plan-public";
import { getModality } from "@/lib/catalog/modalities";
import { describeCadence } from "@/lib/catalog/plan-cadence";
import { formatDate } from "@/lib/format";
import type { PlanDay, PlanItem } from "@/lib/types";

export const metadata = { title: "Workout Plan · CoachPro" };

function Unavailable({ status }: { status: "not_found" | "revoked" }) {
  const msg =
    status === "revoked"
      ? "This plan link has been turned off by your trainer."
      : "This plan link is invalid or no longer available.";
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon name="dumbbell" size={22} className="text-muted-foreground" />
        </div>
        <p className="text-base font-semibold">Plan unavailable</p>
        <p className="mt-1 text-sm text-muted-foreground">{msg}</p>
      </div>
    </div>
  );
}

/** The non-empty programmed fields for one item, as label/value chips. */
function itemFields(item: PlanItem, day: PlanDay, planModality: string) {
  const def = getModality(day.modality ?? planModality);
  return def.planColumns
    .map((c) => ({ label: c.label, value: (item[c.field] as string | undefined)?.trim() ?? "" }))
    .filter((f) => f.value);
}

export default async function PublicPlanPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const resolved = await resolvePlanShare(token);

  if (resolved.status !== "ok" || !resolved.data) {
    return <Unavailable status={resolved.status === "revoked" ? "revoked" : "not_found"} />;
  }

  const { plan, clientName, businessName } = resolved.data;
  await recordPlanView(plan.id, plan.share_view_count);

  const days = plan.days.filter((d) => d.items.length || d.title);
  const modalityLabel = getModality(plan.modality).label;

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">
            CP
          </div>
          {businessName ?? "CoachPro"}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* Header band */}
          <div
            className="px-6 py-8 text-white sm:px-10 sm:py-10"
            style={{ background: "linear-gradient(120deg, #e8402a, #c6331c 60%, #ef6a4c)" }}
          >
            <p className="text-sm font-medium opacity-90">{modalityLabel} plan</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{plan.name}</h1>
            <p className="mt-2 text-sm opacity-90">
              Prepared for {clientName} ·{" "}
              {describeCadence(plan.cadence ?? "weekly", plan.duration_weeks ?? 1)}
              {plan.starts_on ? ` · from ${formatDate(plan.starts_on)}` : ""}
            </p>
          </div>

          <div className="flex flex-col gap-5 px-6 py-6 sm:px-10 sm:py-8">
            {plan.notes && (
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
                {plan.notes}
              </div>
            )}

            {days.length === 0 ? (
              <p className="text-sm text-muted-foreground">No training days in this plan yet.</p>
            ) : (
              days.map((day, di) => (
                <div key={di} className="rounded-xl border border-border">
                  <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {day.day}
                    </span>
                    {day.title && <span className="text-sm font-medium">{day.title}</span>}
                  </div>
                  {day.items.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-muted-foreground">Rest / no exercises</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {day.items.map((item, ii) => {
                        const fields = itemFields(item, day, plan.modality);
                        return (
                          <li key={ii} className="px-4 py-3">
                            <p className="text-sm font-medium">{item.exercise_name}</p>
                            {fields.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                {fields.map((f) => (
                                  <span key={f.label}>
                                    <span className="font-medium text-foreground">{f.value}</span> {f.label.toLowerCase()}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.notes?.trim() && (
                              <p className="mt-1 text-xs text-muted-foreground">{item.notes}</p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Shared with you via CoachPro
        </p>
      </div>
    </div>
  );
}
