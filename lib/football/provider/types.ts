import type { Fixture, Standings, MatchDetail, Team, H2HData, TeamStatistics, FixturePlayerStats } from "../types";

/**
 * IFootballProvider
 *
 * Common interface for all football data providers (mock and real).
 * Consumers should always depend on this interface, never on a concrete class.
 */
export interface IFootballProvider {
  /** Human-readable identifier for the provider (e.g. "mock", "api-football") */
  name: string;

  /** True when the provider returns static/mock data instead of live API data */
  isMockMode: boolean;

  /**
   * Fetch fixtures for a given league, optionally filtered by date and season.
   * @param leagueId  Numeric league ID (e.g. 39 for Premier League)
   * @param date      ISO date string "YYYY-MM-DD" – defaults to today
   * @param season    4-digit season year – defaults to the league's current season
   */
  fetchFixtures(leagueId: number, date?: string, season?: number): Promise<Fixture[]>;

  /**
   * Fetch the standings table for a given league and season.
   * Returns null if the data cannot be retrieved.
   */
  fetchStandings(leagueId: number, season: number): Promise<Standings | null>;

  /**
   * Fetch full match detail (events, statistics, lineups) for a single fixture.
   * Returns null if the fixture is not found or the request fails.
   */
  fetchMatchDetail(fixtureId: number): Promise<MatchDetail | null>;

  /**
   * Fetch team information by its numeric ID.
   * Returns null if the team is not found or the request fails.
   */
  fetchTeam(teamId: number): Promise<Team | null>;

  /**
   * Fetch finished results (FT / AET / PEN) for a league season.
   * @param limit  Optional cap on the number of results returned
   */
  fetchResults(leagueId: number, season: number, limit?: number): Promise<Fixture[]>;

  /**
   * Fetch fixtures within a date range (inclusive) with KST timezone.
   * More reliable than single-date query for cross-midnight kick-offs.
   */
  fetchFixturesRange(leagueId: number, from: string, to: string, season?: number): Promise<Fixture[]>;

  /**
   * Fetch the N most recent finished fixtures for a league.
   * Fallback when the date-range query returns nothing.
   */
  fetchFixturesLast(leagueId: number, season: number, n: number): Promise<Fixture[]>;

  /**
   * Fetch the N next scheduled (NS) fixtures for a league.
   * Last-resort fallback so the home page always shows something.
   */
  fetchFixturesNext(leagueId: number, season: number, n: number): Promise<Fixture[]>;

  /**
   * Fetch head-to-head record between two teams (last 10 matches).
   */
  fetchHeadToHead(team1Id: number, team2Id: number): Promise<H2HData>;

  /**
   * Fetch aggregated team statistics for a league season.
   * Returns null if unavailable.
   */
  fetchTeamStatistics(leagueId: number, season: number, teamId: number): Promise<TeamStatistics | null>;

  /**
   * Fetch per-player statistics for a finished fixture (ratings, goals, etc.).
   * Used for automatic Man of the Match selection.
   */
  fetchFixturePlayers(fixtureId: number): Promise<FixturePlayerStats[]>;

  /**
   * Fetch the last N finished fixtures for a specific team in a league season.
   * More precise than fetchResults — filtered by team ID at the API level.
   */
  fetchTeamResults(teamId: number, leagueId: number, season: number, n: number): Promise<Fixture[]>;

  /**
   * Fetch the next N scheduled fixtures for a specific team in a league season.
   */
  fetchTeamFixturesNext(teamId: number, leagueId: number, season: number, n: number): Promise<Fixture[]>;
}
