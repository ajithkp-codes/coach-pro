import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { AppointmentRow } from "@/components/schedule/appointment-row";
import { NewAppointmentButton } from "@/components/schedule/new-appointment-button";
import { WeekRoster } from "@/components/schedule/week-roster";
import { listAgenda } from "@/lib/data/appointments";
import { getWeekRoster } from "@/lib/data/roster";
import { localDateISO } from "@/lib/roster";
import { listClients } from "@/lib/data/clients";

export const metadata = { title: "Schedule · CoachPro" };

export default async function SchedulePage() {
  const todayISO = localDateISO(new Date());
  const [{ overdue }, week, clients] = await Promise.all([
    listAgenda(),
    getWeekRoster(todayISO, 7),
    listClients("active"),
  ]);
  const clientOptions = clients.map((c) => ({ id: c.id, full_name: c.full_name }));
  const totalSessions = week.reduce((n, d) => n + d.sessions.length, 0);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 animate-slide-up">
        <div>
          <p className="overline">Next 7 days</p>
          <h1 className="hdisp mt-1 text-[2rem] sm:text-[2.5rem]">Schedule</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Derived from each client&rsquo;s active workout plan — no double entry. Add one-off
            events for consults and calls.
          </p>
        </div>
        <NewAppointmentButton clients={clientOptions} label="New event" />
      </div>

      {overdue.length > 0 && (
        <Card className="mb-6 border-warning/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-warning">
                <Icon name="alert" size={18} />
              </span>
              Events needing a decision
            </CardTitle>
            <Badge tone="warning">{overdue.length}</Badge>
          </CardHeader>
          <CardBody>
            <p className="mb-1 text-sm text-muted-foreground">
              These one-off events are past their time but still marked scheduled. Mark them done,
              no-show, or cancelled.
            </p>
            <div className="divide-y divide-border">
              {overdue.map((a) => (
                <AppointmentRow key={a.id} a={a} clients={clientOptions} showDate />
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {totalSessions === 0 && week.every((d) => d.events.length === 0) ? (
        <Card>
          <CardBody>
            <p className="text-sm font-medium">Nothing scheduled this week.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your weekly roster builds itself from clients&rsquo; active workout plans. Open a
              client&rsquo;s training tab, build a plan, and tag its days by weekday (Mon, Wed,
              Fri&hellip;) — those sessions then appear here automatically. For anything that
              isn&rsquo;t part of a plan (a consult, a call), add a one-off event above.
            </p>
          </CardBody>
        </Card>
      ) : (
        <WeekRoster week={week} todayISO={todayISO} />
      )}
    </>
  );
}
