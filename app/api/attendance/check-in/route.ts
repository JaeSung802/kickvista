import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMyCheckInStatus, recordCheckIn } from "@/lib/attendance";
import type { Profile } from "@/lib/auth";
import { ATTENDANCE_CHECKIN_PAUSED } from "@/lib/attendance-pause";

export async function POST() {
  // Temporary pause: return before the session lookup and any database work.
  if (ATTENDANCE_CHECKIN_PAUSED) {
    return NextResponse.json(
      { error: "Check-in is temporarily paused.", code: "attendance_paused" },
      { status: 503 }
    );
  }

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

    const result = await recordCheckIn();

    switch (result.status) {
      case "checked_in":
        return NextResponse.json({
          success: true,
          pointsEarned: result.pointsEarned,
          newStreak: result.newStreak,
          totalPoints: result.totalPoints,
        });
      case "already_checked_in":
        return NextResponse.json(
          { error: "Already checked in today" },
          { status: 409 }
        );
      case "paused":
        return NextResponse.json(
          { error: "Check-in is temporarily paused.", code: "attendance_paused" },
          { status: 503 }
        );
      case "unauthenticated":
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      case "profile_missing":
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      default:
        return NextResponse.json({ error: "Check-in failed" }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: "Check-in failed" }, { status: 500 });
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

    // Trusted status only; no fallback to attendance_logs / profiles.current_streak.
    const status = await getMyCheckInStatus();
    if (!status.ok) {
      if (status.reason === "unauthenticated") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.json(
        { error: "Check-in status is temporarily unavailable.", code: "status_unavailable" },
        { status: 503 }
      );
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("total_points")
      .eq("id", user.id)
      .single();
    const profile = profileData as Pick<Profile, "total_points"> | null;

    return NextResponse.json({
      checkedIn: status.checkedInToday,
      streak: status.streak,
      totalPoints: profile?.total_points ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Check-in status is temporarily unavailable.", code: "status_unavailable" },
      { status: 503 }
    );
  }
}
