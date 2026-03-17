"use client";

import { useState } from "react";
import LikeButton from "@/components/community/LikeButton";
import ReportModal from "@/components/community/ReportModal";

interface PostActionsProps {
  postId: string;
  likeCount: number;
  isLikedByUser?: boolean;
  isLoggedIn: boolean;
  locale: "ko" | "en";
}

export default function PostActions({ postId, likeCount, isLikedByUser = false, isLoggedIn, locale }: PostActionsProps) {
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied]         = useState(false);
  const loginHref = `/${locale}/auth/login`;

  function handleBookmark() {
    if (!isLoggedIn) { window.location.href = loginHref; return; }
    setBookmarked((p) => !p);
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback — ignore
    }
  }

  const btn = {
    base: {
      display: "inline-flex" as const,
      alignItems: "center" as const,
      gap: 6,
      padding: "8px 18px",
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 600,
      backgroundColor: "transparent",
      border: "1px solid #30363d",
      cursor: "pointer",
      transition: "all 0.15s",
    },
  };

  return (
    <div
      style={{
        padding: "20px 28px",
        borderTop: "1px solid #21262d",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      {/* Left: Like + Bookmark */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <LikeButton
          initialCount={likeCount}
          initialLiked={isLikedByUser}
          postId={postId}
          locale={locale}
          isLoggedIn={isLoggedIn}
          loginHref={loginHref}
          variant="upvote"
          size="md"
        />

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          style={{
            ...btn.base,
            backgroundColor: bookmarked ? "rgba(245,158,11,0.1)" : "transparent",
            color: bookmarked ? "#f59e0b" : "#8b949e",
            borderColor: bookmarked ? "rgba(245,158,11,0.3)" : "#30363d",
          }}
          onMouseEnter={(e) => {
            if (!bookmarked) {
              e.currentTarget.style.color = "#c9d1d9";
              e.currentTarget.style.borderColor = "#484f58";
            }
          }}
          onMouseLeave={(e) => {
            if (!bookmarked) {
              e.currentTarget.style.color = "#8b949e";
              e.currentTarget.style.borderColor = "#30363d";
            }
          }}
        >
          {bookmarked ? "🔖" : "🔖"}{" "}
          {locale === "ko" ? (bookmarked ? "저장됨" : "저장") : (bookmarked ? "Saved" : "Save")}
        </button>
      </div>

      {/* Right: Share + Report */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={handleShare}
          style={{
            ...btn.base,
            backgroundColor: copied ? "rgba(34,197,94,0.1)" : "transparent",
            color: copied ? "#22c55e" : "#8b949e",
            borderColor: copied ? "rgba(34,197,94,0.3)" : "#30363d",
          }}
        >
          {copied ? "✓" : "🔗"}{" "}
          {locale === "ko" ? (copied ? "복사됨" : "공유") : (copied ? "Copied!" : "Share")}
        </button>

        <div style={{ ...btn.base, padding: 0, border: "none" }}>
          <ReportModal
            type="post"
            targetId={postId}
            locale={locale}
            isLoggedIn={isLoggedIn}
            loginHref={loginHref}
          />
        </div>
      </div>
    </div>
  );
}
