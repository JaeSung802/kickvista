import type { Fixture, Standings, MatchDetail, Team, H2HData, H2HRecord, TeamStatistics, FixturePlayerStats, LineupPlayer } from "../types";
import type { IFootballProvider } from "./types";
import { SUPPORTED_LEAGUES } from "../constants";
import {
  normalizeFixtures,
  normalizeStandings,
  normalizeFixture,
  normalizeTeam,
} from "../normalizer";
import { CACHE_TTL, cacheTags } from "../cache";

// ---------------------------------------------------------------------------
// KST date helper (UTC+9)
// ---------------------------------------------------------------------------
// Duplicated from query.ts so this module stays self-contained.
// The fallback in fetchFixtures uses this instead of the plain UTC toISOString().

function kstTodayString(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y   = parts.find((p) => p.type === "year")!.value;
  const m   = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// Module-level in-process dedup cache
//
// Purpose: deduplicate CONCURRENT requests within the same render cycle
// (e.g., the home page requests standings for 4 leagues in Promise.all).
//
// ⚠️  This is NOT a long-term cache — TTL is intentionally short for fixture
//     data (CACHE_TTL.FIXTURES_TODAY = 60 s).  For date-sensitive queries the
//     TTL is overridden to DEDUP_TTL_SECONDS (5 s) so the Map only coalesces
//     requests fired in the same millisecond, not across page refreshes.
//
// Cache key = full URL (includes date parameters, so stale-date bugs are
// impossible for date-range queries).  Date-free endpoints (fetchFixturesLast,
// fetchFixturesNext) use the short 5-second TTL to stay fresh.
// ---------------------------------------------------------------------------

const DEDUP_TTL_SECONDS = 5; // max 5 s dedup for live/today fixture calls

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const _processCache = new Map<string, CacheEntry>();

function cacheGet<T>(key: string): T | undefined {
  const entry = _processCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    _processCache.delete(key);
    return undefined;
  }
  return entry.data as T;
}

function cacheSet(key: string, data: unknown, ttlSeconds: number): void {
  _processCache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

// ---------------------------------------------------------------------------
// RealFootballProvider
//
// Caching strategy:
//
//   모든 쿼리 → apiFetch(..., noStore = false)  (default)
//     → in-process Map dedup cache  (5초 TTL, 동일 렌더 사이클 내 중복 요청 제거)
//     → Next.js Data Cache  (next: { revalidate: TTL })
//       · fixture 쿼리 : CACHE_TTL.FIXTURES_TODAY = 300 s (5분)
//       · standings    : CACHE_TTL.STANDINGS = 3600 s (1시간)
//       · match detail : CACHE_TTL.MATCH_DETAIL_LIVE/FINISHED
//
//   페이지 레벨 ISR (export const revalidate)이 함께 동작하므로,
//   force-dynamic + cache:"no-store" 조합 없이도 신선한 데이터를 유지한다.
// ---------------------------------------------------------------------------

export class RealFootballProvider implements IFootballProvider {
  readonly name = "api-football";
  readonly isMockMode = false;

  private readonly apiKey: string;
  private readonly host: string;

  constructor(apiKey: string, host = "v3.football.api-sports.io") {
    this.apiKey = apiKey;
    this.host = host;
  }

  // ---------------------------------------------------------------------------
  // Private fetch helper
  // ---------------------------------------------------------------------------

  /**
   * @param path      API path + query string  e.g. `/fixtures?date=2026-03-25&league=39`
   * @param revalidate Seconds for Next.js ISR cache.  Ignored when noStore=true.
   * @param tags       Next.js cache tags for on-demand revalidation.
   * @param noStore    When true:
   *                   • bypasses the Next.js Data Cache  (cache: "no-store")
   *                   • bypasses the in-process Map cache (uses only a 5-second
   *                     dedup TTL to coalesce parallel requests in the same cycle)
   *                   Use for all date-sensitive fixture queries.
   */
  private async apiFetch<T>(
    path: string,
    revalidate: number,
    tags?: string[],
    noStore = false,
  ): Promise<T> {
    const url = `https://${this.host}${path}`;

    // ── In-process dedup cache ────────────────────────────────────────────────
    // For noStore queries we still short-circuit if a request for the exact
    // same URL landed within the last 5 seconds (same render cycle).
    const dedupTtl = noStore ? DEDUP_TTL_SECONDS : revalidate;
    const cached = cacheGet<T>(url);
    if (cached !== undefined) {
      return cached;
    }

    // ── Build fetch options ───────────────────────────────────────────────────
    const fetchOptions: RequestInit = {
      headers: { "x-apisports-key": this.apiKey },
      ...(noStore
        // cache: "no-store" bypasses Next.js Data Cache entirely.
        // This is necessary because `next: { revalidate }` on individual
        // fetches takes precedence over the route's `force-dynamic` / `revalidate=0`.
        ? { cache: "no-store" as const }
        : {
            next: {
              revalidate,
              ...(tags?.length ? { tags } : {}),
            },
          }),
    };

    // ── 5-second hard timeout ─────────────────────────────────────────────────
    const fetchPromise   = fetch(url, fetchOptions);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), 5_000)
    );

    let res: Response;
    try {
      res = await Promise.race([fetchPromise, timeoutPromise]);
    } catch (fetchErr) {
      if ((fetchErr as Error).message === "TIMEOUT") {
        console.warn("[real-provider] TIMEOUT (5s) for", path, "— returning empty shape");
      } else {
        console.error("[real-provider] Network error for", path, fetchErr);
      }
      return { response: [] } as T;
    }

    const text = await res.text();

    // ── Rate limit handling ───────────────────────────────────────────────────
    if (!res.ok || res.status === 429) {
      if (text.includes("rateLimit") || text.includes("Too many requests")) {
        console.warn("[real-provider] RATE LIMIT hit for", path, "— returning empty shape");
      } else {
        console.error("[real-provider] HTTP", res.status, "for", path, text.slice(0, 300));
      }
      return { response: [] } as T;
    }

    let json: T;
    try {
      json = JSON.parse(text) as T;
    } catch (parseErr) {
      console.error("[real-provider] JSON parse failed for", path, parseErr);
      return { response: [] } as T;
    }

    // ── API-level error check (HTTP 200 with error body) ──────────────────────
    const errors = (json as Record<string, unknown>)?.errors;
    const hasErrors =
      errors &&
      (Array.isArray(errors)
        ? errors.length > 0
        : typeof errors === "object" && Object.keys(errors).length > 0);

    if (hasErrors) {
      const errStr = JSON.stringify(errors);
      if (errStr.includes("rateLimit") || errStr.includes("Too many")) {
        console.warn("[real-provider] API rate-limit in body for", path, "— returning empty shape");
      } else {
        console.error("[real-provider] API-level errors for", path, errStr);
      }
      return { response: [] } as T;
    }

    // ── 배포 확인용 응답 로그 ─────────────────────────────────────────────────
    // Vercel Functions 탭 또는 로컬 터미널에서 확인.
    // - results: API가 실제로 돌려준 경기 수
    // - params:  API가 수신한 쿼리 파라미터 (date/from/to 날짜가 KST인지 검증)
    // - first:   첫 번째 경기의 킥오프 datetime (어느 날 데이터인지 직접 확인)
    const j = json as Record<string, unknown>;
    const resultCount  = j?.results as number | undefined;
    const apiParams    = j?.parameters;
    const firstItem    = (j?.response as Record<string, unknown>[] | undefined)?.[0];
    const firstFixDate = (firstItem?.fixture as Record<string, unknown>)?.date as string | undefined;
    console.log(
      `[real-provider] ${path.split("?")[0]}`,
      `results=${resultCount ?? 0}`,
      `params=${JSON.stringify(apiParams)}`,
      firstFixDate ? `first_fixture=${firstFixDate}` : "(empty response)",
    );

    // ── Store in process cache ────────────────────────────────────────────────
    cacheSet(url, json, dedupTtl);

    return json;
  }

  // ---------------------------------------------------------------------------
  // IFootballProvider implementation
  // ---------------------------------------------------------------------------

  async fetchFixtures(
    leagueId: number,
    date?: string,
    season?: number
  ): Promise<Fixture[]> {
    const league = SUPPORTED_LEAGUES.find((l) => l.id === leagueId);
    const resolvedSeason = season ?? league?.season ?? new Date().getFullYear();
    // ── Fixed: was `new Date().toISOString()` (UTC) — now uses KST ──────────
    const resolvedDate   = date ?? kstTodayString();

    const data = await this.apiFetch<{ response: unknown[] }>(
      `/fixtures?date=${resolvedDate}&league=${leagueId}&season=${resolvedSeason}`,
      CACHE_TTL.FIXTURES_TODAY,
      cacheTags("fixtures", leagueId),
      // noStore = false — ISR 캐시(5분) 활용, API 호출 빈도 낮춤
    );

    const raw        = data?.response ?? [];
    const normalized = normalizeFixtures(raw, resolvedSeason);
    return normalized;
  }

  async fetchStandings(leagueId: number, season: number): Promise<Standings | null> {
    const data = await this.apiFetch<{ response: unknown[] }>(
      `/standings?league=${leagueId}&season=${season}`,
      CACHE_TTL.STANDINGS,
      cacheTags("standings", leagueId),
      // noStore = false (default) — standings change only after FT; caching is fine
    );

    if (!data?.response?.length) {
      console.warn(`[real-provider] fetchStandings league=${leagueId} season=${season}: empty response`);
      return null;
    }

    const rawLeague = (data.response[0] as Record<string, unknown>)?.league as Record<string, unknown> | undefined;
    const rawTable: unknown[] = (rawLeague?.standings as unknown[][])?.[0] ?? [];

    const table = normalizeStandings(rawTable);

    const league = SUPPORTED_LEAGUES.find((l) => l.id === leagueId);

    return {
      leagueId,
      leagueSlug: league?.slug ?? "premier-league",
      season,
      table,
      updatedAt: new Date().toISOString(),
    };
  }

  async fetchMatchDetail(fixtureId: number): Promise<MatchDetail | null> {
    const [matchData, lineupData] = await Promise.all([
      this.apiFetch<{ response: unknown[] }>(
        `/fixtures?id=${fixtureId}`,
        CACHE_TTL.MATCH_DETAIL_LIVE,
        cacheTags("match", fixtureId),
        // noStore = false — match detail page has its own revalidate logic
      ),
      this.apiFetch<{ response: unknown[] }>(
        `/fixtures/lineups?fixture=${fixtureId}`,
        CACHE_TTL.MATCH_DETAIL_FINISHED, // lineups are immutable once published
        cacheTags("match", fixtureId),
      ).catch(() => ({ response: [] as unknown[] })),
    ]);

    if (!matchData?.response?.length) return null;

    const raw     = matchData.response[0] as Record<string, unknown>;
    const season  = (raw?.league as Record<string, unknown>)?.season as number ?? new Date().getFullYear();
    const fixture = normalizeFixture(raw as unknown as Parameters<typeof normalizeFixture>[0], season);
    if (!fixture) return null;

    const lineupItems = lineupData?.response ?? [];
    let lineupHome: LineupPlayer[] = [];
    let lineupAway: LineupPlayer[] = [];

    if (lineupItems.length >= 2) {
      const extractPlayers = (item: unknown): LineupPlayer[] => {
        const xi = ((item as Record<string, unknown>)?.startXI) as Array<{
          player?: { name?: string; number?: number; pos?: string };
        }> | undefined;
        if (!Array.isArray(xi)) return [];
        return xi
          .map((e) => ({
            name:   e?.player?.name   ?? "",
            number: e?.player?.number ?? undefined,
            pos:    e?.player?.pos    ?? undefined,
          }))
          .filter((p) => p.name.length > 0);
      };

      const item0  = lineupItems[0] as Record<string, unknown>;
      const item1  = lineupItems[1] as Record<string, unknown>;
      const teamId0 = ((item0?.team) as Record<string, unknown>)?.id as number | undefined;

      if (teamId0 === fixture.homeTeam.id) {
        lineupHome = extractPlayers(item0);
        lineupAway = extractPlayers(item1);
      } else {
        lineupHome = extractPlayers(item1);
        lineupAway = extractPlayers(item0);
      }
    }

    return {
      ...fixture,
      events:     Array.isArray(raw.events)     ? raw.events     : [],
      statistics: Array.isArray(raw.statistics) ? raw.statistics : [],
      lineupHome,
      lineupAway,
    };
  }

  async fetchTeam(teamId: number): Promise<Team | null> {
    const data = await this.apiFetch<{ response: unknown[] }>(
      `/teams?id=${teamId}`,
      CACHE_TTL.TEAM,
      cacheTags("team", teamId),
    );

    if (!data?.response?.length) return null;

    const raw = ((data.response[0] as Record<string, unknown>)?.team) as Parameters<typeof normalizeTeam>[0] | undefined;
    return raw ? normalizeTeam(raw) : null;
  }

  async fetchResults(
    leagueId: number,
    season: number,
    limit?: number
  ): Promise<Fixture[]> {
    const path = limit
      ? `/fixtures?league=${leagueId}&season=${season}&status=FT-AET-PEN&last=${limit}`
      : `/fixtures?league=${leagueId}&season=${season}&status=FT-AET-PEN`;

    const data = await this.apiFetch<{ response: unknown[] }>(
      path,
      CACHE_TTL.RESULTS,
      cacheTags("fixtures", leagueId),
    );

    const raw = data?.response ?? [];
    return normalizeFixtures(raw, season);
  }

  async fetchFixturesRange(
    leagueId: number,
    from: string,
    to: string,
    season?: number
  ): Promise<Fixture[]> {
    const league = SUPPORTED_LEAGUES.find((l) => l.id === leagueId);
    const resolvedSeason = season ?? league?.season ?? new Date().getFullYear();

    const data = await this.apiFetch<{ response: unknown[] }>(
      `/fixtures?from=${from}&to=${to}&league=${leagueId}&season=${resolvedSeason}&timezone=Asia%2FSeoul`,
      CACHE_TTL.FIXTURES_TODAY,
      cacheTags("fixtures", leagueId),
      // noStore = false — ISR 캐시 활용
    );

    const raw = data?.response ?? [];
    return normalizeFixtures(raw, resolvedSeason);
  }

  async fetchFixturesLast(
    leagueId: number,
    season: number,
    n: number
  ): Promise<Fixture[]> {
    const data = await this.apiFetch<{ response: unknown[] }>(
      `/fixtures?league=${leagueId}&season=${season}&status=FT&last=${n}`,
      CACHE_TTL.FIXTURES_TODAY,
      cacheTags("fixtures", leagueId),
      // noStore = false — ISR 캐시 활용
    );

    const raw = data?.response ?? [];
    return normalizeFixtures(raw, season);
  }

  async fetchFixturesNext(
    leagueId: number,
    season: number,
    n: number
  ): Promise<Fixture[]> {
    const data = await this.apiFetch<{ response: unknown[] }>(
      `/fixtures?league=${leagueId}&season=${season}&status=NS&next=${n}`,
      CACHE_TTL.FIXTURES_TODAY,
      cacheTags("fixtures", leagueId),
      // noStore = false — ISR 캐시 활용
    );

    const raw = data?.response ?? [];
    return normalizeFixtures(raw, season);
  }

  async fetchTeamResults(teamId: number, leagueId: number, season: number, n: number): Promise<Fixture[]> {
    const data = await this.apiFetch<{ response: unknown[] }>(
      `/fixtures?team=${teamId}&league=${leagueId}&season=${season}&status=FT-AET-PEN&last=${n}`,
      CACHE_TTL.RESULTS,
      cacheTags("fixtures", leagueId),
    );
    return normalizeFixtures(data?.response ?? [], season);
  }

  async fetchTeamFixturesNext(teamId: number, leagueId: number, season: number, n: number): Promise<Fixture[]> {
    const data = await this.apiFetch<{ response: unknown[] }>(
      `/fixtures?team=${teamId}&league=${leagueId}&season=${season}&status=NS-PST&next=${n}`,
      CACHE_TTL.FIXTURES_TODAY,
      cacheTags("fixtures", leagueId),
      // noStore = false — ISR 캐시 활용
    );
    return normalizeFixtures(data?.response ?? [], season);
  }

  async fetchHeadToHead(team1Id: number, team2Id: number): Promise<H2HData> {
    const data = await this.apiFetch<{ response: unknown[] }>(
      `/fixtures/headtohead?h2h=${team1Id}-${team2Id}&last=10`,
      CACHE_TTL.RESULTS,
    );

    const raw = data?.response ?? [];
    const matches: H2HRecord[] = [];
    let team1Wins = 0, team2Wins = 0, draws = 0;

    for (const item of raw) {
      const r = item as Record<string, unknown>;
      const fixture = r.fixture as Record<string, unknown>;
      const goals = r.goals as Record<string, number | null>;
      const teams = r.teams as Record<string, { id: number; name: string }>;

      const homeScore = goals?.home ?? 0;
      const awayScore = goals?.away ?? 0;
      const homeId = teams?.home?.id;

      let result: "home" | "away" | "draw";
      if (homeScore > awayScore) { result = "home"; homeId === team1Id ? team1Wins++ : team2Wins++; }
      else if (awayScore > homeScore) { result = "away"; homeId === team2Id ? team2Wins++ : team1Wins++; }
      else { result = "draw"; draws++; }

      matches.push({
        homeTeam: teams?.home?.name ?? "",
        awayTeam: teams?.away?.name ?? "",
        homeScore,
        awayScore,
        date: (fixture?.date as string) ?? "",
        result,
      });
    }

    return { team1Id, team2Id, matches, summary: { team1Wins, team2Wins, draws } };
  }

  async fetchTeamStatistics(leagueId: number, season: number, teamId: number): Promise<TeamStatistics | null> {
    const data = await this.apiFetch<{ response: unknown }>(
      `/teams/statistics?league=${leagueId}&season=${season}&team=${teamId}`,
      CACHE_TTL.STANDINGS,
    );

    const r = data?.response as Record<string, unknown> | undefined;
    if (!r) return null;

    const fixtures    = r.fixtures    as Record<string, Record<string, number>> | undefined;
    const goals       = r.goals       as Record<string, Record<string, Record<string, number>>> | undefined;
    const cleanSheets = r.clean_sheet as Record<string, number> | undefined;

    const avgGoalsFor     = goals?.for?.average?.total     ?? 0;
    const avgGoalsAgainst = goals?.against?.average?.total ?? 0;

    return {
      teamId,
      leagueId,
      season,
      form: (r.form as string) ?? "",
      played:        { home: fixtures?.played?.home ?? 0, away: fixtures?.played?.away ?? 0, total: fixtures?.played?.total ?? 0 },
      wins:          { home: fixtures?.wins?.home   ?? 0, away: fixtures?.wins?.away   ?? 0, total: fixtures?.wins?.total   ?? 0 },
      draws:         { home: fixtures?.draws?.home  ?? 0, away: fixtures?.draws?.away  ?? 0, total: fixtures?.draws?.total  ?? 0 },
      losses:        { home: fixtures?.loses?.home  ?? 0, away: fixtures?.loses?.away  ?? 0, total: fixtures?.loses?.total  ?? 0 },
      goalsFor:      { home: goals?.for?.total?.home      ?? 0, away: goals?.for?.total?.away      ?? 0, total: goals?.for?.total?.total      ?? 0 },
      goalsAgainst:  { home: goals?.against?.total?.home  ?? 0, away: goals?.against?.total?.away  ?? 0, total: goals?.against?.total?.total  ?? 0 },
      cleanSheets:   { home: cleanSheets?.home ?? 0, away: cleanSheets?.away ?? 0, total: cleanSheets?.total ?? 0 },
      avgGoalsFor:   typeof avgGoalsFor     === "string" ? parseFloat(avgGoalsFor)     : avgGoalsFor,
      avgGoalsAgainst: typeof avgGoalsAgainst === "string" ? parseFloat(avgGoalsAgainst) : avgGoalsAgainst,
    };
  }

  async fetchFixturePlayers(fixtureId: number): Promise<FixturePlayerStats[]> {
    const data = await this.apiFetch<{ response: unknown[] }>(
      `/fixtures/players?fixture=${fixtureId}`,
      CACHE_TTL.MATCH_DETAIL_FINISHED,
      cacheTags("match", fixtureId),
    );

    const raw = data?.response ?? [];
    const players: FixturePlayerStats[] = [];

    for (const teamEntry of raw) {
      const t        = teamEntry as Record<string, unknown>;
      const team     = t.team as Record<string, unknown>;
      const teamId   = team?.id as number;
      const teamName = team?.name as string ?? "";

      for (const playerEntry of (t.players as unknown[] ?? [])) {
        const pe    = playerEntry as Record<string, unknown>;
        const p     = pe.player as Record<string, unknown>;
        const stats = (pe.statistics as Record<string, unknown>[])?.[0];
        if (!stats) continue;

        const games     = stats.games    as Record<string, unknown>;
        const shotsObj  = stats.shots    as Record<string, number>;
        const goalsObj  = stats.goals    as Record<string, number>;
        const passesObj = stats.passes   as Record<string, unknown>;
        const duelsObj  = stats.duels    as Record<string, number>;
        const cardsObj  = stats.cards    as Record<string, number>;

        const ratingStr = games?.rating;
        const rating    = ratingStr ? parseFloat(ratingStr as string) : null;

        players.push({
          playerId:       p?.id as number,
          playerName:     p?.name as string ?? "",
          teamId,
          teamName,
          position:       (games?.position as string) ?? "",
          rating:         isNaN(rating as number) ? null : rating,
          minutesPlayed:  (games?.minutes as number) ?? 0,
          goals:          goalsObj?.total  ?? 0,
          assists:        goalsObj?.assists ?? 0,
          shotsTotal:     shotsObj?.total  ?? 0,
          shotsOnTarget:  shotsObj?.on     ?? 0,
          passAccuracy:   passesObj?.accuracy ? parseFloat(passesObj.accuracy as string) : null,
          duelsWon:       duelsObj?.won ?? 0,
          yellowCard:     (cardsObj?.yellow ?? 0) > 0,
          redCard:        (cardsObj?.red    ?? 0) > 0,
        });
      }
    }

    return players;
  }
}
