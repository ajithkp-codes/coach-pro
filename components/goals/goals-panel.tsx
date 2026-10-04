"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { GoalForm } from "./goal-form";
import { GoalProgressBar } from "./goal-progress-bar";
import { formatDate } from "@/lib/format";
import {
  createGoalAction,
  updateGoalAction,
  deleteGoalAction,
} from "@/app/(dashboard)/clients/[id]/goals/actions";
import type { Goal, GoalStatus } from "@/lib/types";
import type { GoalProgress } from "@/lib/data/goals";

const STATUS_TONE: Record<GoalStatus, "info" | "success" | "warning" | "neutral"> = {
  active: "info",
  achieved: "success",
  paused: "warning",
  dropped: "neutral",
};

export function GoalsPanel({
  clientId,
  goals,
  progressById,
}: {
  clientId: string;
  goals: Goal[];
  progressById: Record<string, GoalProgress>;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {goals.length} goal{goals.length === 1 ? "" : "s"}
        </p>
        <Modal
          wide
          title="Set a goal"
          description="Define a target. Link it to a metric to track progress automatically."
          trigger={(open) => <Button onClick={open}>Add goal</Button>}
        >
          {(close) => (
            <GoalForm
              action={createGoalAction.bind(null, clientId)}
              onSuccess={close}
              onCancel={close}
            />
          )}
        </Modal>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          description="Set health or workout targets and track progress over time."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map((g) => (
            <Card key={g.id}>
              <CardBody className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{g.title}</p>
                    <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                      {g.category}
                      {g.target_date && <> · by {formatDate(g.target_date)}</>}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[g.status]} className="capitalize">
                    {g.status}
                  </Badge>
                </div>

                {g.description && (
                  <p className="text-sm text-muted-foreground">{g.description}</p>
                )}

                {g.metric_key && g.target_value !== null && (
                  <GoalProgressBar progress={progressById[g.id]} goal={g} />
                )}

                <div className="mt-1 flex justify-end gap-1">
                  <Modal
                    wide
                    title="Edit goal"
                    trigger={(open) => (
                      <Button variant="ghost" size="sm" onClick={open}>
                        Edit
                      </Button>
                    )}
                  >
                    {(close) => (
                      <GoalForm
                        action={updateGoalAction.bind(null, clientId, g.id)}
                        goal={g}
                        onSuccess={close}
                        onCancel={close}
                      />
                    )}
                  </Modal>
                  <Modal
                    title="Delete goal?"
                    description={`This removes "${g.title}".`}
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
                        <form action={deleteGoalAction.bind(null, clientId, g.id)}>
                          <Button type="submit" variant="danger">
                            Delete
                          </Button>
                        </form>
                      </div>
                    )}
                  </Modal>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
