import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";
import type { ClientBoardItem } from "@/lib/data/dashboard";

function GapRow({
  href,
  icon,
  name,
  detail,
}: {
  href: string;
  icon: IconName;
  name: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm hover:bg-muted"
    >
      <span className="text-muted-foreground">
        <Icon name={icon} size={15} />
      </span>
      <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{detail}</span>
      <Icon name="chevronRight" size={14} className="shrink-0 text-muted-foreground" />
    </Link>
  );
}

/**
 * Clients who can't be coached yet — no active plan, or consent not recorded.
 * Renders nothing when there are no gaps.
 */
export function SetupGaps({ board }: { board: ClientBoardItem[] }) {
  const noPlan = board.filter((c) => c.noActivePlan).slice(0, 5);
  const noConsent = board.filter((c) => !c.consent_given).slice(0, 5);

  if (noPlan.length === 0 && noConsent.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-warning">
            <Icon name="alert" size={18} />
          </span>
          Setup gaps
        </CardTitle>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        {noPlan.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              No active plan
            </p>
            <div className="flex flex-col gap-0.5">
              {noPlan.map((c) => (
                <GapRow
                  key={c.id}
                  href={`/clients/${c.id}/training`}
                  icon="dumbbell"
                  name={c.full_name}
                  detail="Build a plan"
                />
              ))}
            </div>
          </div>
        )}
        {noConsent.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Consent not recorded
            </p>
            <div className="flex flex-col gap-0.5">
              {noConsent.map((c) => (
                <GapRow
                  key={c.id}
                  href={`/clients/${c.id}/edit`}
                  icon="user"
                  name={c.full_name}
                  detail="Record consent"
                />
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
