/**
 * Football Data Normalizer
 *
 * Transforms raw API responses (api-football.com v3 format) into
 * KickVista domain types defined in ./types.ts
 *
 * Usage: call these functions inside RealFootballProvider after fetching
 */

import type { Fixture, Team, StandingEntry, FixtureStatus } from "./types";
import type { LeagueSlug } from "./types";

// Raw API types (api-football.com v3)
interface RawTeam {
  id: number;
  name: string;
  code?: string;
  logo?: string;
  country?: string;
}

interface RawFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string; elapsed?: number };
    venue?: { name?: string };
  };
  league: { id: number; name: string; round: string };
  teams: { home: RawTeam; away: RawTeam };
  goals: { home: number | null; away: number | null };
  score?: { halftime?: { home: number | null; away: number | null } };
}

interface RawStandingEntry {
  rank: number;
  team: RawTeam;
  points: number;
  goalsDiff: number;
  description?: string;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  form?: string;
}

// Status mapping from API codes to domain FixtureStatus
const STATUS_MAP: Record<string, FixtureStatus> = {
  "NS": "NS", "1H": "1H", "HT": "HT", "2H": "2H",
  "ET": "ET", "P": "P", "FT": "FT", "AET": "AET",
  "PEN": "PEN", "PST": "PST", "CANC": "CANC", "SUSP": "SUSP",
};

// Map API league IDs to domain slugs (matches constants.ts)
const LEAGUE_ID_TO_SLUG: Record<number, LeagueSlug> = {
  39: "premier-league", 140: "la-liga", 78: "bundesliga",
  135: "serie-a", 61: "ligue-1", 2: "champions-league",
};

export function normalizeTeam(raw: RawTeam): Team {
  return {
    id: raw.id,
    name: raw.name,
    shortName: raw.code ?? raw.name.slice(0, 3).toUpperCase(),
    flag: "⚽", // Placeholder - real flag comes from team mapping
    country: raw.country,
  };
}

export function normalizeFixture(raw: RawFixture, season: number): Fixture | null {
  const slug = LEAGUE_ID_TO_SLUG[raw.league.id];
  if (!slug) return null; // Skip unsupported leagues

  const status = STATUS_MAP[raw.fixture.status.short] ?? "NS";

  return {
    id: raw.fixture.id,
    leagueId: raw.league.id,
    leagueSlug: slug,
    season,
    round: raw.league.round,
    date: raw.fixture.date,
    venue: raw.fixture.venue?.name,
    status,
    minute: raw.fixture.status.elapsed ?? undefined,
    homeTeam: normalizeTeam(raw.teams.home),
    awayTeam: normalizeTeam(raw.teams.away),
    homeScore: raw.goals.home ?? undefined,
    awayScore: raw.goals.away ?? undefined,
    homeScoreHT: raw.score?.halftime?.home ?? undefined,
    awayScoreHT: raw.score?.halftime?.away ?? undefined,
  };
}

export function normalizeStandingEntry(raw: RawStandingEntry): StandingEntry {
  return {
    rank: raw.rank,
    team: normalizeTeam(raw.team),
    points: raw.points,
    played: raw.all.played,
    won: raw.all.win,
    drawn: raw.all.draw,
    lost: raw.all.lose,
    goalsFor: raw.all.goals.for,
    goalsAgainst: raw.all.goals.against,
    goalDifference: raw.goalsDiff,
    form: raw.form ?? undefined,
    description: raw.description ?? undefined,
  };
}

export function normalizeFixtures(rawList: unknown[], season: number): Fixture[] {
  return (rawList as RawFixture[])
    .map((r) => normalizeFixture(r, season))
    .filter((f): f is Fixture => f !== null);
}

export function normalizeStandings(rawList: unknown[]): StandingEntry[] {
  return (rawList as RawStandingEntry[]).map(normalizeStandingEntry);
}
