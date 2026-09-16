// ─── Standings zone classification ─────────────────────────────────────────────
//
// Single source of truth for turning a standings row's API `description`
// string into a typed, colored "zone" (Champions League, relegation, a
// league's own promotion/relegation split, etc.) shared by every standings
// display in the app (full table, league-overview mini table, home tabs,
// match-detail table).
//
// Priority order (Phase 4-A3-B1-Z2):
//   1. League-specific override (exact/competition-specific naming quirks —
//      e.g. K League's "(Championship Group)" is a table split, not a UCL spot)
//   2. Generic API-description normalization (ordered, most-specific first)
//   3. No description, or nothing recognized → null (never guessed from rank)
//
// Deliberately excluded: any rank-based fallback that colors a row without a
// matching description. A wrong color is worse than no color.

import type { LeagueSlug } from "./types";

export type StandingZoneKind =
  | "championsLeague"
  | "championsLeagueQualifying"
  | "europaLeague"
  | "conferenceLeague"
  | "knockoutDirect"
  | "knockoutPlayoff"
  | "promotion"
  | "promotionPlayoff"
  | "relegationPlayoff"
  | "relegation"
  | "upperSplit"
  | "lowerSplit"
  | "libertadores"
  | "sudamericana"
  | "championshipPlayoff";

export interface StandingZoneInput {
  leagueSlug: LeagueSlug;
  season: number;
  rank: number;
  teamId: number;
  description?: string | null;
  /** Standings group index, for leagues whose API response has multiple groups (e.g. MLS conferences). */
  group?: number;
}

export interface StandingZone {
  kind: StandingZoneKind;
  labelKo: string;
  labelEn: string;
  /** Left border / rank-number color. */
  color: string;
  /** Very light row background. */
  background: string;
}

const ZONE_STYLE: Record<StandingZoneKind, { color: string; background: string }> = {
  championsLeague:           { color: "#2563EB", background: "#EFF6FF" },
  championsLeagueQualifying: { color: "#0284C7", background: "#F0F9FF" },
  europaLeague:              { color: "#D97706", background: "#FFF7ED" },
  conferenceLeague:          { color: "#0891B2", background: "#ECFEFF" },
  knockoutDirect:            { color: "#059669", background: "#ECFDF5" },
  knockoutPlayoff:           { color: "#7C3AED", background: "#F5F3FF" },
  promotion:                 { color: "#15803D", background: "#F0FDF4" },
  promotionPlayoff:          { color: "#7C3AED", background: "#F5F3FF" },
  relegationPlayoff:         { color: "#EA580C", background: "#FFF7ED" },
  relegation:                { color: "#DC2626", background: "#FEF2F2" },
  upperSplit:                { color: "#4F46E5", background: "#EEF2FF" },
  lowerSplit:                { color: "#64748B", background: "#F8FAFC" },
  libertadores:              { color: "#047857", background: "#ECFDF5" },
  sudamericana:              { color: "#C2410C", background: "#FFF7ED" },
  championshipPlayoff:       { color: "#9333EA", background: "#FAF5FF" },
};

const ZONE_LABEL: Record<StandingZoneKind, { ko: string; en: string }> = {
  championsLeague:           { ko: "챔피언스리그",       en: "Champions League" },
  championsLeagueQualifying: { ko: "챔피언스리그 예선",   en: "Champions League Qualifying" },
  europaLeague:              { ko: "유로파리그",         en: "Europa League" },
  conferenceLeague:          { ko: "컨퍼런스리그",       en: "Conference League" },
  knockoutDirect:            { ko: "토너먼트 직행",       en: "Knockout (Direct)" },
  knockoutPlayoff:           { ko: "토너먼트 플레이오프", en: "Knockout Play-off" },
  promotion:                 { ko: "자동 승격",          en: "Automatic promotion" },
  promotionPlayoff:          { ko: "승격 플레이오프",     en: "Promotion Play-off" },
  relegationPlayoff:         { ko: "강등 플레이오프",     en: "Relegation Play-off" },
  relegation:                { ko: "강등",               en: "Relegation" },
  upperSplit:                { ko: "상위 스플릿",         en: "Upper Split" },
  lowerSplit:                { ko: "하위 스플릿",         en: "Lower Split" },
  libertadores:              { ko: "코파 리베르타도레스", en: "Copa Libertadores" },
  sudamericana:              { ko: "코파 수다메리카나",   en: "Copa Sudamericana" },
  championshipPlayoff:       { ko: "챔피언십 플레이오프", en: "Championship Play-off" },
};

/** Per-league display-label overrides — same zone kind/color, different wording
 *  (e.g. K League's split is "Final A/B", Scotland's is "Top Six/Bottom Six"). */
const LEAGUE_LABEL_OVERRIDES: Partial<Record<LeagueSlug, Partial<Record<StandingZoneKind, { ko: string; en: string }>>>> = {
  "k-league-1": {
    upperSplit: { ko: "파이널 A", en: "Final A" },
    lowerSplit: { ko: "파이널 B", en: "Final B" },
    // 2026 season-specific wording (Phase 4-A3-B1-Z3 §2) — same kind/color as
    // the generic relegation/relegationPlayoff zones, K League 1-specific text.
    relegation: { ko: "자동 강등", en: "Automatic relegation" },
    relegationPlayoff: { ko: "승강 PO 대상", en: "Relegation playoff place" },
  },
  "scottish-premiership": {
    upperSplit: { ko: "상위 스플릿", en: "Top Six" },
    lowerSplit: { ko: "하위 스플릿", en: "Bottom Six" },
  },
};

interface OverrideRule {
  /** Receives the full input so a rule can key off teamId/rank/season, not
   *  just the description text (e.g. a club-specific regulation). */
  match: (input: StandingZoneInput) => boolean;
  /** null = explicitly suppress this description (regulation overrides API text). */
  kind: StandingZoneKind | null;
}

/** League-specific overrides, checked before generic normalization. Exact-string
 *  matches for static competition-structure labels (K League/Scotland splits);
 *  substring matches only where the API's own wording varies by round
 *  (MLS/Liga MX playoff round names, UCL/UEL knockout-fraction labels); and
 *  team/rank-scoped rules for club- or slot-specific regulations that no
 *  description can express (K League 1 2026 §2). Rule order matters — the
 *  first match wins. */
const LEAGUE_OVERRIDES: Partial<Record<LeagueSlug, OverrideRule[]>> = {
  "champions-league": [
    // API labels both bands "Play Offs: N-finals" — 1/8 = straight to Round of 16,
    // 1/16 = must win an extra knockout tie first.
    { match: (i) => !!i.description?.includes("1/8"), kind: "knockoutDirect" },
    { match: (i) => !!i.description?.includes("1/16"), kind: "knockoutPlayoff" },
  ],
  "europa-league": [
    { match: (i) => i.description?.trim().toLowerCase() === "play offs", kind: "knockoutPlayoff" },
  ],
  "k-league-1": [
    // 2026 regulation: Gimcheon Sangmu (a military-service club) is
    // automatically relegated regardless of final position — checked first,
    // ahead of both the rank-12 playoff rule and the generic group labels.
    { match: (i) => i.season === 2026 && i.teamId === 2768, kind: "relegation" },
    // 2026 regulation: K League 1's 12th-place team enters a relegation
    // play-off against a K League 2 promotion-play-off winner.
    { match: (i) => i.season === 2026 && i.rank === 12, kind: "relegationPlayoff" },
    { match: (i) => i.description === "Promotion - K League 1 (Championship Group)", kind: "upperSplit" },
    { match: (i) => i.description === "K League 1 (Relegation Group)", kind: "lowerSplit" },
  ],
  "k-league-2": [
    { match: (i) => i.description === "Promotion - K League 1", kind: "promotion" },
    { match: (i) => i.description === "Promotion - K League 2 (Play Offs)", kind: "promotionPlayoff" },
    // 2026 K League 2 regulations have no relegation zone — the regulation
    // takes precedence over this API's "(Relegation)" description (Phase 4-A3-B1-Z2 §1).
    { match: (i) => i.description === "K League 2 (Relegation)", kind: null },
  ],
  "scottish-premiership": [
    { match: (i) => i.description === "Promotion - Premiership (Championship Group)", kind: "upperSplit" },
    { match: (i) => i.description === "Premiership (Relegation Group)", kind: "lowerSplit" },
  ],
  "eredivisie": [
    { match: (i) => i.description === "Eredivisie (Relegation)", kind: "relegationPlayoff" },
  ],
  "primeira-liga": [
    { match: (i) => i.description === "Liga Portugal (Relegation)", kind: "relegationPlayoff" },
  ],
  "la-liga": [
    { match: (i) => i.description === "ECL Playoffs", kind: "conferenceLeague" },
  ],
  "mls": [
    // MLS has no promotion/relegation pyramid — "Promotion" in the API text
    // means advancing in the end-of-season championship playoffs, not
    // promotion to a higher division. Must not become "promotionPlayoff".
    { match: (i) => !!i.description?.includes("MLS") && !!i.description?.includes("Play Offs"), kind: "championshipPlayoff" },
  ],
  "liga-mx": [
    // Same reasoning as MLS — Liga MX has been a closed league since 2020.
    { match: (i) => !!i.description?.includes("Liga MX") && !!i.description?.includes("Play Offs"), kind: "championshipPlayoff" },
  ],
};

/** Generic normalization for leagues without an override. Order matters —
 *  more specific phrases are checked first so, e.g., a description mentioning
 *  both "relegation" and "play-off" is classified as the play-off zone. */
function normalizeGeneric(description: string): StandingZoneKind | null {
  const d = description.toLowerCase();
  const hasPlayoff = d.includes("play-off") || d.includes("play off") || d.includes("playoff");
  // Deliberately "champions league" (the phrase), not bare "champions" —
  // "Championship Group"/"Relegation - Championship" both contain "champions"
  // as a substring of "championship" and must NOT match here.
  const hasChampionsLeague = d.includes("champions league");

  if (hasChampionsLeague && d.includes("qualif")) return "championsLeagueQualifying";
  if (hasChampionsLeague) return "championsLeague";
  if (d.includes("libertadores")) return "libertadores";
  if (d.includes("sudamericana")) return "sudamericana";
  if (d.includes("conference")) return "conferenceLeague";
  if (d.includes("europa")) return "europaLeague";
  if (d.includes("relegation") && hasPlayoff) return "relegationPlayoff";
  if (d.includes("relegation")) return "relegation";
  if (d.includes("promotion") && hasPlayoff) return "promotionPlayoff";
  if (d.includes("promotion")) return "promotion";
  return null;
}

function buildZone(leagueSlug: LeagueSlug, kind: StandingZoneKind): StandingZone {
  const style = ZONE_STYLE[kind];
  const label = LEAGUE_LABEL_OVERRIDES[leagueSlug]?.[kind] ?? ZONE_LABEL[kind];
  return { kind, labelKo: label.ko, labelEn: label.en, color: style.color, background: style.background };
}

/**
 * Determine the display zone for one standings row. Returns null when
 * nothing applies — a row is never colored by rank position alone, except
 * where a documented league+season regulation explicitly says otherwise
 * (see the k-league-1 rules above, which are the only rank/teamId-based
 * rules in this module and apply only to that one league and season).
 */
export function determineStandingZone(input: StandingZoneInput): StandingZone | null {
  const { leagueSlug, description } = input;

  // League overrides run first — some (like the K League 1 2026 club/rank
  // rules) apply regardless of whether a description is present at all.
  const overrides = LEAGUE_OVERRIDES[leagueSlug];
  if (overrides) {
    for (const rule of overrides) {
      if (rule.match(input)) {
        return rule.kind === null ? null : buildZone(leagueSlug, rule.kind);
      }
    }
  }

  if (!description) return null;

  const kind = normalizeGeneric(description);
  return kind ? buildZone(leagueSlug, kind) : null;
}

/**
 * Collect the unique zones actually present in a rank-ordered list of rows,
 * for a dynamic legend — first-appearance order (i.e. highest rank first),
 * de-duplicated by kind.
 */
export function collectLegendZones(zones: (StandingZone | null)[]): StandingZone[] {
  const seen = new Set<StandingZoneKind>();
  const legend: StandingZone[] = [];
  for (const zone of zones) {
    if (zone && !seen.has(zone.kind)) {
      seen.add(zone.kind);
      legend.push(zone);
    }
  }
  return legend;
}

export interface LeagueSpecialNotice {
  ko: string;
  en: string;
}

/**
 * Club-specific regulations that a rank-based zone can't express (e.g. a
 * mandatory relegation clause tied to a specific club, not a table position).
 * Kept separate from zone coloring by design — the notice is a footnote, not
 * a row highlight.
 */
export function getLeagueSpecialNotice(leagueSlug: LeagueSlug, season: number): LeagueSpecialNotice | null {
  if (leagueSlug === "k-league-1" && season === 2026) {
    return {
      ko: "※ 김천상무는 2026 시즌 종료 후 K리그2로 자동 강등됩니다.",
      en: "※ Gimcheon Sangmu will be automatically relegated to K League 2 after the 2026 season.",
    };
  }
  return null;
}
