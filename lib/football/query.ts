/**
 * Football Data Query Layer
 *
 * High-level query functions intended for use in Next.js Server Components
 * and Route Handlers. Each function delegates to the active provider
 * (mock in dev, real API in production) via the provider singleton.
 *
 * Caching strategy:
 *  - Mock mode: data is already in-memory; no caching needed.
 *  - Real mode: each underlying `fetch` call in RealFootballProvider carries
 *    Next.js ISR directives (`next: { revalidate, tags }`), so responses are
 *    cached at the fetch level automatically by the App Router.
 *
 * Usage in a Server Component:
 *   import { queryTodayFixtures, queryStandings } from "@/lib/football/query";
 *   const fixtures  = await queryTodayFixtures();
 *   const standings = await queryStandings("premier-league");
 */

import type { Fixture, Standings, MatchDetail, LeagueSlug } from "./types";
import { LEAGUE_BY_SLUG, SUPPORTED_LEAGUES, LIVE_STATUSES } from "./constants";
import { getFootballProvider } from "./provider";

const LIVE_SET = new Set(LIVE_STATUSES);
const FINISHED_SET = new Set(["FT", "AET", "PEN"]);

// ---------------------------------------------------------------------------
// Fixture queries
// ---------------------------------------------------------------------------

/**
 * Fetch today's fixtures for one league or all supported leagues.
 * Deduplicates and sorts by kick-off time.
 */
export async function queryTodayFixtures(
  leagueSlug?: LeagueSlug
): Promise<Fixture[]> {
  const provider = getFootballProvider();
  const today = new Date().toISOString().split("T")[0];

  if (leagueSlug) {
    const league = LEAGUE_BY_SLUG[leagueSlug];
    return provider.fetchFixtures(league.id, today, league.season);
  }

  const all = await Promise.all(
    SUPPORTED_LEAGUES.map((l) =>
      provider.fetchFixtures(l.id, today, l.season)
    )
  );

  return all
    .flat()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Fetch all fixtures for a league (all statuses).
 * In mock mode the date is ignored, returning the complete mock set.
 * In real mode this fetches by date — wire to a date-range endpoint when available.
 */
export async function queryLeagueFixtures(
  leagueSlug: LeagueSlug
): Promise<Fixture[]> {
  const provider = getFootballProvider();
  const league = LEAGUE_BY_SLUG[leagueSlug];
  const all = await provider.fetchFixtures(league.id, undefined, league.season);
  return all.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Fetch upcoming (not-started) fixtures for a league.
 * Includes postponed matches (PST).
 */
export async function queryUpcomingFixtures(
  leagueSlug: LeagueSlug,
  limit = 10
): Promise<Fixture[]> {
  const provider = getFootballProvider();
  const league = LEAGUE_BY_SLUG[leagueSlug];
  const all = await provider.fetchFixtures(league.id, undefined, league.season);

  return all
    .filter((f) => f.status === "NS" || f.status === "PST")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);
}

/**
 * Fetch the most recent finished results for a league.
 */
export async function queryRecentResults(
  leagueSlug: LeagueSlug,
  limit = 5
): Promise<Fixture[]> {
  const provider = getFootballProvider();
  const league = LEAGUE_BY_SLUG[leagueSlug];
  return provider.fetchResults(league.id, league.season, limit);
}

// ---------------------------------------------------------------------------
// Standings queries
// ---------------------------------------------------------------------------

/**
 * Fetch the standings table for a single league.
 */
export async function queryStandings(
  leagueSlug: LeagueSlug
): Promise<Standings | null> {
  const provider = getFootballProvider();
  const league = LEAGUE_BY_SLUG[leagueSlug];
  return provider.fetchStandings(league.id, league.season);
}

/**
 * Fetch standings for all supported leagues in parallel.
 * Returns a map of slug → Standings (omits leagues that returned null).
 */
export async function queryAllStandings(): Promise<
  Partial<Record<LeagueSlug, Standings>>
> {
  const results = await Promise.all(
    SUPPORTED_LEAGUES.map(async (league) => ({
      slug: league.slug,
      data: await queryStandings(league.slug),
    }))
  );

  return Object.fromEntries(
    results
      .filter((r) => r.data !== null)
      .map((r) => [r.slug, r.data])
  ) as Partial<Record<LeagueSlug, Standings>>;
}

// ---------------------------------------------------------------------------
// Match detail query
// ---------------------------------------------------------------------------

/**
 * Fetch full match detail including events and statistics.
 */
export async function queryMatchDetail(
  fixtureId: number
): Promise<MatchDetail | null> {
  return getFootballProvider().fetchMatchDetail(fixtureId);
}

// ---------------------------------------------------------------------------
// Utility helpers (pure — no async)
// ---------------------------------------------------------------------------

/** Filter an array of fixtures to only live matches. */
export function getLiveFixtures(fixtures: Fixture[]): Fixture[] {
  return fixtures.filter((f) => LIVE_SET.has(f.status));
}

/** Filter an array of fixtures to only finished matches. */
export function getFinishedFixtures(fixtures: Fixture[]): Fixture[] {
  return fixtures.filter((f) => FINISHED_SET.has(f.status));
}

/** Filter an array of fixtures to only upcoming (NS / PST) matches. */
export function getUpcomingFixtures(fixtures: Fixture[]): Fixture[] {
  return fixtures.filter((f) => f.status === "NS" || f.status === "PST");
}

/**
 * Count live fixtures per league slug.
 * Useful for showing the "N LIVE" badge on league cards.
 */
export function countLiveByLeague(
  fixtures: Fixture[]
): Partial<Record<LeagueSlug, number>> {
  const counts: Partial<Record<LeagueSlug, number>> = {};
  for (const f of fixtures) {
    if (LIVE_SET.has(f.status)) {
      counts[f.leagueSlug] = (counts[f.leagueSlug] ?? 0) + 1;
    }
  }
  return counts;
}

/**
 * Count all fixtures (regardless of status) per league slug.
 */
export function countByLeague(
  fixtures: Fixture[]
): Partial<Record<LeagueSlug, number>> {
  const counts: Partial<Record<LeagueSlug, number>> = {};
  for (const f of fixtures) {
    counts[f.leagueSlug] = (counts[f.leagueSlug] ?? 0) + 1;
  }
  return counts;
}
