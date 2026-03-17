/**
 * Cron endpoint: Sync league standings
 * Schedule: Every 30 minutes / after match completion
 *
 * Env vars: CRON_SECRET, FOOTBALL_API_KEY, FOOTBALL_API_HOST
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LEAGUES = [
  { id: 39, slug: "premier-league", season: 2024 },
  { id: 140, slug: "la-liga", season: 2024 },
  { id: 78, slug: "bundesliga", season: 2024 },
  { id: 135, slug: "serie-a", season: 2024 },
  { id: 61, slug: "ligue-1", season: 2024 },
  { id: 2, slug: "champions-league", season: 2024 },
];

async function fetchStandingsFromAPI(leagueId: number, season: number): Promise<unknown> {
  const apiKey = process.env.FOOTBALL_API_KEY;
  const host = process.env.FOOTBALL_API_HOST ?? "v3.football.api-sports.io";
  if (!apiKey) return null;

  const url = `https://${host}/standings?league=${leagueId}&season=${season}`;
  const res = await fetch(url, {
    headers: { "x-rapidapi-key": apiKey, "x-rapidapi-host": host },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  return data.response?.[0] ?? null;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isMockMode = !process.env.FOOTBALL_API_KEY || process.env.FOOTBALL_MOCK_MODE === "true";

  if (isMockMode) {
    return NextResponse.json({
      success: true,
      mode: "mock",
      message: "Mock mode active. Set FOOTBALL_API_KEY to enable real sync.",
      leagues: LEAGUES.map((l) => ({ slug: l.slug, status: "mock" })),
      syncedAt: new Date().toISOString(),
    });
  }

  const results: { slug: string; status: "ok" | "error"; error?: string }[] = [];

  for (const league of LEAGUES) {
    try {
      const standings = await fetchStandingsFromAPI(league.id, league.season);
      if (!standings) throw new Error("Empty response");
      // TODO: upsert standings to database
      results.push({ slug: league.slug, status: "ok" });
    } catch (error) {
      results.push({ slug: league.slug, status: "error", error: String(error) });
    }
  }

  return NextResponse.json({
    success: results.every((r) => r.status === "ok"),
    mode: "live",
    leagues: results,
    syncedAt: new Date().toISOString(),
  });
}
