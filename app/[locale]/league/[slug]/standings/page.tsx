import { notFound, redirect } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildLeagueMetadata } from "@/lib/seo/metadata";
import type { LeagueSlug, StandingEntry } from "@/lib/football/types";
import { LEAGUE_BY_SLUG, formatSeasonLabel } from "@/lib/football/constants";
import { queryStandings } from "@/lib/football/query";
import {
  determineStandingZone,
  collectLegendZones,
  getLeagueSpecialNotice,
  type StandingZone,
} from "@/lib/football/standingZones";
import LeagueHeader from "@/components/league/LeagueHeader";

export const revalidate = 3600; // 1시간 ISR
import AdSlot from "@/components/ads/AdSlot";
import { TeamLogo } from "@/components/ui/TeamLogo";
import {
  ALL_VALID_LEAGUE_URL_SLUGS,
  LEAGUE_URL_REDIRECTS,
  resolveLeagueUrlSlug,
  canonicalTeamUrl,
} from "@/lib/football/slugs";
import { getTeamSlugById } from "@/lib/football/teamRegistry";

function isValidLeagueUrlSlug(value: string): boolean {
  return ALL_VALID_LEAGUE_URL_SLUGS.includes(value);
}

export async function generateStaticParams() {
  const locales = ["ko", "en"];
  return locales.flatMap((locale) =>
    ALL_VALID_LEAGUE_URL_SLUGS.map((slug) => ({ locale, slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale) || !isValidLeagueUrlSlug(slug)) return {};
  const loc          = locale as Locale;
  const internalSlug = resolveLeagueUrlSlug(slug) as LeagueSlug;
  const base         = buildLeagueMetadata(loc, internalSlug);
  const suffix       = loc === "ko" ? " – 순위표" : " – Standings";
  return {
    ...base,
    title: typeof base.title === "string" ? base.title + suffix : base.title,
  };
}

// ─── Zone helpers ─────────────────────────────────────────────────────────────
// Zone classification (description → color/label) now lives in the shared
// lib/football/standingZones module so every standings display agrees.

const FORM_COLORS: Record<string, { background: string; color: string }> = {
  W: { background: "#05966922", color: "#059669" },
  D: { background: "#f59e0b22", color: "#f59e0b" },
  L: { background: "#ef444422", color: "#ef4444" },
};

// ─── Labels ───────────────────────────────────────────────────────────────────
// Season text is league-dependent (K League is calendar-year, European leagues
// are Aug–May split-year) so it's computed per-request via formatSeasonLabel,
// not baked into this static table — see the `seasonLabel` variable below.

const labels = {
  en: {
    pageTitle: "Standings",
    subtitle:  "Current season table",
    updated:   "Updated",
    headers:   { pos: "#", club: "Club", mp: "MP", w: "W", d: "D", l: "L", gf: "GF", ga: "GA", gd: "GD", pts: "Pts", form: "Form" },
    legend:    "Zone Key",
    noData:    "Standings not available.",
  },
  ko: {
    pageTitle: "순위표",
    subtitle:  "현재 시즌 테이블",
    updated:   "업데이트",
    headers:   { pos: "#", club: "클럽", mp: "경기", w: "승", d: "무", l: "패", gf: "득", ga: "실", gd: "득실", pts: "승점", form: "최근" },
    legend:    "구간 안내",
    noData:    "순위 데이터를 불러올 수 없습니다.",
  },
};

// ─── Row component ────────────────────────────────────────────────────────────

function StandingsRow({
  entry,
  zone,
  isLast,
  isKo,
  loc,
}: {
  entry: StandingEntry;
  zone: StandingZone | null;
  isLast: boolean;
  isKo: boolean;
  loc: Locale;
}) {
  const formChars = entry.form ? entry.form.slice(0, 5).split("") : [];
  const teamSlug = getTeamSlugById(entry.team.id);
  const teamDisplayName = isKo ? (entry.team.nameKo ?? entry.team.name) : entry.team.name;

  const gdVal = entry.goalDifference;
  const gdStr = gdVal > 0 ? `+${gdVal}` : String(gdVal);
  const gdColor = gdVal > 0 ? "#059669" : gdVal < 0 ? "#ef4444" : "#6b7280";

  const zoneLabel = zone ? (isKo ? zone.labelKo : zone.labelEn) : undefined;

  return (
    <div
      className="hover-row grid grid-cols-[32px_minmax(0,1fr)_40px_40px_44px] sm:grid-cols-[32px_1fr_40px_30px_30px_30px_36px_36px_40px_44px_80px]"
      title={zoneLabel}
      style={{
        gap: 0,
        padding: "10px 16px",
        borderBottom: isLast ? "none" : "1px solid #f3f4f6",
        alignItems: "center",
        borderLeft: zone ? `3px solid ${zone.color}` : "3px solid transparent",
        background: zone ? zone.background : undefined,
        transition: "background 0.15s",
      }}
    >
      {/* Rank number carries the zone's accessible label — color alone never conveys the zone. */}
      <span
        aria-label={zoneLabel ? `${entry.rank}, ${zoneLabel}` : undefined}
        style={{
          color: zone ? zone.color : "#6b7280",
          fontSize: 13,
          fontWeight: 700,
          textAlign: "center" as const,
        }}
      >
        {entry.rank}
      </span>

      {(() => {
        const teamCellChildren = (
          <>
            {entry.team.logo ? (
              <TeamLogo logo={entry.team.logo} name={entry.team.name} size={20} />
            ) : (
              <span style={{ fontSize: 16, flexShrink: 0 }}>{entry.team.flag}</span>
            )}
            <span
              style={{
                color: "#111827",
                fontSize: 13,
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap" as const,
              }}
            >
              {teamDisplayName}
            </span>
          </>
        );
        return teamSlug ? (
          <a
            href={`/${loc}/team/${canonicalTeamUrl(teamSlug)}`}
            className="flex items-center gap-2 min-w-0 no-underline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:outline-offset-2 rounded"
          >
            {teamCellChildren}
          </a>
        ) : (
          <div className="flex items-center gap-2 min-w-0">{teamCellChildren}</div>
        );
      })()}

      {/* MP (always visible) · W D L GF GA (hidden below sm — mobile shows only MP/GD/Pts) */}
      {[entry.played, entry.won, entry.drawn, entry.lost, entry.goalsFor, entry.goalsAgainst].map(
        (val, i) => (
          <span
            key={i}
            className={i === 0 ? undefined : "hidden sm:block"}
            style={{
              color: i === 1 ? "#111827" : "#6b7280",
              fontSize: 13,
              fontWeight: i === 1 ? 600 : 400,
              textAlign: "center" as const,
            }}
          >
            {val}
          </span>
        )
      )}

      {/* GD */}
      <span style={{ color: gdColor, fontSize: 13, fontWeight: 600, textAlign: "center" as const }}>
        {gdStr}
      </span>

      {/* Points */}
      <span style={{ color: "#111827", fontSize: 14, fontWeight: 800, textAlign: "center" as const }}>
        {entry.points}
      </span>

      {/* Form (hidden below sm — 80px column not shown on mobile) */}
      <div className="hidden sm:flex items-center gap-0.5 justify-center">
        {formChars.map((f, i) => (
          <span
            key={i}
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 700,
              ...(FORM_COLORS[f] ?? { background: "#f3f4f6", color: "#6b7280" }),
            }}
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LeagueStandingsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  if (!isValidLocale(locale) || !isValidLeagueUrlSlug(slug)) notFound();

  if (LEAGUE_URL_REDIRECTS[slug]) {
    redirect(`/${locale}/league/${LEAGUE_URL_REDIRECTS[slug]}/standings`);
  }

  const loc          = locale as Locale;
  const internalSlug = resolveLeagueUrlSlug(slug) as LeagueSlug;
  const league       = LEAGUE_BY_SLUG[internalSlug];
  if (!league) notFound();

  const t    = labels[loc];
  const isKo = loc === "ko";

  // Fetch standings via provider abstraction
  const standings = await queryStandings(internalSlug);
  const rows      = standings ? [...standings.table].sort((a, b) => a.rank - b.rank) : [];

  const leagueName = isKo ? league.nameKo : league.name;
  const seasonLabel = formatSeasonLabel(internalSlug, league.season, loc);
  const updatedAt  = standings?.updatedAt
    ? new Date(standings.updatedAt).toLocaleDateString(isKo ? "ko-KR" : "en-GB", {
        day: "numeric",
        month: "short",
      })
    : "—";

  // One shared zone determination per row — reused for row coloring and the
  // dynamic legend so both always agree on what's actually in this table.
  const zones = rows.map((entry) =>
    determineStandingZone({
      leagueSlug: internalSlug,
      season: league.season,
      rank: entry.rank,
      teamId: entry.team.id,
      description: entry.description,
    })
  );
  const legendZones   = collectLegendZones(zones);
  const specialNotice = getLeagueSpecialNotice(internalSlug, league.season);

  return (
    <main className="min-h-screen">
      {/* League header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <LeagueHeader slug={internalSlug} locale={loc} activeTab={3} />
      </div>

      {/* Top ad */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <AdSlot slotId={`league-${slug}-standings-top`} size="leaderboard" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Page title */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 style={{ color: "#111827", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>
              {leagueName} — {t.pageTitle}
            </h1>
            <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
              {seasonLabel} &nbsp;·&nbsp; {t.updated}: {updatedAt}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Full standings table */}
          <div className="lg:col-span-3">
            {rows.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-16 rounded-xl"
                style={{ background: "#ffffff", border: "1px solid #e5e7eb" }}
              >
                <span style={{ fontSize: 36, marginBottom: 12 }}>📊</span>
                <p style={{ color: "#6b7280", fontSize: 14 }}>{t.noData}</p>
              </div>
            ) : (
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {/* Table header — mobile shows pos/club/MP/GD/Pts only (indices 0,1,2,8,9);
                    W/D/L/GF/GA/Form (3,4,5,6,7,10) are hidden below sm, matching StandingsRow. */}
                <div
                  className="grid grid-cols-[32px_minmax(0,1fr)_40px_40px_44px] sm:grid-cols-[32px_1fr_40px_30px_30px_30px_36px_36px_40px_44px_80px]"
                  style={{
                    gap: 0,
                    padding: "10px 16px",
                    borderBottom: "1px solid #e5e7eb",
                    background: "#f9fafb",
                  }}
                >
                  {Object.values(t.headers).map((h, idx) => (
                    <span
                      key={idx}
                      className={[3, 4, 5, 6, 7, 10].includes(idx) ? "hidden sm:block" : undefined}
                      style={{
                        color: "#6b7280",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.04em",
                        whiteSpace: "nowrap" as const,
                        textAlign: idx === 1 ? ("left" as const) : ("center" as const),
                      }}
                    >
                      {h}
                    </span>
                  ))}
                </div>

                {/* Rows */}
                {rows.map((entry, idx) => (
                  <StandingsRow
                    key={entry.team.id}
                    entry={entry}
                    zone={zones[idx]}
                    isLast={idx === rows.length - 1}
                    isKo={isKo}
                    loc={loc}
                  />
                ))}
              </div>
            )}

            {/* Zone legend — only the zones actually present in this table, in the
                order they first appear (i.e. highest rank first); hidden entirely
                when the table has no zones at all. */}
            {legendZones.length > 0 && (
              <div className="flex flex-wrap items-center gap-5 mt-4 px-1">
                <span style={{ color: "#6b7280", fontSize: 12, fontWeight: 600 }}>{t.legend}:</span>
                {legendZones.map((zone) => (
                  <div key={zone.kind} className="flex items-center gap-2">
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: zone.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ color: "#6b7280", fontSize: 12 }}>
                      {isKo ? zone.labelKo : zone.labelEn}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Club-specific regulation notice — separate from zone coloring by
                design (see standingZones.getLeagueSpecialNotice). */}
            {specialNotice && (
              <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 8, paddingLeft: 4 }}>
                {isKo ? specialNotice.ko : specialNotice.en}
              </p>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            <AdSlot slotId={`league-${slug}-standings-sidebar`} size="rectangle" />
          </div>
        </div>

        {/* Bottom ad */}
        <div className="mt-10">
          <AdSlot slotId={`league-${slug}-standings-bottom`} size="leaderboard" />
        </div>
      </div>
    </main>
  );
}
