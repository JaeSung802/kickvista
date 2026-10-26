/**
 * MatchDataNotice — shown in a match tab when the fixture response has no data
 * for that section. Wording depends on the match phase: before kick-off the data
 * is "not yet available", during the match "none yet"; otherwise it is "not
 * provided for this match".
 */

import type { Locale } from "@/lib/i18n";

export type MatchPhase = "upcoming" | "live" | "inactive" | "played";
type Section = "events" | "lineups" | "statistics";

const TEXT: Record<Section, Record<MatchPhase, [string, string]>> = {
  events: {
    upcoming: ["경기가 시작되면 경기 기록이 표시됩니다.", "Match events will appear once the match starts."],
    live:     ["아직 기록된 경기 이벤트가 없습니다.", "No match events yet."],
    inactive: ["이 경기의 경기 기록이 없습니다.", "There are no events for this match."],
    played:   ["이 경기의 경기 기록은 제공되지 않습니다.", "Match events are not available for this match."],
  },
  lineups: {
    upcoming: ["라인업이 발표되면 표시됩니다.", "Lineups will appear once they are announced."],
    live:     ["이 경기의 라인업은 제공되지 않습니다.", "Lineups are not available for this match."],
    inactive: ["이 경기의 라인업이 없습니다.", "There are no lineups for this match."],
    played:   ["이 경기의 라인업은 제공되지 않습니다.", "Lineups are not available for this match."],
  },
  statistics: {
    upcoming: ["경기가 시작되면 팀 통계가 표시됩니다.", "Team statistics will appear once the match starts."],
    live:     ["팀 통계가 아직 제공되지 않습니다.", "Team statistics are not available yet."],
    inactive: ["이 경기의 팀 통계가 없습니다.", "There are no team statistics for this match."],
    played:   ["이 경기의 팀 통계는 제공되지 않습니다.", "Team statistics are not available for this match."],
  },
};

export default function MatchDataNotice({ locale, section, phase }: { locale: Locale; section: Section; phase: MatchPhase }) {
  return (
    <section
      data-match-nodata={section}
      className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-10 text-center"
    >
      <span className="text-2xl" aria-hidden="true">📋</span>
      <p className="text-[13px] text-gray-500">{TEXT[section][phase][locale === "ko" ? 0 : 1]}</p>
    </section>
  );
}
