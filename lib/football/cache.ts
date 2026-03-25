/**
 * Cache strategy configuration for football data.
 *
 * Different data types require different freshness guarantees:
 *  - Live scores / events:           30 s  (score can change any minute)
 *  - Today's fixture list:           5 min (new kick-offs, postponements)
 *  - League standings:               5 min (only changes after FT)
 *  - Finished match detail:          1 h   (immutable once FT)
 *  - Team metadata:                  1 h   (rarely changes)
 *
 * These constants are used by RealFootballProvider's fetch calls
 * (next: { revalidate: CACHE_TTL.X }) and can be passed to
 * revalidatePath / revalidateTag in on-demand revalidation handlers.
 */

// ---------------------------------------------------------------------------
// TTL constants (seconds)
// ---------------------------------------------------------------------------

export const CACHE_TTL = {
  /** Live match data — score, minute, events */
  LIVE: 30,
  /**
   * Today's fixture list — kick-off times, status changes, postponements.
   *
   * Reduced from 300 s → 60 s so that status transitions (NS → 1H → HT → FT)
   * are visible within 1 minute.  The in-process Map cache in RealFootballProvider
   * deduplicates concurrent requests within the same render cycle, so the
   * actual API call rate stays low even on a busy server.
   */
  FIXTURES_TODAY: 60,
  /** Recent results list */
  RESULTS: 300,
  /** League standings table */
  STANDINGS: 3_600,
  /** Match detail while the match is in progress */
  MATCH_DETAIL_LIVE: 30,
  /** Match detail for a finished match (immutable) */
  MATCH_DETAIL_FINISHED: 3_600,
  /** Team info — badge URL, venue */
  TEAM: 3_600,
  /** Squad roster — changes infrequently, refresh daily */
  SQUAD: 86_400,
} as const;

// ---------------------------------------------------------------------------
// Cache tag helpers
// ---------------------------------------------------------------------------

/**
 * Returns the cache tags for a given data type and optional ID.
 * Use with `revalidateTag(tag)` in API route handlers to do on-demand ISR.
 *
 * @example
 *   // In a cron sync route:
 *   import { revalidateTag } from "next/cache";
 *   cacheTags("standings", 39).forEach(revalidateTag);
 */
export function cacheTags(
  type: "fixtures" | "standings" | "match" | "team" | "squad",
  id?: number | string
): string[] {
  const base: string[] = [type];
  if (id !== undefined) base.push(`${type}:${id}`);
  return base;
}
