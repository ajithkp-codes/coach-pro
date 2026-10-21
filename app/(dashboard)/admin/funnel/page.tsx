import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { getFunnel } from "@/lib/data/admin-analytics";

export const metadata = { title: "Funnel · CoachPro" };

export default async function AdminFunnelPage() {
  const stages = await getFunnel();
  const top = Math.max(1, stages[0]?.value ?? 1);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Acquisition funnel</CardTitle>
          <span className="text-xs text-muted-foreground">demo → signup → active → paid</span>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          {stages.map((s) => {
            const width = Math.max(4, (s.value / top) * 100);
            return (
              <div key={s.key} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">{s.label}</span>
                  <span className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold tabular-nums">{s.value}</span>
                    {s.fromPrev != null && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {(s.fromPrev * 100).toFixed(0)}%
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-7 overflow-hidden rounded-[var(--radius-sm)] bg-muted">
                  <div
                    className="flex h-full items-center rounded-[var(--radius-sm)] bg-primary/85 px-2 transition-all"
                    style={{ width: `${width}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{s.hint}</span>
              </div>
            );
          })}
        </CardBody>
      </Card>

      <p className="text-xs text-muted-foreground">
        Percentages show conversion from the previous stage. Stages are independent trainer counts,
        so a trainer who skipped a step can still appear later — the shape shows where trainers stall.
      </p>
    </div>
  );
}
