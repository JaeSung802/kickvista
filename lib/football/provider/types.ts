import type { Fixture, Standings, MatchDetail, Team } from "../types";

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
}
