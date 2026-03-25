import { createClient } from "@/lib/supabase/server";

export type PredictionResult = "HOME_WIN" | "DRAW" | "AWAY_WIN";
export type PredictionStatus = "PENDING" | "WON" | "LOST" | "CANCELLED";

export interface Prediction {
  id: string;
  user_id: string;
  match_id: number;
  predicted_result: PredictionResult;
  bet_amount: number;
  status: PredictionStatus;
  created_at: string;
}

export interface PredictionStats {
  HOME_WIN: number;
  DRAW: number;
  AWAY_WIN: number;
  total: number;
}

export const MIN_BET = 10;

function isSupabaseConfigured() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Place a prediction. Deducts points and inserts a prediction record. */
export async function placePrediction(
  userId: string,
  matchId: number,
  result: PredictionResult,
  amount: number,
  homeTeamName?: string,
  awayTeamName?: string
): Promise<{ success: boolean; error?: string; prediction?: Prediction }> {
  if (!isSupabaseConfigured()) return { success: false, error: "Supabase not configured" };
  if (amount < MIN_BET) return { success: false, error: `Minimum bet is ${MIN_BET} points` };

  const supabase = await createClient();

  // Check current points
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_points")
    .eq("id", userId)
    .single();

  if (!profile) return { success: false, error: "Profile not found" };
  if (profile.total_points < amount) return { success: false, error: "Insufficient points" };

  // Check for duplicate prediction
  const { data: existing } = await supabase
    .from("predictions")
    .select("id")
    .eq("user_id", userId)
    .eq("match_id", matchId)
    .maybeSingle();

  if (existing) return { success: false, error: "Already predicted for this match" };

  // Deduct points from profile
  const { error: deductErr } = await supabase
    .from("profiles")
    .update({ total_points: profile.total_points - amount })
    .eq("id", userId);

  if (deductErr) return { success: false, error: "Failed to deduct points" };

  // Insert prediction record
  const { data: prediction, error: insertErr } = await supabase
    .from("predictions")
    .insert({
      user_id: userId,
      match_id: matchId,
      predicted_result: result,
      bet_amount: amount,
      status: "PENDING",
      home_team_name: homeTeamName ?? null,
      away_team_name: awayTeamName ?? null,
    })
    .select()
    .single();

  if (insertErr) {
    // Refund the deducted points on failure
    await supabase
      .from("profiles")
      .update({ total_points: profile.total_points })
      .eq("id", userId);
    return { success: false, error: "Failed to save prediction" };
  }

  // Log the deduction
  await supabase.from("point_logs").insert({
    user_id: userId,
    amount: -amount,
    reason: "match_bet",
    reference_id: (prediction as Prediction).id,
  });

  return { success: true, prediction: prediction as Prediction };
}

/** Get the current user's prediction for a specific match. */
export async function getUserPrediction(
  userId: string,
  matchId: number
): Promise<Prediction | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", userId)
      .eq("match_id", matchId)
      .maybeSingle();
    return (data as Prediction) ?? null;
  } catch {
    return null;
  }
}

/** Get aggregated vote counts for all results in a match. */
export async function getPredictionStats(matchId: number): Promise<PredictionStats> {
  const empty: PredictionStats = { HOME_WIN: 0, DRAW: 0, AWAY_WIN: 0, total: 0 };
  if (!isSupabaseConfigured()) return empty;

  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_prediction_stats", { p_match_id: matchId });
    if (!data) return empty;

    const stats = { ...empty };
    for (const row of data as Array<{ predicted_result: string; vote_count: number }>) {
      const count = Number(row.vote_count);
      if (row.predicted_result === "HOME_WIN") stats.HOME_WIN = count;
      else if (row.predicted_result === "DRAW") stats.DRAW = count;
      else if (row.predicted_result === "AWAY_WIN") stats.AWAY_WIN = count;
    }
    stats.total = stats.HOME_WIN + stats.DRAW + stats.AWAY_WIN;
    return stats;
  } catch {
    return empty;
  }
}

/**
 * Settle all PENDING predictions for a match via the SECURITY DEFINER DB function.
 * Winners receive bet_amount * 2. Called by the settle API route.
 */
export async function settlePredictions(
  matchId: number,
  finalResult: PredictionResult
): Promise<{ settled: number; rewarded: number }> {
  if (!isSupabaseConfigured()) return { settled: 0, rewarded: 0 };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("settle_predictions", {
    p_match_id: matchId,
    p_final_result: finalResult,
  });

  if (error) throw new Error(error.message);
  return data as { settled: number; rewarded: number };
}
