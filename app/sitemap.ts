import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://kickvista.io";
const LOCALES = ["ko", "en"];
const LEAGUE_SLUGS = [
  "epl",
  "la-liga",
  "bundesliga",
  "serie-a",
  "ligue-1",
  "champions-league",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // Homepages — priority 1.0
  for (const locale of LOCALES) {
    entries.push({
      url: `${BASE_URL}/${locale}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    });
  }

  // League overview pages — priority 0.9
  for (const locale of LOCALES) {
    for (const slug of LEAGUE_SLUGS) {
      entries.push({
        url: `${BASE_URL}/${locale}/league/${slug}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.9,
      });
    }
  }

  // League fixtures — priority 0.9
  for (const locale of LOCALES) {
    for (const slug of LEAGUE_SLUGS) {
      entries.push({
        url: `${BASE_URL}/${locale}/league/${slug}/fixtures`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.9,
      });
    }
  }

  // League standings — priority 0.9
  for (const locale of LOCALES) {
    for (const slug of LEAGUE_SLUGS) {
      entries.push({
        url: `${BASE_URL}/${locale}/league/${slug}/standings`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.9,
      });
    }
  }

  // League results — priority 0.9
  for (const locale of LOCALES) {
    for (const slug of LEAGUE_SLUGS) {
      entries.push({
        url: `${BASE_URL}/${locale}/league/${slug}/results`,
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.9,
      });
    }
  }

  // Analysis + Community — priority 0.8
  for (const locale of LOCALES) {
    entries.push({
      url: `${BASE_URL}/${locale}/analysis`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    });
    entries.push({
      url: `${BASE_URL}/${locale}/community`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.8,
    });
  }

  // Attendance — priority 0.7
  for (const locale of LOCALES) {
    entries.push({
      url: `${BASE_URL}/${locale}/attendance`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  return entries;
}
