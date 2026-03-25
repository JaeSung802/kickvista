"use client";

import { useState } from "react";
import type { Prediction, PredictionResult, PredictionStatus, PredictionStats } from "@/lib/predictions";

// Re-export types so the server component can import them from here
export type { Prediction, PredictionResult, PredictionStatus, PredictionStats };

const MIN_BET_AMOUNT = 10;

interface PredictionCardProps {
  matchId: number;
  homeTeamName: string;
  awayTeamName: string;
  /** true while match is live */
  isLive: boolean;
  /** true after full-time */
  isFinished: boolean;
  /** true if postponed or cancelled */
  isInactive: boolean;
  /** null = not logged in */
  userPoints: number | null;
  initialPrediction: Prediction | null;
  initialStats: PredictionStats;
  locale: "ko" | "en";
  loginUrl: string;
}

const labels = {
  en: {
    title: "Match Prediction",
    yourPick: "Your Pick",
    draw: "Draw",
    betAmount: "Bet Points",
    potentialReward: "Potential Reward",
    placeBet: "Confirm Prediction",
    predictionClosed: "Predictions Closed",
    matchStarted: "Match has started — predictions are now closed.",
    loginToPredict: "Sign in to make your prediction",
    login: "Sign In",
    pts: "pts",
    statusPending: "Pending",
    statusWon: "Correct!",
    statusLost: "Incorrect",
    statusCancelled: "Cancelled",
    communityVotes: "Community Votes",
    minBetError: "Minimum bet is {min} pts",
    insufficientPoints: "Not enough points. You need {amount} pts.",
  },
  ko: {
    title: "승부 예측",
    yourPick: "내 예측",
    draw: "무승부",
    betAmount: "배팅 포인트",
    potentialReward: "예상 보상",
    placeBet: "예측 참여",
    predictionClosed: "예측 마감",
    matchStarted: "경기가 시작되어 예측이 마감되었습니다.",
    loginToPredict: "예측에 참여하려면 로그인하세요",
    login: "로그인",
    pts: "pts",
    statusPending: "진행 중",
    statusWon: "적중!",
    statusLost: "미적중",
    statusCancelled: "취소됨",
    communityVotes: "커뮤니티 투표",
    minBetError: "최소 배팅은 {min} pts입니다",
    insufficientPoints: "포인트가 부족합니다. {amount} pts가 필요합니다.",
  },
};

const STATUS_COLOR: Record<PredictionStatus, string> = {
  PENDING:   "#d97706",
  WON:       "#059669",
  LOST:      "#dc2626",
  CANCELLED: "#6b7280",
};

function VoteBar({
  label,
  count,
  total,
  highlight,
}: {
  label: string;
  count: number;
  total: number;
  highlight: boolean;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-xs font-semibold"
          style={{ color: highlight ? "#059669" : "#6b7280" }}
        >
          {label}
        </span>
        <span className="text-xs" style={{ color: highlight ? "#059669" : "#9ca3af" }}>
          {pct}%
          {total > 0 && (
            <span className="ml-1" style={{ color: "#d1d5db" }}>
              ({count})
            </span>
          )}
        </span>
      </div>
      <div
        style={{
          height: 6,
          backgroundColor: "#f3f4f6",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            backgroundColor: highlight ? "#059669" : "#d1d5db",
            borderRadius: 999,
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}

export default function PredictionCard({
  matchId,
  homeTeamName,
  awayTeamName,
  isLive,
  isFinished,
  isInactive,
  userPoints,
  initialPrediction,
  initialStats,
  locale,
  loginUrl,
}: PredictionCardProps) {
  const t = labels[locale];

  const [selected, setSelected] = useState<PredictionResult | null>(null);
  const [betAmount, setBetAmount] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(initialPrediction);
  const [stats, setStats] = useState<PredictionStats>(initialStats);

  const isPredictionOpen = !isLive && !isFinished && !isInactive;
  const isLoggedIn = userPoints !== null;

  const resultLabels: Record<PredictionResult, string> = {
    HOME_WIN: homeTeamName,
    DRAW: t.draw,
    AWAY_WIN: awayTeamName,
  };

  const statusLabels: Record<PredictionStatus, string> = {
    PENDING:   t.statusPending,
    WON:       t.statusWon,
    LOST:      t.statusLost,
    CANCELLED: t.statusCancelled,
  };

  async function handlePlaceBet() {
    if (!selected || !isLoggedIn || userPoints === null) return;

    if (betAmount < MIN_BET_AMOUNT) {
      setError(t.minBetError.replace("{min}", String(MIN_BET_AMOUNT)));
      return;
    }
    if (userPoints < betAmount) {
      setError(t.insufficientPoints.replace("{amount}", String(betAmount)));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          result: selected,
          amount: betAmount,
          homeTeamName: homeTeamName,
          awayTeamName: awayTeamName,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to place prediction");
        return;
      }

      setPrediction(data.prediction as Prediction);
      setStats((prev) => ({
        ...prev,
        [selected]: prev[selected] + 1,
        total: prev.total + 1,
      }));
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ backgroundColor: "#fffbeb", borderColor: "#fde68a" }}
      >
        <span style={{ fontSize: 16 }}>🪙</span>
        <h4 className="text-sm font-bold" style={{ color: "#78350f" }}>
          {t.title}
        </h4>
        {isPredictionOpen && (
          <span
            className="ml-auto text-xs font-bold rounded-full px-2 py-0.5"
            style={{ backgroundColor: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }}
          >
            OPEN
          </span>
        )}
        {(isLive || isFinished) && (
          <span
            className="ml-auto text-xs font-bold rounded-full px-2 py-0.5"
            style={{ backgroundColor: "#f3f4f6", color: "#6b7280", border: "1px solid #e5e7eb" }}
          >
            {t.predictionClosed}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-4">

        {/* ── Existing prediction ──────────────────────────────────────── */}
        {prediction && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                {t.yourPick}
              </span>
              <span
                className="text-xs font-bold rounded-full px-2.5 py-0.5"
                style={{
                  backgroundColor: STATUS_COLOR[prediction.status] + "18",
                  color: STATUS_COLOR[prediction.status],
                }}
              >
                {statusLabels[prediction.status]}
              </span>
            </div>

            <div
              className="rounded-lg p-3 text-center"
              style={{ backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0" }}
            >
              <div className="text-sm font-black text-emerald-800">
                {resultLabels[prediction.predicted_result]}
              </div>
              <div className="text-xs text-emerald-600 mt-1">
                🪙 {prediction.bet_amount.toLocaleString()} {t.pts}
                {prediction.status === "WON" && (
                  <span className="ml-2 font-bold text-emerald-700">
                    → +{(prediction.bet_amount * 2).toLocaleString()} {t.pts}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Prediction form ──────────────────────────────────────────── */}
        {!prediction && isPredictionOpen && (
          <>
            {!isLoggedIn ? (
              <div className="text-center py-2 flex flex-col gap-3">
                <p className="text-xs text-gray-500">{t.loginToPredict}</p>
                <a
                  href={loginUrl}
                  className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors no-underline"
                >
                  {t.login}
                </a>
              </div>
            ) : (
              <>
                {/* Choice buttons */}
                <div className="grid grid-cols-3 gap-1.5">
                  {(["HOME_WIN", "DRAW", "AWAY_WIN"] as PredictionResult[]).map((result) => (
                    <button
                      key={result}
                      onClick={() => setSelected(result)}
                      className={`py-2 px-1 rounded-lg text-xs font-bold text-center transition-all ${
                        selected === result
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-gray-50 text-gray-700 border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50"
                      }`}
                    >
                      {resultLabels[result]}
                    </button>
                  ))}
                </div>

                {/* Bet amount input */}
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-1.5">
                    {t.betAmount}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={MIN_BET_AMOUNT}
                      max={userPoints ?? MIN_BET_AMOUNT}
                      value={betAmount}
                      onChange={(e) =>
                        setBetAmount(Math.max(MIN_BET_AMOUNT, parseInt(e.target.value) || MIN_BET_AMOUNT))
                      }
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-center focus:outline-none focus:border-emerald-400"
                    />
                    <span className="text-xs text-gray-400 shrink-0">
                      / {(userPoints ?? 0).toLocaleString()} pts
                    </span>
                  </div>
                  {selected && (
                    <p className="text-xs text-amber-700 font-semibold mt-1">
                      {t.potentialReward}: 🪙 {(betAmount * 2).toLocaleString()} {t.pts}
                    </p>
                  )}
                </div>

                {error && (
                  <p className="text-xs text-red-500">{error}</p>
                )}

                <button
                  onClick={handlePlaceBet}
                  disabled={!selected || loading || !isLoggedIn || (userPoints ?? 0) < MIN_BET_AMOUNT}
                  className={`w-full py-2.5 rounded-lg text-sm font-bold transition-colors ${
                    !selected || loading || !isLoggedIn || (userPoints ?? 0) < MIN_BET_AMOUNT
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-amber-500 text-white hover:bg-amber-600 cursor-pointer"
                  }`}
                >
                  {loading ? "…" : t.placeBet}
                </button>
              </>
            )}
          </>
        )}

        {/* ── Prediction closed (no prior prediction) ──────────────────── */}
        {!prediction && !isPredictionOpen && (isLive || isFinished) && (
          <p className="text-xs text-gray-400 text-center py-1">{t.matchStarted}</p>
        )}

        {/* ── Community vote distribution ──────────────────────────────── */}
        {stats.total > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
              {t.communityVotes} · {stats.total}
            </p>
            <div className="flex flex-col gap-2">
              <VoteBar
                label={homeTeamName}
                count={stats.HOME_WIN}
                total={stats.total}
                highlight={prediction?.predicted_result === "HOME_WIN"}
              />
              <VoteBar
                label={t.draw}
                count={stats.DRAW}
                total={stats.total}
                highlight={prediction?.predicted_result === "DRAW"}
              />
              <VoteBar
                label={awayTeamName}
                count={stats.AWAY_WIN}
                total={stats.total}
                highlight={prediction?.predicted_result === "AWAY_WIN"}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
