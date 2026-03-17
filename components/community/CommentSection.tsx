"use client";

import { useState } from "react";
import LikeButton from "@/components/community/LikeButton";
import ReportModal from "@/components/community/ReportModal";
import { createComment, createReply } from "@/lib/community/actions";
import type { CommentData, ReplyData } from "@/lib/community/actions";

interface CommentSectionProps {
  postId: string;
  commentCount: number;
  locale: "ko" | "en";
  isLoggedIn?: boolean;
  userNickname?: string;
  userBadge?: string;
  initialComments?: CommentData[];
}

const RANK_COLORS: Record<string, string> = {
  bronze:  "#cd7f32",
  silver:  "#c0c0c0",
  gold:    "#ffd700",
  diamond: "#a8d8f0",
  legend:  "#22c55e",
};

// ─── ReplyItem ────────────────────────────────────────────────────────────────

function ReplyItem({
  reply,
  locale,
  isLoggedIn,
  loginHref,
}: {
  reply: ReplyData;
  locale: "ko" | "en";
  isLoggedIn: boolean;
  loginHref: string;
}) {
  const rankColor = reply.author.rankColor ?? RANK_COLORS[reply.author.rankTier] ?? "#8b949e";

  return (
    <div
      style={{
        display: "flex", gap: 10,
        padding: "12px 0", borderBottom: "1px solid #21262d",
        marginLeft: 44,
      }}
    >
      <div
        style={{
          width: 28, height: 28, borderRadius: "50%",
          backgroundColor: "#0d1117", border: `2px solid ${rankColor}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, flexShrink: 0,
        }}
      >
        {reply.author.rankBadge}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
          <span style={{ color: "#e6edf3", fontSize: 12, fontWeight: 600 }}>{reply.author.nickname}</span>
          <span style={{ color: "#484f58", fontSize: 11 }}>{reply.timeAgo}</span>
        </div>
        <p style={{ color: "#c9d1d9", fontSize: 13, lineHeight: 1.55, margin: "0 0 8px" }}>
          {reply.content}
        </p>
        <LikeButton
          initialCount={reply.likeCount}
          postId={reply.id}
          locale={locale}
          isLoggedIn={isLoggedIn}
          loginHref={loginHref}
          variant="heart"
          size="sm"
        />
      </div>
    </div>
  );
}

// ─── CommentItem ──────────────────────────────────────────────────────────────

function CommentItem({
  comment,
  postId,
  locale,
  isLoggedIn,
  loginHref,
  onReplyAdded,
}: {
  comment: CommentData;
  postId: string;
  locale: "ko" | "en";
  isLoggedIn: boolean;
  loginHref: string;
  onReplyAdded: (commentId: string, reply: ReplyData) => void;
}) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText]       = useState("");
  const [showReplies, setShowReplies]   = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [replyError, setReplyError]     = useState<string | null>(null);

  const rankColor = comment.author.rankColor ?? RANK_COLORS[comment.author.rankTier] ?? "#8b949e";
  const replies   = comment.replies ?? [];

  async function handleReplySubmit() {
    const text = replyText.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    setReplyError(null);

    const result = await createReply(postId, comment.id, text);
    setSubmitting(false);

    if (result.error) {
      setReplyError(locale === "ko" ? "답글 작성에 실패했습니다." : "Failed to post reply.");
      return;
    }

    onReplyAdded(comment.id, result.reply!);
    setReplyText("");
    setShowReplyBox(false);
    setShowReplies(true);
  }

  return (
    <div style={{ borderBottom: "1px solid #21262d" }}>
      {/* Main comment */}
      <div style={{ display: "flex", gap: 12, padding: "16px 0" }}>
        {/* Avatar */}
        <div
          style={{
            width: 36, height: 36, borderRadius: "50%",
            backgroundColor: "#0d1117", border: `2px solid ${rankColor}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, flexShrink: 0,
          }}
        >
          {comment.author.rankBadge}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Author row */}
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
            <span style={{ color: "#e6edf3", fontSize: 13, fontWeight: 700 }}>
              {comment.author.nickname}
            </span>
            <span
              style={{
                fontSize: 10, fontWeight: 700, color: rankColor,
                backgroundColor: `${rankColor}1a`, border: `1px solid ${rankColor}40`,
                borderRadius: 4, padding: "1px 6px",
                textTransform: "uppercase", letterSpacing: "0.04em",
              }}
            >
              {comment.author.rankTier}
            </span>
            <span style={{ color: "#484f58", fontSize: 11 }}>{comment.timeAgo}</span>
          </div>

          {/* Content */}
          <p style={{ color: "#c9d1d9", fontSize: 14, lineHeight: 1.65, margin: "0 0 10px" }}>
            {comment.content}
          </p>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <LikeButton
              initialCount={comment.likeCount}
              postId={comment.id}
              locale={locale}
              isLoggedIn={isLoggedIn}
              loginHref={loginHref}
              variant="heart"
              size="sm"
            />
            <button
              onClick={() => {
                if (!isLoggedIn) { window.location.href = loginHref; return; }
                setShowReplyBox((p) => !p);
              }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: showReplyBox ? "#22c55e" : "#8b949e",
                fontSize: 12, padding: 0,
                display: "flex", alignItems: "center", gap: 4,
                transition: "color 0.15s",
              }}
            >
              💬 {locale === "ko" ? "답글" : "Reply"}
            </button>
            <ReportModal
              type="comment"
              targetId={comment.id}
              locale={locale}
              isLoggedIn={isLoggedIn}
              loginHref={loginHref}
            />
            {replies.length > 0 && (
              <button
                onClick={() => setShowReplies((p) => !p)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#8b949e", fontSize: 12, padding: 0,
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                {showReplies
                  ? (locale === "ko" ? `▲ 답글 숨기기` : `▲ Hide replies`)
                  : (locale === "ko" ? `▼ 답글 ${replies.length}개` : `▼ ${replies.length} replies`)}
              </button>
            )}
          </div>

          {/* Inline reply box */}
          {showReplyBox && (
            <div
              style={{
                marginTop: 12, padding: "12px 14px",
                backgroundColor: "#0d1117",
                border: "1px solid #30363d", borderRadius: 8,
              }}
            >
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={
                  locale === "ko"
                    ? `@${comment.author.nickname}에게 답글...`
                    : `Reply to @${comment.author.nickname}...`
                }
                rows={2}
                style={{
                  width: "100%", background: "transparent", border: "none",
                  color: "#e6edf3", fontSize: 13, resize: "vertical",
                  outline: "none", fontFamily: "inherit", lineHeight: 1.5,
                  boxSizing: "border-box",
                }}
              />
              {replyError && (
                <p style={{ color: "#ef4444", fontSize: 11, margin: "4px 0 0" }}>{replyError}</p>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => { setShowReplyBox(false); setReplyText(""); setReplyError(null); }}
                  style={{
                    background: "transparent", border: "1px solid #30363d",
                    borderRadius: 6, color: "#8b949e", fontSize: 12,
                    fontWeight: 600, padding: "5px 14px", cursor: "pointer",
                  }}
                >
                  {locale === "ko" ? "취소" : "Cancel"}
                </button>
                <button
                  onClick={handleReplySubmit}
                  disabled={!replyText.trim() || submitting}
                  style={{
                    backgroundColor: replyText.trim() && !submitting ? "#22c55e" : "#21262d",
                    color: replyText.trim() && !submitting ? "#0d1117" : "#8b949e",
                    border: "none", borderRadius: 6, fontSize: 12,
                    fontWeight: 700, padding: "5px 14px",
                    cursor: replyText.trim() && !submitting ? "pointer" : "default",
                  }}
                >
                  {submitting
                    ? (locale === "ko" ? "작성 중..." : "Posting...")
                    : (locale === "ko" ? "답글 작성" : "Reply")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {showReplies && replies.map((reply) => (
        <ReplyItem
          key={reply.id}
          reply={reply}
          locale={locale}
          isLoggedIn={isLoggedIn}
          loginHref={loginHref}
        />
      ))}
    </div>
  );
}

// ─── CommentSection ───────────────────────────────────────────────────────────

type SortKey = "top" | "newest";

export default function CommentSection({
  postId,
  commentCount,
  locale,
  isLoggedIn = false,
  userBadge = "🥉",
  initialComments = [],
}: CommentSectionProps) {
  const [sortBy, setSortBy]           = useState<SortKey>("top");
  const [commentText, setCommentText] = useState("");
  const [comments, setComments]       = useState<CommentData[]>(initialComments);
  const [localCount, setLocalCount]   = useState(commentCount);
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const loginHref = `/${locale}/auth/login`;

  async function handleCommentSubmit() {
    const text = commentText.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const result = await createComment(postId, text);
    setSubmitting(false);

    if (result.error) {
      setSubmitError(locale === "ko" ? "댓글 작성에 실패했습니다." : "Failed to post comment.");
      return;
    }

    setComments((prev) => [result.comment!, ...prev]);
    setLocalCount((c) => c + 1);
    setCommentText("");
  }

  function handleReplyAdded(commentId: string, reply: ReplyData) {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, replies: [...(c.replies ?? []), reply] }
          : c
      )
    );
  }

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === "top")    return b.likeCount - a.likeCount;
    if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return 0;
  });

  const sortLabel = {
    en: { top: "Top", newest: "Newest" },
    ko: { top: "추천순", newest: "최신순" },
  }[locale];

  return (
    <section
      style={{
        backgroundColor: "#161b22",
        border: "1px solid #30363d",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid #21262d",
          backgroundColor: "#0d1117",
        }}
      >
        <h2 style={{ color: "#e6edf3", fontSize: 16, fontWeight: 800, margin: 0 }}>
          {locale === "ko" ? `댓글 ${localCount}` : `Comments (${localCount})`}
        </h2>
        {/* Sort tabs */}
        <div
          style={{
            display: "flex", gap: 4, padding: "3px 4px",
            backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: 8,
          }}
        >
          {(["top", "newest"] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              style={{
                padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                border: "none", cursor: "pointer",
                backgroundColor: sortBy === key ? "#22c55e" : "transparent",
                color: sortBy === key ? "#0d1117" : "#8b949e",
                transition: "all 0.15s",
              }}
            >
              {sortLabel[key]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 24px" }}>
        {/* Comment input */}
        <div style={{ padding: "20px 0", borderBottom: "1px solid #21262d" }}>
          {isLoggedIn ? (
            <div style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  width: 36, height: 36, borderRadius: "50%",
                  backgroundColor: "#0d1117", border: "2px solid #22c55e",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, flexShrink: 0,
                }}
              >
                {userBadge}
              </div>
              <div style={{ flex: 1 }}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={locale === "ko" ? "댓글을 작성하세요..." : "Write a comment..."}
                  rows={3}
                  style={{
                    width: "100%", backgroundColor: "#0d1117",
                    border: "1px solid #30363d", borderRadius: 8,
                    color: "#e6edf3", fontSize: 14,
                    resize: "vertical", outline: "none",
                    fontFamily: "inherit", lineHeight: 1.55,
                    padding: "10px 14px", boxSizing: "border-box",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.4)"; }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = "#30363d"; }}
                />
                {submitError && (
                  <p style={{ color: "#ef4444", fontSize: 12, margin: "4px 0 0" }}>{submitError}</p>
                )}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <button
                    onClick={handleCommentSubmit}
                    disabled={!commentText.trim() || submitting}
                    style={{
                      backgroundColor: commentText.trim() && !submitting ? "#22c55e" : "#21262d",
                      color: commentText.trim() && !submitting ? "#0d1117" : "#8b949e",
                      border: "none", borderRadius: 8, fontSize: 13,
                      fontWeight: 700, padding: "8px 20px",
                      cursor: commentText.trim() && !submitting ? "pointer" : "default",
                      transition: "all 0.15s",
                    }}
                  >
                    {submitting
                      ? (locale === "ko" ? "작성 중..." : "Posting...")
                      : (locale === "ko" ? "댓글 작성" : "Post Comment")}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                backgroundColor: "#0d1117", border: "1px solid #30363d",
                borderRadius: 10, padding: "14px 18px", gap: 12, flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 24 }}>💬</span>
                <p style={{ color: "#8b949e", fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                  {locale === "ko"
                    ? "로그인하면 댓글을 작성하고 대화에 참여할 수 있습니다"
                    : "Sign in to join the conversation and leave your thoughts"}
                </p>
              </div>
              <a
                href={loginHref}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 18px", backgroundColor: "#22c55e",
                  color: "#0d1117", fontSize: 13, fontWeight: 700,
                  borderRadius: 8, textDecoration: "none", flexShrink: 0,
                }}
              >
                {locale === "ko" ? "로그인" : "Sign In"}
              </a>
            </div>
          )}
        </div>

        {/* Comment list */}
        <div>
          {sortedComments.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center" }}>
              <p style={{ color: "#484f58", fontSize: 14, margin: 0 }}>
                {locale === "ko" ? "첫 댓글을 남겨보세요!" : "Be the first to comment!"}
              </p>
            </div>
          ) : (
            sortedComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={postId}
                locale={locale}
                isLoggedIn={isLoggedIn}
                loginHref={loginHref}
                onReplyAdded={handleReplyAdded}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
