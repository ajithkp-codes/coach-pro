import { Icon, type IconName } from "@/components/ui/icon";
import { ReportChart } from "@/components/report/report-chart";
import { PrintButton } from "@/components/report/print-button";
import {
  resolveReport,
  buildReportData,
  recordReportView,
} from "@/lib/data/report-public";
import { METRIC_BY_KEY } from "@/lib/catalog/metrics";
import { formatDate, formatNumber } from "@/lib/format";

export const metadata = { title: "Progress Report · CoachPro" };

const CHART_KEYS = ["weight_kg", "body_fat_pct", "waist_cm"];
const CHART_COLOR: Record<string, string> = {
  weight_kg: "#4f46e5",
  body_fat_pct: "#0369a1",
  waist_cm: "#c2410c",
};

export default async function ReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const resolved = await resolveReport(token);

  if (resolved.status !== "ok" || !resolved.report) {
    return <Unavailable status={resolved.status} />;
  }
  const data = await buildReportData(resolved.report);
  if (!data) return <Unavailable status="not_found" />;
  await recordReportView(data.report.id, data.report.view_count);

  const rangeText = data.rangeStart
    ? `${formatDate(data.rangeStart)} to ${formatDate(data.rangeEnd)}`
    : `Up to ${formatDate(data.rangeEnd)}`;

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">
              CP
            </div>
            CoachPro
          </div>
          <PrintButton />
        </div>

        <div className="report-page overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* Header band */}
          <div
            className="relative px-6 py-8 text-white sm:px-10 sm:py-10"
            style={{ background: "linear-gradient(120deg, #4f46e5, #7c3aed 60%, #2563eb)" }}
          >
            {data.businessName && (
              <p className="text-sm font-medium text-white/80">{data.businessName}</p>
            )}
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {data.report.title || "Progress Report"}
            </h1>
            <p className="mt-2 text-white/90">
              {data.clientName} · {data.periodLabel}
            </p>
            <p className="mt-0.5 text-sm text-white/70">{rangeText}</p>
          </div>

          <div className="flex flex-col gap-8 px-6 py-8 sm:px-10">
            {/* Highlights */}
            <section className="avoid-break">
              <SectionLabel icon="sparkles">Highlights</SectionLabel>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {data.summary.weight && (
                  <Highlight label="Weight" value={formatNumber(data.summary.weight.latest, "kg")} change={data.summary.weight.change} unit="kg" lowerIsBetter />
                )}
                {data.summary.bodyFat && (
                  <Highlight label="Body fat" value={formatNumber(data.summary.bodyFat.latest, "%")} change={data.summary.bodyFat.change} unit="%" lowerIsBetter />
                )}
                {data.summary.waist && (
                  <Highlight label="Waist" value={formatNumber(data.summary.waist.latest, "cm")} change={data.summary.waist.change} unit="cm" lowerIsBetter />
                )}
                <Highlight label="Goals achieved" value={String(data.summary.goalsAchieved)} />
                <Highlight label="Sessions" value={String(data.summary.sessions)} />
                {data.summary.volumeKg > 0 && (
                  <Highlight label="Training volume" value={`${formatNumber(data.summary.volumeKg)} kg`} />
                )}
              </div>
            </section>

            {/* Trends */}
            {CHART_KEYS.some((k) => data.metricSeries[k]?.length >= 2) && (
              <section className="avoid-break">
                <SectionLabel icon="trendingUp">Trends</SectionLabel>
                <div className="mt-3 flex flex-col gap-5">
                  {CHART_KEYS.filter((k) => data.metricSeries[k]?.length >= 2).map((k) => {
                    const meta = data.metricMeta.find((m) => m.key === k)!;
                    const pts = data.metricSeries[k];
                    const latest = pts[pts.length - 1].value;
                    const change = +(latest - pts[0].value).toFixed(1);
                    return (
                      <div key={k} className="rounded-xl border border-border p-4 avoid-break">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">{meta.label}</p>
                          <p className="flex items-center gap-2 text-sm">
                            <span className="font-semibold">{formatNumber(latest, meta.unit)}</span>
                            <Change change={change} unit={meta.unit} lowerIsBetter={!!METRIC_BY_KEY[k]?.lowerIsBetter} />
                          </p>
                        </div>
                        <div className="mt-2">
                          <ReportChart data={pts} id={k} color={CHART_COLOR[k]} unit={meta.unit} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Goals */}
            {data.goals.length > 0 && (
              <section className="avoid-break">
                <SectionLabel icon="target">Goals</SectionLabel>
                <ul className="mt-3 flex flex-col gap-4">
                  {data.goals.map((g, i) => (
                    <li key={i}>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          {g.status === "achieved" && (
                            <span className="text-success"><Icon name="checkCircle" size={16} /></span>
                          )}
                          {g.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {g.target != null ? `Target ${formatNumber(g.target, g.unit)}` : g.category}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${g.status === "achieved" || (g.pct ?? 0) >= 100 ? "bg-success" : "bg-primary"}`}
                          style={{ width: `${Math.max(3, Math.min(100, g.pct ?? (g.status === "achieved" ? 100 : 0)))}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Markers */}
            {data.markers.length > 0 && (
              <section className="avoid-break">
                <SectionLabel icon="pulse">Health markers</SectionLabel>
                <div className="mt-3 overflow-hidden rounded-xl border border-border">
                  {data.markers.map((m, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 text-sm last:border-0">
                      <span>{m.label}</span>
                      <span className="flex items-center gap-2">
                        {m.tone && (
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${m.tone === "ok" ? "bg-success-bg text-success" : "bg-warning-bg text-warning"}`}>
                            {m.tone === "ok" ? "In range" : "Watch"}
                          </span>
                        )}
                        <span className="font-semibold">{formatNumber(m.value, m.unit)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Photos */}
            {data.photos.length > 0 && (
              <section className="avoid-break">
                <SectionLabel icon="camera">Progress photos</SectionLabel>
                {data.photos.length >= 2 ? (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <PhotoFrame photo={data.photos[0]} badge="Before" />
                    <PhotoFrame photo={data.photos[data.photos.length - 1]} badge="Latest" />
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <PhotoFrame photo={data.photos[0]} />
                  </div>
                )}
                {data.photos.length > 2 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {data.photos.slice(1, -1).slice(0, 4).map((p, i) => (
                      <PhotoFrame key={i} photo={p} small />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          <div className="border-t border-border px-6 py-5 text-center text-xs text-muted-foreground sm:px-10">
            Prepared{data.businessName ? ` by ${data.businessName}` : ""} on{" "}
            {formatDate(data.rangeEnd)}. Powered by CoachPro.
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- pieces ----
function SectionLabel({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      <span className="text-primary"><Icon name={icon} size={16} /></span>
      {children}
    </h2>
  );
}

function Highlight({
  label,
  value,
  change,
  unit,
  lowerIsBetter,
}: {
  label: string;
  value: string;
  change?: number | null;
  unit?: string;
  lowerIsBetter?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
      {change !== undefined && (
        <div className="mt-0.5">
          <Change change={change} unit={unit} lowerIsBetter={lowerIsBetter} />
        </div>
      )}
    </div>
  );
}

function Change({
  change,
  unit,
  lowerIsBetter,
}: {
  change: number | null | undefined;
  unit?: string;
  lowerIsBetter?: boolean;
}) {
  if (change == null || change === 0) {
    return <span className="text-xs text-muted-foreground">no change</span>;
  }
  const up = change > 0;
  const good = lowerIsBetter ? change < 0 : change > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${good ? "text-success" : "text-danger"}`}>
      <Icon name={up ? "trendingUp" : "trendingDown"} size={13} strokeWidth={2.2} />
      {up ? "+" : ""}{change}{unit ? ` ${unit}` : ""}
    </span>
  );
}

function PhotoFrame({
  photo,
  badge,
  small,
}: {
  photo: { url: string; caption: string | null; taken_on: string };
  badge?: string;
  small?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-muted">
      <div className={small ? "aspect-square" : "aspect-[3/4]"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={photo.caption ?? "Progress photo"} className="h-full w-full object-cover" />
      </div>
      {badge && (
        <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
          {badge}
        </span>
      )}
      {!small && (
        <span className="absolute inset-x-0 bottom-0 bg-black/45 px-2 py-1 text-[11px] text-white">
          {formatDate(photo.taken_on)}
        </span>
      )}
    </div>
  );
}

function Unavailable({ status }: { status: string }) {
  const msg =
    status === "expired"
      ? "This report link has expired."
      : status === "revoked"
        ? "This report link was turned off."
        : "Report not found.";
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-bg text-warning">
        <Icon name="alert" size={22} />
      </span>
      <h1 className="mt-4 text-lg font-semibold">{msg}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Please ask your trainer to share an updated link.
      </p>
    </div>
  );
}
