"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { BodyMetricForm } from "./body-metric-form";
import { BODY_METRIC_FIELDS } from "@/lib/catalog/metrics";
import { formatDate, formatNumber } from "@/lib/format";
import { DeleteButton } from "@/components/ui/button";
import {
  createBodyMetricAction,
  updateBodyMetricAction,
  deleteBodyMetricAction,
} from "@/app/(dashboard)/clients/[id]/metrics/actions";
import type { BodyMetric } from "@/lib/types";

export function MetricsPanel({
  clientId,
  metrics,
}: {
  clientId: string;
  metrics: BodyMetric[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {metrics.length} measurement{metrics.length === 1 ? "" : "s"} on record
        </p>
        <Modal
          wide
          title="Add measurement"
          description="Record body metrics for a date. Fill in whatever you measured."
          trigger={(open) => (
            <Button onClick={open}>
              <Icon name="plus" size={16} /> Add measurement
            </Button>
          )}
        >
          {(close) => (
            <BodyMetricForm
              action={createBodyMetricAction.bind(null, clientId)}
              onSuccess={close}
              onCancel={close}
            />
          )}
        </Modal>
      </div>

      {metrics.length === 0 ? (
        <EmptyState
          title="No measurements yet"
          description="Add the first measurement to start building this client's history."
        />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">Date</th>
                {BODY_METRIC_FIELDS.map((f) => (
                  <th key={f.key} className="px-3 py-2 font-medium whitespace-nowrap">
                    {f.label}
                    <span className="ml-1 font-normal">({f.unit})</span>
                  </th>
                ))}
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                >
                  <td className="px-3 py-2 font-medium whitespace-nowrap">
                    {formatDate(m.measured_on)}
                  </td>
                  {BODY_METRIC_FIELDS.map((f) => {
                    const v = m[f.key as keyof BodyMetric];
                    return (
                      <td key={f.key} className="px-3 py-2 whitespace-nowrap">
                        {v != null ? formatNumber(Number(v)) : "-"}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Modal
                        wide
                        title="Edit measurement"
                        trigger={(open) => (
                          <Button variant="ghost" size="sm" onClick={open}>
                            Edit
                          </Button>
                        )}
                      >
                        {(close) => (
                          <BodyMetricForm
                            action={updateBodyMetricAction.bind(null, clientId, m.id)}
                            metric={m}
                            onSuccess={close}
                            onCancel={close}
                          />
                        )}
                      </Modal>
                      <Modal
                        title="Delete measurement?"
                        description={`This removes the entry from ${formatDate(m.measured_on)}.`}
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
                            <form action={deleteBodyMetricAction.bind(null, clientId, m.id)}>
                              <DeleteButton />
                            </form>
                          </div>
                        )}
                      </Modal>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
