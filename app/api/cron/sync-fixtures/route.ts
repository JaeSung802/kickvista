/**
 * Cron endpoint: Sync today's fixtures from football API
 * Schedule: Every 5 minutes during match days
 *
 * Env vars:
 *   CRON_SECRET         – shared secret for cron authentication
 *   API_FOOTBALL_KEY    – API key (falls back to mock mode if missing)
 *   FOOTBALL_API_HOST   – default: v3.football.api-sports.io
 *
 * Usage (Vercel Cron / external cron service):
 *   GET /api/cron/sync-fixtures
 *   Authorization: Bearer {CRON_SECRET}
 */
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { currentFootballSeason, SUPPORTED_LEAGUES } from "@/lib/football/constants";
import { getFootballProvider } from "@/lib/football/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isMockMode = !process.env.API_FOOTBALL_KEY || process.env.FOOTBALL_MOCK_MODE === "true";

  if (isMockMode) {
    return NextResponse.json({
      success: true,
      mode: "mock",
      message: "Mock mode: no API key configured. Set API_FOOTBALL_KEY to enable real sync.",
      count: 0,
      syncedAt: new Date().toISOString(),
    });
  }

  const provider = getFootballProvider();
  const season = currentFootballSeason();
  const today = new Date().toISOString().split("T")[0];

  const results = await Promise.all(
    SUPPORTED_LEAGUES.map(async (league) => {
      try {
        const fixtures = await provider.fetchFixtures(league.id, today, season);
        return { leagueId: league.id, count: fixtures.length };
      } catch (error) {
        return { leagueId: league.id, count: 0, error: String(error) };
      }
    })
  );

  const totalSynced = results.reduce((sum, r) => sum + r.count, 0);
  const errors = results.filter((r) => r.error);

  // Invalidate Next.js data cache so pages re-render with fresh data
  revalidateTag("fixtures", {});

  return NextResponse.json({
    success: errors.length === 0,
    mode: "live",
    totalSynced,
    results,
    errors: errors.length > 0 ? errors : undefined,
    syncedAt: new Date().toISOString(),
  });
}
