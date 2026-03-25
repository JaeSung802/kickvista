import type { MetadataRoute } from "next";
import { TEAM_REGISTRY } from "@/lib/football/teamRegistry";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.kickvista.com";
const LOCALES  = ["ko", "en"] as const;

// Must match the actual route slugs used in app/[locale]/league/[slug]/
const LEAGUE_SLUGS = [
  "premier-league",
  "la-liga",
  "bundesliga",
  "serie-a",
  "ligue-1",
  "champions-league",
] as const;

const TEAM_SLUGS = Object.keys(TEAM_REGISTRY);

export default function sitemap(): MetadataRoute.Sitemap {
  const now     = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // ── Homepages — priority 1.0 ───────────────────────────────────────────────
  for (const locale of LOCALES) {
    entries.push({
      url: `${BASE_URL}/${locale}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    });
  }

  // ── League overview pages — priority 0.9 ──────────────────────────────────
  for (const locale of LOCALES) {
    for (const slug of LEAGUE_SLUGS) {
      entries.push({ url: `${BASE_URL}/${locale}/league/${slug}`,           lastModified: now, changeFrequency: "daily", priority: 0.9 });
      entries.push({ url: `${BASE_URL}/${locale}/league/${slug}/fixtures`,  lastModified: now, changeFrequency: "daily", priority: 0.9 });
      entries.push({ url: `${BASE_URL}/${locale}/league/${slug}/standings`, lastModified: now, changeFrequency: "daily", priority: 0.9 });
      entries.push({ url: `${BASE_URL}/${locale}/league/${slug}/results`,   lastModified: now, changeFrequency: "daily", priority: 0.9 });
    }
  }

  // ── Team pages — priority 0.8 ──────────────────────────────────────────────
  for (const locale of LOCALES) {
    entries.push({
      url: `${BASE_URL}/${locale}/team`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
    for (const slug of TEAM_SLUGS) {
      entries.push({
        url: `${BASE_URL}/${locale}/team/${slug}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  }

  // ── Analysis + Community — priority 0.8 ───────────────────────────────────
  for (const locale of LOCALES) {
    entries.push({ url: `${BASE_URL}/${locale}/analysis`,  lastModified: now, changeFrequency: "daily",  priority: 0.8 });
    entries.push({ url: `${BASE_URL}/${locale}/community`, lastModified: now, changeFrequency: "hourly", priority: 0.8 });
  }

  // ── Attendance — priority 0.7 ──────────────────────────────────────────────
  for (const locale of LOCALES) {
    entries.push({ url: `${BASE_URL}/${locale}/attendance`, lastModified: now, changeFrequency: "daily", priority: 0.7 });
  }

  // ── Legal pages — priority 0.4 ────────────────────────────────────────────
  for (const locale of LOCALES) {
    entries.push({ url: `${BASE_URL}/${locale}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.4 });
    entries.push({ url: `${BASE_URL}/${locale}/terms`,   lastModified: now, changeFrequency: "monthly", priority: 0.4 });
  }

  // ── Search — excluded from sitemap (noIndex, dynamic) ────────────────────
  // /search?q=... is intentionally omitted; the page itself sets noIndex: true

  return entries;
}
