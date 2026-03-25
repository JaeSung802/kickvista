"use client";

import { useEffect, useState, useCallback } from "react";

interface UnnotifiedPrediction {
  id: string;
  match_id: number;
  predicted_result: "HOME_WIN" | "DRAW" | "AWAY_WIN";
  bet_amount: number;
  home_team_name: string | null;
  away_team_name: string | null;
}

interface SettlementModalProps {
  locale: "ko" | "en";
}

// ─── Falling coins animation ──────────────────────────────────────────────────

const COIN_POSITIONS = [8, 18, 28, 38, 48, 58, 68, 78, 88, 14, 34, 62, 72];

function FallingCoins() {
  return (
    <>
      <style>{`
        @keyframes coinDrop {
          0%   { top: -8%; transform: rotate(0deg) scale(1.1); opacity: 1; }
          70%  { opacity: 1; }
          100% { top: 108%; transform: rotate(540deg) scale(0.7); opacity: 0; }
        }
      `}</style>
      {COIN_POSITIONS.map((left, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            position: "absolute",
            left: `${left}%`,
            fontSize: i % 3 === 0 ? 22 : 16,
            animation: `coinDrop ${0.9 + (i % 5) * 0.15}s ease-in ${(i % 7) * 0.12}s both`,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          🪙
        </span>
      ))}
    </>
  );
}

// ─── Labels ───────────────────────────────────────────────────────────────────

const labels = {
  en: {
    title: "Prediction Correct!",
    subtitle: "Your prediction paid off",
    match: "Match",
    yourPick: "Your Pick",
    bet: "Bet",
    reward: "Reward",
    total: "Total Earned",
    confirm: "Claim Reward",
    resultLabels: {
      HOME_WIN: "Home Win",
      DRAW: "Draw",
      AWAY_WIN: "Away Win",
    },
  },
  ko: {
    title: "예측 성공! 🎉",
    subtitle: "승부 예측이 적중했습니다",
    match: "경기",
    yourPick: "내 예측",
    bet: "배팅",
    reward: "보상",
    total: "획득 포인트",
    confirm: "보상 받기",
    resultLabels: {
      HOME_WIN: "홈 승리",
      DRAW: "무승부",
      AWAY_WIN: "원정 승리",
    },
  },
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function SettlementModal({ locale }: SettlementModalProps) {
  const t = labels[locale];
  const [prediction, setPrediction] = useState<UnnotifiedPrediction | null>(null);
  const [visible, setVisible] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    // Check once per session — skip if already checked this tab session
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("settle_checked")) {
      return;
    }

    async function checkUnnotified() {
      try {
        const res = await fetch("/api/predictions/unnotified");
        const { prediction: data } = await res.json();
        if (data) {
          setPrediction(data as UnnotifiedPrediction);
          setVisible(true);
        }
      } catch {
        // Silent fail — non-critical
      } finally {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem("settle_checked", "1");
        }
      }
    }

    // Small delay so the page renders before the modal pops up
    const timer = setTimeout(checkUnnotified, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!prediction) return;
    setClaiming(true);

    try {
      await fetch(`/api/predictions/${prediction.id}/notify`, { method: "PATCH" });
    } catch {
      // Silent fail — we still close the modal
    }

    setVisible(false);
    setPrediction(null);
    setClaiming(false);
  }, [prediction]);

  if (!visible || !prediction) return null;

  const reward = prediction.bet_amount * 2;
  const matchLabel =
    prediction.home_team_name && prediction.away_team_name
      ? `${prediction.home_team_name} vs ${prediction.away_team_name}`
      : `Match #${prediction.match_id}`;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          zIndex: 999,
          backdropFilter: "blur(2px)",
        }}
        onClick={handleConfirm}
        aria-hidden
      />

      {/* Modal card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1000,
          width: "min(380px, 92vw)",
          background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(234,179,8,0.3)",
        }}
      >
        {/* Coin rain zone */}
        <div style={{ position: "relative", height: 80, overflow: "hidden" }}>
          <FallingCoins />
          {/* Gold shimmer bar */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 3,
              background: "linear-gradient(90deg, transparent, #eab308, #fde047, #eab308, transparent)",
            }}
          />
        </div>

        <div style={{ padding: "0 28px 28px" }}>
          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: "#fde047",
                margin: "0 0 4px",
                letterSpacing: "-0.02em",
              }}
            >
              {t.title}
            </h2>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>{t.subtitle}</p>
          </div>

          {/* Match info */}
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 16,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              {t.match}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>
              {matchLabel}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
              {t.yourPick}: <span style={{ color: "#34d399", fontWeight: 700 }}>
                {t.resultLabels[prediction.predicted_result]}
              </span>
            </div>
          </div>

          {/* Reward breakdown */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: 10,
                padding: "10px 12px",
                textAlign: "center",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{t.bet}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#e2e8f0" }}>
                🪙 {prediction.bet_amount.toLocaleString()}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                color: "#34d399",
                fontSize: 18,
                fontWeight: 900,
              }}
            >
              ×2
            </div>
            <div
              style={{
                flex: 1,
                background: "linear-gradient(135deg, rgba(234,179,8,0.2), rgba(253,224,71,0.1))",
                borderRadius: 10,
                padding: "10px 12px",
                textAlign: "center",
                border: "1px solid rgba(234,179,8,0.3)",
              }}
            >
              <div style={{ fontSize: 11, color: "#ca8a04", marginBottom: 4 }}>{t.total}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#fde047" }}>
                🪙 {reward.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={claiming}
            style={{
              width: "100%",
              padding: "14px",
              background: claiming
                ? "#374151"
                : "linear-gradient(135deg, #eab308, #ca8a04)",
              color: claiming ? "#6b7280" : "#000",
              fontWeight: 900,
              fontSize: 15,
              borderRadius: 12,
              border: "none",
              cursor: claiming ? "not-allowed" : "pointer",
              letterSpacing: "0.02em",
            }}
          >
            {claiming ? "…" : `🪙 ${t.confirm}`}
          </button>
        </div>
      </div>
    </>
  );
}
