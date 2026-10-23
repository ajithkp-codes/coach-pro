import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { timeAgo } from "@/lib/format";
import type { ReviewItem } from "@/lib/data/dashboard";

export function ReviewInbox({ reviews, total }: { reviews: ReviewItem[]; total: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Check-ins to review</CardTitle>
        {total > 0 && <Badge tone="info">{total}</Badge>}
      </CardHeader>
      <CardBody>
        {reviews.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-success">
              <Icon name="checkCircle" size={18} />
            </span>
            Inbox zero — no client check-ins waiting.
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {reviews.map((r) => (
              <li key={r.clientId}>
                <Link
                  href={`/clients/${r.clientId}/nutrition`}
                  className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-muted"
                >
                  <Avatar name={r.clientName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.clientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.days} day{r.days > 1 ? "s" : ""} to review · {timeAgo(r.latest)}
                    </p>
                  </div>
                  <Icon name="chevronRight" size={16} className="shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
