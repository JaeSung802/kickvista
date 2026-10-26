/**
 * MatchEventsPanel — goals, cards, substitutions and VAR decisions from the
 * fixture response (lib/football/match-core.ts), in minute order.
 * Home events sit on the left, away events on the right. Nothing is added when
 * the response has no events.
 */

import type { Locale } from "@/lib/i18n";
import type { CoreEvent } from "@/lib/football/match-core";
import MatchDataNotice, { type MatchPhase } from "@/components/match/MatchDataNotice";

const KIND_LABEL: Record<CoreEvent["kind"], [string, string]> = {
  "goal":           ["골", "Goal"],
  "own-goal":       ["자책골", "Own goal"],
  "penalty-goal":   ["페널티 골", "Penalty goal"],
  "missed-penalty": ["페널티 실축", "Missed penalty"],
  "yellow-card":    ["경고", "Yellow card"],
  "second-yellow":  ["경고 누적 퇴장", "Second yellow"],
  "red-card":       ["퇴장", "Red card"],
  "substitution":   ["교체", "Substitution"],
  "var":            ["VAR", "VAR"],
  "other":          ["기타", "Other"],
};

function EventIcon({ kind }: { kind: CoreEvent["kind"] }) {
  if (kind === "yellow-card") return <span className="inline-block h-3.5 w-2.5 rounded-[2px] bg-yellow-400" aria-hidden="true" />;
  if (kind === "red-card") return <span className="inline-block h-3.5 w-2.5 rounded-[2px] bg-red-600" aria-hidden="true" />;
  if (kind === "second-yellow") return (
    <span className="relative inline-block h-3.5 w-3.5" aria-hidden="true">
      <span className="absolute left-0 top-0 h-3 w-2 rounded-[2px] bg-yellow-400" />
      <span className="absolute bottom-0 right-0 h-3 w-2 rounded-[2px] bg-red-600" />
    </span>
  );
  const glyph = kind === "substitution" ? "⇄" : kind === "var" ? "📺" : kind === "missed-penalty" ? "✕" : kind === "other" ? "•" : "⚽";
  return <span className="text-sm leading-none" aria-hidden="true">{glyph}</span>;
}

function minuteLabel(e: CoreEvent) {
  return e.extra ? `${e.elapsed}+${e.extra}'` : `${e.elapsed}'`;
}

export default function MatchEventsPanel({
  locale, events, phase, homeName, awayName,
}: {
  locale: Locale;
  events: CoreEvent[] | null;
  phase: MatchPhase;
  homeName: string;
  awayName: string;
}) {
  const isKo = locale === "ko";
  if (!events || events.length === 0) {
    return <MatchDataNotice locale={locale} section="events" phase={phase} />;
  }
  return (
    <section className="rounded-xl border border-gray-200 bg-white" data-match-events={events.length}>
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 text-xs font-semibold text-gray-500">
        <span className="truncate">{homeName}</span>
        <span className="text-gray-300">{isKo ? "경기 기록" : "Events"}</span>
        <span className="truncate text-right">{awayName}</span>
      </div>
      <ol className="divide-y divide-gray-50">
        {events.map((e, i) => {
          const away = e.side === "away";
          const label = KIND_LABEL[e.kind][isKo ? 0 : 1];
          let main: string | null = e.player;
          let sub: string | null = null;
          if (e.kind === "substitution") {
            if (e.playerIn && e.playerOut) { main = `↑ ${e.playerIn}`; sub = `↓ ${e.playerOut}`; }
            else { main = [e.player, e.assist].filter(Boolean).join(" · ") || null; sub = null; }
          } else if (e.kind === "var" || e.kind === "other") {
            sub = [e.typeRaw, e.detailRaw].filter(Boolean).join(" · ") || null;
          } else if (e.assist && (e.kind === "goal" || e.kind === "penalty-goal")) {
            sub = `${isKo ? "도움" : "Assist"} ${e.assist}`;
          }
          return (
            <li
              key={i}
              data-event-kind={e.kind}
              data-event-side={e.side ?? "none"}
              className={`flex items-center gap-3 px-4 py-2.5 ${away ? "flex-row-reverse text-right" : ""}`}
            >
              <span className="w-12 shrink-0 text-xs font-bold tabular-nums text-gray-500">{minuteLabel(e)}</span>
              <span className="flex w-5 shrink-0 justify-center"><EventIcon kind={e.kind} /></span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-gray-900">{main ?? label}</div>
                <div className="truncate text-xs text-gray-500">
                  {label}{sub ? ` · ${sub}` : ""}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
