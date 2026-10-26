/**
 * Match status + kick-off time for the match page.
 *
 * Uses the provider's raw status code when available (MatchDetail.statusRaw),
 * because the shared normalizer maps codes it does not know to "NS". An unknown
 * code is shown as "status unknown", never as "not started".
 * Times are always formatted in Asia/Seoul (KST), independent of the server TZ.
 */

import type { Locale } from "@/lib/i18n";

export type MatchStatusKind =
  | "scheduled" | "tbd" | "live" | "halftime" | "break" | "finished"
  | "postponed" | "cancelled" | "suspended" | "interrupted" | "abandoned" | "awarded" | "unknown";

export interface MatchStatusInfo {
  kind: MatchStatusKind;
  label: string;
  /** Only live / finished matches show a score; others show "vs". */
  showScore: boolean;
  isLive: boolean;
  isFinished: boolean;
  /** Postponed / cancelled / abandoned … — no play, no score. */
  isInactive: boolean;
}

const KNOWN: Record<string, MatchStatusKind> = {
  NS: "scheduled", TBD: "tbd", "1H": "live", "2H": "live", ET: "live", P: "live", LIVE: "live",
  HT: "halftime", BT: "break", FT: "finished", AET: "finished", PEN: "finished",
  PST: "postponed", CANC: "cancelled", SUSP: "suspended", INT: "interrupted", ABD: "abandoned",
  AWD: "awarded", WO: "awarded",
};

export function matchStatusInfo(
  statusRaw: string | undefined,
  status: string,
  minute: number | undefined,
  kickoffIso: string,
  locale: Locale,
): MatchStatusInfo {
  const code = statusRaw ?? status;
  const kind: MatchStatusKind = KNOWN[code] ?? "unknown";
  const ko = locale === "ko";
  const finishedLabel: Record<string, [string, string]> = {
    FT: ["경기 종료", "Full time"], AET: ["연장 종료", "After extra time"], PEN: ["승부차기 종료", "After penalties"],
  };
  const label = (() => {
    switch (kind) {
      case "scheduled": return formatKickoffKST(kickoffIso, locale);
      case "tbd": return ko ? "경기 시각 미정" : "Kick-off time to be confirmed";
      case "live": return `${ko ? "진행 중" : "LIVE"}${minute ? ` ${minute}'` : ""}`;
      case "halftime": return ko ? "하프타임" : "Half-time";
      case "break": return ko ? "연장 전 휴식" : "Break before extra time";
      case "finished": { const l = finishedLabel[code] ?? finishedLabel.FT; return ko ? l[0] : l[1]; }
      case "postponed": return ko ? "연기됨" : "Postponed";
      case "cancelled": return ko ? "취소됨" : "Cancelled";
      case "suspended": return ko ? "일시 중단" : "Suspended";
      case "interrupted": return ko ? "경기 중단" : "Interrupted";
      case "abandoned": return ko ? "경기 취소(중도 중단)" : "Abandoned";
      case "awarded": return ko ? "몰수·부전 처리" : "Awarded";
      default: return ko ? "경기 상태 미확인" : "Status unavailable";
    }
  })();
  const isLive = kind === "live" || kind === "halftime" || kind === "break";
  const isFinished = kind === "finished";
  const isInactive = ["postponed", "cancelled", "abandoned"].includes(kind);
  // Suspended / interrupted / awarded can carry a score from the API; show it only if present.
  const showScore = isLive || isFinished || kind === "suspended" || kind === "interrupted" || kind === "awarded";
  return { kind, label, showScore, isLive, isFinished, isInactive };
}

/** "2026년 10월 24일 (토) 20:30 KST" / "Sat, 24 Oct 2026, 20:30 KST" */
export function formatKickoffKST(iso: string, locale: Locale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return locale === "ko" ? "일정 미확인" : "Date unavailable";
  const date = new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-GB", {
    timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric", weekday: "short",
  }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
  return `${date} ${time} KST`;
}
