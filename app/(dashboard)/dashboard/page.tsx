import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { DashboardReminders } from "@/components/reminders/dashboard-reminders";
import { TodaysSessions } from "@/components/dashboard/todays-sessions";
import { ReviewInbox } from "@/components/dashboard/review-inbox";
import { ActionCounts } from "@/components/dashboard/action-counts";
import { NeedsAttention } from "@/components/dashboard/needs-attention";
import { FollowUps } from "@/components/dashboard/follow-ups";
import { UpcomingWeek } from "@/components/dashboard/upcoming-week";
import { SetupGaps } from "@/components/dashboard/setup-gaps";
import { NewAppointmentButton } from "@/components/schedule/new-appointment-button";
import { getTrainerDashboard } from "@/lib/data/dashboard";
import { getDayRoster, getWeekRoster } from "@/lib/data/roster";
import { listOpenReminders } from "@/lib/data/reminders";
import { getTrainerProfile } from "@/lib/data/session";
import { localDateISO } from "@/lib/roster";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Dashboard · CoachPro" };

export default async function DashboardPage() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [data, roster, week, trainer, openReminders] = await Promise.all([
    getTrainerDashboard(),
    getDayRoster(),
    getWeekRoster(localDateISO(tomorrow), 6),
    getTrainerProfile(),
    listOpenReminders(),
  ]);

  const clientOptions = data.board.map((c) => ({ id: c.id, full_name: c.full_name }));
  const needsAttention = data.board.filter((c) => c.risk.tier !== "on_track").length;
  const sessionsDone = roster.sessions.filter((s) => s.status === "done").length;
  const upcomingEvents = week.flatMap((d) => d.events);

  const firstName = (trainer?.full_name || "there").split(" ")[0];
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const hasClients = data.board.length > 0;

  return (
    <>
      {/* Zone 0 — greeting + command bar */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 animate-slide-up">
        <div>
          <p className="overline">{today}</p>
          <h1 className="hdisp mt-1 text-[2rem] sm:text-[2.5rem]">
            Hey, <em>{firstName}</em>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink href="/clients/import" variant="outline" size="sm">
            <Icon name="download" size={15} /> Import
          </ButtonLink>
          <NewAppointmentButton clients={clientOptions} label="Appointment" variant="outline" size="sm" />
          <ButtonLink href="/clients/new" size="sm">
            <Icon name="plus" size={15} /> Add client
          </ButtonLink>
        </div>
      </div>

      {!hasClients ? (
        <EmptyState
          title="Let's get your practice set up"
          description="Add your first client — or import your whole roster from Excel — to start tracking compliance, check-ins, and appointments."
          action={
            <div className="flex gap-2">
              <ButtonLink href="/clients/new">Add client</ButtonLink>
              <ButtonLink href="/clients/import" variant="outline">
                Import from Excel
              </ButtonLink>
            </div>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {/* At a glance — only actionable numbers */}
          <ActionCounts
            needsAttention={needsAttention}
            toReview={data.stats.pendingReviews}
            sessionsDone={sessionsDone}
            sessionsTotal={roster.sessions.length}
          />

          {/* Two continuous columns: a main action feed + a review/follow-up rail,
              so neither side leaves dead space when the other runs long. */}
          <div className="grid items-start gap-6 lg:grid-cols-3">
            {/* Main column — the work: today → drifting → week ahead → history */}
            <div className="flex flex-col gap-6 lg:col-span-2">
              <div id="today" className="scroll-mt-20">
                <TodaysSessions
                  sessions={roster.sessions}
                  events={roster.events}
                  dateISO={roster.dateISO}
                />
              </div>
              <NeedsAttention board={data.board} />
              <UpcomingWeek events={upcomingEvents} />
              <Card>
                <CardHeader>
                  <CardTitle>Recent activity</CardTitle>
                </CardHeader>
                <CardBody>
                  {data.activity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
                  ) : (
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {data.activity.map((a, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <Avatar name={a.clientName} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">
                              <span className="font-medium">{a.clientName}</span>
                            </p>
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Icon name={a.icon} size={12} />
                              {a.label}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {timeAgo(a.at)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
            </div>

            {/* Right rail — the review & chase stack */}
            <div id="review" className="flex scroll-mt-20 flex-col gap-6">
              <ReviewInbox reviews={data.reviews} total={data.stats.pendingReviews} />
              <DashboardReminders reminders={openReminders} clients={clientOptions} />
              <FollowUps board={data.board} />
              <SetupGaps board={data.board} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
