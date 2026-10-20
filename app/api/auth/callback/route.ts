import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/auth";

/**
 * Auth callback (OAuth sign-in and the sign-up confirmation link).
 * Supabase redirects here with a one-time code; we exchange it for a session,
 * ensure the user has a profile row, then redirect. The exchange needs the
 * PKCE verifier stored by the browser that started the flow, so a link opened
 * in another browser fails here even though Supabase has already confirmed
 * the e-mail — the login page then explains that signing in works.
 * Only fixed error codes go into the URL (never Supabase's message).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  // Determine locale from the Referer or default to "ko"
  const locale = next.startsWith("/en") ? "en" : "ko";
  const redirectBase = `${origin}/${locale}`;

  if (!code) {
    return NextResponse.redirect(`${redirectBase}/auth/login?error=link_invalid`);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      return NextResponse.redirect(`${redirectBase}/auth/login?error=link_invalid`);
    }

    // Ensure profile row exists (idempotent); the layout retries if this fails.
    await ensureProfile(data.user);

    // Redirect to the page the user was trying to reach, or home
    const destination = next.startsWith("/") ? `${origin}${next}` : redirectBase;
    return NextResponse.redirect(destination);
  } catch {
    return NextResponse.redirect(`${redirectBase}/auth/login?error=server_error`);
  }
}
