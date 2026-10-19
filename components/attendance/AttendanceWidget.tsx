"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface AttendanceWidgetProps {
  /** days checked in during the last 30 days; null = not loaded (shown as "—") */
  totalDays: number | null;
  /** trusted streak (kv_my_checkin_status); null = could not be read */
  currentStreak: number | null;
  totalPoints: number;
  rankTier: "bronze" | "silver" | "gold" | "platinum" | "legend";
  rankLabel: string;
  rankColor: string;
  rankBadge: string;
  /** trusted "checked in today"; null = could not be read */
  hasCheckedInToday: boolean | null;
  onCheckIn?: () => void;
  /** server-controlled temporary pause of check-in (lib/attendance-pause.ts) */
  checkInPaused?: boolean;
  /** streak restart notice for the check-in resume (lib/attendance-pause.ts) */
  resumeNotice?: boolean;
  locale: "ko" | "en";
  progressToNextRank: number; // 0–100
}

const t = {
  en: {
    attendance: "Attendance",
    points: "Points",
    streak: "Streak",
    days: "days",
    checkIn: "Check In Today",
    checkedIn: "Checked In",
    nextRank: "Progress to next rank",
    paused: "Check-in paused",
    pausedNote: "Check-in is paused for now. We'll announce when it resumes.",
    working: "Checking in…",
    success: (p: number, s: number) => `Checked in! +${p} points · ${s}-day streak`,
    successPlain: "Checked in!",
    already: "You've already checked in today.",
    unauthorized: "Please sign in again to check in.",
    profileMissing: "We couldn't find your profile. Please try again later.",
    failed: "Check-in failed. Please try again in a moment.",
    resumeTitle: "About streaks",
    statusUnknown: "We couldn't load your streak and today's check-in status. Please try again in a moment.",
    statusRetry: "Try again",
    statusChecking: "Checking…",
    statusRetryFailed: "Still couldn't load it. Please try again later.",
    unknownValue: "Unavailable",
    resumeNote:
      "After check-in resumes, streaks start again from day 1 with your first check-in. Your past attendance history stays visible, and your points are kept. A new day starts at 9:00 AM KST.",
  },
  ko: {
    attendance: "출석 체크",
    points: "포인트",
    streak: "연속 출석",
    days: "일",
    checkIn: "오늘 출석 체크",
    checkedIn: "출석 완료",
    nextRank: "다음 등급까지",
    paused: "출석 체크 일시 중지",
    pausedNote: "출석 체크가 일시 중지된 상태입니다. 다시 시작하면 공지로 안내해 드립니다.",
    working: "출석 처리 중…",
    success: (p: number, s: number) => `출석 완료! +${p} 포인트 · 연속 ${s}일`,
    successPlain: "출석 완료!",
    already: "오늘은 이미 출석했습니다.",
    unauthorized: "로그인이 필요합니다. 다시 로그인한 뒤 출석해 주세요.",
    profileMissing: "프로필 정보를 찾지 못했습니다. 잠시 후 다시 시도해 주세요.",
    failed: "출석 체크에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    resumeTitle: "연속 출석 안내",
    statusUnknown: "연속 출석과 오늘 출석 여부를 확인할 수 없습니다. 잠시 후 다시 확인해 주세요.",
    statusRetry: "다시 확인",
    statusChecking: "확인 중…",
    statusRetryFailed: "여전히 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.",
    unknownValue: "확인할 수 없음",
    resumeNote:
      "출석 체크 재개 후 첫 출석부터 연속 출석이 1일차로 다시 시작됩니다. 지금까지의 출석 기록은 그대로 볼 수 있고, 보유 포인트도 그대로 유지됩니다. 날짜는 매일 오전 9시(KST)에 바뀝니다.",
  },
};

export default function AttendanceWidget({
  totalDays,
  currentStreak,
  totalPoints,
  rankLabel,
  rankColor,
  rankBadge,
  hasCheckedInToday,
  onCheckIn,
  checkInPaused = false,
  resumeNotice = false,
  locale,
  progressToNextRank,
}: AttendanceWidgetProps) {
  const tx = t[locale];
  const router = useRouter();
  // Values from this page's own requests (POST result / status retry); the
  // server-rendered values arrive with router.refresh(). Nothing is guessed:
  // unknown stays unknown until the server answers.
  const [local, setLocal] = useState<{ checkedIn?: boolean; streak?: number; totalPoints?: number }>({});
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "info" | "error"; text: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<"checkin" | "status" | null>(null);
  const busyRef = useRef(false);

  const checkedIn = local.checkedIn ?? hasCheckedInToday;
  const streak = local.streak ?? currentStreak;
  const statusUnknown = checkedIn === null || streak === null;
  // The API also rejects check-in while paused; the button just matches it.
  const isPaused = checkInPaused || paused;
  // With an unknown status the button stays available: the server decides (409 if already checked in).
  const canCheckIn = checkedIn !== true && !isPaused && busy === null;
  const shownPoints = local.totalPoints ?? totalPoints;

  async function retryStatus() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy("status");
    setStatusMessage(null);
    try {
      const res = await fetch("/api/attendance/check-in", { method: "GET" });
      const body = (await res.json().catch(() => null)) as { checkedIn?: unknown; streak?: unknown; totalPoints?: unknown } | null;
      if (res.ok && typeof body?.checkedIn === "boolean" && typeof body?.streak === "number") {
        setLocal((l) => ({
          ...l,
          checkedIn: body.checkedIn as boolean,
          streak: body.streak as number,
          totalPoints: typeof body.totalPoints === "number" ? body.totalPoints : l.totalPoints,
        }));
      } else if (res.status === 401) {
        setStatusMessage(tx.unauthorized);
      } else {
        setStatusMessage(tx.statusRetryFailed);
      }
    } catch {
      setStatusMessage(tx.statusRetryFailed);
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  }

  async function handleCheckIn() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy("checkin");
    setMessage(null);
    try {
      const res = await fetch("/api/attendance/check-in", { method: "POST" });
      const body = (await res.json().catch(() => null)) as {
        success?: boolean; pointsEarned?: unknown; newStreak?: unknown; totalPoints?: unknown; code?: string;
      } | null;
      if (res.ok && body?.success) {
        const p = typeof body.pointsEarned === "number" ? body.pointsEarned : null;
        const s = typeof body.newStreak === "number" ? body.newStreak : null;
        setLocal((l) => ({
          ...l,
          checkedIn: true,
          streak: s ?? l.streak,
          totalPoints: typeof body.totalPoints === "number" ? body.totalPoints : l.totalPoints,
        }));
        setMessage({ kind: "success", text: p !== null && s !== null ? tx.success(p, s) : tx.successPlain });
        onCheckIn?.();
        router.refresh();
      } else if (res.status === 409) {
        // The server says today is done (a retry pays nothing); the streak comes with the refresh.
        setLocal((l) => ({ ...l, checkedIn: true }));
        setMessage({ kind: "info", text: tx.already });
        router.refresh();
      } else if (res.status === 503 && body?.code === "attendance_paused") {
        setPaused(true);
      } else if (res.status === 401) {
        setMessage({ kind: "error", text: tx.unauthorized });
      } else if (res.status === 404) {
        setMessage({ kind: "error", text: tx.profileMissing });
      } else {
        setMessage({ kind: "error", text: tx.failed });
      }
    } catch {
      setMessage({ kind: "error", text: tx.failed });
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Rank color top stripe */}
      <div style={{ height: 3, backgroundColor: rankColor }} />

      <div className="p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">{tx.attendance}</h3>
          {/* Rank badge */}
          <div
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 bg-gray-50 border"
            style={{ borderColor: `${rankColor}40` }}
          >
            <span className="text-sm">{rankBadge}</span>
            <span className="text-xs font-bold" style={{ color: rankColor }}>{rankLabel}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between">
          {/* Points */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl font-black text-emerald-600 tabular-nums">
              {shownPoints.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400">{tx.points}</span>
          </div>

          <div className="w-px h-9 bg-gray-200" />

          {/* Streak */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl font-black text-gray-800 tabular-nums">
              {streak === null ? (
                <span title={tx.unknownValue} aria-label={tx.unknownValue}>🔥 —</span>
              ) : (
                <>🔥 {streak}</>
              )}
            </span>
            <span className="text-xs text-gray-400">{tx.streak}</span>
          </div>

          <div className="w-px h-9 bg-gray-200" />

          {/* Total days */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl font-black text-gray-800 tabular-nums">{totalDays ?? "—"}</span>
            <span className="text-xs text-gray-400">{tx.days}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400">{tx.nextRank}</span>
            <span className="text-xs text-gray-400">{progressToNextRank}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, progressToNextRank)}%` }}
            />
          </div>
        </div>

        {statusUnknown && (
          <div role="status" className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-700 leading-relaxed">{statusMessage ?? tx.statusUnknown}</p>
            <button
              type="button"
              onClick={busy === null ? retryStatus : undefined}
              disabled={busy !== null}
              className="shrink-0 self-start sm:self-auto rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-60"
            >
              {busy === "status" ? tx.statusChecking : tx.statusRetry}
            </button>
          </div>
        )}

        {resumeNotice && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <p className="text-xs font-bold text-amber-800">{tx.resumeTitle}</p>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">{tx.resumeNote}</p>
          </div>
        )}

        {/* Check-in button */}
        <button
          onClick={canCheckIn ? handleCheckIn : undefined}
          disabled={!canCheckIn}
          className={`w-full py-3 rounded-lg text-sm font-bold transition-opacity ${
            !canCheckIn
              ? "bg-gray-100 text-gray-400 cursor-default"
              : "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
          }`}
        >
          {checkedIn === true ? `✓ ${tx.checkedIn}` : isPaused ? tx.paused : busy === "checkin" ? tx.working : tx.checkIn}
        </button>
        {isPaused && checkedIn !== true && (
          <p role="status" className="text-xs text-gray-500 text-center -mt-2">
            {tx.pausedNote}
          </p>
        )}
        {message && (
          <p
            role={message.kind === "error" ? "alert" : "status"}
            className={`text-xs text-center -mt-2 ${
              message.kind === "error" ? "text-red-600" : message.kind === "success" ? "text-emerald-700" : "text-gray-600"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
