/**
 * Movement catalog — one curated library per training modality, merged into a
 * single lookup. The plan editor and logger search this filtered to the plan's
 * modality (with a "show all" escape hatch), so a yoga coach sees poses and a
 * calisthenics coach sees skill progressions — not a wall of barbell lifts.
 *
 * Add a stream: author lib/catalog/movements/<modality>.ts as MovementGroup[],
 * import it, and add it to SOURCES below. Nothing else changes.
 */

import type { Modality } from "@/lib/catalog/modalities";
import { STRENGTH_GROUPS } from "./strength";
import { CALISTHENICS_GROUPS } from "./calisthenics";
import { MOBILITY_GROUPS } from "./mobility";
import { CONDITIONING_GROUPS } from "./conditioning";
import { LONGEVITY_GROUPS } from "./longevity";
import { LIFESTYLE_GROUPS } from "./lifestyle";
import { RUNNING_GROUPS } from "./running";

/** Compact authoring shape: a named group holding movement names. */
export interface MovementGroup {
  group: string;
  names: string[];
}

/** A single movement, tagged with the modality and group it belongs to. */
export interface MovementDef {
  name: string;
  group: string;
  modality: Modality;
}

/** Per-modality source libraries. Modalities without a file fall back to custom
 * typing / "show all" until their library is authored. */
const SOURCES: Partial<Record<Modality, MovementGroup[]>> = {
  strength: STRENGTH_GROUPS,
  calisthenics: CALISTHENICS_GROUPS,
  mobility: MOBILITY_GROUPS,
  conditioning: CONDITIONING_GROUPS,
  longevity: LONGEVITY_GROUPS,
  lifestyle: LIFESTYLE_GROUPS,
  running: RUNNING_GROUPS,
};

function flatten(modality: Modality, groups: MovementGroup[]): MovementDef[] {
  return groups.flatMap((g) => g.names.map((name) => ({ name, group: g.group, modality })));
}

export const MOVEMENTS_BY_MODALITY: Partial<Record<Modality, MovementDef[]>> =
  Object.fromEntries(
    (Object.entries(SOURCES) as [Modality, MovementGroup[]][]).map(([m, groups]) => [
      m,
      flatten(m, groups),
    ]),
  );

export const ALL_MOVEMENTS: MovementDef[] = Object.values(MOVEMENTS_BY_MODALITY).flat();

export const EXERCISE_NAMES: string[] = [...new Set(ALL_MOVEMENTS.map((m) => m.name))];

/** name (lowercased) → its group, for progress aggregation. First definition wins
 * when a name is shared across modalities (e.g. a push-up). */
export const GROUP_BY_EXERCISE: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const m of ALL_MOVEMENTS) {
    const key = m.name.toLowerCase();
    if (!(key in out)) out[key] = m.group;
  }
  return out;
})();

/** The library for one modality, or every movement when "all". */
export function movementsForModality(modality: Modality | "all"): MovementDef[] {
  if (modality === "all") return ALL_MOVEMENTS;
  return MOVEMENTS_BY_MODALITY[modality] ?? [];
}

/** Whether a modality has its own authored library (vs. relying on custom typing). */
export function hasMovementLibrary(modality: Modality): boolean {
  return (MOVEMENTS_BY_MODALITY[modality]?.length ?? 0) > 0;
}

/** Autocomplete over a modality's library (prefix matches first, then contains). */
export function searchMovements(
  query: string,
  modality: Modality | "all" = "all",
  limit = 10,
): MovementDef[] {
  const pool = movementsForModality(modality);
  const q = query.trim().toLowerCase();
  if (!q) return pool.slice(0, limit);
  const starts: MovementDef[] = [];
  const contains: MovementDef[] = [];
  for (const e of pool) {
    const n = e.name.toLowerCase();
    if (n.startsWith(q)) starts.push(e);
    else if (n.includes(q)) contains.push(e);
  }
  return [...starts, ...contains].slice(0, limit);
}
