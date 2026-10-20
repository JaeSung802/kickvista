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

export type ProfileLoad =
  | { status: "ok"; profile: Profile }
  | { status: "missing" }
  | { status: "error" };

/**
 * Like getServerProfile(), but tells "no profile row" apart from a failed
 * query, so pages can show an error instead of default (0-point) values.
 */
export async function loadServerProfile(userId: string): Promise<ProfileLoad> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return { status: "error" };
  }
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) return { status: "error" };
    return data ? { status: "ok", profile: data as Profile } : { status: "missing" };
  } catch {
    return { status: "error" };
  }
}

export type EnsureProfileResult = "exists" | "created" | "error";

const NICKNAME_MIN = 3;
const NICKNAME_MAX = 20;

function usableNickname(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v.length >= NICKNAME_MIN && v.length <= NICKNAME_MAX ? v : null;
}

/**
 * Makes sure the signed-in user has a profiles row. Inserts only id and
 * nickname — role, points, streak and badges keep their column defaults
 * (the role / points guards refuse anything else from the API roles), and
 * ON CONFLICT (id) DO NOTHING keeps parallel calls safe. Runs as the user,
 * so the owner-insert RLS policy applies.
 *
 * Needed beyond the OAuth callback: an e-mail / password account only got a
 * profile when the confirmation link was opened in the browser that signed
 * up (the PKCE code exchange in /api/auth/callback). Without a profile the
 * header showed the user as signed out after a successful login.
 *
 * Nickname: the one chosen at sign-up (user metadata), else the e-mail name,
 * else "fan_" + the first 8 characters of the id — the next candidate is tried
 * when one is rejected as a duplicate or by a check constraint.
 */
export async function ensureProfile(user: User): Promise<EnsureProfileResult> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return "error";
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { data: existing, error: readError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (readError) return "error";
    if (existing) return "exists";

    const emailName = user.email?.split("@")[0]?.slice(0, NICKNAME_MAX);
    const candidates = [
      usableNickname(user.user_metadata?.nickname),
      usableNickname(emailName),
      `fan_${user.id.replace(/-/g, "").slice(0, 8)}`,
    ].filter((v, i, all): v is string => !!v && all.indexOf(v) === i);

    for (const nickname of candidates) {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, nickname }, { onConflict: "id", ignoreDuplicates: true });
      if (error) {
        // 23505 unique / 23514 check: try the next nickname.
        if (error.code !== "23505" && error.code !== "23514") return "error";
        continue;
      }
      // Count it only when the row is really there (a parallel request may
      // have created it, which is fine too).
      const { data: row, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (checkError) return "error";
      if (row) return "created";
    }
    return "error";
  } catch {
    return "error";
  }
}
