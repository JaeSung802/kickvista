"use client";

import { useRef, useState } from "react";
import LikeButton from "@/components/community/LikeButton";
import ReportModal from "@/components/community/ReportModal";
import { createComment, createReply, deleteComment } from "@/lib/community/actions";
import type { CommentData, ReplyData, CommentRemoved, DeleteCommentError } from "@/lib/community/actions";

interface CommentSectionProps {
  postId: string;
  commentCount: number;
  locale: "ko" | "en";
  isLoggedIn?: boolean;
  userNickname?: string;
  userBadge?: string;
  initialComments?: CommentData[];
  /** Signed-in user's id: shows the delete button on their own comments. */
  currentUserId?: string | null;
}

const deleteLabels = {
  ko: {
    delete: "삭제",
    deleting: "삭제 중...",
    confirm: "이 댓글을 삭제할까요?\n삭제한 댓글은 되돌릴 수 없으며 '삭제된 댓글입니다'로 표시됩니다.",
    deleted: "삭제된 댓글입니다.",
    hidden: "숨겨진 댓글입니다.",
    errors: {
      unauthenticated: "로그인이 필요합니다. 다시 로그인해 주세요.",
      not_found: "댓글을 찾을 수 없습니다. 이미 삭제되었거나 숨겨졌을 수 있습니다.",
      unavailable: "지금은 댓글을 삭제할 수 없습니다. 잠시 후 다시 시도해 주세요.",
      failed: "댓글을 삭제하지 못했습니다. 다시 시도해 주세요.",
    } satisfies Record<DeleteCommentError, string>,
  },
  en: {
    delete: "Delete",
    deleting: "Deleting...",
    confirm: "Delete this comment?\nYou can't undo this; it will show as 'This comment was deleted.'",
    deleted: "This comment was deleted.",
    hidden: "This comment was hidden.",
    errors: {
      unauthenticated: "Please sign in again.",
      not_found: "This comment wasn't found. It may already be deleted or hidden.",
      unavailable: "Deleting comments isn't available right now. Please try again later.",
      failed: "Couldn't delete the comment. Please try again.",
    } satisfies Record<DeleteCommentError, string>,
  },
};

type OnDeleted = (commentId: string) => void;

/** Delete control for the author's own comment / reply (confirm, one request at a time). */
function DeleteCommentButton({ postId, commentId, locale, onDeleted }: { postId: string; commentId: string; locale: "ko" | "en"; onDeleted: OnDeleted }) {
  const tx = deleteLabels[locale];
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (busyRef.current) return;
    if (!window.confirm(tx.confirm)) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await deleteComment(postId, commentId);
      if (result.ok) { onDeleted(commentId); return; }
      setError(tx.errors[result.error] ?? tx.errors.failed);
    } catch {
      setError(tx.errors.failed);
    }
    busyRef.current = false;
    setBusy(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        data-testid="comment-delete"
        className={`text-xs font-medium transition-colors ${busy ? "text-gray-300 cursor-not-allowed" : "text-gray-400 hover:text-red-500"}`}
      >
        🗑 {busy ? tx.deleting : tx.delete}
      </button>
      {error && <span role="alert" className="text-xs text-red-500">{error}</span>}
    </>
  );
}

/** Placeholder for a deleted / hidden comment: no text, author or actions. */
function RemovedNote({ removed, locale, small }: { removed: CommentRemoved; locale: "ko" | "en"; small?: boolean }) {
  const tx = deleteLabels[locale];
  return (
    <p data-testid="comment-removed" className={`${small ? "text-xs" : "text-sm"} italic text-gray-400 m-0`}>
      {removed === "hidden" ? tx.hidden : tx.deleted}
    </p>
  );
}

const RANK_COLORS: Record<string, string> = {
  bronze:  "#cd7f32",
  silver:  "#c0c0c0",
  gold:    "#ffd700",
  diamond: "#a8d8f0",
  legend:  "#059669",
};

// ─── ReplyItem ────────────────────────────────────────────────────────────────

function ReplyItem({
  reply,
  postId,
  locale,
  isLoggedIn,
  loginHref,
  currentUserId,
  onDeleted,
}: {
  reply: ReplyData;
  postId: string;
  locale: "ko" | "en";
  isLoggedIn: boolean;
  loginHref: string;
  currentUserId?: string | null;
  onDeleted: OnDeleted;
}) {
  const rankColor = reply.author.rankColor ?? RANK_COLORS[reply.author.rankTier] ?? "#9ca3af";

  if (reply.removed) {
    return (
      <div className="flex gap-2.5 py-3 border-b border-gray-100 ml-11" data-comment-id={reply.id}>
        <div className="w-7 h-7 rounded-full bg-gray-100 shrink-0" />
        <div className="flex-1 min-w-0 flex items-center"><RemovedNote removed={reply.removed} locale={locale} small /></div>
      </div>
    );
  }

  const isMine = !!currentUserId && reply.author.id === currentUserId;

  return (
    <div className="flex gap-2.5 py-3 border-b border-gray-100 ml-11" data-comment-id={reply.id}>
      <div
        className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center text-sm shrink-0"
        style={{ border: `2px solid ${rankColor}` }}
      >
        {reply.author.rankBadge}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-semibold text-gray-900">{reply.author.nickname}</span>
          <span className="text-[11px] text-gray-400">{reply.timeAgo}</span>
        </div>
        <p className="text-sm text-gray-700 leading-snug mb-2">{reply.content}</p>
        <div className="flex items-center gap-3.5 flex-wrap">
          <LikeButton
            initialCount={reply.likeCount}
            postId={reply.id}
            locale={locale}
            isLoggedIn={isLoggedIn}
            loginHref={loginHref}
            variant="heart"
            size="sm"
          />
          {isMine && <DeleteCommentButton postId={postId} commentId={reply.id} locale={locale} onDeleted={onDeleted} />}
        </div>
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
  currentUserId,
  onDeleted,
}: {
  comment: CommentData;
  postId: string;
  locale: "ko" | "en";
  isLoggedIn: boolean;
  loginHref: string;
  onReplyAdded: (commentId: string, reply: ReplyData) => void;
  currentUserId?: string | null;
  onDeleted: OnDeleted;
}) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText]       = useState("");
  const [showReplies, setShowReplies]   = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [replyError, setReplyError]     = useState<string | null>(null);

  const rankColor = comment.author.rankColor ?? RANK_COLORS[comment.author.rankTier] ?? "#9ca3af";
  const replies   = comment.replies ?? [];
  const isMine    = !comment.removed && !!currentUserId && comment.author.id === currentUserId;

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

  const replyList = showReplies && replies.map((reply) => (
    <ReplyItem
      key={reply.id}
      reply={reply}
      postId={postId}
      locale={locale}
      isLoggedIn={isLoggedIn}
      loginHref={loginHref}
      currentUserId={currentUserId}
      onDeleted={onDeleted}
    />
  ));

  if (comment.removed) {
    // Keeps its place (and its replies) in the thread; no text, author or actions.
    return (
      <div className="border-b border-gray-100" data-comment-id={comment.id}>
        <div className="flex gap-3 py-4">
          <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
          <div className="flex-1 min-w-0 flex items-center gap-3 flex-wrap">
            <RemovedNote removed={comment.removed} locale={locale} />
            {replies.length > 0 && (
              <button onClick={() => setShowReplies((p) => !p)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                {showReplies
                  ? (locale === "ko" ? `▲ 답글 숨기기` : `▲ Hide replies`)
                  : (locale === "ko" ? `▼ 답글 ${replies.length}개` : `▼ ${replies.length} replies`)}
              </button>
            )}
          </div>
        </div>
        {replyList}
      </div>
    );
  }

  return (
    <div className="border-b border-gray-100" data-comment-id={comment.id}>
      {/* Main comment */}
      <div className="flex gap-3 py-4">
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-base shrink-0"
          style={{ border: `2px solid ${rankColor}` }}
        >
          {comment.author.rankBadge}
        </div>

        <div className="flex-1 min-w-0">
          {/* Author row */}
          <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
            <span className="text-sm font-bold text-gray-900">{comment.author.nickname}</span>
            <span
              className="text-[10px] font-bold rounded px-1.5 py-0.5 uppercase tracking-wide"
              style={{
                color: rankColor,
                backgroundColor: `${rankColor}1a`,
                border: `1px solid ${rankColor}40`,
              }}
            >
              {comment.author.rankTier}
            </span>
            <span className="text-xs text-gray-400">{comment.timeAgo}</span>
          </div>

          {/* Content */}
          <p className="text-sm text-gray-700 leading-relaxed mb-2.5">{comment.content}</p>

          {/* Actions */}
          <div className="flex items-center gap-3.5 flex-wrap">
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
              className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                showReplyBox ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"
              }`}
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
            {isMine && <DeleteCommentButton postId={postId} commentId={comment.id} locale={locale} onDeleted={onDeleted} />}
            {replies.length > 0 && (
              <button
                onClick={() => setShowReplies((p) => !p)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showReplies
                  ? (locale === "ko" ? `▲ 답글 숨기기` : `▲ Hide replies`)
                  : (locale === "ko" ? `▼ 답글 ${replies.length}개` : `▼ ${replies.length} replies`)}
              </button>
            )}
          </div>

          {/* Inline reply box */}
          {showReplyBox && (
            <div className="mt-3 p-3.5 bg-gray-50 border border-gray-200 rounded-lg">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={
                  locale === "ko"
                    ? `@${comment.author.nickname}에게 답글...`
                    : `Reply to @${comment.author.nickname}...`
                }
                rows={2}
                className="w-full bg-transparent border-none text-sm text-gray-900 placeholder-gray-400 resize-vertical outline-none leading-relaxed"
              />
              {replyError && (
                <p className="text-xs text-red-500 mt-1">{replyError}</p>
              )}
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => { setShowReplyBox(false); setReplyText(""); setReplyError(null); }}
                  className="text-xs font-semibold text-gray-500 border border-gray-200 rounded-md px-3.5 py-1.5 hover:bg-gray-100 transition-colors"
                >
                  {locale === "ko" ? "취소" : "Cancel"}
                </button>
                <button
                  onClick={handleReplySubmit}
                  disabled={!replyText.trim() || submitting}
                  className={`text-xs font-bold rounded-md px-3.5 py-1.5 transition-colors ${
                    replyText.trim() && !submitting
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
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
      {replyList}
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
  currentUserId = null,
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

  // A deleted comment keeps its place (and replies) as a placeholder; the
  // comment count does not change (it counts top-level comments in any state).
  function handleDeleted(commentId: string) {
    const strip = <T extends { id: string; content: string; removed?: CommentRemoved }>(c: T): T =>
      c.id === commentId ? { ...c, content: "", removed: "deleted" } : c;
    setComments((prev) => prev.map((c) => ({ ...strip(c), replies: (c.replies ?? []).map(strip) })));
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
    <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-base font-extrabold text-gray-900">
          {locale === "ko" ? `댓글 ${localCount}` : `Comments (${localCount})`}
        </h2>
        {/* Sort tabs */}
        <div className="flex gap-1 p-0.5 bg-white border border-gray-200 rounded-lg">
          {(["top", "newest"] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                sortBy === key
                  ? "bg-emerald-600 text-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {sortLabel[key]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6">
        {/* Comment input */}
        <div className="py-5 border-b border-gray-100">
          {isLoggedIn ? (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-50 border-2 border-emerald-500 flex items-center justify-center text-base shrink-0">
                {userBadge}
              </div>
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={locale === "ko" ? "댓글을 작성하세요..." : "Write a comment..."}
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-vertical px-3.5 py-2.5 leading-relaxed transition-colors"
                />
                {submitError && (
                  <p className="text-xs text-red-500 mt-1">{submitError}</p>
                )}
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleCommentSubmit}
                    disabled={!commentText.trim() || submitting}
                    className={`text-sm font-bold rounded-lg px-5 py-2 transition-all ${
                      commentText.trim() && !submitting
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {submitting
                      ? (locale === "ko" ? "작성 중..." : "Posting...")
                      : (locale === "ko" ? "댓글 작성" : "Post Comment")}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <p className="text-sm text-gray-500 leading-snug">
                  {locale === "ko"
                    ? "로그인하면 댓글을 작성하고 대화에 참여할 수 있습니다"
                    : "Sign in to join the conversation and leave your thoughts"}
                </p>
              </div>
              <a
                href={loginHref}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg no-underline transition-colors shrink-0"
              >
                {locale === "ko" ? "로그인" : "Sign In"}
              </a>
            </div>
          )}
        </div>

        {/* Comment list */}
        <div>
          {sortedComments.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-400">
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
                currentUserId={currentUserId}
                onDeleted={handleDeleted}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
