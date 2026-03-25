import { cache } from "react";
import type { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  total_points: number;
  current_streak: number;
  favorite_league: string | null;
  avatar_border_color: string | null;
  title_badge: string;
  role: string;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Returns the authenticated Supabase user, or null if not configured / not signed in.
 * Wrapped with React cache() so multiple calls within the same server render pass
 * (e.g. layout + page) share a single network round-trip.
 */
export const getServerUser = cache(async (): Promise<User | null> => {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
});

/**
 * Returns the user's profile row.
 * Wrapped with React cache() so repeated calls within the same render pass
 * (e.g. layout + page) share a single DB query.
 */
export const getServerProfile = cache(async (userId: string): Promise<Profile | null> => {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any) ?? null;
  } catch {
    return null;
  }
});

/**
 * Upserts a profile row for a new user.
 * Called from the OAuth callback to ensure a profile exists.
 */
export async function ensureProfile(
  userId: string,
  email: string | undefined
): Promise<void> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return;
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const nickname =
      email?.split("@")[0] ?? `fan_${userId.slice(0, 8)}`;

    await supabase.from("profiles").upsert(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: userId, nickname, total_points: 0, current_streak: 0 } as any,
      { onConflict: "id", ignoreDuplicates: true }
    );
  } catch {
    // Non-fatal
  }
}
