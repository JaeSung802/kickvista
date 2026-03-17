import type { Fixture, Standings, MatchDetail, Team } from "../types";
import type { IFootballProvider } from "./types";
import { SUPPORTED_LEAGUES } from "../constants";
import {
  normalizeFixtures,
  normalizeStandings,
  normalizeFixture,
  normalizeTeam,
} from "../normalizer";
import { CACHE_TTL, cacheTags } from "../cache";

/**
 * RealFootballProvider
 *
 * Connects to api-football.com (v3) via RapidAPI.
 * Each fetch call carries Next.js ISR cache directives so responses are
 * automatically revalidated at the appropriate cadence.
 *
 * Activate by setting the FOOTBALL_API_KEY environment variable.
 * Optionally override the host with FOOTBALL_API_HOST.
 */
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
   * Fetch from the API with Next.js ISR cache options.
   *
   * @param path       URL path + query string, e.g. "/fixtures?date=2024-01-01&league=39&season=2023"
   * @param revalidate Cache TTL in seconds (use CACHE_TTL constants)
   * @param tags       Cache tags for on-demand revalidation
   */
  private async apiFetch<T>(
    path: string,
    revalidate: number,
    tags?: string[]
  ): Promise<T | null> {
    try {
      const res = await fetch(`https://${this.host}${path}`, {
        headers: {
          "x-rapidapi-key": this.apiKey,
          "x-rapidapi-host": this.host,
        },
        next: {
          revalidate,
          ...(tags?.length ? { tags } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(
          `[api-football] HTTP ${res.status} for ${path}`
        );
      }

      return (await res.json()) as T;
    } catch (err) {
      console.error("[real-football-provider]", err);
      return null;
    }
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
    const resolvedDate = date ?? new Date().toISOString().split("T")[0];

    const data = await this.apiFetch<{ response: unknown[] }>(
      `/fixtures?date=${resolvedDate}&league=${leagueId}&season=${resolvedSeason}`,
      CACHE_TTL.FIXTURES_TODAY,
      cacheTags("fixtures", leagueId)
    );

    if (!data?.response) return [];
    return normalizeFixtures(data.response, resolvedSeason);
  }

  async fetchStandings(leagueId: number, season: number): Promise<Standings | null> {
    const data = await this.apiFetch<{ response: unknown[] }>(
      `/standings?league=${leagueId}&season=${season}`,
      CACHE_TTL.STANDINGS,
      cacheTags("standings", leagueId)
    );

    if (!data?.response?.length) return null;

    // API response shape: response[0].league.standings[0] = array of standing entries
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawLeague = (data.response[0] as any)?.league;
    const rawTable: unknown[] = rawLeague?.standings?.[0] ?? [];
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
    const data = await this.apiFetch<{ response: unknown[] }>(
      `/fixtures?id=${fixtureId}`,
      CACHE_TTL.MATCH_DETAIL_LIVE,
      cacheTags("match", fixtureId)
    );

    if (!data?.response?.length) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = data.response[0] as any;

    // Determine season from the response (fall back to current year)
    const season: number =
      raw?.league?.season ?? new Date().getFullYear();

    const fixture = normalizeFixture(raw, season);
    if (!fixture) return null;

    return {
      ...fixture,
      events: Array.isArray(raw.events) ? raw.events : [],
      statistics: Array.isArray(raw.statistics) ? raw.statistics : [],
    };
  }

  async fetchTeam(teamId: number): Promise<Team | null> {
    const data = await this.apiFetch<{ response: unknown[] }>(
      `/teams?id=${teamId}`,
      CACHE_TTL.TEAM,
      cacheTags("team", teamId)
    );

    if (!data?.response?.length) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (data.response[0] as any)?.team;
    return raw ? normalizeTeam(raw) : null;
  }

  async fetchResults(
    leagueId: number,
    season: number,
    limit?: number
  ): Promise<Fixture[]> {
    const path = limit
      ? `/fixtures?league=${leagueId}&season=${season}&status=FT&last=${limit}`
      : `/fixtures?league=${leagueId}&season=${season}&status=FT`;

    const data = await this.apiFetch<{ response: unknown[] }>(
      path,
      CACHE_TTL.MATCH_DETAIL_FINISHED,
      cacheTags("fixtures", leagueId)
    );

    if (!data?.response) return [];
    return normalizeFixtures(data.response, season);
  }
}
