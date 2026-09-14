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

/**
 * Format a YYYY-MM-DD date key for compact display (recent results, etc.).
 * Year is shown only when it differs from the current KST year.
 *
 * KO: "9월 7일" / "2025년 5월 11일"
 * EN: "7 Sept"  / "11 May 2025"
 *
 * Uses UTC noon to ensure the calendar date never drifts across midnight.
 */
export function formatFixtureDate(dateKey: string, locale: "ko" | "en"): string {
  const [y, mo, d] = dateKey.split("-").map(Number);
  const kstYear = Number(kstParts(new Date()).year);
  const utcNoon = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: "UTC",
    month:    "short",
    day:      "numeric",
  };
  if (y !== kstYear) opts.year = "numeric";
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-GB", opts).format(utcNoon);
}

/**
 * Format a YYYY-MM-DD date key for use as a date-group section header.
 *
 * showYear=true  (FixturesTabView): long weekday + year
 *   KO: "2026년 9월 7일 월요일"       EN: "Monday, 7 September 2026"
 *
 * showYear=false (results page): short weekday, no year
 *   KO: "9월 7일 (월)"               EN: "Mon 7 September"
 *
 * Uses UTC noon to prevent date from shifting across timezone boundaries.
 */
export function formatFixtureDateHeader(
  dateKey: string,
  locale:  "ko" | "en",
  showYear: boolean,
): string {
  if (dateKey === "unknown") return locale === "ko" ? "날짜 미정" : "Date TBD";
  const [y, mo, d] = dateKey.split("-").map(Number);
  const utcNoon = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: "UTC",
    month:    "long",
    day:      "numeric",
    weekday:  showYear ? "long" : "short",
  };
  if (showYear) opts.year = "numeric";
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-GB", opts).format(utcNoon);
}

/**
 * Format an ISO instant as a full date-time string in KST.
 * Used by the match detail page header.
 *
 * KO: "2026년 9월 7일 오후 11:00"
 * EN: "7 September 2026 at 23:00"
 */
export function formatMatchDateTime(isoDate: string, locale: "ko" | "en"): string {
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-GB", {
    timeZone:  KST_TZ,
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(isoDate));
}
