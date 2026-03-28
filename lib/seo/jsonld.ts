import type { Fixture } from "../football/types";
import type { Locale } from "../i18n";
import { WC_SCHEDULE } from "../worldcup/data";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://kickvista.io";

// "6/12 (금)" → "2026-06-12"
function parseDateLabel(dateLabel: string): string {
  const m = dateLabel.match(/(\d+)\/(\d+)/);
  if (!m) return "2026-06-01";
  return `2026-${String(m[1]).padStart(2, "0")}-${String(m[2]).padStart(2, "0")}`;
}

export function websiteJsonLd(locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "KickVista",
    "url": `${BASE_URL}/${locale}`,
    "description":
      locale === "ko"
        ? "축구 라이브 스코어, 순위표, AI 경기 분석"
        : "Football live scores, standings and AI match analysis",
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${BASE_URL}/${locale}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function sportsTeamJsonLd({
  nameEn,
  nameKo,
  leagueName,
  slug,
  locale,
}: {
  nameEn: string;
  nameKo: string;
  leagueName: string;
  slug: string;
  locale: Locale;
}) {
  const name = locale === "ko" ? nameKo : nameEn;
  return {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    "name": name,
    "sport": "Soccer",
    "memberOf": {
      "@type": "SportsOrganization",
      "name": leagueName,
    },
    "url": `${BASE_URL}/${locale}/team/${slug}`,
    "sameAs": `${BASE_URL}/en/team/${slug}`,
  };
}

function fixtureEventStatus(status: Fixture["status"]): string {
  if (status === "PST") return "https://schema.org/EventPostponed";
  if (status === "CANC" || status === "SUSP") return "https://schema.org/EventCancelled";
  if (status === "FT" || status === "AET" || status === "PEN") return "https://schema.org/EventScheduled";
  return "https://schema.org/EventScheduled";
}

export function sportsEventJsonLd(fixture: Fixture, locale: Locale) {
  const score =
    fixture.homeScore !== undefined
      ? `${fixture.homeScore}-${fixture.awayScore}`
      : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": `${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`,
    "startDate": fixture.date,
    "eventStatus": fixtureEventStatus(fixture.status),
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "location": fixture.venue
      ? { "@type": "Place", "name": fixture.venue }
      : { "@type": "Place", "name": "TBD" },
    "image": `${BASE_URL}/og-default.png`,
    "organizer": {
      "@type": "Organization",
      "name": "KickVista",
      "url": BASE_URL,
    },
    "performer": [
      { "@type": "SportsTeam", "name": fixture.homeTeam.name },
      { "@type": "SportsTeam", "name": fixture.awayTeam.name },
    ],
    "homeTeam": { "@type": "SportsTeam", "name": fixture.homeTeam.name },
    "awayTeam": { "@type": "SportsTeam", "name": fixture.awayTeam.name },
    "url": `${BASE_URL}/${locale}/match/${fixture.id}`,
    ...(score && { "description": `Final score: ${score}` }),
  };
}

// ─── koreaScheduleJsonLd ──────────────────────────────────────────────────────

/**
 * 대한민국 조별리그 3경기를 schema.org SportsEvent 배열로 반환합니다.
 * 홈 페이지 및 커뮤니티 월드컵 탭에 JSON-LD로 삽입하세요.
 */
export function koreaScheduleJsonLd(locale: Locale) {
  const koreaMatches = (WC_SCHEDULE["A"] ?? []).filter(
    (m) => m.homeKo === "대한민국" || m.awayKo === "대한민국",
  );

  return koreaMatches.map((match) => {
    const dateStr   = parseDateLabel(match.dateLabel);
    const startDate = `${dateStr}T${match.timeKst}:00+09:00`;
    const isKo      = locale === "ko";

    const homeEn = match.homeKo === "대한민국" ? "Korea Republic" : match.homeKo;
    const awayEn = match.awayKo === "대한민국" ? "Korea Republic" : match.awayKo;
    const homeName = isKo ? match.homeKo : homeEn;
    const awayName = isKo ? match.awayKo : awayEn;

    return {
      "@context":           "https://schema.org",
      "@type":              "SportsEvent",
      "name":               isKo
        ? `${match.homeKo} vs ${match.awayKo} — 2026 FIFA 월드컵 A조 ${match.round}차전`
        : `${homeEn} vs ${awayEn} — 2026 FIFA World Cup Group A Round ${match.round}`,
      "startDate":          startDate,
      "eventStatus":        "https://schema.org/EventScheduled",
      "eventAttendanceMode":"https://schema.org/OfflineEventAttendanceMode",
      "location": {
        "@type": "Place",
        "name":  match.venueKo,
        "address": { "@type": "PostalAddress", "addressCountry": "US" },
      },
      "image":     `${BASE_URL}/og-default.png`,
      "organizer": { "@type": "Organization", "name": "FIFA", "url": "https://www.fifa.com" },
      "homeTeam":  { "@type": "SportsTeam", "name": homeName },
      "awayTeam":  { "@type": "SportsTeam", "name": awayName },
      "url":       `${BASE_URL}/${locale}/community?category=worldcup-2026`,
      "inLanguage": isKo ? "ko-KR" : "en-US",
    };
  });
}

// ─── articleJsonLd ────────────────────────────────────────────────────────────

export function articleJsonLd({
  title,
  description,
  url,
  publishedAt,
  modifiedAt,
}: {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  modifiedAt?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "url": url,
    "datePublished": publishedAt,
    "dateModified": modifiedAt ?? publishedAt,
    "publisher": {
      "@type": "Organization",
      "name": "KickVista",
      "url": BASE_URL,
    },
  };
}
