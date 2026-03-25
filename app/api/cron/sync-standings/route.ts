/**
 * Cron endpoint: Sync league standings
 * Schedule: Every 30 minutes / after match completion
 *
 * Env vars: CRON_SECRET, API_FOOTBALL_KEY, FOOTBALL_API_HOST
 */
import { NextRequest, NextResponse } from "next/server";
import { currentFootballSeason, SUPPORTED_LEAGUES } from "@/lib/football/constants";
import { getFootballProvider } from "@/lib/football/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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
      message: "Mock mode active. Set API_FOOTBALL_KEY to enable real sync.",
      leagues: SUPPORTED_LEAGUES.map((l) => ({ slug: l.slug, status: "mock" })),
      syncedAt: new Date().toISOString(),
    });
  }

  const provider = getFootballProvider();
  const season = currentFootballSeason();

  const results = await Promise.all(
    SUPPORTED_LEAGUES.map(async (league) => {
      try {
        const standings = await provider.fetchStandings(league.id, season);
        if (!standings) throw new Error("Empty response");
        return { slug: league.slug, status: "ok" as const };
      } catch (error) {
        return { slug: league.slug, status: "error" as const, error: String(error) };
      }
    })
  );

  return NextResponse.json({
    success: results.every((r) => r.status === "ok"),
    mode: "live",
    leagues: results,
    syncedAt: new Date().toISOString(),
  });
}
