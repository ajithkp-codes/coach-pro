import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { listTrainers } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Trainers · Admin · CoachPro" };

export default async function AdminTrainersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const trainers = await listTrainers(q);

  return (
    <div className="flex flex-col gap-4">
      <form className="max-w-sm">
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name, email or business"
          aria-label="Search trainers"
        />
      </form>

      {trainers.length === 0 ? (
        <EmptyState title="No trainers found" description={q ? "Try a different search." : "No trainers yet."} />
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {trainers.map((t) => (
              <Link
                key={t.id}
                href={`/admin/trainers/${t.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
              >
                <Avatar name={t.full_name || t.email || "Trainer"} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {t.full_name || "Unnamed"}
                    {t.is_admin && <span className="ml-2 text-xs font-normal text-primary">admin</span>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[t.business_name, t.email].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {t.clientCount} client{t.clientCount === 1 ? "" : "s"}
                </span>
                {!t.approved && <Badge tone="warning">Pending</Badge>}
                <Badge tone={t.plan === "pro" ? "success" : "neutral"} className="capitalize">
                  {t.plan}
                </Badge>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {formatDate(t.created_at)}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
