"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { HealthMarkerForm } from "./health-marker-form";
import { markerLabel, MARKER_BY_KEY } from "@/lib/catalog/markers";
import { formatDate, formatNumber } from "@/lib/format";
import {
  createHealthMarkerAction,
  updateHealthMarkerAction,
  deleteHealthMarkerAction,
} from "@/app/(dashboard)/clients/[id]/markers/actions";
import type { HealthMarker } from "@/lib/types";

function rangeTone(m: HealthMarker): "success" | "warning" | null {
  const def = MARKER_BY_KEY[m.marker_key];
  if (!def) return null;
  const below = def.refLow !== undefined && m.value < def.refLow;
  const above = def.refHigh !== undefined && m.value > def.refHigh;
  if (below || above) return "warning";
  if (def.refLow !== undefined || def.refHigh !== undefined) return "success";
  return null;
}

export function MarkersPanel({
  clientId,
  markers,
}: {
  clientId: string;
  markers: HealthMarker[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {markers.length} reading{markers.length === 1 ? "" : "s"} on record
        </p>
        <Modal
          wide
          title="Add health marker"
          description="Record a clinical reading for a date."
          trigger={(open) => (
            <Button onClick={open}>
              <Icon name="plus" size={16} /> Add reading
            </Button>
          )}
        >
          {(close) => (
            <HealthMarkerForm
              action={createHealthMarkerAction.bind(null, clientId)}
              onSuccess={close}
              onCancel={close}
            />
          )}
        </Modal>
      </div>

      {markers.length === 0 ? (
        <EmptyState
          title="No markers yet"
          description="Record blood sugar, cholesterol, vitamin D, blood pressure and more."
        />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius)] border border-border bg-card">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Marker</th>
                <th className="px-3 py-2 font-medium">Value</th>
                <th className="px-3 py-2 font-medium">Notes</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {markers.map((m) => {
                const tone = rangeTone(m);
                return (
                  <tr
                    key={m.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-3 py-2 font-medium whitespace-nowrap">
                      {formatDate(m.measured_on)}
                    </td>
                    <td className="px-3 py-2">
                      {markerLabel(m.marker_key, m.custom_name)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="font-medium">
                        {formatNumber(m.value, m.unit)}
                      </span>
                      {tone && (
                        <Badge tone={tone} className="ml-2">
                          {tone === "warning" ? "Out of range" : "In range"}
                        </Badge>
                      )}
                    </td>
                    <td className="max-w-[16rem] truncate px-3 py-2 text-muted-foreground">
                      {m.notes || "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <Modal
                          wide
                          title="Edit reading"
                          trigger={(open) => (
                            <Button variant="ghost" size="sm" onClick={open}>
                              Edit
                            </Button>
                          )}
                        >
                          {(close) => (
                            <HealthMarkerForm
                              action={updateHealthMarkerAction.bind(null, clientId, m.id)}
                              marker={m}
                              onSuccess={close}
                              onCancel={close}
                            />
                          )}
                        </Modal>
                        <Modal
                          title="Delete reading?"
                          description={`This removes the ${markerLabel(m.marker_key, m.custom_name)} reading from ${formatDate(m.measured_on)}.`}
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
                              <form
                                action={deleteHealthMarkerAction.bind(null, clientId, m.id)}
                              >
                                <Button type="submit" variant="danger">
                                  Delete
                                </Button>
                              </form>
                            </div>
                          )}
                        </Modal>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
