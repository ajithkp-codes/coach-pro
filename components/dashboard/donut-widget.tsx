import { Card, CardBody } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";

export function DonutWidget({
  value,
  label,
  achieved,
  active,
}: {
  value: number;
  label: string;
  achieved: number;
  active: number;
}) {
  const size = 100;
  const strokeWidth = 10;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <Card>
      <CardBody className="flex items-center gap-5">
        <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              className="stroke-border"
              strokeWidth={strokeWidth}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              className="stroke-primary"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{ filter: "drop-shadow(0 0 6px var(--primary-glow))" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-xl font-black">{value}%</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{label}</p>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-success-bg text-success">
                <Icon name="check" size={12} />
              </span>
              <span className="font-semibold">{achieved}</span>
              <span className="text-muted-foreground">achieved</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-info-bg text-primary">
                <Icon name="target" size={12} />
              </span>
              <span className="font-semibold">{active}</span>
              <span className="text-muted-foreground">active</span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
