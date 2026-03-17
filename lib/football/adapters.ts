/**
 * Football Data Adapters
 *
 * Bridges domain types (Fixture, Standings, StandingEntry) to the
 * view-model types consumed by UI components (MatchCard, StandingsPreview,
 * LeagueCards).
 *
 * Components receive plain view-model objects so they stay decoupled from
 * the data-fetching layer. Swap providers freely — components never change.
 */

import type { Fixture, Standings, StandingEntry, LeagueSlug } from "./types";
import { LEAGUE_BY_SLUG, LIVE_STATUSES, FINISHED_STATUSES } from "./constants";

const LIVE_SET     = new Set(LIVE_STATUSES);
const FINISHED_SET = new Set(FINISHED_STATUSES);

// ---------------------------------------------------------------------------
// Match view-model (mirrors MatchCard's Match interface)
// ---------------------------------------------------------------------------

export interface MatchViewModel {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homeScore?: number;
  awayScore?: number;
  status: "live" | "upcoming" | "finished";
  time?: string;       // "HH:MM" local kick-off time for upcoming matches
  minute?: number;     // elapsed minute for live matches
  league: string;      // display name
  leagueFlag: string;  // flag emoji
  venue?: string;
}

/**
 * Convert a domain Fixture to the MatchViewModel expected by MatchCard.
 * Pass `locale` to get the localised league name.
 */
export function fixtureToMatch(
  fixture: Fixture,
  locale: "ko" | "en" = "en"
): MatchViewModel {
  const league = LEAGUE_BY_SLUG[fixture.leagueSlug];

  const status: MatchViewModel["status"] = LIVE_SET.has(fixture.status)
    ? "live"
    : FINISHED_SET.has(fixture.status)
    ? "finished"
    : "upcoming";

  // Extract local time string from the ISO date ("HH:MM")
  const kickOffTime = fixture.date
    ? new Date(fixture.date).toLocaleTimeString(
        locale === "ko" ? "ko-KR" : "en-GB",
        { hour: "2-digit", minute: "2-digit", hour12: false }
      )
    : undefined;

  return {
    id: String(fixture.id),
    homeTeam: locale === "ko" ? (fixture.homeTeam.nameKo ?? fixture.homeTeam.name) : fixture.homeTeam.name,
    awayTeam: locale === "ko" ? (fixture.awayTeam.nameKo ?? fixture.awayTeam.name) : fixture.awayTeam.name,
    homeFlag: fixture.homeTeam.flag,
    awayFlag: fixture.awayTeam.flag,
    homeScore: fixture.homeScore,
    awayScore: fixture.awayScore,
    status,
    time: status === "upcoming" ? kickOffTime : undefined,
    minute: fixture.minute,
    league: locale === "ko" ? league.nameKo : league.name,
    leagueFlag: league.flag,
    venue: fixture.venue,
  };
}

/**
 * Convert an array of domain Fixtures to MatchViewModels.
 */
export function fixturesToMatches(
  fixtures: Fixture[],
  locale: "ko" | "en" = "en"
): MatchViewModel[] {
  return fixtures.map((f) => fixtureToMatch(f, locale));
}

// ---------------------------------------------------------------------------
// Standings view-model (mirrors StandingsPreview's row format)
// ---------------------------------------------------------------------------

export interface StandingRowViewModel {
  pos: number;
  team: string;
  teamKo?: string;
  flag: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gd: string;   // formatted: "+5", "-3", "0"
  pts: number;
  form: string[];     // ["W", "D", "L", ...]
  description?: string;
}

/**
 * Format goal difference as a signed string.
 */
function formatGD(gd: number): string {
  if (gd > 0) return `+${gd}`;
  return String(gd);
}

/**
 * Convert a domain StandingEntry to the view-model row.
 */
export function standingEntryToRow(
  entry: StandingEntry
): StandingRowViewModel {
  return {
    pos: entry.rank,
    team: entry.team.name,
    teamKo: entry.team.nameKo,
    flag: entry.team.flag,
    played: entry.played,
    won: entry.won,
    drawn: entry.drawn,
    lost: entry.lost,
    gd: formatGD(entry.goalDifference),
    pts: entry.points,
    form: entry.form ? entry.form.slice(0, 5).split("") : [],
    description: entry.description,
  };
}

/**
 * Convert domain Standings to an array of view-model rows.
 * Optionally limit to the top N entries.
 */
export function standingsToRows(
  standings: Standings,
  limit?: number
): StandingRowViewModel[] {
  const rows = standings.table
    .sort((a, b) => a.rank - b.rank)
    .map(standingEntryToRow);

  return limit !== undefined ? rows.slice(0, limit) : rows;
}

// ---------------------------------------------------------------------------
// League card view-model
// ---------------------------------------------------------------------------

export interface LeagueCardViewModel {
  slug: LeagueSlug;
  name: string;
  nameKo: string;
  country: string;
  countryKo: string;
  flag: string;
  liveCount: number;   // number of currently live matches
  totalCount: number;  // total fixtures today
}

/**
 * Build league card view-models from the live and total fixture counts.
 * Falls back to 0 for leagues with no fixtures today.
 */
export function buildLeagueCards(
  liveCounts: Partial<Record<LeagueSlug, number>>,
  totalCounts: Partial<Record<LeagueSlug, number>>
): LeagueCardViewModel[] {
  return Object.values(LEAGUE_BY_SLUG).map((league) => ({
    slug: league.slug,
    name: league.name,
    nameKo: league.nameKo,
    country: league.country,
    countryKo: league.countryKo,
    flag: league.flag,
    liveCount: liveCounts[league.slug] ?? 0,
    totalCount: totalCounts[league.slug] ?? 0,
  }));
}
