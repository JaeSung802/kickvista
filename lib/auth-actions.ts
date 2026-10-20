"use server";

import { getServerUser, ensureProfile, type EnsureProfileResult } from "@/lib/auth";

/**
 * Called by the login form right after a successful password sign-in, so the
 * first page already has the user's profile. The session comes from the
 * cookies the browser client just stored; nothing is taken from the caller.
 */
export async function ensureMyProfile(): Promise<EnsureProfileResult | "unauthenticated"> {
  const user = await getServerUser();
  if (!user) return "unauthenticated";
  return ensureProfile(user);
}
