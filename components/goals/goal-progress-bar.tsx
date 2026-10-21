import { formatNumber, formatDate } from "@/lib/format";
import type { Goal } from "@/lib/types";
import type { GoalProgress } from "@/lib/data/goals";
import { cn } from "@/lib/utils";

export function GoalProgressBar({
  progress,
  goal,
}: {
  progress: GoalProgress;
  goal: Goal;
}) {
  const pct = progress.pct;
  const hasBar = pct !== null;

  return (
    <div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {hasBar && (
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              pct >= 100
                ? "bg-gradient-to-r from-success to-emerald-400"
                : "bg-gradient-to-r from-primary to-accent",
            )}
            style={{ width: `${Math.max(2, Math.min(pct, 100))}%` }}
          />
        )}
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {progress.current !== null
            ? `Now ${formatNumber(progress.current, goal.target_unit)}`
            : goal.start_value !== null
              ? `Start ${formatNumber(goal.start_value, goal.target_unit)}`
              : "No reading yet"}
          {progress.measuredOn && <> · {formatDate(progress.measuredOn)}</>}
        </span>
        <span className={cn("font-bold", pct !== null && pct >= 100 ? "text-success" : "text-foreground")}>
          {hasBar ? `${pct}%` : "–"}
        </span>
      </div>
    </div>
  );
}
