/**
 * Auth utility placeholders
 * Designed to work with Supabase or NextAuth — swap implementations as needed.
 * Env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   NEXTAUTH_SECRET
 */

import type { UserProfile, AuthSession } from "./types";

// Mock session for development
export const MOCK_USER: UserProfile = {
  id: "mock-user-1",
  email: "demo@kickvista.io",
  nickname: "FootballFan",
  role: "user",
  points: 350,
  level: 2,
  provider: "email",
  favoriteLeague: "premier-league",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export async function getSession(): Promise<AuthSession | null> {
  // TODO: Implement with Supabase Auth or NextAuth
  // Example Supabase: await supabase.auth.getSession()
  // Example NextAuth: await getServerSession(authOptions)
  if (process.env.AUTH_MOCK_MODE === "true") {
    return { user: MOCK_USER };
  }
  return null;
}

export async function signOut(): Promise<void> {
  // TODO: Implement provider sign-out
}

export function isAdmin(user: UserProfile | null): boolean {
  return user?.role === "admin";
}

export function isModerator(user: UserProfile | null): boolean {
  return user?.role === "moderator" || user?.role === "admin";
}

export function getLevelLabel(level: number): string {
  if (level >= 10) return "Expert";
  if (level >= 5) return "Advanced";
  if (level >= 2) return "Regular";
  return "Newcomer";
}
