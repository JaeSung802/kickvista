/**
 * Transfer Center — server data loading.
 *
 * Scope: the teams KickVista registers under the five leagues below (lib/football/teamRegistry.ts).
 * "League" means "teams currently in KickVista's registry for that league", not the league a club
 * was in when a transfer happened, and the registry is not updated per season automatically.
 *
 * Calls: one GET /transfers?team=<id> per team, only for teams in the selected scope. Each team's
 * normalised result (trimmed to RETENTION_DAYS) is cached for TRANSFER_TTL_SECONDS in the shared
 * Data Cache; search, sort, type/period filters and paging run on that cached data with no further
 * API calls. Failures are not cached: a failed team is not requested again from this instance for
 * 30 s (doubling up to 5 min) and concurrent loads of the same team share one request. The Data
 * Cache is per deployment/region and can be evicted, so it lowers the call count but is not a cap.
 */
import { unstable_cache } from "next/cache";
import { getFootballProvider } from "./provider";
import { FootballApiError } from "./provider/errors";
import { TEAMS_BY_LEAGUE, TEAM_REGISTRY, type TeamEntry } from "./teamRegistry";
import type { LeagueSlug } from "./types";
import { RETENTION_DAYS, addDays, dedupeTransfers, kstToday, normalizeTeamTransfers, type NormalizeStats, type TransferItem } from "./transfers";

export const TRANSFER_LEAGUES: LeagueSlug[] = ["premier-league", "la-liga", "bundesliga", "serie-a", "ligue-1"];
/** The provider updates transfers "several times a week" and recommends one call a day per query. */
export const TRANSFER_TTL_SECONDS = 43_200;
const CONCURRENCY = 6;
const BACKOFF_MS = 30_000, BACKOFF_MAX_MS = 300_000;

export function scopeTeams(league: string, teamSlug: string | null): TeamEntry[] {
  if (teamSlug) { const t = TEAM_REGISTRY[teamSlug]; return t ? [t] : []; }
  const leagues = league === "all" ? TRANSFER_LEAGUES : TRANSFER_LEAGUES.filter((l) => l === league);
  return leagues.flatMap((l) => TEAMS_BY_LEAGUE[l] ?? []);
}

/** League of a registered team inside the transfer scope, else null. */
export function teamLeagueOf(slug: string): string | null {
  const t = Object.prototype.hasOwnProperty.call(TEAM_REGISTRY, slug) ? TEAM_REGISTRY[slug] : undefined;
  return t && TRANSFER_LEAGUES.includes(t.leagueSlug) ? t.leagueSlug : null;
}

/**
 * Same rule as the home page: mock data only when FOOTBALL_MOCK_MODE=true is set on purpose for local
 * tests, never on a Vercel deployment. A missing API key alone makes the provider fall back to mock,
 * which is treated as "no data source".
 */
export function transfersDataAvailable(): boolean {
  return !getFootballProvider().isMockMode || (process.env.FOOTBALL_MOCK_MODE === "true" && !process.env.VERCEL_ENV);
}

interface TeamTransfers { teamId: number; fetchedAt: string; items: TransferItem[]; stats: NormalizeStats }

const _failures = new Map<number, { count: number; until: number }>();
const _inflight = new Map<number, Promise<TeamTransfers>>();

function loadTeam(teamId: number): Promise<TeamTransfers> {
  const failed = _failures.get(teamId);
  if (failed && failed.until > Date.now()) return Promise.reject(new FootballApiError("http", `/transfers?team=${teamId}`, failed.until - Date.now()));
  const pending = _inflight.get(teamId);
  if (pending) return pending;
  const run = unstable_cache(
    async (): Promise<TeamTransfers> => {
      const raw = await getFootballProvider().fetchTeamTransfers(teamId);
      const { items, stats } = normalizeTeamTransfers(raw, teamId, addDays(kstToday(), -RETENTION_DAYS));
      return { teamId, fetchedAt: new Date().toISOString(), items, stats };
    },
    ["transfers-team-v1", String(teamId)],
    { revalidate: TRANSFER_TTL_SECONDS, tags: ["transfers", `transfers:${teamId}`] },
  )()
    .then((r) => { _failures.delete(teamId); return r; })
    .catch((e) => {
      const count = (_failures.get(teamId)?.count ?? 0) + 1;
      _failures.set(teamId, { count, until: Date.now() + Math.min(BACKOFF_MS * 2 ** (count - 1), BACKOFF_MAX_MS) });
      throw e;
    })
    .finally(() => _inflight.delete(teamId));
  _inflight.set(teamId, run);
  return run;
}

export type TransferScopeResult =
  | { status: "unavailable" }
  | { status: "ok" | "partial" | "error"; items: TransferItem[]; teams: TeamEntry[]; failed: TeamEntry[]; oldestFetchedAt: string | null; dropped: number };

/** Loads every team in scope (at most CONCURRENCY requests at a time) and merges the results. */
export async function loadTransferScope(teams: TeamEntry[]): Promise<TransferScopeResult> {
  if (!transfersDataAvailable()) return { status: "unavailable" };
  const results: (TeamTransfers | null)[] = new Array(teams.length).fill(null);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, teams.length) }, async () => {
    while (next < teams.length) {
      const i = next++;
      try { results[i] = await loadTeam(teams[i].id); } catch { results[i] = null; }
    }
  }));
  const ok = results.filter((r): r is TeamTransfers => r !== null);
  const failed = teams.filter((_, i) => results[i] === null);
  const status = ok.length === 0 ? "error" : failed.length ? "partial" : "ok";
  return {
    status,
    items: dedupeTransfers(ok.map((r) => r.items)),
    teams,
    failed,
    oldestFetchedAt: ok.length ? ok.map((r) => r.fetchedAt).sort()[0] : null,
    dropped: ok.reduce((n, r) => n + r.stats.noDate + r.stats.sameTeam, 0),
  };
}
