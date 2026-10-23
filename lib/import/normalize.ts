/**
 * Cell-value coercion for imported Excel data. Pure helpers: turn whatever a
 * spreadsheet cell holds (strings with units, Excel date serials, "M"/"Female",
 * "120/80") into the shapes the zod schemas and data layer expect.
 */

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function isoFrom(y: number, m: number, d: number): string | null {
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** Excel serial date → ISO. Excel's epoch is 1899-12-30 (the 1900 leap-year bug). */
function fromExcelSerial(serial: number): string | null {
  if (!Number.isFinite(serial) || serial <= 0 || serial > 60000) return null;
  const ms = Math.round(serial) * 86400000;
  const d = new Date(Date.UTC(1899, 11, 30) + ms);
  return isoFrom(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/**
 * Parse a date cell to ISO `yyyy-mm-dd`, or null. Ambiguous numeric formats
 * (dd/mm vs mm/dd) are read as **day-first** (India/EU convention) unless the
 * first part is clearly > 12.
 */
export function parseDate(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return isoFrom(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }
  const raw = String(value).trim();
  if (!raw) return null;

  // Pure number → Excel serial.
  if (/^\d+(\.\d+)?$/.test(raw)) {
    const n = Number(raw);
    if (n > 31) return fromExcelSerial(n);
  }

  // ISO yyyy-mm-dd
  let m = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) return isoFrom(+m[1], +m[2], +m[3]);

  // dd/mm/yyyy or mm/dd/yyyy (day-first unless first part > 12)
  m = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (m) {
    const a = +m[1];
    const b = +m[2];
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    if (a > 12 && b <= 12) return isoFrom(y, b, a); // clearly dd/mm
    if (b > 12 && a <= 12) return isoFrom(y, a, b); // clearly mm/dd
    return isoFrom(y, b, a); // ambiguous → day-first
  }

  // "12 Jan 2020" / "Jan 12 2020" / "12 January 2020"
  m = raw.match(/^(\d{1,2})\s+([a-z]{3,})\s+(\d{2,4})$/i);
  if (m) {
    const mon = MONTHS[m[2].slice(0, 3).toLowerCase()];
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    if (mon) return isoFrom(y, mon, +m[1]);
  }
  m = raw.match(/^([a-z]{3,})\s+(\d{1,2}),?\s+(\d{2,4})$/i);
  if (m) {
    const mon = MONTHS[m[1].slice(0, 3).toLowerCase()];
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    if (mon) return isoFrom(y, mon, +m[2]);
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return isoFrom(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
  }
  return null;
}

/** Strip units/symbols and parse a number ("72 kg" → 72, "18%" → 18). */
export function toNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  if (!cleaned) return null;
  const n = Number(cleaned[0]);
  return Number.isFinite(n) ? n : null;
}

export function cleanText(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s ? s : null;
}

export type SexValue = "male" | "female" | "other" | "unspecified";

export function toSex(value: unknown): SexValue {
  const s = String(value ?? "").trim().toLowerCase();
  if (!s) return "unspecified";
  if (s === "m" || s.startsWith("male") || s === "man") return "male";
  if (s === "f" || s.startsWith("female") || s === "woman") return "female";
  if (s.startsWith("other") || s.startsWith("non")) return "other";
  return "unspecified";
}

/** Split a "120/80" cell into systolic/diastolic. */
export function splitBloodPressure(value: unknown): { systolic: number | null; diastolic: number | null } {
  const s = String(value ?? "").trim();
  const m = s.match(/(\d{2,3})\s*[/\\]\s*(\d{2,3})/);
  if (!m) return { systolic: null, diastolic: null };
  return { systolic: Number(m[1]), diastolic: Number(m[2]) };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function looksLikeEmail(value: unknown): boolean {
  return EMAIL_RE.test(String(value ?? "").trim());
}

/** Age in years → an approximate date of birth (Jan 1 of the birth year). */
export function ageToDob(value: unknown, today: Date = new Date()): string | null {
  const n = toNumber(value);
  if (n == null || n <= 0 || n > 120) return null;
  return isoFrom(today.getFullYear() - Math.round(n), 1, 1);
}
