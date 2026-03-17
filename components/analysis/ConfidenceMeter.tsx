"use client";

import { useEffect, useState } from "react";

interface ConfidenceMeterProps {
  confidence: number;
  locale: "ko" | "en";
  size?: "sm" | "md" | "lg";
}

function getBarColor(confidence: number): string {
  if (confidence < 40) return "#ef4444";
  if (confidence < 65) return "#f59e0b";
  return "#22c55e";
}

const SIZE_CONFIG = {
  sm: { height: 6,  fontSize: "11px", labelSize: "11px", gap: 4 },
  md: { height: 8,  fontSize: "13px", labelSize: "12px", gap: 6 },
  lg: { height: 12, fontSize: "16px", labelSize: "13px", gap: 8 },
};

export default function ConfidenceMeter({
  confidence,
  locale,
  size = "md",
}: ConfidenceMeterProps) {
  const [filled, setFilled] = useState(0);
  const clamped = Math.max(0, Math.min(100, confidence));
  const color = getBarColor(clamped);
  const cfg = SIZE_CONFIG[size];

  useEffect(() => {
    // Trigger animation after mount
    const raf = requestAnimationFrame(() => {
      setFilled(clamped);
    });
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: `${cfg.gap}px`, width: "100%" }}>
      {/* Label + percentage */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: "#8b949e", fontSize: cfg.labelSize, fontWeight: 500 }}>
          {locale === "ko" ? "AI 신뢰도" : "AI Confidence"}
        </span>
        <span
          style={{
            color: color,
            fontSize: cfg.fontSize,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            transition: "color 0.3s ease",
          }}
        >
          {clamped}%
        </span>
      </div>

      {/* Bar track */}
      <div
        style={{
          width: "100%",
          height: `${cfg.height}px`,
          backgroundColor: "#21262d",
          borderRadius: `${cfg.height}px`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Filled portion */}
        <div
          style={{
            height: "100%",
            width: `${filled}%`,
            backgroundColor: color,
            borderRadius: `${cfg.height}px`,
            transition: "width 0.7s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Shine effect */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "50%",
              background: "rgba(255,255,255,0.15)",
              borderRadius: `${cfg.height}px ${cfg.height}px 0 0`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
