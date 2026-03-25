"use client";

/**
 * PointRankingWidget — client component
 *
 * Exact bugs fixed in this revision
 * ──────────────────────────────────
 * 1. LOGIN GATE FLICKER  — added `initializing` state.  While we haven't yet
 *    received the first onAuthStateChange event we show a spinner, not the
 *    guest gate.  This kills the "Login Required" flash for already-logged-in
 *    users.
 *
 * 2. DOUBLE-FETCH RACE   — removed the separate getSession() call.
 *    onAuthStateChange fires INITIAL_SESSION synchronously on subscribe,
 *    giving us the stored session in one place.  Previously both paths called
 *    fetchRankings() in parallel.
 *
 * 3. WRONG FETCH ORDER   — the leaderboard VIEW runs as SECURITY INVOKER.
 *    With the profiles RLS policy `auth.uid() = id` it returns exactly ONE row
 *    (the current user's own profile) — never the full top-10.  Because the
 *    old code only fell through to the RPC when the view returned ZERO rows,
 *    the RPC was never reached.  New order: RPC first → view second → fallback.
 *
 * 4. STALE FETCH         — a `cancelled` ref stops setState calls after the
 *    effect cleans up (component unmount / dep change).
 *
 * 5. EMPTY-STATE COPY    — updated to match spec ("아직 등록된 랭킹이 없습니다.
 *    첫 번째 주인공이 되어보세요!").
 *
 * 6. OWN-ROW HIGHLIGHT   — the logged-in user's row is highlighted in green.
 */

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getRank } from "@/lib/ranks";
import type { Locale } from "@/lib/i18n";
import type { Session } from "@supabase/supabase-js";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Columns returned by the leaderboard view and the get_leaderboard() RPC */
interface LeaderboardRow {
  nickname: string;       // profiles.nickname  NOT NULL DEFAULT ''
  total_points: number;   // profiles.total_points  NOT NULL DEFAULT 0
  current_streak: number; // profiles.current_streak  NOT NULL DEFAULT 0
}

/** Public display model consumed by the render tree */
export interface RankingEntry {
  rank: number;
  nickname: string;
  totalPoints: number;    // always a number — renders "0 P" when 0
  currentStreak: number;
  badge: string;
  tier: string;
}

type FetchState = "idle" | "loading" | "done" | "error";

export interface PointRankingWidgetProps {
  locale: Locale;
  /**
   * Fallback entries shown while Supabase is not yet configured, or when every
   * live query path returns 0 rows.  Pass the page-level mock array here so the
   * widget is never blank on a fresh deployment.
   */
  fallbackEntries?: RankingEntry[];
}

// ── i18n ──────────────────────────────────────────────────────────────────────

const labels = {
  en: {
    rank: "Rank", user: "User", tier: "Tier", streak: "Streak", points: "Points",
    days: "days", pts: "P",
    loading: "Loading rankings…",
    loginTitle: "Log in to view the full rankings",
    loginSubtitle: "Check in daily to earn points and climb to the top of the leaderboard.",
    loginBtn: "Sign In to See Rankings",
    empty: "No rankings found yet. Be the first!",
    emptySubtitle: "Check in daily to start earning points.",
    error: "Failed to load rankings. Please try again.",
    you: "YOU",
  },
  ko: {
    rank: "순위", user: "유저", tier: "등급", streak: "연속", points: "포인트",
    days: "일", pts: "P",
    loading: "랭킹 불러오는 중…",
    loginTitle: "로그인하여 전체 랭킹을 확인하세요",
    loginSubtitle: "매일 출석 체크로 포인트를 쌓고 상위 팬으로 올라가세요.",
    loginBtn: "로그인하고 랭킹 보기",
    // ← spec-exact copy
    empty: "아직 등록된 랭킹이 없습니다. 첫 번째 주인공이 되어보세요!",
    emptySubtitle: "매일 출석 체크로 포인트를 모아보세요.",
    error: "랭킹을 불러오지 못했습니다. 다시 시도해주세요.",
    you: "나",
  },
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Pure CSS spinner — no icon library required */
function Spinner() {
  return (
    <div
      className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-emerald-600 animate-spin"
      role="status"
      aria-label="Loading"
    />
  );
}

const MEDALS: readonly string[] = ["🥇", "🥈", "🥉"];

/** True when NEXT_PUBLIC_SUPABASE_* env vars are present in the JS bundle */
const SUPABASE_CONFIGURED =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Maps raw Supabase rows → typed RankingEntry[] */
function mapRows(rows: LeaderboardRow[], locale: Locale): RankingEntry[] {
  return rows.map((row, i) => {
    const rankInfo = getRank(row.total_points ?? 0);
    return {
      rank: i + 1,
      nickname:      row.nickname?.trim() || "—",
      // NOT NULL DEFAULT 0 in schema — coerce defensively
      totalPoints:   typeof row.total_points   === "number" ? row.total_points   : 0,
      currentStreak: typeof row.current_streak === "number" ? row.current_streak : 0,
      badge: rankInfo.badge,
      tier:  rankInfo.label[locale],
    };
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PointRankingWidget({
  locale,
  fallbackEntries = [],
}: PointRankingWidgetProps) {
  const t = labels[locale];

  /**
   * `initializing` starts true and flips to false on the first
   * onAuthStateChange event (INITIAL_SESSION).  While true we show a spinner
   * so already-logged-in users never see the "Login Required" gate flash.
   */
  const [initializing, setInitializing]           = useState(true);
  const [session, setSession]                     = useState<Session | null>(null);
  const [currentUserNickname, setCurrentUserNickname] = useState<string | null>(null);
  const [entries, setEntries]                     = useState<RankingEntry[]>([]);
  const [fetchState, setFetchState]               = useState<FetchState>("idle");

  /** Stable Supabase browser client — one instance per component lifetime */
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  if (!supabaseRef.current) supabaseRef.current = createClient();
  const supabase = supabaseRef.current;

  // ── Auth listener + fetch ──────────────────────────────────────────────────

  useEffect(() => {
    /**
     * `cancelled` prevents setState calls if the component unmounts while a
     * fetch is in flight (stale-update guard).
     */
    let cancelled = false;

    // ── fetchRankings ──────────────────────────────────────────────────────
    /**
     * Three-tier fetch strategy:
     *
     *   1. rpc("get_leaderboard")       ← SECURITY DEFINER; bypasses RLS
     *      Returns real top-10 once schema.sql is applied in Supabase.
     *
     *   2. .from("leaderboard").select  ← SECURITY INVOKER view
     *      With current RLS returns 1 row (the user's own) unless the view is
     *      also updated to SECURITY DEFINER.  Kept as a future-proof secondary.
     *
     *   3. fallbackEntries              ← always non-blank for guests / dev
     *
     * Table / column verification:
     *   Table  : public.profiles
     *   Columns: nickname (text), total_points (integer), current_streak (integer)
     *   Order  : total_points DESC (enforced inside the view and RPC)
     *   Limit  : 10
     */
    async function fetchRankings(sess: Session) {
      if (cancelled) return;

      // ── Supabase not configured (local dev without .env.local) ──────────
      if (!SUPABASE_CONFIGURED) {
        if (!cancelled) {
          setEntries(fallbackEntries.length > 0 ? fallbackEntries : []);
          setFetchState("done");
        }
        return;
      }

      if (!cancelled) setFetchState("loading");

      try {
        // ── Fetch current user's nickname for row highlight ──────────────
        // profiles RLS allows authenticated users to read their own row.
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", sess.user.id)
          .maybeSingle();

        if (!cancelled) {
          setCurrentUserNickname(profileRow?.nickname?.trim() || null);
        }

        // ── Tier 1: SECURITY DEFINER RPC ─────────────────────────────────
        // get_leaderboard() is defined in supabase/schema.sql with
        // `security definer` — it runs as the DB owner, bypassing the
        // per-row RLS that blocks the view from returning the full top-10.
        const { data: rpcData, error: rpcError } = await supabase
          .rpc("get_leaderboard");

        if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
          if (!cancelled) {
            setEntries(mapRows(rpcData as LeaderboardRow[], locale));
            setFetchState("done");
          }
          return;
        }

        // ── Tier 2: leaderboard view (SECURITY INVOKER fallback) ─────────
        const { data: viewData, error: viewError } = await supabase
          .from("leaderboard")
          .select("nickname, total_points, current_streak")
          .limit(10);

        if (!viewError && Array.isArray(viewData) && viewData.length > 0) {
          if (!cancelled) {
            setEntries(mapRows(viewData as LeaderboardRow[], locale));
            setFetchState("done");
          }
          return;
        }

        // ── Tier 3: static fallback — widget is never blank ──────────────
        if (!cancelled) {
          setEntries(fallbackEntries.length > 0 ? fallbackEntries : []);
          setFetchState("done");
        }

      } catch {
        if (!cancelled) {
          // Show fallback rather than an error screen when we have data
          if (fallbackEntries.length > 0) {
            setEntries(fallbackEntries);
            setFetchState("done");
          } else {
            setFetchState("error");
          }
        }
      }
    }

    // ── Single auth subscription ───────────────────────────────────────────
    /**
     * onAuthStateChange is the ONLY auth source here (getSession() removed).
     * It fires INITIAL_SESSION on subscribe with whatever session is stored in
     * the browser cookie — no separate getSession() call needed, and the old
     * double-fetch race is gone.
     *
     * Events we care about:
     *   INITIAL_SESSION  — page load (logged-in or not)
     *   SIGNED_IN        — user just logged in (OAuth redirect, email+pw, etc.)
     *   TOKEN_REFRESHED  — silent token refresh
     *   SIGNED_OUT       — explicit logout
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (cancelled) return;

      setSession(newSession);
      setInitializing(false); // first event received — safe to show real UI

      if (newSession) {
        fetchRankings(newSession);
      } else {
        // No session → reset to guest state
        setEntries([]);
        setCurrentUserNickname(null);
        setFetchState("idle");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, locale, fallbackEntries]); // all three are stable across renders

  // ── Render: initializing ───────────────────────────────────────────────────
  // Show spinner while we wait for the first INITIAL_SESSION event.
  // This prevents the "Login Required" gate from flashing for logged-in users.

  if (initializing) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm min-h-75 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-gray-400">{t.loading}</p>
        </div>
      </div>
    );
  }

  // ── Render: guest gate ────────────────────────────────────────────────────

  if (!session) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-10 flex flex-col items-center gap-5 text-center min-h-75 justify-center">
        <span className="text-5xl leading-none">🏆</span>
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-extrabold text-gray-900">{t.loginTitle}</h3>
          <p className="text-sm text-gray-500 max-w-xs leading-relaxed">{t.loginSubtitle}</p>
        </div>

        {/* Blurred preview — hints at hidden content without leaking data */}
        <div className="w-full max-w-sm select-none pointer-events-none" aria-hidden>
          <div className="bg-white rounded-xl border border-emerald-100 overflow-hidden">
            {["👑 footballking_kr", "👑 premierleaguefan", "👑 bundesligaboss"].map((row, i) => (
              <div
                key={i}
                className="px-4 py-2.5 text-sm text-gray-400 border-b border-gray-50 last:border-0 blur-[3px]"
              >
                {row}
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

  // ── Render: loading ────────────────────────────────────────────────────────

  if (fetchState === "loading" || fetchState === "idle") {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm min-h-75 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-sm text-gray-400">{t.loading}</p>
        </div>
      </div>
    );
  }

  // ── Render: error ──────────────────────────────────────────────────────────

  if (fetchState === "error") {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm min-h-75 flex items-center justify-center p-8 text-center">
        <p className="text-sm text-gray-500">{t.error}</p>
      </div>
    );
  }

  // ── Render: empty ──────────────────────────────────────────────────────────

  if (entries.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm min-h-75 flex flex-col items-center justify-center gap-3 p-8 text-center">
        <span className="text-4xl leading-none">🏆</span>
        <p className="text-base font-bold text-gray-900">{t.empty}</p>
        <p className="text-sm text-gray-400">{t.emptySubtitle}</p>
      </div>
    );
  }

  // ── Render: data table ────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-75">

      {/* Column headers */}
      <div className="grid grid-cols-[48px_1fr_80px_72px_88px] px-5 py-2.5 bg-gray-50 border-b border-gray-100">
        {[t.rank, t.user, t.tier, t.streak, t.points].map((h) => (
          <span key={h} className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            {h}
          </span>
        ))}
      </div>

      {/* Ranking rows */}
      {entries.map((entry, i) => {
        const isCurrentUser =
          !!currentUserNickname && entry.nickname === currentUserNickname;

        return (
          <div
            key={entry.rank}
            className={[
              "grid grid-cols-[48px_1fr_80px_72px_88px] px-5 py-3",
              "border-b border-gray-100 last:border-0",
              "items-center bg-white",          // explicit white bg — no dark-mode leakage
              isCurrentUser
                ? "ring-1 ring-inset ring-emerald-200 bg-emerald-50"
                : i < 3
                ? "bg-yellow-50/50"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {/* ── Rank / medal ── */}
            <span
              className={`flex items-center font-bold leading-none ${
                i < 3 ? "text-base" : "text-sm text-gray-400"
              }`}
            >
              {i < 3 ? MEDALS[i] : entry.rank}
            </span>

            {/* ── Nickname — text-gray-900 per spec ── */}
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-sm shrink-0" aria-hidden>{entry.badge}</span>
              <span className="text-sm font-semibold text-gray-900 truncate">
                {entry.nickname}
              </span>
              {isCurrentUser && (
                <span className="ml-1 shrink-0 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 leading-none uppercase tracking-wide">
                  {t.you}
                </span>
              )}
            </div>

            {/* ── Tier ── */}
            <span className="flex items-center text-xs text-gray-500">
              {entry.tier}
            </span>

            {/* ── Streak ── */}
            <span className="flex items-center text-xs font-bold text-amber-600">
              {entry.currentStreak}
              <span className="font-normal text-gray-400 ml-1">{t.days}</span>
            </span>

            {/* ── Points — "0 P" when totalPoints === 0 — text-emerald-600 font-bold ── */}
            <span className="flex items-center text-xs font-bold text-emerald-600">
              {entry.totalPoints.toLocaleString()}&nbsp;{t.pts}
            </span>
          </div>
        );
      })}
    </div>
  );
}
