import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/predictions/unnotified
 *
 * Returns the most recent WON prediction that hasn't shown a notification yet.
 * Returns { prediction: null } when there's nothing to show.
 */
export async function GET() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json({ prediction: null });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ prediction: null });
    }

    const { data } = await supabase
      .from("predictions")
      .select("id, match_id, predicted_result, bet_amount, home_team_name, away_team_name")
      .eq("user_id", user.id)
      .eq("status", "WON")
      .eq("is_notified", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ prediction: data ?? null });
  } catch {
    return NextResponse.json({ prediction: null });
  }
}
