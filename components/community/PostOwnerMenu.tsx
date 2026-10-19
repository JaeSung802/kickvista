"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deletePost, type OwnPostError } from "@/lib/community/actions";

interface PostOwnerMenuProps {
  postId: string;
  category: string;
  locale: "ko" | "en";
}

const labels = {
  ko: {
    edit: "수정",
    delete: "삭제",
    deleting: "삭제 중...",
    confirm: "이 게시글을 삭제할까요?\n삭제한 글은 목록과 상세 화면에서 사라지며 직접 되돌릴 수 없습니다.",
    errors: {
      unauthenticated: "로그인이 필요합니다. 다시 로그인해 주세요.",
      forbidden: "이 게시글을 삭제할 권한이 없습니다.",
      not_found: "게시글을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.",
      invalid: "삭제에 실패했습니다. 다시 시도해 주세요.",
      unavailable: "지금은 게시글을 삭제할 수 없습니다. 잠시 후 다시 시도해 주세요.",
      failed: "삭제에 실패했습니다. 다시 시도해 주세요.",
    } satisfies Record<OwnPostError, string>,
  },
  en: {
    edit: "Edit",
    delete: "Delete",
    deleting: "Deleting...",
    confirm: "Delete this post?\nIt will disappear from the list and this page, and you can't undo it yourself.",
    errors: {
      unauthenticated: "Please sign in again.",
      forbidden: "You can't delete this post.",
      not_found: "This post wasn't found. It may already be deleted.",
      invalid: "Couldn't delete the post. Please try again.",
      unavailable: "Deleting posts isn't available right now. Please try again later.",
      failed: "Couldn't delete the post. Please try again.",
    } satisfies Record<OwnPostError, string>,
  },
};

/** Edit / delete controls, rendered only for the post's author. */
export default function PostOwnerMenu({ postId, category, locale }: PostOwnerMenuProps) {
  const tx = labels[locale];
  const router = useRouter();
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
      const result = await deletePost(postId);
      if (result.ok) {
        router.replace(`/${locale}/community?category=${encodeURIComponent(category)}`);
        router.refresh();
        return;
      }
      setError(tx.errors[result.error] ?? tx.errors.failed);
    } catch {
      setError(tx.errors.failed);
    }
    busyRef.current = false;
    setBusy(false);
  }

  return (
    <div className="flex flex-col items-end gap-1.5" data-testid="post-owner-menu">
      <div className="flex items-center gap-2">
        <a
          href={`/${locale}/community/post/${postId}/edit`}
          aria-disabled={busy}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 no-underline transition-colors hover:bg-gray-50 ${busy ? "pointer-events-none opacity-50" : ""}`}
        >
          ✏️ {tx.edit}
        </a>
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
            busy
              ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
              : "border-red-200 bg-white text-red-600 hover:bg-red-50"
          }`}
        >
          🗑 {busy ? tx.deleting : tx.delete}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-500 m-0 text-right">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}
