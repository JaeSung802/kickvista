/**
 * Cron endpoint: Generate AI match analysis for upcoming/finished fixtures
 * Schedule: Every hour
 *
 * Flow:
 *  1. Fetch fixtures finishing within 24h (→ recaps) and starting within 24h (→ previews)
 *  2. Skip fixtures that already have an analysis stored
 *  3. Generate analysis via Claude API (both EN + KO)
 *  4. Save to match_analyses table
 *
 * Env vars: CRON_SECRET, ANTHROPIC_API_KEY, API_FOOTBALL_KEY, AI_MOCK_MODE
 */
import { NextRequest, NextResponse } from "next/server";
import { getFootballProvider } from "@/lib/football/provider";
import { SUPPORTED_LEAGUES, currentFootballSeason } from "@/lib/football/constants";
import { generateMatchAnalysis, isAiMockMode, type AnalysisEnrichmentData } from "@/lib/ai-analysis";
import { saveAnalysis, analysisExists } from "@/lib/analysis/db";
import type { Fixture } from "@/lib/football/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Allow up to 5 minutes for AI generation across multiple fixtures
export const maxDuration = 300;

type Job = { fixture: Fixture; type: "preview" | "recap" };

async function buildJobs(provider: ReturnType<typeof getFootballProvider>): Promise<Job[]> {
  const season = currentFootballSeason();
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  // Use 72h lookback so cron delays don't cause missed recaps
  const ago72h = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  const fromStr = ago72h.toISOString().split("T")[0];
  const toStr = in24h.toISOString().split("T")[0];

  const jobs: Job[] = [];

  await Promise.all(
    SUPPORTED_LEAGUES.map(async (league) => {
      try {
        const fixtures = await provider.fetchFixturesRange(
          league.id,
          fromStr,
          toStr,
          season
        );

        for (const f of fixtures) {
          const kickoff = new Date(f.date).getTime();
          const finished = ["FT", "AET", "PEN"].includes(f.status);
          const upcoming = ["NS", "PST"].includes(f.status);

          // Recap: finished within last 72h
          if (finished && kickoff >= ago72h.getTime()) {
            jobs.push({ fixture: f, type: "recap" });
          }
          // Preview: kicks off within next 24h
          if (upcoming && kickoff <= in24h.getTime()) {
            jobs.push({ fixture: f, type: "preview" });
          }
        }
      } catch {
        // Skip this league silently — provider error handling already logs
      }
    })
  );

  return jobs;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isAiMockMode || !process.env.API_FOOTBALL_KEY) {
    return NextResponse.json({
      success: true,
      mode: "mock",
      message: "Mock mode active. Set ANTHROPIC_API_KEY and API_FOOTBALL_KEY to enable real generation.",
      syncedAt: new Date().toISOString(),
    });
  }

  const provider = getFootballProvider();

  let jobs: Job[];
  try {
    jobs = await buildJobs(provider);
  } catch (err) {
    console.error("[sync-match-analysis] Failed to build jobs:", err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }

  const results: { fixtureId: number; type: string; status: "ok" | "skipped" | "error"; error?: string }[] = [];

  for (const job of jobs) {
    const { fixture, type } = job;

    // Skip if both locales already exist
    const [enExists, koExists] = await Promise.all([
      analysisExists(fixture.id, type, "en"),
      analysisExists(fixture.id, type, "ko"),
    ]);
    if (enExists && koExists) {
      results.push({ fixtureId: fixture.id, type: `${type}:en`, status: "skipped" });
      results.push({ fixtureId: fixture.id, type: `${type}:ko`, status: "skipped" });
      continue;
    }

    // Fetch enrichment data once per fixture (shared across both locales)
    let enrichment: AnalysisEnrichmentData = {};
    try {
      const league = SUPPORTED_LEAGUES.find((l) => l.id === fixture.leagueId);
      const season = league?.season ?? currentFootballSeason();

      if (type === "preview") {
        const [h2h, homeStats, awayStats] = await Promise.all([
          provider.fetchHeadToHead(fixture.homeTeam.id, fixture.awayTeam.id),
          provider.fetchTeamStatistics(fixture.leagueId, season, fixture.homeTeam.id),
          provider.fetchTeamStatistics(fixture.leagueId, season, fixture.awayTeam.id),
        ]);
        enrichment = { h2h, homeStats, awayStats };
      } else {
        // For recaps: fetch player stats (wait 30min buffer already handled by cron scheduling)
        const fixturePlayers = await provider.fetchFixturePlayers(fixture.id);
        enrichment = { fixturePlayers };
      }
    } catch (err) {
      console.warn(`[sync-match-analysis] Enrichment failed for fixture=${fixture.id}:`, err);
      // Proceed with empty enrichment — Claude will still generate from basic data
    }

    // Generate for both locales
    for (const locale of ["en", "ko"] as const) {
      const already = locale === "en" ? enExists : koExists;
      if (already) {
        results.push({ fixtureId: fixture.id, type: `${type}:${locale}`, status: "skipped" });
        continue;
      }

      try {
        const analysis = await generateMatchAnalysis({ fixture, type, locale, enrichment });
        await saveAnalysis(analysis, {
          leagueId:   fixture.leagueId,
          leagueSlug: fixture.leagueSlug,
          homeTeam:   fixture.homeTeam.name,
          awayTeam:   fixture.awayTeam.name,
          matchDate:  fixture.date,
        });
        results.push({ fixtureId: fixture.id, type: `${type}:${locale}`, status: "ok" });
      } catch (err) {
        console.error(`[sync-match-analysis] fixture=${fixture.id} type=${type} locale=${locale}`, err);
        results.push({ fixtureId: fixture.id, type: `${type}:${locale}`, status: "error", error: String(err) });
      }
    }
  }

  const ok = results.filter((r) => r.status === "ok").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const errors = results.filter((r) => r.status === "error");

  return NextResponse.json({
    success: errors.length === 0,
    mode: "live",
    jobsFound: jobs.length,
    generated: ok,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
    syncedAt: new Date().toISOString(),
  });
}
