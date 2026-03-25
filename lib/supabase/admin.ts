import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client using the service role key.
 *
 * ⚠️  BYPASSES Row Level Security — use ONLY in server-side admin operations
 * (cron jobs, settlement, background tasks). Never expose to the browser.
 *
 * Requires: SUPABASE_SERVICE_ROLE_KEY in environment variables.
 * Get it from: Supabase Dashboard → Project Settings → API → service_role key.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. " +
        "Add it to .env.local and Vercel → Project → Environment Variables."
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
