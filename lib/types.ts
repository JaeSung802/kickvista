/**
 * lib/types.ts
 *
 * Raw API-Football (api-sports.io) response shapes.
 * These types mirror the exact JSON structure returned by the v3 API
 * so that server components can safely decode responses without `any`.
 *
 * Domain-level normalised types live in lib/football/types.ts.
 */

// ─── Shared primitives ────────────────────────────────────────────────────────

export interface ApfGoals {
  home: number | null;
  away: number | null;
}

export interface ApfRecord {
  played: number;
  win: number;
  draw: number;
  lose: number;
  goals: { for: number; against: number };
}

// ─── Fixtures (/fixtures) ─────────────────────────────────────────────────────

export interface ApfFixtureInfo {
  id: number;
  referee: string | null;
  timezone: string;
  date: string;        // ISO-8601
  timestamp: number;
  status: {
    long: string;
    /** FT | NS | 1H | HT | 2H | ET | P | AET | PEN | PST | CANC | SUSP | ABD | AWD | WO */
    short: string;
    elapsed: number | null;
  };
}

export interface ApfLeagueInfo {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string | null;
  season: number;
  round: string;
}

export interface ApfTeamInfo {
  id: number;
  name: string;
  logo: string;
  winner: boolean | null;
}

export interface ApfScore {
  halftime: ApfGoals;
  fulltime: ApfGoals;
  extratime: ApfGoals;
  penalty: ApfGoals;
}

/** One element of the /fixtures response array */
export interface ApfMatchResponse {
  fixture: ApfFixtureInfo;
  league: ApfLeagueInfo;
  teams: {
    home: ApfTeamInfo;
    away: ApfTeamInfo;
  };
  goals: ApfGoals;
  score: ApfScore;
}

// ─── Standings (/standings) ───────────────────────────────────────────────────

export interface ApfTeamRef {
  id: number;
  name: string;
  logo: string;
}

export interface ApfStandingEntry {
  rank: number;
  team: ApfTeamRef;
  points: number;
  goalsDiff: number;
  group: string;
  form: string;         // e.g. "WWDLW"
  status: string;
  description: string | null;
  all: ApfRecord;
  home: ApfRecord;
  away: ApfRecord;
  update: string;
}

export interface ApfLeagueStandings {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag: string | null;
  season: number;
  standings: ApfStandingEntry[][];
}

export interface ApfStandingsResponse {
  league: ApfLeagueStandings;
}

// ─── Generic API envelope ─────────────────────────────────────────────────────

export interface ApfApiResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: string[] | Record<string, string>;
  results: number;
  paging: { current: number; total: number };
  response: T;
}
