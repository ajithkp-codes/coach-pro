import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import type { ClientBoardItem } from "@/lib/data/dashboard";

const RISK_TONE = { at_risk: "danger", watch: "warning", on_track: "success" } as const;
const RISK_LABEL = { at_risk: "At risk", watch: "Watch", on_track: "On track" } as const;

/**
 * The drifting clients that need a nudge — at-risk and watch only, top reason
 * surfaced. The board is already sorted at-risk-first, so this is a simple slice.
 */
export function NeedsAttention({ board }: { board: ClientBoardItem[] }) {
  const flagged = board.filter((c) => c.risk.tier !== "on_track");
  const shown = flagged.slice(0, 5);

  return (
    <Card id="needs-attention" className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-danger">
            <Icon name="alert" size={18} />
          </span>
          Needs attention
        </CardTitle>
        {flagged.length > 0 && <Badge tone="danger">{flagged.length}</Badge>}
      </CardHeader>
      <CardBody>
        {shown.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-success">
              <Icon name="checkCircle" size={18} />
            </span>
            Everyone&rsquo;s on track — no one is drifting right now.
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {shown.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/clients/${c.id}`}
                  className="flex items-center gap-3 py-2.5 transition-colors hover:bg-muted/40"
                >
                  <Avatar name={c.full_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{c.full_name}</span>
                      <Badge tone={RISK_TONE[c.risk.tier]}>{RISK_LABEL[c.risk.tier]}</Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {c.risk.reasons[0] ?? "Review this client"}
                    </p>
                  </div>
                  <Icon name="chevronRight" size={16} className="shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {flagged.length > shown.length && (
          <Link
            href="/clients?filter=at_risk"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all {flagged.length} in Clients <Icon name="chevronRight" size={14} />
          </Link>
        )}
      </CardBody>
    </Card>
  );
}
