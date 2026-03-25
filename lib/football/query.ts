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
 * Fetch home-page matches for the 4 main leagues (PL, La Liga, Bundesliga, Serie A).
 *
 * Fallback chain per league:
 *   1. Range query: today → +2 days (timezone Asia/Seoul) — catches today + tomorrow
 *   2. Last 10 finished results       — shown when there's a mid-week break
 *   3. Next 10 upcoming fixtures      — shown during pre-season / international breaks
 *
 * Returns deduplicated, sorted, max-20 fixtures — always non-empty when the API
 * is healthy and the season is active.
 */
export async function queryHomeMatches(): Promise<Fixture[]> {
  const provider = getFootballProvider();
  const HOME_SLUGS: LeagueSlug[] = ["premier-league", "la-liga", "bundesliga", "serie-a"];
  const leagues = HOME_SLUGS.map((s) => LEAGUE_BY_SLUG[s]);

  const now   = new Date();
  const from  = now.toISOString().split("T")[0];
  const toRaw = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const to    = toRaw.toISOString().split("T")[0];

  const allFixtures = await Promise.all(
    leagues.map(async (league): Promise<Fixture[]> => {
      // 1st: date range (today → +2 days, KST)
      try {
        const primary = await provider.fetchFixturesRange(league.id, from, to, league.season);
        if (primary.length > 0) return primary;
      } catch (err) {
        console.error(`[matches] league=${league.id} primary failed:`, err);
      }

      // 2nd: last 10 finished
      try {
        const last = await provider.fetchFixturesLast(league.id, league.season, 10);
        if (last.length > 0) return last;
      } catch (err) {
        console.error(`[matches] league=${league.id} fallback last failed:`, err);
      }

      // 3rd: next 10 upcoming
      try {
        const next = await provider.fetchFixturesNext(league.id, league.season, 10);
        return next;
      } catch (err) {
        console.error(`[matches] league=${league.id} fallback next failed:`, err);
        return [];
      }
    })
  );

  // Dedupe by fixture.id, sort by kickoff time, cap at 20
  const seen = new Set<number>();
  const merged: Fixture[] = [];
  for (const fixtures of allFixtures) {
    for (const f of fixtures) {
      if (!seen.has(f.id)) {
        seen.add(f.id);
        merged.push(f);
      }
    }
  }
  merged.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return merged.slice(0, 20);
}

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
    SUPPORTED_LEAGUES.map(async (l) => {
      try {
        return await provider.fetchFixtures(l.id, today, l.season);
      } catch (err) {
        console.error(`[query] fetchFixtures failed for ${l.slug}:`, err);
        return [] as Fixture[];
      }
    })
  );

  return all.flat().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Fetch all fixtures for a league (all statuses).
 * Combines last 10 finished results + next 10 upcoming fixtures so the page
 * always has data regardless of whether there are games today.
 */
export async function queryLeagueFixtures(
  leagueSlug: LeagueSlug
): Promise<Fixture[]> {
  const provider = getFootballProvider();
  const league = LEAGUE_BY_SLUG[leagueSlug];

  // Try a wide date range first (today -30 days to +60 days)
  const now   = new Date();
  const from  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const to    = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  try {
    const rangeFixtures = await provider.fetchFixturesRange(league.id, from, to, league.season);
    if (rangeFixtures.length > 0) {
      return rangeFixtures.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
  } catch (err) {
    console.error(`[queryLeagueFixtures] range failed for ${leagueSlug}:`, err);
  }

  // Fallback: merge last 10 finished + next 10 upcoming
  const [last, next] = await Promise.all([
    provider.fetchFixturesLast(league.id, league.season, 10).catch(() => [] as Fixture[]),
    provider.fetchFixturesNext(league.id, league.season, 10).catch(() => [] as Fixture[]),
  ]);

  const seen = new Set<number>();
  const merged: Fixture[] = [];
  for (const f of [...last, ...next]) {
    if (!seen.has(f.id)) { seen.add(f.id); merged.push(f); }
  }
  return merged.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
  try {
    const result = await provider.fetchStandings(league.id, league.season);
    return result;
  } catch (err) {
    console.error(`[query] fetchStandings failed for ${leagueSlug}:`, err);
    return null;
  }
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

/**
 * Fetch per-player statistics for a finished fixture (ratings, goals, assists).
 * Used for Man of the Match selection. Returns [] on error.
 */
export async function queryFixturePlayers(fixtureId: number) {
  try {
    return await getFootballProvider().fetchFixturePlayers(fixtureId);
  } catch {
    return [];
  }
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
