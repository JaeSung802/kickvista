/**
 * Cron endpoint: Sync today's fixtures from football API
 * Schedule: Every 5 minutes during match days
 *
 * Env vars:
 *   CRON_SECRET         – shared secret for cron authentication
 *   FOOTBALL_API_KEY    – API key (falls back to mock mode if missing)
 *   FOOTBALL_API_HOST   – default: v3.football.api-sports.io
 *
 * Usage (Vercel Cron / external cron service):
 *   GET /api/cron/sync-fixtures
 *   Authorization: Bearer {CRON_SECRET}
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORTED_LEAGUE_IDS = [39, 140, 78, 135, 61, 2];

async function fetchFixturesFromAPI(leagueId: number, season: number): Promise<unknown[]> {
  const apiKey = process.env.FOOTBALL_API_KEY;
  const host = process.env.FOOTBALL_API_HOST ?? "v3.football.api-sports.io";
  if (!apiKey) return [];

  const today = new Date().toISOString().split("T")[0];
  const url = `https://${host}/fixtures?date=${today}&league=${leagueId}&season=${season}`;

  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": host,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new Error(`API error ${res.status} for league ${leagueId}`);
  const data = await res.json();
  return data.response ?? [];
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isMockMode = !process.env.FOOTBALL_API_KEY || process.env.FOOTBALL_MOCK_MODE === "true";
  const currentSeason = 2024;

  if (isMockMode) {
    return NextResponse.json({
      success: true,
      mode: "mock",
      message: "Mock mode: no API key configured. Set FOOTBALL_API_KEY to enable real sync.",
      count: 0,
      syncedAt: new Date().toISOString(),
    });
  }

  const results: { leagueId: number; count: number; error?: string }[] = [];

  for (const leagueId of SUPPORTED_LEAGUE_IDS) {
    try {
      const fixtures = await fetchFixturesFromAPI(leagueId, currentSeason);
      // TODO: upsert fixtures to database
      results.push({ leagueId, count: fixtures.length });
    } catch (error) {
      results.push({ leagueId, count: 0, error: String(error) });
    }
  }

  const totalSynced = results.reduce((sum, r) => sum + r.count, 0);
  const errors = results.filter((r) => r.error);

  return NextResponse.json({
    success: errors.length === 0,
    mode: "live",
    totalSynced,
    results,
    errors: errors.length > 0 ? errors : undefined,
    syncedAt: new Date().toISOString(),
  });
}
