/**
 * Smart Settlement Cron — /api/predictions/settle
 *
 * GET  → Vercel Cron mode: scan all PENDING predictions, check Football API,
 *         settle any finished matches automatically.
 * POST → Manual mode: settle one specific match (body: { matchId, finalResult }).
 *
 * Both require: Authorization: Bearer {CRON_SECRET}
 *
 * Required environment variables:
 *   CRON_SECRET              — shared secret (set in Vercel → Project → Env Vars)
 *   SUPABASE_SERVICE_ROLE_KEY — service role key from Supabase dashboard
 *   API_FOOTBALL_KEY         — football API key (skipped in mock mode if missing)
 *
 * Vercel Cron (vercel.json):
 *   { "path": "/api/predictions/settle", "schedule": "* /15 * * * *" }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { settlePredictions, type PredictionResult } from "@/lib/predictions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Auth guard ───────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // no secret set → open in dev
  return req.headers.get("authorization") === `Bearer ${cronSecret}`;
}

// ─── Football API helper ──────────────────────────────────────────────────────

const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);

interface MatchApiResult {
  status: string; // "FT", "NS", "1H", etc.
  homeGoals: number;
  awayGoals: number;
}

/**
 * Fetch a single fixture from api-football.com.
 * Returns null when API key is missing (mock/dev mode) or on error.
 */
async function fetchMatchResult(fixtureId: number): Promise<MatchApiResult | null> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) return null;

  const host = process.env.FOOTBALL_API_HOST ?? "v3.football.api-sports.io";

  try {
    const res = await fetch(`https://${host}/fixtures?id=${fixtureId}`, {
      headers: { "x-apisports-key": apiKey },
      // No ISR cache — we want fresh data for settlement
      cache: "no-store",
    });

    if (!res.ok) return null;

    const json = await res.json() as {
      response: Array<{
        fixture: { status: { short: string } };
        goals: { home: number | null; away: number | null };
      }>;
    };

    const fixture = json.response?.[0];
    if (!fixture) return null;

    return {
      status: fixture.fixture.status.short,
      homeGoals: fixture.goals.home ?? 0,
      awayGoals: fixture.goals.away ?? 0,
    };
  } catch (err) {
    console.error(`[settle] Football API error for fixture ${fixtureId}:`, err);
    return null;
  }
}

/** Derive HOME_WIN / DRAW / AWAY_WIN from goal counts. */
function toFinalResult(homeGoals: number, awayGoals: number): PredictionResult {
  if (homeGoals > awayGoals) return "HOME_WIN";
  if (awayGoals > homeGoals) return "AWAY_WIN";
  return "DRAW";
}

// ─── Supabase anon client (for RPC without session) ──────────────────────────

function createAnonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ─── GET — Vercel Cron handler ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isMockMode = !process.env.API_FOOTBALL_KEY;

  if (isMockMode) {
    return NextResponse.json({
      success: true,
      mode: "mock",
      message: "Mock mode: set API_FOOTBALL_KEY to enable real settlement.",
      settledMatches: 0,
      totalRewarded: 0,
      checkedAt: new Date().toISOString(),
    });
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 500 }
    );
  }

  // ── Step 1: Get all match_ids with PENDING predictions ──────────────────────
  const supabase = createAnonClient();
  const { data: pendingRows, error: rpcError } = await supabase.rpc(
    "get_pending_match_ids"
  );

  if (rpcError) {
    console.error("[settle] get_pending_match_ids RPC error:", rpcError);
    return NextResponse.json(
      {
        error: "Failed to fetch pending match IDs. " +
               "Did you run supabase/predictions-cron.sql?",
        detail: rpcError.message,
      },
      { status: 500 }
    );
  }

  const matchIds: number[] =
    (pendingRows as Array<{ match_id: number }> | null)?.map((r) => r.match_id) ?? [];

  if (matchIds.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No pending predictions to settle.",
      settledMatches: 0,
      totalRewarded: 0,
      checkedAt: new Date().toISOString(),
    });
  }

  // ── Step 2: Check each match via Football API ───────────────────────────────
  const summary: Array<{
    matchId: number;
    status: string;
    result?: PredictionResult;
    settled?: number;
    rewarded?: number;
    skipped?: string;
  }> = [];

  for (const matchId of matchIds) {
    try {
      const matchData = await fetchMatchResult(matchId);

      if (!matchData) {
        summary.push({ matchId, status: "api_error", skipped: "Football API returned no data" });
        continue;
      }

      if (!FINISHED_STATUSES.has(matchData.status)) {
        summary.push({ matchId, status: matchData.status, skipped: "Match not yet finished" });
        continue;
      }

      // ── Step 3: Settle this match ─────────────────────────────────────────
      const finalResult = toFinalResult(matchData.homeGoals, matchData.awayGoals);
      const { settled, rewarded } = await settlePredictions(matchId, finalResult);

      summary.push({ matchId, status: matchData.status, result: finalResult, settled, rewarded });
    } catch (err) {
      console.error(`[settle] Error processing match ${matchId}:`, err);
      summary.push({ matchId, status: "error", skipped: String(err) });
    }
  }

  const settledMatches = summary.filter((s) => s.settled !== undefined).length;
  const totalRewarded  = summary.reduce((sum, s) => sum + (s.rewarded ?? 0), 0);

  return NextResponse.json({
    success: true,
    mode: "live",
    checkedMatches: matchIds.length,
    settledMatches,
    totalRewarded,
    summary,
    checkedAt: new Date().toISOString(),
  });
}

// ─── POST — Manual settlement handler ────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { matchId, finalResult } = (await req.json()) as {
      matchId: number;
      finalResult: PredictionResult;
    };

    if (!matchId || !finalResult) {
      return NextResponse.json(
        { error: "matchId and finalResult are required" },
        { status: 400 }
      );
    }

    const result = await settlePredictions(matchId, finalResult);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: "Settlement failed", detail: String(error) },
      { status: 500 }
    );
  }
}
