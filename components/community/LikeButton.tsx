"use client";

import { useState } from "react";
import { togglePostLike } from "@/lib/community/actions";

interface LikeButtonProps {
  initialCount: number;
  initialLiked?: boolean;
  postId: string;
  locale: "ko" | "en";
  /** Pass false when user is not logged in — click redirects to login */
  isLoggedIn?: boolean;
  loginHref?: string;
  /** "upvote" = ▲ arrow style (post-level), "heart" = ❤️ style (per-comment) */
  variant?: "upvote" | "heart";
  size?: "sm" | "md";
}

export default function LikeButton({
  initialCount,
  initialLiked = false,
  postId,
  locale,
  isLoggedIn = false,
  loginHref,
  variant = "upvote",
  size = "md",
}: LikeButtonProps) {
  const [liked,   setLiked]   = useState(initialLiked);
  const [count,   setCount]   = useState(initialCount);
  const [pending, setPending] = useState(false);
  const isSm = size === "sm";

  async function handleClick() {
    if (!isLoggedIn) {
      if (loginHref) window.location.href = loginHref;
      return;
    }
    if (pending) return;

    if (variant === "upvote") {
      setPending(true);
      const prevLiked = liked;
      const prevCount = count;
      // Optimistic update
      setLiked(!prevLiked);
      setCount(prevLiked ? prevCount - 1 : prevCount + 1);
      const result = await togglePostLike(postId);
      if (result.error) {
        setLiked(prevLiked);
        setCount(prevCount);
      } else {
        setLiked(result.liked!);
        setCount(result.count!);
      }
      setPending(false);
    } else {
      // heart variant — client-only (comment likes not yet persisted)
      setLiked((prev) => {
        setCount((c) => (prev ? c - 1 : c + 1));
        return !prev;
      });
    }
  }

  const countLabel = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count;

  if (variant === "heart") {
    return (
      <button
        onClick={handleClick}
        aria-label={liked ? "Unlike" : "Like"}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          color: liked ? "#f87171" : "#8b949e",
          fontSize: isSm ? 11 : 12,
          padding: 0,
          transition: "color 0.15s",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: isSm ? 12 : 14, transition: "transform 0.15s", transform: liked ? "scale(1.2)" : "scale(1)", display: "inline-block" }}>
          {liked ? "❤️" : "🤍"}
        </span>
        {countLabel}
      </button>
    );
  }

  // upvote variant
  return (
    <button
      onClick={handleClick}
      disabled={pending}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: isSm ? 4 : 6,
        padding: isSm ? "5px 12px" : "8px 18px",
        borderRadius: 8,
        fontSize: isSm ? 12 : 13,
        fontWeight: 600,
        backgroundColor: liked ? "rgba(34,197,94,0.1)" : "transparent",
        color: liked ? "#22c55e" : "#8b949e",
        border: `1px solid ${liked ? "rgba(34,197,94,0.3)" : "#30363d"}`,
        cursor: pending ? "default" : "pointer",
        opacity: pending ? 0.7 : 1,
        transition: "all 0.15s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!liked && !pending) {
          e.currentTarget.style.color = "#c9d1d9";
          e.currentTarget.style.borderColor = "#484f58";
        }
      }}
      onMouseLeave={(e) => {
        if (!liked && !pending) {
          e.currentTarget.style.color = "#8b949e";
          e.currentTarget.style.borderColor = "#30363d";
        }
      }}
      aria-label={locale === "ko" ? "추천" : "Like"}
    >
      <span>▲</span>
      <span>{countLabel}</span>
      {!isSm && <span>{locale === "ko" ? "추천" : "Like"}</span>}
    </button>
  );
}
