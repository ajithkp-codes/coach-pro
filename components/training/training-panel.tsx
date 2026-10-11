"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SessionForm } from "./session-form";
import { formatDate, formatNumber } from "@/lib/format";
import {
  createSessionAction,
  updateSessionAction,
  deleteSessionAction,
} from "@/app/(dashboard)/clients/[id]/training/actions";
import type { WorkoutSessionWithSets, WorkoutSet, WorkoutPlan } from "@/lib/types";

function volume(sets: WorkoutSet[]): number {
  return sets.reduce(
    (sum, s) =>
      s.reps != null && s.weight_kg != null
        ? sum + Number(s.reps) * Number(s.weight_kg)
        : sum,
    0,
  );
}

function groupByExercise(sets: WorkoutSet[]): { name: string; sets: WorkoutSet[] }[] {
  const groups: { name: string; sets: WorkoutSet[] }[] = [];
  for (const s of sets) {
    const last = groups[groups.length - 1];
    if (last && last.name === s.exercise_name) last.sets.push(s);
    else groups.push({ name: s.exercise_name, sets: [s] });
  }
  return groups;
}

function setLabel(s: WorkoutSet): string {
  const parts: string[] = [];
  if (s.reps != null) parts.push(formatNumber(s.reps));
  if (s.weight_kg != null) parts.push(`${formatNumber(s.weight_kg)}kg`);
  let label = parts.join(" × ") || "-";
  if (s.rpe != null) label += ` @${formatNumber(s.rpe)}`;
  return label;
}

export function TrainingPanel({
  clientId,
  sessions,
  plans = [],
}: {
  clientId: string;
  sessions: WorkoutSessionWithSets[];
  plans?: WorkoutPlan[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sessions.length} session{sessions.length === 1 ? "" : "s"} logged
        </p>
        <Modal
          wide
          title="Log training session"
          description="Record what the client did: exercises, sets, reps, weight, and effort."
          trigger={(open) => (
            <Button onClick={open}>
              <Icon name="plus" size={16} /> Log session
            </Button>
          )}
        >
          {(close) => (
            <SessionForm
              action={createSessionAction.bind(null, clientId)}
              plans={plans}
              onSuccess={close}
              onCancel={close}
            />
          )}
        </Modal>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          description="Log the first training session to start building this client's history."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((session) => {
            const vol = volume(session.sets);
            const groups = groupByExercise(session.sets);
            return (
              <Card key={session.id}>
                <CardBody className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {session.title || "Training session"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDate(session.performed_on)}
                        {session.duration_min != null && (
                          <> · {session.duration_min} min</>
                        )}
                        {session.sets.length > 0 && (
                          <> · {session.sets.length} sets</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {vol > 0 && (
                        <Badge tone="info">
                          {formatNumber(Math.round(vol))} kg volume
                        </Badge>
                      )}
                      <Modal
                        wide
                        title="Edit session"
                        trigger={(open) => (
                          <Button variant="ghost" size="sm" onClick={open}>
                            Edit
                          </Button>
                        )}
                      >
                        {(close) => (
                          <SessionForm
                            action={updateSessionAction.bind(null, clientId, session.id)}
                            session={session}
                            plans={plans}
                            onSuccess={close}
                            onCancel={close}
                          />
                        )}
                      </Modal>
                      <Modal
                        title="Delete session?"
                        description={`This removes the session from ${formatDate(session.performed_on)} and its sets.`}
                        trigger={(open) => (
                          <Button variant="ghost" size="sm" onClick={open}>
                            Delete
                          </Button>
                        )}
                      >
                        {(close) => (
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={close}>
                              Cancel
                            </Button>
                            <form action={deleteSessionAction.bind(null, clientId, session.id)}>
                              <Button type="submit" variant="danger">
                                Delete
                              </Button>
                            </form>
                          </div>
                        )}
                      </Modal>
                    </div>
                  </div>

                  {groups.length > 0 && (
                    <ul className="flex flex-col gap-1.5 border-t border-border pt-3">
                      {groups.map((g, i) => (
                        <li key={i} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                          <span className="font-medium">{g.name}</span>
                          <span className="text-muted-foreground">
                            {g.sets.map(setLabel).join(", ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {session.notes && (
                    <p className="whitespace-pre-wrap border-t border-border pt-3 text-sm text-muted-foreground">
                      {session.notes}
                    </p>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
