/**
 * Shared date/time helpers for football fixture display.
 *
 * All functions use Asia/Seoul (KST, UTC+9) as the canonical timezone.
 * This guarantees identical results regardless of the server's TZ setting.
 * Safe to import from both Server Components and Client Components.
 */

const KST_TZ = "Asia/Seoul";

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

function kstParts(date: Date): { year: string; month: string; day: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: KST_TZ,
    year:  "numeric",
    month: "2-digit",
    day:   "2-digit",
  }).formatToParts(date);
  return {
    year:  parts.find(p => p.type === "year")?.value  ?? "0000",
    month: parts.find(p => p.type === "month")?.value ?? "01",
    day:   parts.find(p => p.type === "day")?.value   ?? "01",
  };
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Convert an ISO instant to a YYYY-MM-DD date key in KST.
 * Replaces `fixture.date.slice(0, 10)` which was UTC-based.
 *
 * 2026-09-07T15:30:00+00:00 → "2026-09-08"  (00:30 KST next day)
 */
export function fixtureDateKey(isoDate: string): string {
  const { year, month, day } = kstParts(new Date(isoDate));
  return `${year}-${month}-${day}`;
}

/**
 * Convert an ISO instant to "HH:mm" in KST.
 * hourCycle "h23" ensures midnight displays as "00:00", never "24:00".
 *
 * 2026-09-07T15:30:00+00:00 → "00:30"
 */
export function fixtureTimeKST(isoDate: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone:  KST_TZ,
    hour:      "2-digit",
    minute:    "2-digit",
    hourCycle: "h23",
  }).format(new Date(isoDate));
}
