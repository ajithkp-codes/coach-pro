import * as React from "react";
import { Card, CardBody } from "./card";
import { Icon, type IconName } from "./icon";
import { cn } from "@/lib/utils";

const accents: Record<string, { bg: string; icon: string }> = {
  indigo: { bg: "bg-info-bg", icon: "text-primary" },
  green: { bg: "bg-success-bg", icon: "text-success" },
  amber: { bg: "bg-warning-bg", icon: "text-warning" },
  red: { bg: "bg-danger-bg", icon: "text-danger" },
  sky: { bg: "bg-sky-bg", icon: "text-sky" },
};

export function StatTile({
  icon,
  label,
  value,
  sub,
  accent = "indigo",
  children,
}: {
  icon: IconName;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: keyof typeof accents;
  children?: React.ReactNode;
}) {
  const a = accents[accent] ?? accents.indigo;
  return (
    <Card className="group overflow-hidden">
      <CardBody className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)]",
                a.bg, a.icon,
              )}
            >
              <Icon name={icon} size={17} />
            </span>
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
          {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
        </div>
        {children && <div className="shrink-0 self-center">{children}</div>}
      </CardBody>
    </Card>
  );
}

export function Delta({
  value,
  unit,
  good,
}: {
  value: number;
  unit?: string;
  good?: boolean;
}) {
  if (value === 0) {
    return <span className="text-xs text-muted-foreground">no change</span>;
  }
  const up = value > 0;
  const positive = good === undefined ? up : good;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold",
        positive
          ? "bg-success-bg text-success"
          : "bg-danger-bg text-danger",
      )}
    >
      <Icon name={up ? "trendingUp" : "trendingDown"} size={12} strokeWidth={2.5} />
      {up ? "+" : ""}
      {Number.isInteger(value) ? value : value.toFixed(1)}
      {unit ? ` ${unit}` : ""}
    </span>
  );
}
