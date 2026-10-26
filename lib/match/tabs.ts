/**
 * Match page tabs (URL: ?tab=<id>, default "facts").
 *
 * Only enabled tabs are shown and accepted. The others are declared for the
 * next bundles and stay hidden until their real-data views are rebuilt; an
 * unknown or not-yet-enabled ?tab= value falls back to "facts".
 */

export interface MatchTabDef {
  id: string;
  ko: string;
  en: string;
  enabled: boolean;
}

export const MATCH_TABS: readonly MatchTabDef[] = [
  { id: "facts",      ko: "개요",     en: "Overview",   enabled: true },
  { id: "events",     ko: "경기 기록", en: "Events",     enabled: true },
  { id: "lineups",    ko: "라인업",   en: "Lineups",    enabled: true },
  { id: "statistics", ko: "통계",     en: "Statistics", enabled: true },
  // Next bundles (not shown yet):
  { id: "standings",  ko: "순위",     en: "Standings",  enabled: false },
  { id: "h2h",        ko: "상대전적", en: "Head-to-head", enabled: false },
  { id: "analysis",   ko: "AI 분석",  en: "AI Analysis", enabled: false },
];

export const DEFAULT_MATCH_TAB = "facts";

export function enabledMatchTabs(): MatchTabDef[] {
  return MATCH_TABS.filter((t) => t.enabled);
}

/** Returns an enabled tab id; anything else (missing, unknown, disabled) → "facts". */
export function resolveMatchTab(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return enabledMatchTabs().some((t) => t.id === value) ? (value as string) : DEFAULT_MATCH_TAB;
}

export function matchTabHref(locale: string, matchId: string, tabId: string): string {
  return tabId === DEFAULT_MATCH_TAB ? `/${locale}/match/${matchId}` : `/${locale}/match/${matchId}?tab=${tabId}`;
}
