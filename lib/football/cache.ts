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
  /** Today's fixture list — kick-off times, postponements */
  FIXTURES_TODAY: 300,
  /** League standings table */
  STANDINGS: 300,
  /** Match detail while the match is in progress */
  MATCH_DETAIL_LIVE: 30,
  /** Match detail for a finished match (immutable) */
  MATCH_DETAIL_FINISHED: 3_600,
  /** Team info — badge URL, venue */
  TEAM: 3_600,
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
  type: "fixtures" | "standings" | "match" | "team",
  id?: number | string
): string[] {
  const base: string[] = [type];
  if (id !== undefined) base.push(`${type}:${id}`);
  return base;
}
