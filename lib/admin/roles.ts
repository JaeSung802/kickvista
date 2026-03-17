import { getServerUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "user" | "moderator" | "admin";

/** Fetches the current authenticated user's role from their profile. */
export async function getServerRole(): Promise<UserRole | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  const user = await getServerUser();
  if (!user) return null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const role = (data as any)?.role as string | undefined;
    if (role === "admin" || role === "moderator") return role;
    return "user";
  } catch {
    return null;
  }
}

export function isAdmin(role: UserRole | null): boolean {
  return role === "admin";
}

export function isModerator(role: UserRole | null): boolean {
  return role === "moderator" || role === "admin";
}

/** True if the role can perform moderation actions (hide/delete/restore). */
export function canModerate(role: UserRole | null): boolean {
  return isModerator(role);
}
