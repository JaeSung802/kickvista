import { MOCK_SQUADS, type MockPlayer } from "./mock-data";
import { TEAM_REGISTRY } from "./teamRegistry";
import { CACHE_TTL } from "./cache";
import { currentFootballSeason } from "./constants";

export type { MockPlayer };

// ─── API response shapes ───────────────────────────────────────────────────────

interface ApfSquadsResponse {
  response: Array<{
    team: { id: number; name: string; logo: string };
    players: Array<{
      id: number;
      name: string;
      age: number;
      number: number;
      position: string; // "Goalkeeper" | "Defender" | "Midfielder" | "Attacker"
      photo: string;
    }>;
  }>;
}

interface ApfPlayersStatsResponse {
  response: Array<{
    player: {
      id: number;
      name: string;
      age: number;
      nationality: string;
      height: string | null;
      weight: string | null;
    };
    statistics: Array<{
      games: {
        appearences: number | null; // note: API typo
        minutes: number | null;
      };
      goals: {
        total: number | null;
        assists: number | null;
      };
    }>;
  }>;
  paging: { current: number; total: number };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function mapPosition(apiPos: string): "GK" | "DEF" | "MID" | "FWD" {
  const p = apiPos.toLowerCase();
  if (p === "goalkeeper") return "GK";
  if (p === "defender")   return "DEF";
  if (p === "midfielder") return "MID";
  return "FWD";
}

/**
 * Fetch all pages of /players?team=&season= and return a Map keyed by player ID.
 * Accumulates stats across pages (typically 2 pages for a 25-player squad).
 */
async function fetchSeasonStats(
  teamId: number,
  apiKey: string,
): Promise<Map<number, ApfPlayersStatsResponse["response"][0]>> {
  const statsMap = new Map<number, ApfPlayersStatsResponse["response"][0]>();
  const season = currentFootballSeason();

  for (let page = 1; page <= 3; page++) {
    const url = `https://v3.football.api-sports.io/players?team=${teamId}&season=${season}&page=${page}`;
    const res = await fetch(url, {
      headers: { "x-apisports-key": apiKey },
      next: { revalidate: CACHE_TTL.SQUAD, tags: [`squad:${teamId}`] },
    });

    if (!res.ok) break;

    const json: ApfPlayersStatsResponse = await res.json();
    for (const item of json.response ?? []) {
      statsMap.set(item.player.id, item);
    }

    // Stop when we've fetched all pages
    if (json.paging.current >= json.paging.total) break;
  }

  return statsMap;
}

// ─── Main export ───────────────────────────────────────────────────────────────

/**
 * Returns the squad for a team with real season statistics.
 *
 * Strategy:
 *  1. No API key → return MOCK_SQUADS immediately (full stats available).
 *  2. With API key:
 *     a. Fetch /players/squads  → current squad membership + jersey numbers
 *     b. Fetch /players?team=&season= (all pages) → goals, assists, appearances,
 *        nationality, height, weight
 *     c. Merge: squad list × season stats × mock data (for nameKo, marketValue)
 *  3. Any fetch failure → fall back to MOCK_SQUADS.
 */
export async function getLiveSquad(teamSlug: string): Promise<MockPlayer[]> {
  const entry = TEAM_REGISTRY[teamSlug];
  if (!entry) return [];

  const mockFallback = MOCK_SQUADS[teamSlug] ?? [];
  const apiKey = process.env.API_FOOTBALL_KEY;

  // Skip real API in mock mode or when no key is configured
  if (!apiKey || process.env.FOOTBALL_MOCK_MODE === "true") return mockFallback;

  try {
    // ── 1. Squad list (membership + jersey numbers) ──────────────────────────
    const squadRes = await fetch(
      `https://v3.football.api-sports.io/players/squads?team=${entry.id}`,
      {
        headers: { "x-apisports-key": apiKey },
        next: { revalidate: CACHE_TTL.SQUAD, tags: [`squad:${entry.id}`] },
      },
    );

    if (!squadRes.ok) {
      console.warn(`[squads] HTTP ${squadRes.status} for team ${entry.id} — using mock`);
      return mockFallback;
    }

    const squadJson: ApfSquadsResponse = await squadRes.json();
    const apiPlayers = squadJson.response?.[0]?.players ?? [];

    if (apiPlayers.length === 0) return mockFallback;

    // ── 2. Season statistics (goals, assists, appearances) ───────────────────
    const statsMap = await fetchSeasonStats(entry.id, apiKey);

    // ── 3. Mock lookup (Korean name, market value — not in API) ─────────────
    const mockById   = new Map(mockFallback.map((p) => [p.id, p]));
    // Name-based fallback: normalise to lowercase for fuzzy match
    const mockByName = new Map(mockFallback.map((p) => [p.name.toLowerCase(), p]));

    // ── 4. Merge ─────────────────────────────────────────────────────────────
    return apiPlayers
      .filter((p) => p.number > 0)
      .map((p): MockPlayer => {
        // Try ID first, then name (API sometimes uses different numeric IDs)
        const mock  = mockById.get(p.id) ?? mockByName.get(p.name.toLowerCase());
        const stats = statsMap.get(p.id);
        // Pick the statistics entry with the most appearances (avoids picking a
        // cup competition instead of the primary league)
        const st = stats?.statistics?.reduce(
          (best, cur) =>
            (cur.games.appearences ?? 0) > (best.games.appearences ?? 0) ? cur : best,
          stats.statistics[0],
        );

        return {
          id:          p.id,
          name:        p.name,
          nameKo:      mock?.nameKo,
          position:    mapPosition(p.position),
          number:      p.number,
          // Prefer live API data; fall back to mock
          nationality: stats?.player.nationality ?? mock?.nationality ?? "",
          height:      stats?.player.height     ?? mock?.height,
          weight:      stats?.player.weight     ?? mock?.weight,
          age:         stats?.player.age        ?? p.age ?? mock?.age,
          goals:       st?.goals.total          ?? mock?.goals,
          assists:     st?.goals.assists        ?? mock?.assists,
          appearances: st?.games.appearences   ?? mock?.appearances,
          // Not available from API — use mock value
          marketValue: mock?.marketValue,
        };
      })
      .sort((a, b) => {
        const order = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
        return order[a.position] - order[b.position] || a.number - b.number;
      });
  } catch (err) {
    console.error(`[squads] Fetch failed for ${teamSlug}:`, err);
    return mockFallback;
  }
}

/** Synchronous fallback — used where async is not possible */
export function getSquad(teamSlug: string): MockPlayer[] {
  return MOCK_SQUADS[teamSlug] ?? [];
}
