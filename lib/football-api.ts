/**
 * Football API Integration Layer
 *
 * Supports: api-football.com (v3) via RapidAPI
 * Env vars:
 *   FOOTBALL_API_KEY   – RapidAPI key
 *   FOOTBALL_API_HOST  – default: v3.football.api-sports.io
 *   FOOTBALL_MOCK_MODE – set to "true" to always use mock data
 *
 * Falls back to mock data when API key is missing.
 *
 * This module now delegates all data-fetching to the provider layer
 * (lib/football/provider). Existing call-sites are preserved via
 * the same exported function signatures.
 */

import type { Fixture, Standings, MatchDetail, LeagueSlug, SyncResult } from "./football/types";
import { LEAGUE_BY_SLUG, SUPPORTED_LEAGUES } from "./football/constants";
import { getFootballProvider } from "./football/provider";

// Re-export provider factory so consumers can access it directly from this module
export { getFootballProvider } from "./football/provider";

// ---------------------------------------------------------------------------
// Backward-compatible exports
// ---------------------------------------------------------------------------

export async function fetchTodayFixtures(leagueSlug?: LeagueSlug): Promise<Fixture[]> {
  const provider = getFootballProvider();

  if (leagueSlug) {
    const league = LEAGUE_BY_SLUG[leagueSlug];
    return provider.fetchFixtures(league.id, undefined, league.season);
  }

  // Fetch fixtures for all supported leagues in parallel
  const today = new Date().toISOString().split("T")[0];
  const results = await Promise.all(
    SUPPORTED_LEAGUES.map((league) =>
      provider.fetchFixtures(league.id, today, league.season)
    )
  );
  return results.flat();
}

export async function fetchStandings(leagueSlug: LeagueSlug): Promise<Standings | null> {
  const provider = getFootballProvider();
  const league = LEAGUE_BY_SLUG[leagueSlug];
  return provider.fetchStandings(league.id, league.season);
}

export async function fetchMatchDetail(fixtureId: number): Promise<MatchDetail | null> {
  const provider = getFootballProvider();
  return provider.fetchMatchDetail(fixtureId);
}

// ---------------------------------------------------------------------------
// Sync helpers (unchanged behaviour)
// ---------------------------------------------------------------------------

export async function syncFixtures(): Promise<SyncResult> {
  try {
    const fixtures = await fetchTodayFixtures();
    return {
      success: true,
      count: fixtures.length,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function syncStandings(): Promise<SyncResult> {
  try {
    let count = 0;
    for (const league of SUPPORTED_LEAGUES) {
      await fetchStandings(league.slug);
      count++;
    }
    return { success: true, count, updatedAt: new Date().toISOString() };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Convenience flag — true when the active provider is mock mode
export const isMockMode: boolean = getFootballProvider().isMockMode;
