import type { League, LeagueSlug } from "./types";

export const SUPPORTED_LEAGUES: League[] = [
  {
    id: 39,
    slug: "premier-league",
    name: "Premier League",
    nameKo: "프리미어리그",
    country: "England",
    countryKo: "잉글랜드",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    logo: "🔵",
    season: 2024,
    color: "#9333ea",
    totalRounds: 38,
  },
  {
    id: 140,
    slug: "la-liga",
    name: "La Liga",
    nameKo: "라리가",
    country: "Spain",
    countryKo: "스페인",
    flag: "🇪🇸",
    logo: "🔴",
    season: 2024,
    color: "#ef4444",
    totalRounds: 38,
  },
  {
    id: 78,
    slug: "bundesliga",
    name: "Bundesliga",
    nameKo: "분데스리가",
    country: "Germany",
    countryKo: "독일",
    flag: "🇩🇪",
    logo: "🟡",
    season: 2024,
    color: "#f59e0b",
    totalRounds: 34,
  },
  {
    id: 135,
    slug: "serie-a",
    name: "Serie A",
    nameKo: "세리에 A",
    country: "Italy",
    countryKo: "이탈리아",
    flag: "🇮🇹",
    logo: "🔵",
    season: 2024,
    color: "#3b82f6",
    totalRounds: 38,
  },
  {
    id: 61,
    slug: "ligue-1",
    name: "Ligue 1",
    nameKo: "리그 1",
    country: "France",
    countryKo: "프랑스",
    flag: "🇫🇷",
    logo: "🟦",
    season: 2024,
    color: "#06b6d4",
    totalRounds: 34,
  },
  {
    id: 2,
    slug: "champions-league",
    name: "Champions League",
    nameKo: "UEFA 챔피언스리그",
    country: "Europe",
    countryKo: "유럽",
    flag: "🌍",
    logo: "⭐",
    season: 2024,
    color: "#22c55e",
  },
];

export const LEAGUE_BY_SLUG = SUPPORTED_LEAGUES.reduce<Record<LeagueSlug, League>>(
  (acc, league) => ({ ...acc, [league.slug]: league }),
  {} as Record<LeagueSlug, League>
);

export const LEAGUE_IDS = SUPPORTED_LEAGUES.map((l) => l.id);

export const LIVE_STATUSES: string[] = ["1H", "HT", "2H", "ET", "P"];
export const FINISHED_STATUSES: string[] = ["FT", "AET", "PEN"];
export const UPCOMING_STATUSES: string[] = ["NS", "PST"];
