import { Card, CardBody } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";

function RingStat({
  value,
  max,
  label,
  icon,
  accent,
}: {
  value: number;
  max: number;
  label: string;
  icon: IconName;
  accent: string;
}) {
  const size = 52;
  const strokeWidth = 5;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circ - pct * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-border" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={accent}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute" style={{ color: accent }}>
          <Icon name={icon} size={16} />
        </span>
      </div>
      <div className="text-center">
        <p className="text-lg font-black">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function GoalRingsWidget({
  activeClients,
  sessionsThisWeek,
  goalsAchieved,
  attentionCount,
}: {
  activeClients: number;
  sessionsThisWeek: number;
  goalsAchieved: number;
  attentionCount: number;
}) {
  return (
    <Card>
      <CardBody>
        <p className="mb-4 text-sm font-semibold text-muted-foreground">Overview</p>
        <div className="flex items-start justify-around">
          <RingStat value={activeClients} max={Math.max(activeClients, 10)} label="Clients" icon="users" accent="var(--primary)" />
          <RingStat value={goalsAchieved} max={Math.max(goalsAchieved, 5)} label="Achieved" icon="checkCircle" accent="var(--success)" />
          <RingStat value={attentionCount} max={Math.max(attentionCount, 5)} label="Alerts" icon="alert" accent={attentionCount > 0 ? "var(--warning)" : "var(--success)"} />
        </div>
      </CardBody>
    </Card>
  );
}
