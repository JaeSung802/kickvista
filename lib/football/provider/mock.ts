import type { Fixture, Standings, MatchDetail, Team } from "../types";
import type { IFootballProvider } from "./types";
import { MOCK_FIXTURES, MOCK_STANDINGS } from "../mock-data";
import { LEAGUE_BY_SLUG, SUPPORTED_LEAGUES, FINISHED_STATUSES } from "../constants";

const FINISHED_SET = new Set(FINISHED_STATUSES);

export class MockFootballProvider implements IFootballProvider {
  readonly name = "mock";
  readonly isMockMode = true;

  async fetchFixtures(leagueId: number, _date?: string, _season?: number): Promise<Fixture[]> {
    if (!leagueId) return [...MOCK_FIXTURES];
    return MOCK_FIXTURES.filter((f) => f.leagueId === leagueId);
  }

  async fetchStandings(leagueId: number, season: number): Promise<Standings | null> {
    // Resolve the league by its numeric ID
    const league = SUPPORTED_LEAGUES.find((l) => l.id === leagueId);
    if (!league) return null;

    const table = MOCK_STANDINGS[league.slug] ?? [];
    return {
      leagueId: league.id,
      leagueSlug: league.slug,
      season,
      table,
      updatedAt: new Date().toISOString(),
    };
  }

  async fetchMatchDetail(fixtureId: number): Promise<MatchDetail | null> {
    const fixture = MOCK_FIXTURES.find((f) => f.id === fixtureId);
    if (!fixture) return null;
    return {
      ...fixture,
      events: [],
      statistics: [],
    };
  }

  async fetchTeam(teamId: number): Promise<Team | null> {
    // Search MOCK_FIXTURES for a team with the given ID
    for (const fixture of MOCK_FIXTURES) {
      if (fixture.homeTeam.id === teamId) return { ...fixture.homeTeam };
      if (fixture.awayTeam.id === teamId) return { ...fixture.awayTeam };
    }

    // Also scan MOCK_STANDINGS
    for (const slug of Object.keys(MOCK_STANDINGS) as Array<keyof typeof MOCK_STANDINGS>) {
      for (const entry of MOCK_STANDINGS[slug]) {
        if (entry.team.id === teamId) return { ...entry.team };
      }
    }

    // Fallback: return a minimal mock team
    return {
      id: teamId,
      name: `Team #${teamId}`,
      shortName: `T${teamId}`,
      flag: "⚽",
    };
  }

  async fetchResults(leagueId: number, _season: number, limit?: number): Promise<Fixture[]> {
    let results = MOCK_FIXTURES.filter(
      (f) => f.leagueId === leagueId && FINISHED_SET.has(f.status)
    );
    if (limit !== undefined && limit > 0) {
      results = results.slice(0, limit);
    }
    return results;
  }
}

// Re-export LEAGUE_BY_SLUG so consumers can resolve slugs without importing constants directly
export { LEAGUE_BY_SLUG };
