import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  placePrediction,
  getUserPrediction,
  getPredictionStats,
  type PredictionResult,
} from "@/lib/predictions";

/** GET /api/predictions?matchId=123 — returns user's prediction + community stats */
export async function GET(req: NextRequest) {
  const matchId = Number(req.nextUrl.searchParams.get("matchId"));
  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [stats, userPrediction] = await Promise.all([
      getPredictionStats(matchId),
      user ? getUserPrediction(user.id, matchId) : Promise.resolve(null),
    ]);

    return NextResponse.json({ stats, userPrediction });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load predictions", detail: String(error) },
      { status: 500 }
    );
  }
}

/** POST /api/predictions — place a prediction */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json() as {
      matchId: number;
      result: PredictionResult;
      amount: number;
      homeTeamName?: string;
      awayTeamName?: string;
    };

    const { matchId, result, amount, homeTeamName, awayTeamName } = body;
    if (!matchId || !result || !amount) {
      return NextResponse.json(
        { error: "matchId, result, and amount are required" },
        { status: 400 }
      );
    }

    const res = await placePrediction(user.id, matchId, result, amount, homeTeamName, awayTeamName);
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, prediction: res.prediction });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to place prediction", detail: String(error) },
      { status: 500 }
    );
  }
}
