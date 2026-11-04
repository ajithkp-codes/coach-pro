import "server-only";
import { getClient } from "@/lib/data/clients";
import { listHealthMarkers } from "@/lib/data/healthMarkers";
import { listGoals } from "@/lib/data/goals";
import { latestMetricValue } from "@/lib/data/bodyMetrics";
import { MARKER_BY_KEY, markerLabel } from "@/lib/catalog/markers";
import type { Sex } from "@/lib/types";

/**
 * A read-only snapshot of what the app ALREADY knows about a client, assembled
 * for the "Generate with AI" workout-plan brief. Nothing new is stored — this
 * just surfaces existing demographics, the latest body metrics, any flagged
 * (out-of-reference) health markers, and open goals so the trainer confirms
 * rather than re-types, and the model plans around the client's real condition.
 */

export interface FlaggedMarker {
  label: string;
  value: number;
  unit: string | null;
  /** Whether the value sits above or below its reference band. */
  direction: "high" | "low";
}

export interface SnapshotGoal {
  title: string;
  targetDate: string | null;
}

export interface ClientTrainingSnapshot {
  name: string;
  firstName: string;
  sex: Sex;
  age: number | null;
  weightKg: number | null;
  heightCm: number | null;
  flaggedMarkers: FlaggedMarker[];
  openGoals: SnapshotGoal[];
}

function ageFromDob(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age < 130 ? age : null;
}

export async function getClientTrainingSnapshot(
  clientId: string,
): Promise<ClientTrainingSnapshot | null> {
  const client = await getClient(clientId);
  if (!client) return null;

  const [markers, goals, weight, height] = await Promise.all([
    listHealthMarkers(clientId),
    listGoals(clientId),
    latestMetricValue(clientId, "weight_kg"),
    latestMetricValue(clientId, "height_cm"),
  ]);

  // Markers come back newest-first, so the first row seen for a key is its
  // latest reading. Flag it when it falls outside the catalog reference band.
  const seen = new Set<string>();
  const flaggedMarkers: FlaggedMarker[] = [];
  for (const m of markers) {
    if (seen.has(m.marker_key)) continue;
    seen.add(m.marker_key);
    const def = MARKER_BY_KEY[m.marker_key];
    if (!def) continue;
    let direction: "high" | "low" | null = null;
    if (def.refHigh != null && m.value > def.refHigh) direction = "high";
    else if (def.refLow != null && m.value < def.refLow) direction = "low";
    if (direction) {
      flaggedMarkers.push({
        label: markerLabel(m.marker_key, m.custom_name),
        value: m.value,
        unit: m.unit ?? def.unit ?? null,
        direction,
      });
    }
  }

  const openGoals: SnapshotGoal[] = goals
    .filter((g) => g.status === "active")
    .slice(0, 5)
    .map((g) => ({ title: g.title, targetDate: g.target_date }));

  const firstName = client.full_name.trim().split(/\s+/)[0] || client.full_name;

  return {
    name: client.full_name,
    firstName,
    sex: client.sex,
    age: ageFromDob(client.date_of_birth),
    weightKg: weight?.value ?? null,
    heightCm: height?.value ?? null,
    flaggedMarkers,
    openGoals,
  };
}
