/**
 * Smart Settlement Cron — /api/predictions/settle
 *
 * GET  → Vercel Cron mode: scan all PENDING predictions, check Football API,
 *         settle any finished matches automatically.
 * POST → Manual mode: settle one specific finished match (body: { matchId,
 *         finalResult? }). The result is always taken from the Football API;
 *         a finalResult that disagrees is rejected.
 *
 * Both require: Authorization: Bearer {CRON_SECRET} (no secret → 503).
 * While PREDICTION_SETTLEMENT_PAUSED (lib/predictions-pause.ts) is true, both
 * return 503 settlement_paused right after the auth check.
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
import { PREDICTION_SETTLEMENT_PAUSED } from "@/lib/predictions-pause";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Auth guard ───────────────────────────────────────────────────────────────

// Fail closed: without a configured secret settlement never runs, so the
// endpoint can't be triggered anonymously (it pays out points).
function authError(req: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Cron is not configured." }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

// Temporary pause (after auth): no Football API call, DB query or RPC.
function pausedResponse(): NextResponse {
  return NextResponse.json(
    { error: "Settlement is temporarily paused.", code: "settlement_paused" },
    { status: 503 }
  );
}

// ─── Structured run logs ──────────────────────────────────────────────────────
// One JSON line per event with fixed fields and reason codes only. Never log
// user data, keys/tokens/headers, request or response bodies, or raw errors.

type LogValue = string | number | boolean | null;

function logSettle(
  runId: string | null,
  event: string,
  fields: Record<string, LogValue> = {},
  level: "info" | "warn" | "error" = "info"
): void {
  const line = JSON.stringify({ scope: "settle", run_id: runId, event, ...fields });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

/** Fixed error code for a failed settlement; the error message is not logged. */
function settleErrorCode(err: unknown): string {
  const message = err instanceof Error ? err.message : "";
  if (/permission denied/i.test(message)) return "rpc_permission_denied";
  if (/SUPABASE_SERVICE_ROLE_KEY/.test(message)) return "service_key_missing";
  return "settle_failed";
}

const asCount = (n: unknown): number | null => (typeof n === "number" && Number.isFinite(n) ? n : null);

// ─── Football API helper ──────────────────────────────────────────────────────

const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);

interface MatchApiResult {
  status: string; // "FT", "NS", "1H", etc.
  homeGoals: number | null;
  awayGoals: number | null;
}

/** Same rule as the rest of the app: no API key or FOOTBALL_MOCK_MODE=true. */
function isFootballMockMode(): boolean {
  return !process.env.API_FOOTBALL_KEY || process.env.FOOTBALL_MOCK_MODE === "true";
}

/**
 * Fetch a single fixture from api-football.com.
 * Returns null in mock mode, on any API error, or when the response is not
 * clearly the requested fixture.
 */
async function fetchMatchResult(fixtureId: number, runId: string | null = null): Promise<MatchApiResult | null> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey || isFootballMockMode()) return null;

  const host = process.env.FOOTBALL_API_HOST ?? "v3.football.api-sports.io";

  try {
    const res = await fetch(`https://${host}/fixtures?id=${fixtureId}`, {
      headers: { "x-apisports-key": apiKey },
      // No ISR cache — we want fresh data for settlement
      cache: "no-store",
    });

    if (!res.ok) {
      logSettle(runId, "football_api_failed", { match_id: fixtureId, reason: "http_error", http_status: res.status }, "error");
      return null;
    }

    const json = await res.json() as {
      response?: Array<{
        fixture?: { id?: number; status?: { short?: string } };
        goals?: { home?: number | null; away?: number | null };
      }>;
    };

    const fixture = json.response?.[0];
    const status = fixture?.fixture?.status?.short;
    if (!fixture || fixture.fixture?.id !== fixtureId || typeof status !== "string") {
      const reason = !fixture ? "no_fixture" : fixture.fixture?.id !== fixtureId ? "fixture_mismatch" : "missing_status";
      logSettle(runId, "football_api_failed", { match_id: fixtureId, reason }, "warn");
      return null;
    }

    // Missing scores stay null — never default them to 0.
    return {
      status,
      homeGoals: typeof fixture.goals?.home === "number" ? fixture.goals.home : null,
      awayGoals: typeof fixture.goals?.away === "number" ? fixture.goals.away : null,
    };
  } catch {
    logSettle(runId, "football_api_failed", { match_id: fixtureId, reason: "request_failed" }, "error");
    return null;
  }
}

/** Derive HOME_WIN / DRAW / AWAY_WIN from goal counts. */
function toFinalResult(homeGoals: number, awayGoals: number): PredictionResult {
  if (homeGoals > awayGoals) return "HOME_WIN";
  if (awayGoals > homeGoals) return "AWAY_WIN";
  return "DRAW";
}

const isGoalCount = (n: number | null): n is number => Number.isInteger(n) && (n as number) >= 0;

/**
 * Result of a finished match with valid scores, or null when anything is in
 * doubt (never settle then). Uses the API's `goals` field as before: for
 * AET that includes extra time, for PEN it excludes the shoot-out.
 */
function verifiedFinalResult(match: MatchApiResult): PredictionResult | null {
  if (!FINISHED_STATUSES.has(match.status)) return null;
  if (!isGoalCount(match.homeGoals) || !isGoalCount(match.awayGoals)) return null;
  return toFinalResult(match.homeGoals, match.awayGoals);
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
  const denied = authError(req);
  if (denied) return denied;

  // Ties together every log line of this run.
  const runId = crypto.randomUUID();

  if (PREDICTION_SETTLEMENT_PAUSED) {
    logSettle(runId, "run_end", { outcome: "paused" }, "warn");
    return pausedResponse();
  }

  const isMockMode = isFootballMockMode();

  if (isMockMode) {
    logSettle(runId, "run_end", { outcome: "mock_mode" });
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
    logSettle(runId, "run_end", { outcome: "supabase_not_configured" }, "error");
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
    logSettle(runId, "run_end", { outcome: "pending_query_failed", db_code: rpcError.code ?? null }, "error");
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
    logSettle(runId, "run_end", { outcome: "no_pending", checked_matches: 0 });
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

  // rpc_ok_matches counts successful RPC calls; settled/rewarded_predictions
  // count the predictions those calls actually changed (can be 0).
  const counts = {
    rpc_ok_matches: 0,
    settled_predictions: 0,
    rewarded_predictions: 0,
    skipped_not_finished: 0,
    skipped_api_no_data: 0,
    skipped_invalid_score: 0,
    failed_matches: 0,
  };

  for (const matchId of matchIds) {
    try {
      const matchData = await fetchMatchResult(matchId, runId);

      if (!matchData) {
        counts.skipped_api_no_data++;
        logSettle(runId, "match", { match_id: matchId, result: "skipped", reason: "api_no_data" }, "warn");
        summary.push({ matchId, status: "api_error", skipped: "Football API returned no data" });
        continue;
      }

      if (!FINISHED_STATUSES.has(matchData.status)) {
        counts.skipped_not_finished++;
        logSettle(runId, "match", { match_id: matchId, result: "skipped", reason: "not_finished", api_status: matchData.status });
        summary.push({ matchId, status: matchData.status, skipped: "Match not yet finished" });
        continue;
      }

      const finalResult = verifiedFinalResult(matchData);
      if (!finalResult) {
        counts.skipped_invalid_score++;
        logSettle(runId, "match", { match_id: matchId, result: "skipped", reason: "invalid_score", api_status: matchData.status }, "warn");
        summary.push({ matchId, status: matchData.status, skipped: "Score missing or invalid" });
        continue;
      }

      // ── Step 3: Settle this match ─────────────────────────────────────────
      const { settled, rewarded } = await settlePredictions(matchId, finalResult);

      counts.rpc_ok_matches++;
      counts.settled_predictions += asCount(settled) ?? 0;
      counts.rewarded_predictions += asCount(rewarded) ?? 0;
      logSettle(runId, "match", {
        match_id: matchId, result: "settled", api_status: matchData.status, final_result: finalResult,
        settled: asCount(settled), rewarded: asCount(rewarded),
      });
      summary.push({ matchId, status: matchData.status, result: finalResult, settled, rewarded });
    } catch (err) {
      counts.failed_matches++;
      logSettle(runId, "match", { match_id: matchId, result: "failed", error_code: settleErrorCode(err) }, "error");
      summary.push({ matchId, status: "error", skipped: String(err) });
    }
  }

  logSettle(runId, "run_end", { outcome: "completed", checked_matches: matchIds.length, ...counts });

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
  const denied = authError(req);
  if (denied) return denied;

  if (PREDICTION_SETTLEMENT_PAUSED) {
    logSettle(null, "manual_settle", { outcome: "paused" }, "warn");
    return pausedResponse();
  }

  try {
    const { matchId, finalResult } = (await req.json()) as {
      matchId: number;
      finalResult?: PredictionResult;
    };

    if (!Number.isInteger(matchId) || matchId <= 0) {
      return NextResponse.json({ error: "A valid matchId is required" }, { status: 400 });
    }

    if (isFootballMockMode()) {
      return NextResponse.json(
        { error: "Settlement is disabled in mock mode" },
        { status: 503 }
      );
    }

    // Never trust the caller's result: settle only a finished match, with the
    // result derived from the Football API.
    const matchData = await fetchMatchResult(matchId);
    if (!matchData) {
      return NextResponse.json(
        { error: "Could not verify the match result" },
        { status: 503 }
      );
    }
    if (!FINISHED_STATUSES.has(matchData.status)) {
      return NextResponse.json(
        { error: "Match is not finished", status: matchData.status },
        { status: 409 }
      );
    }

    const verifiedResult = verifiedFinalResult(matchData);
    if (!verifiedResult) {
      return NextResponse.json(
        { error: "Could not verify the match result" },
        { status: 503 }
      );
    }
    if (finalResult !== undefined && finalResult !== verifiedResult) {
      return NextResponse.json(
        { error: "finalResult does not match the verified result", verifiedResult },
        { status: 409 }
      );
    }

    const result = await settlePredictions(matchId, verifiedResult);
    return NextResponse.json({ success: true, result: verifiedResult, ...result });
  } catch (error) {
    // Details stay in the server log (message only — no request headers);
    // the caller gets a generic error.
    console.error("[settle] Manual settlement failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Settlement failed" }, { status: 500 });
  }
}
