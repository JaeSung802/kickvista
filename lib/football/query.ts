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
// KST date utility
// ---------------------------------------------------------------------------

/**
 * Returns a YYYY-MM-DD date string in KST (Asia/Seoul, UTC+9).
 *
 * WHY: `new Date().toISOString()` always returns UTC. When the server runs in
 * UTC, calling it at 09:30 KST on March 25 returns "2026-03-24T00:30:00Z" —
 * the API receives yesterday's date and returns yesterday's fixtures.
 *
 * Uses `Intl.DateTimeFormat` with timeZone "Asia/Seoul" instead of manual
 * UTC+9 arithmetic — explicit, readable, and immune to off-by-one errors.
 *
 * @param offsetDays Positive = future days, negative = past days.
 */
function kstDateString(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  // formatToParts guarantees YYYY-MM-DD regardless of Node.js locale data.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// Fixture queries
// ---------------------------------------------------------------------------

/**
 * Fetch home-page matches for the 4 main leagues (PL, La Liga, Bundesliga, Serie A).
 *
 * Fallback chain per league:
 *   1. Range query: 오늘 + 다음 7일 (timezone Asia/Seoul) — finished/live/upcoming 모두 포함
 *   2. Next 10 upcoming fixtures      — 오늘~7일 범위에 경기가 없을 때 (국제 A매치 기간 등)
 *
 * 과거 종료 경기(fetchFixturesLast)는 홈 일정에 사용하지 않는다.
 * 오늘 날짜의 finished/live/upcoming 경기는 모두 유지된다.
 *
 * Returns deduplicated, kickoff-sorted fixtures for the first 3 match days found.
 */
export async function queryHomeMatches(): Promise<Fixture[]> {
  const provider = getFootballProvider();
  const HOME_SLUGS: LeagueSlug[] = ["premier-league", "la-liga", "bundesliga", "serie-a"];

  // Filter out any slug that isn't registered in LEAGUE_BY_SLUG — prevents
  // "Cannot read properties of undefined (reading 'id')" crashes at runtime.
  const leagues = HOME_SLUGS
    .map((s) => LEAGUE_BY_SLUG[s])
    .filter((l): l is (typeof LEAGUE_BY_SLUG)[LeagueSlug] => {
      if (!l) console.error(`[queryHomeMatches] LEAGUE_BY_SLUG lookup failed for a HOME_SLUG`);
      return Boolean(l);
    });

  // KST dates: using toISOString() would return UTC and show yesterday's date
  // in Korean morning hours (UTC+9 is 9 h ahead of UTC).
  const from = kstDateString(0);
  const to   = kstDateString(7);

  // calendar year vs football season: 2026 calendar year → season param 2025 (2025-26)
  console.log(`[queryHomeMatches] KST: ${from}→${to} | calYear=${new Date().getFullYear()} season=${leagues[0]?.season}`);

  const allFixtures = await Promise.all(
    leagues.map(async (league): Promise<Fixture[]> => {
      // 1st: date range (today → +7 days, KST)
      try {
        const primary = await provider.fetchFixturesRange(league.id, from, to, league.season);
        if (primary.length > 0) return primary;
      } catch (err) {
        console.error(`[matches] league=${league.id} primary failed:`, err);
      }

      // 2nd: next 10 upcoming
      try {
        const next = await provider.fetchFixturesNext(league.id, league.season, 10);
        return next;
      } catch (err) {
        console.error(`[matches] league=${league.id} fallback next failed:`, err);
        return [];
      }
    })
  );

  // Dedupe by fixture.id, sort by kickoff time
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

  // 가장 이른 고유 날짜 3개를 선택해 그 날짜의 경기를 모두 반환한다.
  // fixture.date는 timezone=Asia/Seoul 요청으로 +09:00 offset이므로
  // .slice(0, 10)이 올바른 KST YYYY-MM-DD를 반환한다.
  const firstThreeDates = [
    ...new Set(merged.map((fixture) => fixture.date.slice(0, 10))),
  ].slice(0, 3);

  const allowedDates = new Set(firstThreeDates);

  return merged.filter((fixture) =>
    allowedDates.has(fixture.date.slice(0, 10))
  );
}

/**
 * Fetch today's fixtures for one league or all supported leagues.
 * Deduplicates and sorts by kick-off time.
 */
export async function queryTodayFixtures(
  leagueSlug?: LeagueSlug
): Promise<Fixture[]> {
  const provider = getFootballProvider();
  const today = kstDateString(0); // KST date — avoids UTC midnight off-by-one
  console.log(`[queryTodayFixtures] KST: ${today} | calYear=${new Date().getFullYear()}`);

  if (leagueSlug) {
    const league = LEAGUE_BY_SLUG[leagueSlug];
    if (!league) {
      console.error(`[queryTodayFixtures] unknown leagueSlug: ${leagueSlug}`);
      return [];
    }
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
  if (!league) {
    console.error(`[queryLeagueFixtures] unknown leagueSlug: ${leagueSlug}`);
    return [];
  }

  // Try a wide date range first (today -30 days to +60 days, KST)
  const from = kstDateString(-30);
  const to   = kstDateString(60);

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
 *
 * NOTE: PST(postponed) fixtures are not included — fetchFixturesNext uses
 * status=NS only. This is an intentional behavior change from the previous
 * implementation which filtered fetchFixtures(today) for NS|PST.
 */
export async function queryUpcomingFixtures(
  leagueSlug: LeagueSlug,
  limit = 10
): Promise<Fixture[]> {
  const provider = getFootballProvider();
  const league = LEAGUE_BY_SLUG[leagueSlug];
  if (!league) {
    console.error(`[queryUpcomingFixtures] unknown leagueSlug: ${leagueSlug}`);
    return [];
  }
  const fixtures = await provider.fetchFixturesNext(league.id, league.season, limit);

  return [...fixtures]
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
  if (!league) {
    console.error(`[queryRecentResults] unknown leagueSlug: ${leagueSlug}`);
    return [];
  }
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
  if (!league) {
    console.error(`[queryStandings] unknown leagueSlug: ${leagueSlug}`);
    return null;
  }
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
