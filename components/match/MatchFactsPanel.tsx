/**
 * MatchFactsPanel — "Overview" tab: competition, round, KST kick-off, venue,
 * and a notice for postponed / cancelled / abandoned matches.
 * Adapted from the redesign branch (components/match/MatchFactsPanel.tsx);
 * missing values show "–" instead of being guessed.
 */

import type { Locale } from "@/lib/i18n";
import type { MatchStatusInfo } from "@/lib/match/status";

interface MatchFactsPanelProps {
  locale: Locale;
  leagueName: string;
  round?: string;
  kickoffKST: string;
  venue?: string;
  status: MatchStatusInfo;
}

export default function MatchFactsPanel({ locale, leagueName, round, kickoffKST, venue, status }: MatchFactsPanelProps) {
  const isKo = locale === "ko";
  const rows: Array<[string, string]> = [
    [isKo ? "대회" : "Competition", leagueName],
    [isKo ? "라운드" : "Round", round || "–"],
    [isKo ? "킥오프" : "Kick-off", kickoffKST],
    [isKo ? "경기장" : "Venue", venue || "–"],
    [isKo ? "상태" : "Status", status.label],
  ];

  return (
    <div className="flex flex-col gap-4" data-match-facts="">
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-bold text-gray-900">{isKo ? "경기 정보" : "Match info"}</h3>
        <dl className="flex flex-col gap-2.5">
          {rows.map(([label, value]) => (
            <div key={label} className="flex gap-3">
              <dt className="min-w-[64px] pt-px text-xs text-gray-400">{label}</dt>
              <dd className="flex-1 text-[13px] text-gray-700 break-words">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {status.isInactive && (
        <section className="flex flex-col items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-6 py-6 text-center" data-match-inactive={status.kind}>
          <p className="text-[15px] font-bold text-amber-800">
            {status.kind === "postponed"
              ? (isKo ? "이 경기는 연기되었습니다" : "This match has been postponed")
              : (isKo ? "이 경기는 진행되지 않습니다" : "This match is not being played")}
          </p>
          <p className="max-w-md text-[13px] leading-relaxed text-amber-700">
            {status.kind === "postponed"
              ? (isKo ? "새 일정이 확정되면 이 화면에 반영됩니다." : "The new date will appear here once it is confirmed.")
              : (isKo ? "대회 측 결정에 따라 경기가 취소 또는 중단되었습니다." : "The fixture was cancelled or abandoned.")}
          </p>
        </section>
      )}
    </div>
  );
}
