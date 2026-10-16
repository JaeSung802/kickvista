"use client";

/**
 * PointRankingWidget — points ranking by CURRENT balance.
 *
 * Data: only the kv_points_leaderboard() RPC (supabase/points-leaderboard-rpc.sql),
 * which must be applied before an app version using it is deployed. It returns
 * the top 10 by profiles.total_points with competition ranking (1, 1, 3), every
 * profile tied at the 10th place (at most 30 rows, `tied_hidden` for the rest),
 * streaks from the trusted check-in records (UTC date) and the caller's own
 * position. No period filter.
 *
 * No fallback: a failed or malformed response shows the error state with a
 * retry — never 0 values, sample users or the old leaderboard view.
 * Signed-out visitors see the sign-in gate (the RPC is not executable by anon).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getRank } from "@/lib/ranks";
import type { Locale } from "@/lib/i18n";
import type { Session } from "@supabase/supabase-js";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LeaderboardRow {
  rank: number;
  nickname: string;
  total_points: number;
  streak: number;
  is_me: boolean;
}

type NotRankedReason = "no_nickname" | "no_points" | "not_eligible";

interface LeaderboardMe {
  ranked: boolean;
  /** why the caller is not ranked (own row only); null when ranked */
  reason: NotRankedReason | null;
  rank: number | null;
  nickname: string | null;
  total_points: number;
  streak: number;
  in_list: boolean;
}

interface Leaderboard {
  rows: LeaderboardRow[];
  tiedHidden: number;
  me: LeaderboardMe | null;
}

type FetchState = "idle" | "loading" | "done" | "error";

export interface PointRankingWidgetProps {
  locale: Locale;
}

// ── i18n ──────────────────────────────────────────────────────────────────────

const labels = {
  en: {
    rank: "Rank", user: "Nickname", points: "Points held",
    days: (n: number) => `${n}-day streak`, pts: "P",
    loading: "Loading rankings…",
    loginTitle: "Sign in to view the ranking",
    loginSubtitle: "The ranking shows nicknames and the points each fan currently holds.",
    loginBtn: "Sign In to See Rankings",
    empty: "Nobody is on the ranking yet.",
    emptySubtitle: "Fans with a nickname and more than 0 points appear here.",
    error: "Couldn't load the ranking.",
    retry: "Try again",
    you: "YOU",
    myRank: "My position",
    notRankedZero: "You're not on the ranking yet: it lists balances above 0 points.",
    notRankedNick: "Set a nickname to appear on the ranking.",
    notRankedOther: "This account is not shown on the ranking.",
    tiedHidden: (n: number) => `${n} more ${n === 1 ? "fan is" : "fans are"} tied at the last rank shown.`,
    notes: [
      "Top 10 by points currently held. Equal points share a rank (1, 1, 3); everyone tied at 10th is listed, up to 30 rows.",
      "Streaks come from check-in records; a new day starts at 9:00 AM KST.",
    ],
  },
  ko: {
    rank: "순위", user: "닉네임", points: "보유 포인트",
    days: (n: number) => `연속 ${n}일`, pts: "P",
    loading: "랭킹 불러오는 중…",
    loginTitle: "로그인하여 랭킹을 확인하세요",
    loginSubtitle: "랭킹에는 닉네임과 현재 보유 포인트가 표시됩니다.",
    loginBtn: "로그인하고 랭킹 보기",
    empty: "아직 랭킹에 오른 사용자가 없습니다.",
    emptySubtitle: "닉네임이 있고 보유 포인트가 0보다 많은 사용자가 표시됩니다.",
    error: "랭킹을 불러오지 못했습니다.",
    retry: "다시 시도",
    you: "나",
    myRank: "내 순위",
    notRankedZero: "보유 포인트가 0보다 많아야 랭킹에 표시됩니다.",
    notRankedNick: "닉네임을 설정하면 랭킹에 표시됩니다.",
    notRankedOther: "현재 이 계정은 랭킹에 표시되지 않습니다.",
    tiedHidden: (n: number) => `마지막 순위 동점자 ${n}명이 더 있습니다.`,
    notes: [
      "현재 보유 포인트 기준 TOP 10입니다. 같은 점수는 같은 순위(1, 1, 3)이며, 10위 동점자는 최대 30명까지 모두 표시합니다.",
      "연속 출석은 출석 기록 기준이며 매일 오전 9시(KST)에 날짜가 바뀝니다.",
    ],
  },
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div
      className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-emerald-600 animate-spin"
      role="status"
      aria-label="Loading"
    />
  );
}

/** True when NEXT_PUBLIC_SUPABASE_* env vars are present in the JS bundle */
const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);

/** Validates the RPC payload; null when anything is missing or of the wrong type. */
export function parseLeaderboard(data: unknown): Leaderboard | null {
  const d = data as { rows?: unknown; tied_hidden?: unknown; me?: unknown } | null;
  if (!d || !Array.isArray(d.rows) || !isInt(d.tied_hidden)) return null;
  const rows: LeaderboardRow[] = [];
  for (const r of d.rows as Record<string, unknown>[]) {
    if (!r || !isInt(r.rank) || typeof r.nickname !== "string" || !isInt(r.total_points) || !isInt(r.streak) || typeof r.is_me !== "boolean") return null;
    rows.push({ rank: r.rank, nickname: r.nickname, total_points: r.total_points, streak: r.streak, is_me: r.is_me });
  }
  let me: LeaderboardMe | null = null;
  if (d.me !== null && d.me !== undefined) {
    const m = d.me as Record<string, unknown>;
    if (typeof m.ranked !== "boolean" || !(m.rank === null || isInt(m.rank)) || !isInt(m.total_points) || !isInt(m.streak) || typeof m.in_list !== "boolean") return null;
    const reason = m.reason ?? null;
    if (!(reason === null || reason === "no_nickname" || reason === "no_points" || reason === "not_eligible")) return null;
    if (m.ranked !== (reason === null) || m.ranked !== (m.rank !== null)) return null;
    me = { ranked: m.ranked, reason, rank: m.rank as number | null, nickname: typeof m.nickname === "string" ? m.nickname : null,
      total_points: m.total_points, streak: m.streak, in_list: m.in_list };
  }
  return { rows, tiedHidden: d.tied_hidden, me };
}

// ── Row ───────────────────────────────────────────────────────────────────────

function RankRow({ rank, nickname, points, streak, isMe, locale }: {
  rank: number | null; nickname: string; points: number; streak: number; isMe: boolean; locale: Locale;
}) {
  const t = labels[locale];
  const tier = getRank(points);
  return (
    <div className={`flex items-center gap-3 px-4 sm:px-5 py-3 ${isMe ? "bg-emerald-50 ring-1 ring-inset ring-emerald-200" : ""}`}>
      {/* Numbers, not medals: 🥇🥈🥉 are already the rank-tier icons. */}
      <span className="w-9 shrink-0 flex justify-center">
        <span
          className={`min-w-7 h-7 px-1 rounded-full flex items-center justify-center text-sm font-black tabular-nums ${
            rank !== null && rank <= 3 ? "bg-amber-100 text-amber-700" : "text-gray-500"
          }`}
        >
          {rank ?? "—"}
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-semibold text-gray-900 truncate" title={nickname}>{nickname}</span>
          {isMe && (
            <span className="shrink-0 text-[10px] font-black text-emerald-700 bg-white border border-emerald-200 rounded px-1.5 py-0.5 leading-none">
              {t.you}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-0.5 truncate">
          <span aria-hidden>{tier.badge}</span> {tier.label[locale]}
          <span className="mx-1.5 text-gray-300">·</span>
          <span className="text-amber-600">🔥 {t.days(streak)}</span>
        </div>
      </div>
      <span className="shrink-0 text-sm font-extrabold text-emerald-600 tabular-nums">
        {points.toLocaleString("en-US")}&nbsp;{t.pts}
      </span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PointRankingWidget({ locale }: PointRankingWidgetProps) {
  const t = labels[locale];

  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [board, setBoard] = useState<Leaderboard | null>(null);
  const [fetchState, setFetchState] = useState<FetchState>("idle");

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  if (!supabaseRef.current && SUPABASE_CONFIGURED) supabaseRef.current = createClient();
  const supabase = supabaseRef.current;
  const seq = useRef(0);

  const fetchRankings = useCallback(async () => {
    const my = ++seq.current;
    setFetchState("loading");
    try {
      if (!supabase) throw new Error("not configured");
      const { data, error } = await supabase.rpc("kv_points_leaderboard");
      const parsed = error ? null : parseLeaderboard(data);
      if (my !== seq.current) return;
      if (!parsed) { setBoard(null); setFetchState("error"); return; }
      setBoard(parsed);
      setFetchState("done");
    } catch {
      if (my === seq.current) { setBoard(null); setFetchState("error"); }
    }
  }, [supabase]);

  useEffect(() => {
    if (!supabase) { setInitializing(false); setFetchState("error"); return; }
    let cancelled = false;
    const requests = seq; // invalidates in-flight fetches on cleanup
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (cancelled) return;
      setSession(newSession);
      setInitializing(false);
      if (newSession) fetchRankings();
      else { requests.current++; setBoard(null); setFetchState("idle"); }
    });
    return () => { cancelled = true; requests.current++; subscription.unsubscribe(); };
  }, [supabase, fetchRankings]);

  const box = "bg-white border border-gray-200 rounded-xl shadow-sm min-h-75";

  if (initializing || (session && (fetchState === "loading" || fetchState === "idle"))) {
    return (
      <div className={`${box} flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-gray-400">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (fetchState === "error") {
    return (
      <div role="alert" className={`${box} flex flex-col items-center justify-center gap-3 p-8 text-center`}>
        <p className="text-sm font-semibold text-gray-700">{t.error}</p>
        {supabase && session && (
          <button
            type="button"
            onClick={fetchRankings}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100"
          >
            {t.retry}
          </button>
        )}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-10 flex flex-col items-center gap-5 text-center min-h-75 justify-center">
        <span className="text-5xl leading-none">🏆</span>
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-extrabold text-gray-900">{t.loginTitle}</h3>
          <p className="text-sm text-gray-500 max-w-xs leading-relaxed">{t.loginSubtitle}</p>
        </div>
        {/* Neutral placeholder rows — no names or numbers */}
        <div className="w-full max-w-sm select-none pointer-events-none" aria-hidden>
          <div className="bg-white rounded-xl border border-emerald-100 overflow-hidden">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                <span className="h-3 w-5 rounded bg-gray-100" />
                <span className="h-3 flex-1 rounded bg-gray-100" />
                <span className="h-3 w-12 rounded bg-emerald-100" />
              </div>
            ))}
          </div>
        </div>
        <a
          href={`/${locale}/auth/login`}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-7 py-3 rounded-xl transition-colors shadow-sm"
        >
          {t.loginBtn}
        </a>
      </div>
    );
  }

  const rows = board?.rows ?? [];
  const me = board?.me ?? null;
  const showMe = me !== null && !me.in_list;

  return (
    <div className={`${box} overflow-hidden`}>
      {rows.length > 0 ? (
        <>
          <div className="hidden sm:flex items-center gap-3 px-5 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400">
            <span className="w-9 text-center">{t.rank}</span>
            <span className="flex-1">{t.user}</span>
            <span>{t.points}</span>
          </div>
          <ol className="divide-y divide-gray-100">
            {rows.map((r, i) => (
              <li key={`${r.rank}-${i}`} aria-current={r.is_me ? "true" : undefined}>
                <RankRow rank={r.rank} nickname={r.nickname} points={r.total_points} streak={r.streak} isMe={r.is_me} locale={locale} />
              </li>
            ))}
          </ol>
          {board && board.tiedHidden > 0 && (
            <p className="px-5 py-2.5 text-xs text-gray-500 border-t border-gray-100">{t.tiedHidden(board.tiedHidden)}</p>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 p-8 text-center min-h-48">
          <span className="text-4xl leading-none">🏆</span>
          <p className="text-base font-bold text-gray-900">{t.empty}</p>
          <p className="text-sm text-gray-400">{t.emptySubtitle}</p>
        </div>
      )}

      {showMe && me && (
        <div className="border-t-2 border-dashed border-gray-200">
          <p className="px-5 pt-2.5 text-xs font-bold text-gray-500">{t.myRank}</p>
          {me.ranked && me.rank !== null ? (
            <RankRow rank={me.rank} nickname={me.nickname ?? "—"} points={me.total_points} streak={me.streak} isMe locale={locale} />
          ) : (
            <p className="px-5 pb-3 pt-1 text-sm text-gray-600">
              {me.reason === "no_nickname" ? t.notRankedNick : me.reason === "no_points" ? t.notRankedZero : t.notRankedOther}
            </p>
          )}
        </div>
      )}

      <ul className="px-5 py-3 border-t border-gray-100 bg-gray-50 space-y-1">
        {t.notes.map((n) => (
          <li key={n} className="text-xs text-gray-500 leading-relaxed">· {n}</li>
        ))}
      </ul>
    </div>
  );
}
