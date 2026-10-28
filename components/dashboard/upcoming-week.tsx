import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import type { RosterEvent } from "@/lib/data/roster";

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}
function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

/** Next few days of one-off appointments/events (today lives in Today's sessions). */
export function UpcomingWeek({ events }: { events: RosterEvent[] }) {
  // Group by local day, preserving chronological order.
  const byDay = new Map<string, RosterEvent[]>();
  for (const e of events) {
    const key = e.startsAt.slice(0, 10);
    const arr = byDay.get(key) ?? [];
    arr.push(e);
    byDay.set(key, arr);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-primary">
            <Icon name="calendar" size={18} />
          </span>
          Upcoming this week
        </CardTitle>
      </CardHeader>
      <CardBody>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No appointments scheduled for the next few days.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {[...byDay.entries()].map(([day, evs]) => (
              <div key={day}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {dayLabel(`${day}T00:00:00`)}
                </p>
                <ul className="divide-y divide-border">
                  {evs.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 py-1.5 text-sm">
                      <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">
                        {timeLabel(e.startsAt)}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {e.title ?? "Appointment"}
                        {e.clientName && <span className="text-muted-foreground"> · {e.clientName}</span>}
                      </span>
                      {e.location && (
                        <span className="shrink-0 truncate text-xs text-muted-foreground">{e.location}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
