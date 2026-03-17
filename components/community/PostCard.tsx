"use client";

interface Category {
  labelEn: string;
  labelKo: string;
  color: string;
  bg: string;
  border: string;
}

export interface PostCardProps {
  href: string;
  title: string;
  preview: string;
  timeAgo: string;
  category: Category;
  isPinned?: boolean;
  isHot?: boolean;
  authorName: string;
  authorBadge: string;
  rankColor: string;
  upvotes: number;
  comments: number;
  views: number;
  isKo: boolean;
}

export default function PostCard({
  href, title, preview, timeAgo, category,
  isPinned, isHot, authorName, authorBadge,
  rankColor, upvotes, comments, views, isKo,
}: PostCardProps) {
  return (
    <a
      href={href}
      style={{
        display: "block",
        backgroundColor: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 10,
        padding: "18px 20px",
        textDecoration: "none",
        transition: "border-color 0.15s, background 0.15s",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(34,197,94,0.2)";
        e.currentTarget.style.background = "#1c2128";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#30363d";
        e.currentTarget.style.background = "#161b22";
      }}
    >
      {isPinned && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, backgroundColor: "#f59e0b" }} />
      )}

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {isPinned && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 4, padding: "2px 7px" }}>
              📌 {isKo ? "고정" : "PINNED"}
            </span>
          )}
          {isHot && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 4, padding: "2px 7px" }}>
              🔥 {isKo ? "인기" : "HOT"}
            </span>
          )}
          <span style={{ fontSize: 11, fontWeight: 600, color: category.color, backgroundColor: category.bg, border: `1px solid ${category.border}`, borderRadius: 5, padding: "3px 9px" }}>
            {isKo ? category.labelKo : category.labelEn}
          </span>
        </div>
        <span style={{ color: "#8b949e", fontSize: 11 }}>{timeAgo}</span>
      </div>

      <h3 style={{ color: "#e6edf3", fontSize: 15, fontWeight: 700, margin: "0 0 8px", lineHeight: 1.4 }}>
        {title}
      </h3>

      <p
        style={{
          color: "#8b949e", fontSize: 13, margin: "0 0 14px", lineHeight: 1.6,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as const, overflow: "hidden",
        }}
      >
        {preview}
      </p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 22, height: 22, borderRadius: "50%",
              backgroundColor: "#0d1117", border: `1.5px solid ${rankColor}`,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, flexShrink: 0,
            }}
          >
            {authorBadge}
          </span>
          <span style={{ color: "#c9d1d9", fontSize: 12, fontWeight: 500 }}>{authorName}</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ color: "#8b949e", fontSize: 12 }}>▲ {upvotes}</span>
          <span style={{ color: "#8b949e", fontSize: 12 }}>💬 {comments}</span>
          <span style={{ color: "#8b949e", fontSize: 12 }}>👁 {views.toLocaleString()}</span>
        </div>
      </div>
    </a>
  );
}
