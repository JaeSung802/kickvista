// Core domain types for football data
// These mirror the structure of football-data.org / api-football.com APIs

export type LeagueSlug = "premier-league" | "la-liga" | "bundesliga" | "serie-a" | "ligue-1" | "champions-league";

export interface League {
  id: number;
  slug: LeagueSlug;
  name: string;
  nameKo: string;
  country: string;
  countryKo: string;
  flag: string;       // emoji flag
  logo: string;       // URL or emoji fallback
  season: number;
  color: string;      // brand accent color hex
  currentRound?: number;
  totalRounds?: number;
}

export interface Team {
  id: number;
  name: string;
  nameKo?: string;
  shortName: string;
  flag: string;       // emoji or badge URL
  venue?: string;
  country?: string;
}

export type FixtureStatus =
  | "NS"    // Not Started
  | "1H"    // First Half
  | "HT"    // Half Time
  | "2H"    // Second Half
  | "ET"    // Extra Time
  | "P"     // Penalty
  | "FT"    // Full Time
  | "AET"   // After Extra Time
  | "PEN"   // After Penalties
  | "PST"   // Postponed
  | "CANC"  // Cancelled
  | "SUSP"; // Suspended

export interface Fixture {
  id: number;
  leagueId: number;
  leagueSlug: LeagueSlug;
  season: number;
  round: string;
  date: string;       // ISO date string
  venue?: string;
  status: FixtureStatus;
  minute?: number;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number;
  awayScore?: number;
  homeScoreHT?: number;
  awayScoreHT?: number;
}

export interface StandingEntry {
  rank: number;
  team: Team;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form?: string;      // e.g. "WWDLW"
  description?: string; // "Champions League", "Relegation"
}

export interface Standings {
  leagueId: number;
  leagueSlug: LeagueSlug;
  season: number;
  table: StandingEntry[];
  updatedAt: string;  // ISO date string
}

export interface MatchEvent {
  minute: number;
  type: "goal" | "yellow-card" | "red-card" | "substitution" | "var";
  teamId: number;
  playerName: string;
  assistName?: string;
  detail?: string;
}

export interface MatchStatistic {
  type: string;
  home: number | string;
  away: number | string;
}

export interface MatchDetail extends Fixture {
  events: MatchEvent[];
  statistics: MatchStatistic[];
  lineupHome?: string[];
  lineupAway?: string[];
}

export type SyncResult =
  | { success: true; count: number; updatedAt: string }
  | { success: false; error: string };
