import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordCheckIn } from "@/lib/attendance";
import type { Profile } from "@/lib/auth";

export async function POST() {
  // Supabase not configured — return mock success for UI development
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json({
      success: true,
      pointsEarned: 10,
      newStreak: 1,
      mode: "mock",
    });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await recordCheckIn(user.id);

    if (result.alreadyCheckedIn) {
      return NextResponse.json(
        { error: "Already checked in today" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      pointsEarned: result.pointsEarned,
      newStreak: result.newStreak,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Check-in failed", detail: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json({
      checkedIn: false,
      streak: 0,
      totalPoints: 0,
      mode: "mock",
    });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().split("T")[0];

    const { data: todayLog } = await supabase
      .from("attendance_logs")
      .select("id")
      .eq("user_id", user.id)
      .eq("attendance_date", today)
      .maybeSingle();

    const { data: profileData } = await supabase
      .from("profiles")
      .select("current_streak, total_points")
      .eq("id", user.id)
      .single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = profileData as Pick<Profile, "current_streak" | "total_points"> | null;

    return NextResponse.json({
      checkedIn: !!todayLog,
      streak: profile?.current_streak ?? 0,
      totalPoints: profile?.total_points ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get attendance status", detail: String(error) },
      { status: 500 }
    );
  }
}
