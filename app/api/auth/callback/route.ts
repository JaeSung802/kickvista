import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/auth";

/**
 * OAuth callback handler.
 * Supabase redirects here after Google (or any OAuth) sign-in with a one-time code.
 * We exchange it for a session, ensure the user has a profile row, then redirect home.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Determine locale from the Referer or default to "ko"
  const locale = next.startsWith("/en") ? "en" : "ko";
  const redirectBase = `${origin}/${locale}`;

  if (!code) {
    return NextResponse.redirect(`${redirectBase}/auth/login?error=missing_code`);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      return NextResponse.redirect(
        `${redirectBase}/auth/login?error=${encodeURIComponent(error?.message ?? "auth_error")}`
      );
    }

    // Ensure profile row exists (idempotent)
    await ensureProfile(data.user.id, data.user.email);

    // Redirect to the page the user was trying to reach, or home
    const destination = next.startsWith("/") ? `${origin}${next}` : redirectBase;
    return NextResponse.redirect(destination);
  } catch {
    return NextResponse.redirect(`${redirectBase}/auth/login?error=server_error`);
  }
}
