import type { Fixture } from "../football/types";
import type { Locale } from "../i18n";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://kickvista.io";

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
