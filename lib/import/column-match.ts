/**
 * Heuristic header → target-field matcher. Pure and side-effect free so it can be
 * unit-tested and run in the browser. Strategy: normalize the header, try an exact
 * synonym hit first, then a whole-word fuzzy-contains, scoring by synonym length so
 * the most specific synonym wins ("body fat %" beats "fat").
 */
import { IMPORT_FIELDS } from "./fields";

export function normalizeHeader(raw: string): string {
  return String(raw ?? "")
    .toLowerCase()
    .replace(/[_\-/\\.]+/g, " ") // punctuation → space
    .replace(/[()[\]{}:]+/g, " ")
    .replace(/%/g, " percent ")
    .replace(/\s+/g, " ")
    .trim();
}

// Pre-normalize every synonym once.
const FIELD_SYNONYMS: { key: string; synonyms: string[] }[] = IMPORT_FIELDS.map((f) => ({
  key: f.key,
  synonyms: Array.from(new Set([f.label, ...f.synonyms].map(normalizeHeader))).filter(Boolean),
}));

function wordsContain(haystack: string, needle: string): boolean {
  if (!needle) return false;
  // whole-word (or whole-phrase) boundary match
  const re = new RegExp(`(^|\\s)${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`);
  return re.test(haystack);
}

/** Returns the best-matching target field key, or null when nothing is confident. */
export function matchColumn(header: string): string | null {
  const norm = normalizeHeader(header);
  if (!norm) return null;

  // 1. exact synonym match
  for (const field of FIELD_SYNONYMS) {
    if (field.synonyms.includes(norm)) return field.key;
  }

  // 2. fuzzy whole-word contains; prefer the longest matching synonym.
  let best: { key: string; score: number } | null = null;
  for (const field of FIELD_SYNONYMS) {
    for (const syn of field.synonyms) {
      if (syn.length < 2) continue;
      if (wordsContain(norm, syn) || wordsContain(syn, norm)) {
        const score = syn.length;
        if (!best || score > best.score) best = { key: field.key, score };
      }
    }
  }
  return best?.key ?? null;
}

/**
 * Auto-map a header row to target fields. Scalar fields are claimed by the first
 * column that wins them (except `notes`, which can take several columns); later
 * columns that would collide are left unmapped for the trainer to resolve.
 */
export function autoMap(headers: string[]): Record<number, string> {
  const mapping: Record<number, string> = {};
  const claimed = new Set<string>();
  headers.forEach((h, i) => {
    const key = matchColumn(h);
    if (!key) return;
    if (key !== "notes" && claimed.has(key)) return;
    mapping[i] = key;
    claimed.add(key);
  });
  return mapping;
}
