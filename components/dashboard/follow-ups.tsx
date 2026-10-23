import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";
import type { ClientBoardItem } from "@/lib/data/dashboard";

function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function Group({
  icon,
  tone,
  title,
  rows,
}: {
  icon: IconName;
  tone: string;
  title: string;
  rows: { id: string; href: string; name: string; detail: string }[];
}) {
  if (rows.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span className={tone}>
          <Icon name={icon} size={13} />
        </span>
        {title}
      </p>
      <ul className="flex flex-col gap-0.5">
        {rows.map((r) => (
          <li key={r.id}>
            <Link
              href={r.href}
              className="flex items-center gap-2 rounded-lg px-1 py-1 text-sm hover:bg-muted"
            >
              <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{r.detail}</span>
              <Icon name="chevronRight" size={14} className="shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Grouped coaching nudges derived from signals the engine already computes:
 * overdue goals, out-of-range markers, and goals coming due within 14 days.
 */
export function FollowUps({ board }: { board: ClientBoardItem[] }) {
  const overdue = board
    .filter((c) => c.goalOverdue)
    .slice(0, 4)
    .map((c) => ({ id: c.id, href: `/clients/${c.id}/goals`, name: c.full_name, detail: "Goal overdue" }));

  const outOfRange = board
    .filter((c) => c.markerOutOfRange)
    .slice(0, 4)
    .map((c) => ({ id: c.id, href: `/clients/${c.id}/markers`, name: c.full_name, detail: "Marker out of range" }));

  const dueSoon = board
    .filter((c) => c.goalDueSoon)
    .slice(0, 4)
    .map((c) => ({
      id: c.id,
      href: `/clients/${c.id}/goals`,
      name: c.full_name,
      detail: `Due ${fmtDate(c.goalDueSoon!.date)}`,
    }));

  const empty = overdue.length === 0 && outOfRange.length === 0 && dueSoon.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-primary">
            <Icon name="target" size={18} />
          </span>
          Follow-ups
        </CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        {empty ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-success">
              <Icon name="checkCircle" size={18} />
            </span>
            Nothing to chase — goals and markers all look current.
          </div>
        ) : (
          <>
            <Group icon="alert" tone="text-danger" title="Overdue goals" rows={overdue} />
            <Group icon="pulse" tone="text-warning" title="Markers out of range" rows={outOfRange} />
            <Group icon="target" tone="text-primary" title="Goals due soon" rows={dueSoon} />
          </>
        )}
      </CardBody>
    </Card>
  );
}
