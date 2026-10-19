import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { getServerUser, getServerProfile } from "@/lib/auth";
import { getServerRole, isAdmin as checkIsAdmin } from "@/lib/admin/roles";
import { getEditablePost } from "@/lib/community/actions";
import WritePostForm from "@/components/community/WritePostForm";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};
  const isKo = locale === "ko";
  return {
    title: isKo ? "게시글 수정 · KickVista" : "Edit Post · KickVista",
    robots: { index: false, follow: false },
  };
}

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isValidLocale(locale)) notFound();
  const loc  = locale as Locale;
  const isKo = loc === "ko";
  const postHref = `/${loc}/community/post/${id}`;

  const user = await getServerUser();
  const editable = user ? await getEditablePost(id) : null;
  if (editable?.error === "not_found") notFound();

  let form: ReactNode = null;
  if (user && editable?.post) {
    const [profileR, roleR] = await Promise.allSettled([getServerProfile(user.id), getServerRole()]);
    const profile = profileR.status === "fulfilled" ? profileR.value : null;
    const role    = roleR.status    === "fulfilled" ? roleR.value    : null;
    form = (
      <WritePostForm
        locale={loc}
        userNickname={profile?.nickname ?? user.email?.split("@")[0] ?? "fan"}
        userBadge="🥉"
        backHref={postHref}
        isAdmin={checkIsAdmin(role)}
        editPost={editable.post}
      />
    );
  }

  const gate = !user
    ? {
        icon: "🔒",
        title: isKo ? "로그인이 필요합니다" : "Sign in to edit this post",
        body: isKo ? "게시글을 수정하려면 작성한 계정으로 로그인하세요." : "Sign in with the account that wrote this post.",
        href: `/${loc}/auth/login`,
        cta: isKo ? "로그인" : "Sign In",
      }
    : !form
      ? {
          icon: "⛔",
          title: isKo ? "수정할 수 없는 게시글입니다" : "You can't edit this post",
          body: editable?.error === "forbidden"
            ? (isKo ? "작성자 본인만 게시글을 수정할 수 있습니다." : "Only the author can edit this post.")
            : (isKo ? "게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." : "Couldn't load the post. Please try again in a moment."),
          href: postHref,
          cta: isKo ? "게시글로 돌아가기" : "Back to the post",
        }
      : null;

  return (
    <main className="min-h-screen">
      <div style={{ borderBottom: "1px solid #f3f4f6", backgroundColor: "#ffffff" }} className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 14, flexWrap: "wrap" }}>
            <a href={`/${loc}/community`} style={{ color: "#6b7280", textDecoration: "none" }}>
              {isKo ? "커뮤니티" : "Community"}
            </a>
            <span style={{ color: "#d1d5db" }}>›</span>
            <a href={postHref} style={{ color: "#6b7280", textDecoration: "none" }}>
              {isKo ? "게시글" : "Post"}
            </a>
            <span style={{ color: "#d1d5db" }}>›</span>
            <span style={{ color: "#111827" }}>{isKo ? "수정" : "Edit"}</span>
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 3, height: 24, borderRadius: 2, backgroundColor: "#059669", flexShrink: 0 }} />
            <h1 style={{ color: "#111827", fontSize: 24, fontWeight: 900, margin: 0 }}>
              {isKo ? "게시글 수정" : "Edit Post"}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {gate ? (
          <div
            style={{
              maxWidth: 480, margin: "0 auto", backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb", borderRadius: 14, padding: "40px 32px", textAlign: "center",
            }}
          >
            <span style={{ fontSize: 40, display: "block", marginBottom: 14 }}>{gate.icon}</span>
            <h2 style={{ color: "#111827", fontSize: 19, fontWeight: 800, margin: "0 0 10px" }}>{gate.title}</h2>
            <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 22px", lineHeight: 1.6 }}>{gate.body}</p>
            <a
              href={gate.href}
              style={{
                display: "inline-block", padding: "10px 24px", backgroundColor: "#059669", color: "#ffffff",
                fontSize: 14, fontWeight: 700, borderRadius: 8, textDecoration: "none",
              }}
            >
              {gate.cta}
            </a>
          </div>
        ) : (
          form
        )}
      </div>
    </main>
  );
}
