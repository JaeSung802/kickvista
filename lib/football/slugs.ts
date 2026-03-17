/**
 * Slug standardization layer.
 *
 * Internal slugs  — used as data keys (TEAM_REGISTRY, LEAGUE_BY_SLUG, API calls)
 * Canonical URL slugs — the SEO-friendly slugs that appear in live URLs
 * Redirect slugs  — old slugs that 301 redirect to their canonical equivalent
 */

// ─── League slugs ─────────────────────────────────────────────────────────────

/** Old URL slug → canonical URL slug (triggers 301 redirect) */
export const LEAGUE_URL_REDIRECTS: Record<string, string> = {
  "premier-league": "epl",
};

/** Canonical URL slug → internal LeagueSlug (for LEAGUE_BY_SLUG / API calls) */
export const LEAGUE_URL_TO_INTERNAL: Record<string, string> = {
  "epl": "premier-league",
};

/** All canonical league URL slugs (what appears in live URLs) */
export const CANONICAL_LEAGUE_URL_SLUGS = [
  "epl",
  "la-liga",
  "bundesliga",
  "serie-a",
  "ligue-1",
  "champions-league",
] as const;

/** All valid league URL slugs (canonical + redirect) */
export const ALL_VALID_LEAGUE_URL_SLUGS = [
  ...CANONICAL_LEAGUE_URL_SLUGS,
  ...Object.keys(LEAGUE_URL_REDIRECTS),
];

/** Resolve any league URL slug → internal LeagueSlug for data fetching */
export function resolveLeagueUrlSlug(urlSlug: string): string {
  const canonical = LEAGUE_URL_REDIRECTS[urlSlug] ?? urlSlug;
  return LEAGUE_URL_TO_INTERNAL[canonical] ?? canonical;
}

/** Convert internal LeagueSlug → canonical URL slug */
export function canonicalLeagueUrl(internalSlug: string): string {
  return LEAGUE_URL_REDIRECTS[internalSlug] ?? internalSlug;
}

// ─── Team slugs ───────────────────────────────────────────────────────────────

/** Old URL slug → canonical URL slug (triggers 301 redirect) */
export const TEAM_URL_REDIRECTS: Record<string, string> = {
  "man-united": "manchester-united",
};

/** Canonical URL slug → internal team registry key */
export const TEAM_URL_TO_INTERNAL: Record<string, string> = {
  "manchester-united": "man-united",
};

/** Resolve any team URL slug → internal registry key */
export function resolveTeamUrlSlug(urlSlug: string): string {
  return TEAM_URL_TO_INTERNAL[urlSlug] ?? urlSlug;
}

/** Convert internal team registry key → canonical URL slug */
export function canonicalTeamUrl(internalSlug: string): string {
  return TEAM_URL_REDIRECTS[internalSlug] ?? internalSlug;
}
