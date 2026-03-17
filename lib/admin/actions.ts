"use server";

import { createClient } from "@/lib/supabase/server";
import { getServerUser } from "@/lib/auth";
import { getServerRole, canModerate, isAdmin } from "./roles";
import { revalidatePath } from "next/cache";

// ─── Internal guards ──────────────────────────────────────────────

async function assertModerator() {
  const role = await getServerRole();
  if (!canModerate(role)) throw new Error("Unauthorized");
}

async function assertAdmin() {
  const role = await getServerRole();
  if (!isAdmin(role)) throw new Error("Unauthorized");
}

// ─── Post moderation ──────────────────────────────────────────────

/** Soft-delete a post (sets deleted_at, deleted_by, delete_reason). */
export async function deletePostAsAdmin(
  postId: string,
  formData: FormData
): Promise<void> {
  try {
    await assertModerator();
    const user = await getServerUser();
    if (!user) return;

    const reason = (formData.get("reason") as string | null)?.trim() || null;
    const supabase = await createClient();

    await supabase
      .from("community_posts")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
        delete_reason: reason,
      } as any)
      .eq("id", postId);

    revalidatePath("/[locale]/admin/posts", "page");
    revalidatePath("/[locale]/community", "page");
  } catch {
    // Guard already logged
  }
}

/** Hide a post from public view without soft-deleting it. */
export async function hidePostAsAdmin(
  postId: string,
  formData: FormData
): Promise<void> {
  try {
    await assertModerator();
    const user = await getServerUser();
    if (!user) return;

    const reason = (formData.get("reason") as string | null)?.trim() || null;
    const supabase = await createClient();

    await supabase
      .from("community_posts")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({
        is_hidden: true,
        deleted_by: user.id,
        delete_reason: reason,
      } as any)
      .eq("id", postId);

    revalidatePath("/[locale]/admin/posts", "page");
    revalidatePath("/[locale]/community", "page");
  } catch {
    // Guard already logged
  }
}

/** Restore a post — clears deleted_at, is_hidden, and related fields. */
export async function restorePostAsAdmin(postId: string): Promise<void> {
  try {
    await assertModerator();
    const supabase = await createClient();

    await supabase
      .from("community_posts")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({
        deleted_at: null,
        deleted_by: null,
        delete_reason: null,
        is_hidden: false,
      } as any)
      .eq("id", postId);

    revalidatePath("/[locale]/admin/posts", "page");
    revalidatePath("/[locale]/community", "page");
  } catch {
    // Guard already logged
  }
}

// ─── Comment moderation ───────────────────────────────────────────

/** Soft-delete a comment. */
export async function deleteCommentAsAdmin(
  commentId: string,
  formData: FormData
): Promise<void> {
  try {
    await assertModerator();
    const user = await getServerUser();
    if (!user) return;

    const reason = (formData.get("reason") as string | null)?.trim() || null;
    const supabase = await createClient();

    await supabase
      .from("community_comments")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
        delete_reason: reason,
        is_deleted: true,
      } as any)
      .eq("id", commentId);

    revalidatePath("/[locale]/admin/comments", "page");
  } catch {
    // Guard already logged
  }
}

/** Hide a comment without soft-deleting it. */
export async function hideCommentAsAdmin(
  commentId: string,
  formData: FormData
): Promise<void> {
  try {
    await assertModerator();
    const user = await getServerUser();
    if (!user) return;

    const reason = (formData.get("reason") as string | null)?.trim() || null;
    const supabase = await createClient();

    await supabase
      .from("community_comments")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({
        is_hidden: true,
        deleted_by: user.id,
        delete_reason: reason,
      } as any)
      .eq("id", commentId);

    revalidatePath("/[locale]/admin/comments", "page");
  } catch {
    // Guard already logged
  }
}

/** Restore a comment — clears deletion and hidden state. */
export async function restoreCommentAsAdmin(commentId: string): Promise<void> {
  try {
    await assertModerator();
    const supabase = await createClient();

    await supabase
      .from("community_comments")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({
        deleted_at: null,
        deleted_by: null,
        delete_reason: null,
        is_hidden: false,
        is_deleted: false,
      } as any)
      .eq("id", commentId);

    revalidatePath("/[locale]/admin/comments", "page");
  } catch {
    // Guard already logged
  }
}

// ─── User management (admin only) ────────────────────────────────

/** Update a user's role. Only admins can call this. */
export async function updateUserRole(
  userId: string,
  formData: FormData
): Promise<void> {
  try {
    await assertAdmin();
    const role = formData.get("role") as string | null;
    if (!role || !["user", "moderator", "admin"].includes(role)) return;

    const supabase = await createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("profiles").update({ role } as any).eq("id", userId);

    revalidatePath("/[locale]/admin/users", "page");
  } catch {
    // Guard already logged
  }
}

/** Toggle the is_banned flag on a user. Only admins can call this. */
export async function toggleUserBan(
  userId: string,
  currentlyBanned: boolean
): Promise<void> {
  try {
    await assertAdmin();
    const supabase = await createClient();

    await supabase
      .from("profiles")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ is_banned: !currentlyBanned } as any)
      .eq("id", userId);

    revalidatePath("/[locale]/admin/users", "page");
  } catch {
    // Guard already logged
  }
}
