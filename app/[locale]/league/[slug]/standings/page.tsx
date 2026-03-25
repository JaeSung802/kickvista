import { notFound, redirect } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { buildLeagueMetadata } from "@/lib/seo/metadata";
import type { LeagueSlug, StandingEntry } from "@/lib/football/types";
import { LEAGUE_BY_SLUG, currentFootballSeason } from "@/lib/football/constants";
import { queryStandings } from "@/lib/football/query";
import LeagueHeader from "@/components/league/LeagueHeader";

export const revalidate = 3600; // 1시간 ISR
import AdSlot from "@/components/ads/AdSlot";
import { TeamLogo } from "@/components/ui/TeamLogo";
import {
  ALL_VALID_LEAGUE_URL_SLUGS,
  LEAGUE_URL_REDIRECTS,
  resolveLeagueUrlSlug,
} from "@/lib/football/slugs";

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

type ZoneKey = "cl" | "el" | "ecl" | "rel";

function descriptionToZone(desc?: string): ZoneKey | null {
  if (!desc) return null;
  const d = desc.toLowerCase();
  if (d.includes("relegation")) return "rel"; // must be first — "Relegation - Championship" contains "champion"
  if (d.includes("champions league")) return "cl";
  if (d.includes("champions")) return "cl";
  if (d.includes("conference")) return "ecl";
  if (d.includes("europa")) return "el";
  return null;
}

const ZONE_COLORS: Record<ZoneKey, string> = {
  cl:  "#3b82f6",
  el:  "#f59e0b",
  ecl: "#06b6d4",
  rel: "#ef4444",
};

const FORM_COLORS: Record<string, { background: string; color: string }> = {
  W: { background: "#05966922", color: "#059669" },
  D: { background: "#f59e0b22", color: "#f59e0b" },
  L: { background: "#ef444422", color: "#ef4444" },
};

// ─── Labels ───────────────────────────────────────────────────────────────────

// Build season label dynamically so it auto-updates each new season (e.g. "2025/26")
const _sy  = currentFootballSeason();
const _seasonStr = `${_sy}/${(_sy + 1).toString().slice(2)}`; // "2025/26"

const labels = {
  en: {
    pageTitle: "Standings",
    subtitle:  "Current season table",
    season:    `${_seasonStr} Season`,
    updated:   "Updated",
    headers:   { pos: "#", club: "Club", mp: "MP", w: "W", d: "D", l: "L", gf: "GF", ga: "GA", gd: "GD", pts: "Pts", form: "Form" },
    zones: { cl: "Champions League", el: "Europa League", ecl: "Conference League", rel: "Relegation" },
    legend:    "Zone Key",
    noData:    "Standings not available.",
  },
  ko: {
    pageTitle: "순위표",
    subtitle:  "현재 시즌 테이블",
    season:    `${_seasonStr} 시즌`,
    updated:   "업데이트",
    headers:   { pos: "#", club: "클럽", mp: "경기", w: "승", d: "무", l: "패", gf: "득", ga: "실", gd: "득실", pts: "승점", form: "최근" },
    zones: { cl: "챔피언스리그", el: "유로파리그", ecl: "컨퍼런스리그", rel: "강등권" },
    legend:    "구간 안내",
    noData:    "순위 데이터를 불러올 수 없습니다.",
  },
};

// ─── Row component ────────────────────────────────────────────────────────────

function StandingsRow({
  entry,
  idx,
  totalRows,
  isLast,
  isKo,
}: {
  entry: StandingEntry;
  idx: number;
  totalRows: number;
  isLast: boolean;
  isKo: boolean;
}) {
  // Use description from API first; fall back to position-based logic for relegation
  const zone      = descriptionToZone(entry.description) ?? (idx >= totalRows - 3 ? "rel" : null);
  const zoneColor = zone ? ZONE_COLORS[zone] : null;
  const isRel     = zone === "rel";
  const formChars = entry.form ? entry.form.slice(0, 5).split("") : [];

  const gdVal = entry.goalDifference;
  const gdStr = gdVal > 0 ? `+${gdVal}` : String(gdVal);
  const gdColor = gdVal > 0 ? "#059669" : gdVal < 0 ? "#ef4444" : "#6b7280";

  return (
    <div
      className="hover-row"
      style={{
        display: "grid",
        gridTemplateColumns: "32px 1fr 40px 30px 30px 30px 36px 36px 40px 44px 80px",
        gap: 0,
        padding: "10px 16px",
        borderBottom: isLast ? "none" : "1px solid #f3f4f6",
        alignItems: "center",
        borderLeft: zoneColor ? `3px solid ${zoneColor}` : "3px solid transparent",
        background: isRel ? "rgba(239,68,68,0.04)" : undefined,
        transition: "background 0.15s",
      }}
    >
      <span
        style={{
          color: zoneColor ?? "#6b7280",
          fontSize: 13,
          fontWeight: 700,
          textAlign: "center" as const,
        }}
      >
        {entry.rank}
      </span>

      <div className="flex items-center gap-2 min-w-0">
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
          {isKo ? (entry.team.nameKo ?? entry.team.name) : entry.team.name}
        </span>
      </div>

      {/* MP W D L GF GA */}
      {[entry.played, entry.won, entry.drawn, entry.lost, entry.goalsFor, entry.goalsAgainst].map(
        (val, i) => (
          <span
            key={i}
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

      {/* Form */}
      <div className="flex items-center gap-0.5 justify-center">
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
  const updatedAt  = standings?.updatedAt
    ? new Date(standings.updatedAt).toLocaleDateString(isKo ? "ko-KR" : "en-GB", {
        day: "numeric",
        month: "short",
      })
    : "—";

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
              {t.season} &nbsp;·&nbsp; {t.updated}: {updatedAt}
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
                {/* Table header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "32px 1fr 40px 30px 30px 30px 36px 36px 40px 44px 80px",
                    gap: 0,
                    padding: "10px 16px",
                    borderBottom: "1px solid #e5e7eb",
                    background: "#f9fafb",
                  }}
                >
                  {Object.values(t.headers).map((h, idx) => (
                    <span
                      key={idx}
                      style={{
                        color: "#6b7280",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.04em",
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
                    idx={idx}
                    totalRows={rows.length}
                    isLast={idx === rows.length - 1}
                    isKo={isKo}
                  />
                ))}
              </div>
            )}

            {/* Zone legend */}
            <div className="flex flex-wrap items-center gap-5 mt-4 px-1">
              <span style={{ color: "#6b7280", fontSize: 12, fontWeight: 600 }}>{t.legend}:</span>
              {(["cl", "el", "ecl", "rel"] as ZoneKey[]).map((zone) => (
                <div key={zone} className="flex items-center gap-2">
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: ZONE_COLORS[zone],
                    }}
                  />
                  <span style={{ color: "#6b7280", fontSize: 12 }}>{t.zones[zone]}</span>
                </div>
              ))}
            </div>
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
