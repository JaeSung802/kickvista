/**
 * Admin: Force-generate analysis for a specific fixture.
 *
 * GET /api/admin/generate-analysis?fixtureId=XXX&type=preview|recap&locale=en|ko
 *
 * Protected by CRON_SECRET (Bearer token).
 * Overwrites existing analysis for the given fixture+type+locale.
 *
 * Useful for:
 *   - Debugging when the cron missed a match
 *   - Re-generating after stats are finalized (30–60min after FT)
 *   - Testing new prompt changes on a known fixture
 */
import { NextRequest, NextResponse } from "next/server";
import { getFootballProvider } from "@/lib/football/provider";
import { SUPPORTED_LEAGUES, currentFootballSeason } from "@/lib/football/constants";
import { generateMatchAnalysis, type AnalysisEnrichmentData } from "@/lib/ai-analysis";
import { saveAnalysis } from "@/lib/analysis/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  // Auth
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const fixtureIdStr = searchParams.get("fixtureId");
  const typeParam    = searchParams.get("type");
  const localeParam  = searchParams.get("locale");

  // Validate params
  const fixtureId = fixtureIdStr ? parseInt(fixtureIdStr, 10) : NaN;
  if (isNaN(fixtureId)) {
    return NextResponse.json({ error: "Missing or invalid fixtureId" }, { status: 400 });
  }
  const type = typeParam === "preview" || typeParam === "recap" ? typeParam : null;
  if (!type) {
    return NextResponse.json({ error: "type must be 'preview' or 'recap'" }, { status: 400 });
  }
  const locales: Array<"en" | "ko"> =
    localeParam === "en" ? ["en"] :
    localeParam === "ko" ? ["ko"] :
    ["en", "ko"];

  if (!process.env.ANTHROPIC_API_KEY || !process.env.API_FOOTBALL_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY and API_FOOTBALL_KEY are required" }, { status: 503 });
  }

  const provider = getFootballProvider();

  // Fetch fixture detail
  const fixture = await provider.fetchMatchDetail(fixtureId);
  if (!fixture) {
    return NextResponse.json({ error: `Fixture ${fixtureId} not found` }, { status: 404 });
  }

  const league = SUPPORTED_LEAGUES.find((l) => l.id === fixture.leagueId);
  const season = league?.season ?? currentFootballSeason();

  // Fetch enrichment data
  let enrichment: AnalysisEnrichmentData = {};
  try {
    if (type === "preview") {
      const [h2h, homeStats, awayStats] = await Promise.all([
        provider.fetchHeadToHead(fixture.homeTeam.id, fixture.awayTeam.id),
        provider.fetchTeamStatistics(fixture.leagueId, season, fixture.homeTeam.id),
        provider.fetchTeamStatistics(fixture.leagueId, season, fixture.awayTeam.id),
      ]);
      enrichment = { h2h, homeStats, awayStats };
    } else {
      const fixturePlayers = await provider.fetchFixturePlayers(fixtureId);
      enrichment = { fixturePlayers };
    }
  } catch (err) {
    console.warn(`[generate-analysis] Enrichment failed for fixture=${fixtureId}:`, err);
  }

  const generated: string[] = [];
  const errors: { locale: string; error: string }[] = [];

  for (const locale of locales) {
    try {
      const analysis = await generateMatchAnalysis({ fixture, type, locale, enrichment });
      await saveAnalysis(analysis, {
        leagueId:   fixture.leagueId,
        leagueSlug: fixture.leagueSlug,
        homeTeam:   fixture.homeTeam.name,
        awayTeam:   fixture.awayTeam.name,
        matchDate:  fixture.date,
      });
      generated.push(`${type}:${locale}`);
    } catch (err) {
      console.error(`[generate-analysis] fixture=${fixtureId} type=${type} locale=${locale}:`, err);
      errors.push({ locale, error: String(err) });
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    fixtureId,
    fixture: `${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`,
    status: fixture.status,
    type,
    generated,
    errors: errors.length > 0 ? errors : undefined,
    slug: generated.length > 0
      ? `${fixture.homeTeam.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-vs-${fixture.awayTeam.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${fixture.date.split("T")[0]}-${type}`
      : undefined,
  });
}
