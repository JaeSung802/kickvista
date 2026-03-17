import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import {
  deleteCommentAsAdmin,
  hideCommentAsAdmin,
  restoreCommentAsAdmin,
} from "@/lib/admin/actions";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";
  return {
    title: isKo ? "댓글 관리 · KickVista" : "Comment Moderation · KickVista",
  };
}

type CommentStatus = "all" | "visible" | "hidden" | "deleted";

interface AdminComment {
  id: string;
  content: string;
  postId: string;
  postTitle: string;
  authorName: string;
  isHidden: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  deleteReason: string | null;
  createdAt: string;
}

const PAGE_SIZE = 40;

export default async function AdminCommentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const loc = locale as Locale;
  const isKo = loc === "ko";

  const { status = "all", page = "1" } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const statusFilter = status as CommentStatus;

  let comments: AdminComment[] = [];
  let total = 0;

  try {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase
      .from("community_comments")
      .select(
        `id, content, post_id, is_hidden, is_deleted, deleted_at, delete_reason, created_at,
         author:profiles!author_id(nickname),
         post:community_posts!post_id(id, title)`,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (statusFilter === "visible") {
      query = query.eq("is_hidden", false).eq("is_deleted", false).is("deleted_at", null);
    } else if (statusFilter === "hidden") {
      query = query.eq("is_hidden", true).is("deleted_at", null);
    } else if (statusFilter === "deleted") {
      query = query.not("deleted_at", "is", null);
    }

    query = query.range(offset, offset + PAGE_SIZE - 1);
    const { data, count } = await query;

    total = count ?? 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    comments = (data as any[] ?? []).map((row: any) => {
      const author = Array.isArray(row.author) ? row.author[0] : row.author;
      const post = Array.isArray(row.post) ? row.post[0] : row.post;
      return {
        id: row.id,
        content: row.content ?? "",
        postId: post?.id ?? row.post_id,
        postTitle: post?.title ?? "—",
        authorName: author?.nickname ?? "—",
        isHidden: row.is_hidden ?? false,
        isDeleted: row.is_deleted ?? false,
        deletedAt: row.deleted_at ?? null,
        deleteReason: row.delete_reason ?? null,
        createdAt: row.created_at,
      };
    });
  } catch {
    // Show empty state
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const baseUrl = `/${loc}/admin/comments`;

  function statusBadge(c: AdminComment) {
    if (c.deletedAt) {
      return (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 20,
            backgroundColor: "rgba(239,68,68,0.12)",
            color: "#ef4444",
            border: "1px solid rgba(239,68,68,0.25)",
            whiteSpace: "nowrap",
          }}
        >
          {isKo ? "삭제됨" : "Deleted"}
        </span>
      );
    }
    if (c.isHidden || c.isDeleted) {
      return (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 20,
            backgroundColor: "rgba(245,158,11,0.12)",
            color: "#f59e0b",
            border: "1px solid rgba(245,158,11,0.25)",
            whiteSpace: "nowrap",
          }}
        >
          {isKo ? "숨김" : "Hidden"}
        </span>
      );
    }
    return (
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          padding: "2px 8px",
          borderRadius: 20,
          backgroundColor: "rgba(34,197,94,0.12)",
          color: "#22c55e",
          border: "1px solid rgba(34,197,94,0.25)",
          whiteSpace: "nowrap",
        }}
      >
        {isKo ? "공개" : "Visible"}
      </span>
    );
  }

  const statusOptions: { value: CommentStatus; label: string }[] = [
    { value: "all", label: isKo ? "전체" : "All" },
    { value: "visible", label: isKo ? "공개" : "Visible" },
    { value: "hidden", label: isKo ? "숨김" : "Hidden" },
    { value: "deleted", label: isKo ? "삭제됨" : "Deleted" },
  ];

  return (
    <main style={{ background: "#0d1117", minHeight: "100vh" }}>
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid #21262d",
          background: "linear-gradient(180deg, #0f1923 0%, #0d1117 100%)",
          padding: "28px 0",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ width: 3, height: 22, borderRadius: 2, backgroundColor: "#22c55e", flexShrink: 0 }} />
            <h1 style={{ color: "#e6edf3", fontSize: 20, fontWeight: 900, margin: 0 }}>
              {isKo ? "댓글 관리" : "Comment Moderation"}
            </h1>
            <span style={{ color: "#8b949e", fontSize: 13, marginLeft: 4 }}>
              ({total.toLocaleString()})
            </span>
          </div>

          {/* Filter */}
          <form
            method="GET"
            action={baseUrl}
            style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}
          >
            <select
              name="status"
              defaultValue={statusFilter}
              style={{
                background: "#161b22",
                border: "1px solid #30363d",
                borderRadius: 7,
                color: "#e6edf3",
                fontSize: 13,
                padding: "7px 12px",
                cursor: "pointer",
              }}
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              style={{
                background: "#22c55e",
                color: "#0d1117",
                border: "none",
                borderRadius: 7,
                padding: "7px 16px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {isKo ? "필터" : "Filter"}
            </button>
            {statusFilter !== "all" && (
              <a
                href={baseUrl}
                style={{ color: "#8b949e", fontSize: 13, textDecoration: "none" }}
              >
                {isKo ? "초기화" : "Reset"}
              </a>
            )}
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {comments.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#8b949e",
              padding: "60px 0",
              fontSize: 14,
            }}
          >
            {isKo ? "댓글이 없습니다." : "No comments found."}
          </div>
        ) : (
          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.2fr 90px 80px 190px",
                gap: 8,
                padding: "10px 16px",
                borderBottom: "1px solid #21262d",
                fontSize: 11,
                fontWeight: 700,
                color: "#484f58",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <span>{isKo ? "내용" : "Content"}</span>
              <span>{isKo ? "게시글" : "Post"}</span>
              <span>{isKo ? "작성자" : "Author"}</span>
              <span>{isKo ? "상태" : "Status"}</span>
              <span>{isKo ? "액션" : "Actions"}</span>
            </div>

            {/* Rows */}
            {comments.map((c) => {
              const deleteAction = deleteCommentAsAdmin.bind(null, c.id);
              const hideAction = hideCommentAsAdmin.bind(null, c.id);
              const restoreAction = restoreCommentAsAdmin.bind(null, c.id);
              const isModerated = c.deletedAt !== null || c.isHidden || c.isDeleted;

              return (
                <div
                  key={c.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1.2fr 90px 80px 190px",
                    gap: 8,
                    padding: "12px 16px",
                    borderBottom: "1px solid #21262d",
                    alignItems: "start",
                    opacity: c.deletedAt ? 0.55 : 1,
                  }}
                >
                  {/* Content */}
                  <div>
                    <p
                      style={{
                        color: "#e6edf3",
                        fontSize: 13,
                        margin: 0,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {c.content}
                    </p>
                    {c.deleteReason && (
                      <span style={{ color: "#8b949e", fontSize: 11, display: "block", marginTop: 3 }}>
                        {isKo ? "사유: " : "Reason: "}{c.deleteReason}
                      </span>
                    )}
                    <div style={{ color: "#484f58", fontSize: 11, marginTop: 3 }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Post link */}
                  <div style={{ paddingTop: 2 }}>
                    <a
                      href={`/${loc}/community/post/${c.postId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#3b82f6",
                        fontSize: 12,
                        textDecoration: "none",
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.postTitle}
                    </a>
                  </div>

                  {/* Author */}
                  <div style={{ color: "#8b949e", fontSize: 12, paddingTop: 2 }}>
                    {c.authorName}
                  </div>

                  {/* Status */}
                  <div style={{ paddingTop: 2 }}>{statusBadge(c)}</div>

                  {/* Actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {isModerated ? (
                      <form action={restoreAction}>
                        <button
                          type="submit"
                          style={{
                            width: "100%",
                            background: "rgba(34,197,94,0.1)",
                            color: "#22c55e",
                            border: "1px solid rgba(34,197,94,0.25)",
                            borderRadius: 6,
                            padding: "5px 10px",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {isKo ? "복원" : "Restore"}
                        </button>
                      </form>
                    ) : (
                      <>
                        <form action={hideAction} style={{ display: "flex", gap: 4 }}>
                          <input
                            name="reason"
                            placeholder={isKo ? "사유 (선택)" : "Reason (opt.)"}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              background: "#0d1117",
                              border: "1px solid #30363d",
                              borderRadius: 5,
                              color: "#e6edf3",
                              fontSize: 11,
                              padding: "4px 7px",
                            }}
                          />
                          <button
                            type="submit"
                            style={{
                              background: "rgba(245,158,11,0.1)",
                              color: "#f59e0b",
                              border: "1px solid rgba(245,158,11,0.25)",
                              borderRadius: 5,
                              padding: "4px 8px",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {isKo ? "숨김" : "Hide"}
                          </button>
                        </form>

                        <form action={deleteAction} style={{ display: "flex", gap: 4 }}>
                          <input
                            name="reason"
                            placeholder={isKo ? "사유 (선택)" : "Reason (opt.)"}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              background: "#0d1117",
                              border: "1px solid #30363d",
                              borderRadius: 5,
                              color: "#e6edf3",
                              fontSize: 11,
                              padding: "4px 7px",
                            }}
                          />
                          <button
                            type="submit"
                            style={{
                              background: "rgba(239,68,68,0.1)",
                              color: "#ef4444",
                              border: "1px solid rgba(239,68,68,0.25)",
                              borderRadius: 5,
                              padding: "4px 8px",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {isKo ? "삭제" : "Delete"}
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              marginTop: 24,
              flexWrap: "wrap",
            }}
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`${baseUrl}?status=${statusFilter}&page=${p}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 34,
                  height: 34,
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: p === currentPage ? 700 : 400,
                  backgroundColor:
                    p === currentPage ? "#22c55e" : "#161b22",
                  color: p === currentPage ? "#0d1117" : "#8b949e",
                  border: "1px solid #30363d",
                  textDecoration: "none",
                }}
              >
                {p}
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
