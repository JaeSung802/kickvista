import type { Metadata } from "next";
import type { Locale } from "../i18n";
import type { LeagueSlug } from "../football/types";
import { LEAGUE_BY_SLUG } from "../football/constants";
import { canonicalLeagueUrl } from "../football/slugs";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://kickvista.io";

// ─── Core params ───────────────────────────────────────────────────────────────

interface SeoParams {
  locale: Locale;
  title?: string;
  description?: string;
  path?: string;
  imageUrl?: string;
  noIndex?: boolean;
}

// ─── buildMetadata ─────────────────────────────────────────────────────────────

export function buildMetadata({
  locale,
  title,
  description,
  path = "",
  imageUrl,
  noIndex = false,
}: SeoParams): Metadata {
  const siteName = "KickVista";
  const fullTitle = title
    ? `${title} | ${siteName}`
    : `${siteName} – Football Intelligence Hub`;
  const defaultDesc =
    locale === "ko"
      ? "라이브 스코어, 순위표, AI 경기 분석 — 모든 주요 리그를 한 곳에서"
      : "Live scores, standings & AI match analysis for Premier League, La Liga, Bundesliga, Serie A, Ligue 1 & Champions League";

  const url = `${BASE_URL}/${locale}${path}`;
  const ogImage = imageUrl ?? `${BASE_URL}/og-default.png`;

  return {
    title: fullTitle,
    description: description ?? defaultDesc,
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: url,
      languages: {
        ko: `${BASE_URL}/ko${path}`,
        en: `${BASE_URL}/en${path}`,
      },
    },
    openGraph: {
      title: fullTitle,
      description: description ?? defaultDesc,
      url,
      siteName,
      images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }],
      locale: locale === "ko" ? "ko_KR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: description ?? defaultDesc,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
  };
}

// ─── buildLeagueMetadata ──────────────────────────────────────────────────────

export function buildLeagueMetadata(locale: Locale, slug: LeagueSlug): Metadata {
  const league = LEAGUE_BY_SLUG[slug];
  if (!league) return buildMetadata({ locale });

  const name = locale === "ko" ? league.nameKo : league.name;
  return buildMetadata({
    locale,
    title:
      locale === "ko"
        ? `${name} 순위, 경기 일정 & 분석`
        : `${name} Standings, Fixtures & Analysis`,
    description:
      locale === "ko"
        ? `${name} 최신 순위, 경기 일정, AI 분석을 KickVista에서 확인하세요.`
        : `Get the latest ${name} standings, fixtures, and AI match analysis on KickVista.`,
    path: `/league/${canonicalLeagueUrl(slug)}`,
  });
}

// ─── buildMatchMetadata ───────────────────────────────────────────────────────

export function buildMatchMetadata(
  locale: Locale,
  fixture: {
    homeTeam: string;
    awayTeam: string;
    date: string;
    league: string;
  }
): Metadata {
  const { homeTeam, awayTeam, date, league } = fixture;
  const formattedDate = new Date(date).toLocaleDateString(
    locale === "ko" ? "ko-KR" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const title =
    locale === "ko"
      ? `${homeTeam} vs ${awayTeam} — ${league} ${formattedDate}`
      : `${homeTeam} vs ${awayTeam} — ${league} ${formattedDate}`;

  const description =
    locale === "ko"
      ? `${homeTeam} vs ${awayTeam} 경기 일정, 스코어, AI 분석을 KickVista에서 확인하세요.`
      : `${homeTeam} vs ${awayTeam} match stats, score, and AI analysis on KickVista.`;

  return buildMetadata({
    locale,
    title,
    description,
    path: `/match/${homeTeam.toLowerCase().replace(/\s+/g, "-")}-vs-${awayTeam.toLowerCase().replace(/\s+/g, "-")}`,
  });
}

// ─── buildAnalysisMetadata ────────────────────────────────────────────────────

export function buildAnalysisMetadata(
  locale: Locale,
  title: string,
  summary: string,
  slug: string
): Metadata {
  return buildMetadata({
    locale,
    title,
    description: summary,
    path: `/analysis/${slug}`,
    imageUrl: `${BASE_URL}/og-default.png`,
  });
}

// ─── buildWorldCupMetadata ────────────────────────────────────────────────────

export function buildWorldCupMetadata(locale: Locale): Metadata {
  return buildMetadata({
    locale,
    title:
      locale === "ko"
        ? "2026 FIFA 북중미 월드컵 — 조편성 · 대한민국 경기 일정 · 뉴스"
        : "2026 FIFA World Cup — Groups, Korea Schedule & News",
    description:
      locale === "ko"
        ? "2026 FIFA 북중미 월드컵 A조 조편성과 대한민국 경기 일정을 확인하세요. 손흥민·홍명보호 실시간 뉴스와 팬 토론을 킥비스타에서."
        : "2026 FIFA World Cup group draw and Korea Republic match schedule on KickVista. Live news, analysis and fan discussions.",
    path: "/community?category=worldcup-2026",
  });
}

// ─── buildCommunityMetadata ───────────────────────────────────────────────────

export function buildCommunityMetadata(locale: Locale, category?: string): Metadata {
  if (category === "worldcup-2026") return buildWorldCupMetadata(locale);
  return buildMetadata({
    locale,
    title:
      locale === "ko"
        ? "축구 커뮤니티 — 경기 토론 · 이적 뉴스 · 월드컵 소식"
        : "Football Community — Match Discussion, Transfer News & World Cup",
    description:
      locale === "ko"
        ? "킥비스타 커뮤니티에서 2026 월드컵, 손흥민·토트넘 뉴스, 경기 토론, 이적 루머를 나누세요."
        : "Join KickVista to discuss 2026 World Cup, Tottenham, Premier League transfers, tactics and the latest football news.",
    path: "/community",
  });
}

// ─── buildAttendanceMetadata ──────────────────────────────────────────────────

export function buildAttendanceMetadata(locale: Locale): Metadata {
  return buildMetadata({
    locale,
    title:
      locale === "ko"
        ? "출석 체크 & 포인트"
        : "Daily Attendance & Points",
    description:
      locale === "ko"
        ? "매일 출석 체크를 하고 포인트를 모아 등급을 올려보세요."
        : "Check in every day, collect points, and climb the fan rank ladder on KickVista.",
    path: "/attendance",
  });
}

// ─── buildPostMetadata ────────────────────────────────────────────────────────

export function buildPostMetadata(
  locale: Locale,
  post: {
    title: string;
    titleKo?: string;
    excerpt: string;
    excerptKo?: string;
    category: string;
    id?: string;
  }
): Metadata {
  const title = locale === "ko" && post.titleKo ? post.titleKo : post.title;
  const description =
    locale === "ko" && post.excerptKo ? post.excerptKo : post.excerpt;
  const path = post.id ? `/community/post/${post.id}` : "/community";

  return buildMetadata({
    locale,
    title,
    description,
    path,
    imageUrl: `${BASE_URL}/og-default.png`,
  });
}
