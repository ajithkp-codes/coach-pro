/**
 * Backward-compatible facade over the modality-aware movement catalog
 * (lib/catalog/movements). Existing callers that don't care about modality keep
 * working; new, modality-filtered search lives in ./movements.
 */

import { searchMovements, type MovementDef } from "./movements";

export { GROUP_BY_EXERCISE, EXERCISE_NAMES } from "./movements";
export type ExerciseDef = MovementDef;

/** Autocomplete across every modality's library (modality-agnostic). */
export function searchExercises(query: string, limit = 8): MovementDef[] {
  return searchMovements(query, "all", limit);
}
