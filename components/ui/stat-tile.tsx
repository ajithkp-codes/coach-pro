import * as React from "react";
import { Card, CardBody } from "./card";
import { Icon, type IconName } from "./icon";
import { cn } from "@/lib/utils";

const accents: Record<string, string> = {
  indigo: "bg-info-bg text-primary",
  green: "bg-success-bg text-success",
  amber: "bg-warning-bg text-warning",
  red: "bg-danger-bg text-danger",
  sky: "bg-sky-bg text-sky",
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
  return (
    <Card>
      <CardBody className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg",
                accents[accent],
              )}
            >
              <Icon name={icon} size={16} />
            </span>
            <span className="text-sm text-muted-foreground">{label}</span>
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
          {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
        </div>
        {children && <div className="shrink-0 self-center">{children}</div>}
      </CardBody>
    </Card>
  );
}

/** Colored up/down delta chip. `good` controls the color direction. */
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
        "inline-flex items-center gap-0.5 text-xs font-medium",
        positive ? "text-success" : "text-danger",
      )}
    >
      <Icon name={up ? "trendingUp" : "trendingDown"} size={13} strokeWidth={2.2} />
      {up ? "+" : ""}
      {Number.isInteger(value) ? value : value.toFixed(1)}
      {unit ? ` ${unit}` : ""}
    </span>
  );
}
