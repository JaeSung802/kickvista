// lib/api.ts

import type { ApfApiResponse } from "./types";

const BASE_URL = "https://v3.football.api-sports.io";

// ── Dev-mode in-memory cache ──────────────────────────────────────────────────
// next: { revalidate } doesn't persist across hot-reloads in development.
// This module-level Map fills that gap: same endpoint within 5 min = no API call.
type CacheEntry = { data: unknown; expiresAt: number };
const DEV_CACHE = new Map<string, CacheEntry>();
const DEV_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Hard limit for external API calls — prevents 20s+ hangs when API is slow.
const FETCH_TIMEOUT_MS = 5_000;

export async function fetchAPI<T = unknown>(
  path: string,
  revalidate = 60
): Promise<ApfApiResponse<T>> {
  const apiKey = process.env.API_FOOTBALL_KEY;
  const url = `${BASE_URL}${path}`;

  if (!apiKey) {
    throw new Error("FATAL: API_FOOTBALL_KEY is not set");
  }

  // Return cached response during development to avoid repeated external API calls
  if (process.env.NODE_ENV === "development") {
    const cached = DEV_CACHE.get(url);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data as ApfApiResponse<T>;
    }
  }

  const fetchPromise = fetch(url, {
    headers: { "x-apisports-key": apiKey },
    next: { revalidate },
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("TIMEOUT")), FETCH_TIMEOUT_MS)
  );

  let res: Response;
  try {
    res = await Promise.race([fetchPromise, timeoutPromise]);
  } catch (fetchErr) {
    if ((fetchErr as Error).message === "TIMEOUT") {
      throw new Error(`[fetchAPI] TIMEOUT after ${FETCH_TIMEOUT_MS}ms: ${path}`);
    }
    throw new Error(`[fetchAPI] Network error: ${fetchErr}`);
  }

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} for ${path}`);
  }

  const text = await res.text();

  // Guard against empty response body (causes "Unexpected end of JSON input")
  if (!text || text.trim() === "") {
    throw new Error(`[fetchAPI] Empty response body for ${path}`);
  }

  let json: ApfApiResponse<T>;
  try {
    json = JSON.parse(text) as ApfApiResponse<T>;
  } catch (parseErr) {
    console.error("[fetchAPI] JSON parse error for", path, "— body:", text.slice(0, 200));
    throw new Error(`API response was not valid JSON: ${parseErr}`);
  }

  // Store in dev cache
  if (process.env.NODE_ENV === "development") {
    DEV_CACHE.set(url, { data: json, expiresAt: Date.now() + DEV_TTL_MS });
  }

  return json;
}
