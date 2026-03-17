"use client";

import { useState } from "react";
import Link from "next/link";
import ConfidenceMeter from "./ConfidenceMeter";

interface AnalysisList {
  id: string;
  fixtureId: number;
  type: "preview" | "recap";
  locale: "en" | "ko";
  title: string;
  slug: string;
  summary: string;
  prediction?: {
    outcome: "home" | "away" | "draw";
    label: string;
    confidence: number;
  };
  tips: { label: string; labelKo: string }[];
  aiModel: string;
  generatedAt: string;
  disclaimer: string;
  isAiGenerated: boolean;
}

interface PredictionGridProps {
  analyses: AnalysisList[];
  locale: "ko" | "en";
}

type FilterType = "all" | "preview" | "recap";

const OUTCOME_ICONS: Record<string, string> = {
  home: "🏠",
  away: "✈️",
  draw: "🤝",
};

function formatDate(dateStr: string, locale: "ko" | "en"): string {
  const date = new Date(dateStr);
  if (locale === "ko") {
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface PredictionCardProps {
  analysis: AnalysisList;
  locale: "ko" | "en";
}

function PredictionCard({ analysis, locale }: PredictionCardProps) {
  const href = `/${locale}/analysis/${analysis.slug}`;
  const isPreview = analysis.type === "preview";
  const outcomeIcon = analysis.prediction
    ? OUTCOME_ICONS[analysis.prediction.outcome]
    : null;

  return (
    <div
      style={{
        backgroundColor: "#161b22",
        border: "1px solid #30363d",
        borderRadius: "10px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        transition: "border-color 0.2s ease",
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor = "#22c55e33")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor = "#30363d")
      }
    >
      {/* Type badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{
            backgroundColor: isPreview ? "#1e3a5f" : "#2d1b4e",
            color: isPreview ? "#60a5fa" : "#c084fc",
            fontSize: "11px",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: "4px",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {isPreview
            ? locale === "ko" ? "프리뷰" : "Preview"
            : locale === "ko" ? "리캡" : "Recap"}
        </span>
        {analysis.isAiGenerated && (
          <span style={{ color: "#8b949e", fontSize: "10px" }}>🤖 AI</span>
        )}
      </div>

      {/* Title */}
      <h3
        style={{
          color: "#e6edf3",
          fontSize: "14px",
          fontWeight: 600,
          lineHeight: "1.4",
          margin: 0,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {analysis.title}
      </h3>

      {/* Prediction outcome */}
      {analysis.prediction && (
        <div
          style={{
            backgroundColor: "#0d1117",
            borderRadius: "8px",
            padding: "10px 12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "18px" }}>{outcomeIcon}</span>
          <div>
            <div style={{ color: "#8b949e", fontSize: "10px", fontWeight: 500, marginBottom: "2px" }}>
              {locale === "ko" ? "예측 결과" : "Predicted Outcome"}
            </div>
            <div style={{ color: "#e6edf3", fontSize: "13px", fontWeight: 700 }}>
              {analysis.prediction.label}
            </div>
          </div>
        </div>
      )}

      {/* Confidence meter */}
      {analysis.prediction && (
        <ConfidenceMeter
          confidence={analysis.prediction.confidence}
          locale={locale}
          size="sm"
        />
      )}

      {/* Tips */}
      {analysis.tips.length > 0 && (
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          {analysis.tips.slice(0, 2).map((tip, i) => (
            <span
              key={i}
              style={{
                backgroundColor: "#2d1b4e",
                color: "#c084fc",
                fontSize: "11px",
                fontWeight: 500,
                padding: "3px 8px",
                borderRadius: "4px",
              }}
            >
              {locale === "ko" ? tip.labelKo : tip.label}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
          paddingTop: "4px",
        }}
      >
        <span style={{ color: "#8b949e", fontSize: "11px" }}>
          {formatDate(analysis.generatedAt, locale)}
        </span>
        <Link
          href={href}
          style={{
            backgroundColor: "#22c55e",
            color: "#0d1117",
            fontSize: "12px",
            fontWeight: 700,
            padding: "5px 12px",
            borderRadius: "6px",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          {locale === "ko" ? "분석 보기" : "Read Analysis"}
        </Link>
      </div>

      {/* Disclaimer */}
      <p
        style={{
          color: "#8b949e",
          fontSize: "10px",
          lineHeight: "1.4",
          margin: 0,
          borderTop: "1px solid #21262d",
          paddingTop: "8px",
        }}
      >
        {analysis.disclaimer}
      </p>
    </div>
  );
}

export default function PredictionGrid({ analyses, locale }: PredictionGridProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered =
    filter === "all" ? analyses : analyses.filter((a) => a.type === filter);

  const filterTabs: { key: FilterType; label: string; labelKo: string }[] = [
    { key: "all",     label: "All",      labelKo: "전체" },
    { key: "preview", label: "Previews", labelKo: "프리뷰" },
    { key: "recap",   label: "Recaps",   labelKo: "리캡" },
  ];

  return (
    <section>
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <h2 style={{ color: "#e6edf3", fontSize: "18px", fontWeight: 700, margin: 0 }}>
          {locale === "ko" ? "AI 경기 분석" : "AI Match Predictions"}
        </h2>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: "6px" }}>
          {filterTabs.map((tab) => {
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: `1px solid ${isActive ? "#22c55e" : "#30363d"}`,
                  backgroundColor: isActive ? "#22c55e" : "transparent",
                  color: isActive ? "#0d1117" : "#8b949e",
                  fontSize: "12px",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {locale === "ko" ? tab.labelKo : tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "14px",
          }}
        >
          {filtered.map((analysis) => (
            <PredictionCard key={analysis.id} analysis={analysis} locale={locale} />
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#8b949e",
            fontSize: "14px",
            backgroundColor: "#161b22",
            borderRadius: "10px",
            border: "1px solid #30363d",
          }}
        >
          {locale === "ko" ? "분석 데이터가 없습니다." : "No analyses available."}
        </div>
      )}
    </section>
  );
}
