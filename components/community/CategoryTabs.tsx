"use client";

type PostCategory =
  | "match-discussion"
  | "transfer-news"
  | "tactics"
  | "highlights"
  | "predictions"
  | "general";

type CategoryOrAll = PostCategory | "all";

interface CategoryTabsProps {
  selected: CategoryOrAll;
  onChange: (cat: CategoryOrAll) => void;
  locale: "ko" | "en";
  counts?: Record<string, number>;
}

interface TabDef {
  key: CategoryOrAll;
  label: string;
  labelKo: string;
}

const TABS: TabDef[] = [
  { key: "all",              label: "All",              labelKo: "전체" },
  { key: "match-discussion", label: "Match Discussion", labelKo: "경기 토론" },
  { key: "transfer-news",    label: "Transfer News",    labelKo: "이적 소식" },
  { key: "tactics",          label: "Tactics",          labelKo: "전술 분석" },
  { key: "highlights",       label: "Highlights",       labelKo: "하이라이트" },
  { key: "predictions",      label: "Predictions",      labelKo: "예측" },
  { key: "general",          label: "General",          labelKo: "자유 게시판" },
];

export default function CategoryTabs({ selected, onChange, locale, counts }: CategoryTabsProps) {
  return (
    <div
      style={{
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "6px",
          padding: "2px 2px 8px 2px",
          minWidth: "max-content",
        }}
      >
        {TABS.map((tab) => {
          const isActive = selected === tab.key;
          const count = counts?.[tab.key];
          const displayLabel = locale === "ko" ? tab.labelKo : tab.label;

          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 14px",
                borderRadius: "20px",
                border: isActive ? "1px solid #22c55e" : "1px solid #30363d",
                backgroundColor: isActive ? "#22c55e" : "#161b22",
                color: isActive ? "#0d1117" : "#8b949e",
                fontSize: "13px",
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
                outline: "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#22c55e66";
                  (e.currentTarget as HTMLButtonElement).style.color = "#e6edf3";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#30363d";
                  (e.currentTarget as HTMLButtonElement).style.color = "#8b949e";
                }
              }}
            >
              {displayLabel}
              {count !== undefined && (
                <span
                  style={{
                    backgroundColor: isActive ? "#0d1117" : "#0d1117",
                    color: isActive ? "#22c55e" : "#8b949e",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: "10px",
                    minWidth: "18px",
                    textAlign: "center",
                    lineHeight: "1.6",
                  }}
                >
                  {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
