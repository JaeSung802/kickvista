"use server";

import { createClient } from "@/lib/supabase/server";
import { getServerUser } from "@/lib/auth";
import { getServerRole, canModerate } from "@/lib/admin/roles";
import { revalidatePath } from "next/cache";

export type ReportReason =
  | "spam"
  | "harassment"
  | "misinformation"
  | "hate_speech"
  | "illegal"
  | "other";

export type ReportStatus = "open" | "reviewed" | "dismissed" | "actioned";

export type CreateReportResult =
  | { success: true; error?: never }
  | { error: string; success?: never };

// ─── createPostReport ─────────────────────────────────────────────

export async function createPostReport(
  postId: string,
  reason: ReportReason,
  details: string | null
): Promise<CreateReportResult> {
  const user = await getServerUser();
  if (!user) return { error: "unauthenticated" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("community_post_reports")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ reporter_id: user.id, post_id: postId, reason, details: details || null } as any);

  if (error) {
    // Unique constraint: user already reported this post
    if (error.code === "23505") return { error: "already_reported" };
    return { error: error.message };
  }

  return { success: true };
}

// ─── createCommentReport ──────────────────────────────────────────

export async function createCommentReport(
  commentId: string,
  reason: ReportReason,
  details: string | null
): Promise<CreateReportResult> {
  const user = await getServerUser();
  if (!user) return { error: "unauthenticated" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("community_comment_reports")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ reporter_id: user.id, comment_id: commentId, reason, details: details || null } as any);

  if (error) {
    if (error.code === "23505") return { error: "already_reported" };
    return { error: error.message };
  }

  return { success: true };
}

// ─── updateReportStatus ───────────────────────────────────────────

export async function updateReportStatus(
  reportId: string,
  reportType: "post" | "comment",
  status: ReportStatus
): Promise<void> {
  const role = await getServerRole();
  if (!canModerate(role)) return;

  const user = await getServerUser();
  if (!user) return;

  const table =
    reportType === "post"
      ? "community_post_reports"
      : "community_comment_reports";

  const supabase = await createClient();

  await supabase
    .from(table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    } as any)
    .eq("id", reportId);

  revalidatePath("/[locale]/admin/reports", "page");
}
