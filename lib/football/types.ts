// Core domain types for football data
// These mirror the structure of football-data.org / api-football.com APIs

export type LeagueSlug =
  | "premier-league"
  | "la-liga"
  | "bundesliga"
  | "serie-a"
  | "ligue-1"
  | "champions-league"
  | "europa-league"
  | "eredivisie"
  | "primeira-liga"
  | "saudi-pro-league"
  | "mls"
  | "k-league-1"
  | "j1-league"
  | "liga-mx"
  | "super-lig"
  | "brasileirao"
  | "scottish-premiership";

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
  logo?: string;      // API logo URL (e.g. https://media.api-sports.io/...)
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
  lineupHome?: LineupPlayer[];
  lineupAway?: LineupPlayer[];
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

/** A single player in a starting XI or substitute list */
export interface LineupPlayer {
  name: string;
  number?: number;  // jersey number (absent in mock data, present from real API)
  pos?: string;     // "G" | "D" | "M" | "F"  (from API)
}

export interface MatchDetail extends Fixture {
  events: MatchEvent[];
  statistics: MatchStatistic[];
}

export type SyncResult =
  | { success: true; count: number; updatedAt: string }
  | { success: false; error: string };

// ─── Analysis-enrichment types ────────────────────────────────────────────────

/** Head-to-head record between two teams */
export interface H2HRecord {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: string;
  result: "home" | "away" | "draw";
}

export interface H2HData {
  team1Id: number;
  team2Id: number;
  matches: H2HRecord[];
  /** Summary over the fetched matches */
  summary: {
    team1Wins: number;
    team2Wins: number;
    draws: number;
  };
}

/** Aggregated stats for one team in a season (from /teams/statistics) */
export interface TeamStatistics {
  teamId: number;
  leagueId: number;
  season: number;
  /** Last-N form string, e.g. "WWDLW" */
  form: string;
  played: { home: number; away: number; total: number };
  wins: { home: number; away: number; total: number };
  draws: { home: number; away: number; total: number };
  losses: { home: number; away: number; total: number };
  goalsFor: { home: number; away: number; total: number };
  goalsAgainst: { home: number; away: number; total: number };
  cleanSheets: { home: number; away: number; total: number };
  avgGoalsFor: number;
  avgGoalsAgainst: number;
}

/** Per-player stats for a single fixture (from /fixtures/players) */
export interface FixturePlayerStats {
  playerId: number;
  playerName: string;
  teamId: number;
  teamName: string;
  position: string;
  rating: number | null;
  minutesPlayed: number;
  goals: number;
  assists: number;
  shotsTotal: number;
  shotsOnTarget: number;
  passAccuracy: number | null;
  duelsWon: number;
  yellowCard: boolean;
  redCard: boolean;
}

export interface Player {
  id: number;
  name: string;
  nameKo?: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  number: number;
  nationality: string;
  height?: string;   // e.g. "185 cm"
  weight?: string;   // e.g. "80 kg"
  age?: number;
  goals?: number;
  assists?: number;
  appearances?: number;
  marketValue?: string; // e.g. "€85M"
}
