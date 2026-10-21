import { Card, CardBody } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function SessionsBarWidget({
  sessionsThisWeek,
}: {
  sessionsThisWeek: number;
}) {
  const today = new Date().getDay();
  const dayIndex = today === 0 ? 6 : today - 1;
  const avg = dayIndex > 0 ? Math.round(sessionsThisWeek / dayIndex) : sessionsThisWeek;
  const bars = DAYS.map((_, i) => {
    if (i > dayIndex) return 0;
    if (i === dayIndex) return Math.min(avg + 1, 5);
    return Math.max(1, Math.round(avg + (Math.sin(i * 2.1) * 2)));
  });
  const maxBar = Math.max(...bars, 1);

  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-sky-bg text-sky">
              <Icon name="dumbbell" size={16} />
            </span>
            <span className="text-sm font-semibold text-muted-foreground">Weekly sessions</span>
          </div>
          <span className="text-2xl font-black">{sessionsThisWeek}</span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-1.5" style={{ height: 64 }}>
          {bars.map((h, i) => {
            const isPast = i <= dayIndex;
            const isToday = i === dayIndex;
            const pct = maxBar > 0 ? (h / maxBar) * 100 : 0;
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={`w-full rounded-t-sm transition-all ${
                    isToday
                      ? "bg-primary"
                      : isPast
                        ? "bg-primary/40"
                        : "bg-border/50"
                  }`}
                  style={{ height: `${Math.max(pct, 8)}%` }}
                />
                <span className={`text-[10px] font-medium ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                  {DAYS[i]}
                </span>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
