import type { Fixture, Standings, MatchDetail, Team, H2HData, H2HRecord, TeamStatistics, FixturePlayerStats } from "../types";
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
      for (const entry of (MOCK_STANDINGS[slug] ?? [])) {
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

  async fetchFixturesRange(leagueId: number, _from: string, _to: string, _season?: number): Promise<Fixture[]> {
    return this.fetchFixtures(leagueId);
  }

  async fetchFixturesLast(leagueId: number, _season: number, n: number): Promise<Fixture[]> {
    return (await this.fetchFixtures(leagueId)).slice(0, n);
  }

  async fetchFixturesNext(leagueId: number, _season: number, n: number): Promise<Fixture[]> {
    return (await this.fetchFixtures(leagueId)).slice(0, n);
  }

  async fetchTeamResults(teamId: number, leagueId: number, _season: number, n: number): Promise<Fixture[]> {
    return MOCK_FIXTURES.filter(
      (f) => f.leagueId === leagueId && (f.homeTeam.id === teamId || f.awayTeam.id === teamId) && FINISHED_SET.has(f.status)
    ).slice(0, n);
  }

  async fetchTeamFixturesNext(teamId: number, leagueId: number, _season: number, n: number): Promise<Fixture[]> {
    return MOCK_FIXTURES.filter(
      (f) => f.leagueId === leagueId && (f.homeTeam.id === teamId || f.awayTeam.id === teamId) && f.status === "NS"
    ).slice(0, n);
  }

  async fetchHeadToHead(team1Id: number, team2Id: number): Promise<H2HData> {
    const isArsenalManCity =
      (team1Id === 42 && team2Id === 50) || (team1Id === 50 && team2Id === 42);

    if (!isArsenalManCity) {
      return { team1Id, team2Id, matches: [], summary: { team1Wins: 0, team2Wins: 0, draws: 0 } };
    }

    // 7 deterministic records — A~G (literal IDs, same records for both call directions)
    const records: H2HRecord[] = [
      // A: current fixture — NS, null scores
      {
        fixtureId: 1001, status: "NS",  date: "2026-09-15T15:00:00+00:00",
        leagueId: 39, leagueName: "Premier League",
        homeTeamId: 42, homeTeam: "Arsenal",    homeTeamLogoUrl: null,
        awayTeamId: 50, awayTeam: "Manchester City", awayTeamLogoUrl: null,
        homeScore: null, awayScore: null,
      },
      // B: another NS future match — null scores
      {
        fixtureId: 9001, status: "NS",  date: "2026-10-01T15:00:00+00:00",
        leagueId: 39, leagueName: "Premier League",
        homeTeamId: 42, homeTeam: "Arsenal",    homeTeamLogoUrl: null,
        awayTeamId: 50, awayTeam: "Manchester City", awayTeamLogoUrl: null,
        homeScore: null, awayScore: null,
      },
      // C: Arsenal home win 3-1
      {
        fixtureId: 9002, status: "FT",  date: "2026-04-20T14:00:00+00:00",
        leagueId: 39, leagueName: "Premier League",
        homeTeamId: 42, homeTeam: "Arsenal",    homeTeamLogoUrl: null,
        awayTeamId: 50, awayTeam: "Manchester City", awayTeamLogoUrl: null,
        homeScore: 3, awayScore: 1, result: "home",
      },
      // D: ManCity home win 2-0 (historical positions preserved)
      {
        fixtureId: 9003, status: "FT",  date: "2025-12-07T17:30:00+00:00",
        leagueId: 39, leagueName: "Premier League",
        homeTeamId: 50, homeTeam: "Manchester City", homeTeamLogoUrl: null,
        awayTeamId: 42, awayTeam: "Arsenal",    awayTeamLogoUrl: null,
        homeScore: 2, awayScore: 0, result: "home",
      },
      // E: draw 1-1 — unsupported competition (FA Cup, leagueId=9999 not in SUPPORTED_LEAGUES)
      {
        fixtureId: 9004, status: "FT",  date: "2025-08-25T11:30:00+00:00",
        leagueId: 9999, leagueName: "FA Cup",
        homeTeamId: 42, homeTeam: "Arsenal",    homeTeamLogoUrl: null,
        awayTeamId: 50, awayTeam: "Manchester City", awayTeamLogoUrl: null,
        homeScore: 1, awayScore: 1, result: "draw",
      },
      // F: Arsenal away win 0-2 (historical positions preserved)
      {
        fixtureId: 9005, status: "FT",  date: "2025-03-12T20:00:00+00:00",
        leagueId: 39, leagueName: "Premier League",
        homeTeamId: 50, homeTeam: "Manchester City", homeTeamLogoUrl: null,
        awayTeamId: 42, awayTeam: "Arsenal",    awayTeamLogoUrl: null,
        homeScore: 0, awayScore: 2, result: "away",
      },
      // G: third-party match (home=999) — included in raw but excluded by exact pair check
      {
        fixtureId: 9006, status: "FT",  date: "2024-11-05T20:00:00+00:00",
        leagueId: 2, leagueName: "UEFA Champions League",
        homeTeamId: 999, homeTeam: "Unknown FC",    homeTeamLogoUrl: null,
        awayTeamId: 42,  awayTeam: "Arsenal",       awayTeamLogoUrl: null,
        homeScore: 1, awayScore: 0, result: "home",
      },
    ];

    // Provider-level summary: exact pair check + score-based winId (no else team2Wins++)
    let team1Wins = 0, team2Wins = 0, draws = 0;
    for (const m of records) {
      const isPair =
        (m.homeTeamId === team1Id && m.awayTeamId === team2Id) ||
        (m.homeTeamId === team2Id && m.awayTeamId === team1Id);
      if (!isPair) continue;
      if (m.status !== "FT" && m.status !== "AET" && m.status !== "PEN") continue;
      if (m.homeScore === null || m.awayScore === null) continue;

      if (m.homeScore === m.awayScore) {
        draws++;
      } else {
        const winId = m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId;
        if (winId === team1Id)      team1Wins++;
        else if (winId === team2Id) team2Wins++;
      }
    }

    return { team1Id, team2Id, matches: records, summary: { team1Wins, team2Wins, draws } };
  }

  async fetchTeamStatistics(_leagueId: number, _season: number, _teamId: number): Promise<TeamStatistics | null> {
    return null;
  }

  async fetchFixturePlayers(_fixtureId: number): Promise<FixturePlayerStats[]> {
    return [];
  }
}

// Re-export LEAGUE_BY_SLUG so consumers can resolve slugs without importing constants directly
export { LEAGUE_BY_SLUG };
