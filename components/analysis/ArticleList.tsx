import Link from "next/link";

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

interface ArticleListProps {
  analyses: AnalysisList[];
  locale: "ko" | "en";
  type?: "preview" | "recap" | "all";
}

function getConfidenceColor(confidence: number): string {
  if (confidence < 40) return "#ef4444";
  if (confidence < 65) return "#f59e0b";
  return "#22c55e";
}

function formatDate(dateStr: string, locale: "ko" | "en"): string {
  const date = new Date(dateStr);
  if (locale === "ko") {
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ArticleList({
  analyses,
  locale,
  type = "all",
}: ArticleListProps) {
  const filtered =
    type === "all" ? analyses : analyses.filter((a) => a.type === type);

  if (filtered.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "32px 20px",
          color: "#8b949e",
          fontSize: "14px",
        }}
      >
        {locale === "ko" ? "분석 데이터가 없습니다." : "No analyses available."}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {filtered.map((analysis, idx) => {
        const isPreview = analysis.type === "preview";
        const href = `/${locale}/analysis/${analysis.slug}`;
        const confidenceColor = analysis.prediction
          ? getConfidenceColor(analysis.prediction.confidence)
          : "#8b949e";

        return (
          <div key={analysis.id}>
            <Link href={href} style={{ textDecoration: "none", display: "block" }}>
              <div
                className="article-list-item"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "16px",
                  padding: "16px 12px",
                  borderRadius: "8px",
                  transition: "background-color 0.15s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = "#161b22";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
                }}
              >
                {/* Left: main content */}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  {/* Type badge */}
                  <span
                    style={{
                      display: "inline-block",
                      backgroundColor: isPreview ? "#1e3a5f" : "#2d1b4e",
                      color: isPreview ? "#60a5fa" : "#c084fc",
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: "3px",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      alignSelf: "flex-start",
                    }}
                  >
                    {isPreview
                      ? locale === "ko" ? "프리뷰" : "Preview"
                      : locale === "ko" ? "리캡" : "Recap"}
                  </span>

                  {/* Title */}
                  <h3
                    style={{
                      color: "#e6edf3",
                      fontSize: "15px",
                      fontWeight: 600,
                      lineHeight: "1.4",
                      margin: 0,
                    }}
                  >
                    {analysis.title}
                  </h3>

                  {/* Summary */}
                  <p
                    style={{
                      color: "#8b949e",
                      fontSize: "13px",
                      lineHeight: "1.5",
                      margin: 0,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {analysis.summary}
                  </p>

                  {/* Tips badges */}
                  {analysis.tips.length > 0 && (
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                      {analysis.tips.slice(0, 3).map((tip, i) => (
                        <span
                          key={i}
                          style={{
                            backgroundColor: "#2d1b4e",
                            color: "#c084fc",
                            fontSize: "11px",
                            fontWeight: 500,
                            padding: "2px 7px",
                            borderRadius: "4px",
                          }}
                        >
                          {locale === "ko" ? tip.labelKo : tip.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: confidence + meta */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "6px",
                    flexShrink: 0,
                    minWidth: "80px",
                  }}
                >
                  {/* Confidence percentage */}
                  {analysis.prediction && (
                    <>
                      <span
                        style={{
                          color: confidenceColor,
                          fontSize: "24px",
                          fontWeight: 800,
                          lineHeight: 1,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {analysis.prediction.confidence}%
                      </span>
                      <span
                        style={{
                          color: "#8b949e",
                          fontSize: "11px",
                          textAlign: "right",
                          lineHeight: "1.3",
                          maxWidth: "90px",
                        }}
                      >
                        {analysis.prediction.label}
                      </span>
                    </>
                  )}

                  {/* Generated time */}
                  <span style={{ color: "#8b949e", fontSize: "11px", marginTop: "4px" }}>
                    {formatDate(analysis.generatedAt, locale)}
                  </span>

                  {/* AI badge */}
                  {analysis.isAiGenerated && (
                    <span style={{ color: "#8b949e", fontSize: "10px" }}>🤖 AI</span>
                  )}
                </div>
              </div>
            </Link>

            {/* Divider */}
            {idx < filtered.length - 1 && (
              <div
                style={{
                  height: "1px",
                  backgroundColor: "#21262d",
                  margin: "0 12px",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
