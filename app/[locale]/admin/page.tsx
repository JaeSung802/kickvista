import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === "ko";
  return {
    title: isKo ? "관리자 대시보드 · KickVista" : "Admin Dashboard · KickVista",
  };
}

interface StatCard {
  label: string;
  value: number;
  color: string;
  icon: string;
}

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const loc = locale as Locale;
  const isKo = loc === "ko";

  // Fetch stats (Supabase client inherits the admin session from cookies)
  let stats = {
    totalPosts: 0,
    totalComments: 0,
    hiddenPosts: 0,
    hiddenComments: 0,
    deletedPosts: 0,
    deletedComments: 0,
    totalUsers: 0,
    totalModerators: 0,
    totalAdmins: 0,
  };

  try {
    const supabase = await createClient();

    async function count(
      table: string,
      filter?: (q: ReturnType<typeof supabase.from>) => ReturnType<typeof supabase.from>
    ): Promise<number> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q: any = (supabase as any).from(table).select("*", { count: "exact", head: true });
      if (filter) q = filter(q);
      const { count: c } = await q;
      return c ?? 0;
    }

    const [
      totalPosts, totalComments,
      hiddenPosts, hiddenComments,
      deletedPosts, deletedComments,
      totalUsers, totalModerators, totalAdmins,
    ] = await Promise.all([
      count("community_posts"),
      count("community_comments"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      count("community_posts",    (q: any) => q.eq("is_hidden", true)),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      count("community_comments", (q: any) => q.eq("is_hidden", true)),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      count("community_posts",    (q: any) => q.not("deleted_at", "is", null)),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      count("community_comments", (q: any) => q.not("deleted_at", "is", null)),
      count("profiles"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      count("profiles", (q: any) => q.eq("role", "moderator")),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      count("profiles", (q: any) => q.eq("role", "admin")),
    ]);

    stats = {
      totalPosts, totalComments,
      hiddenPosts, hiddenComments,
      deletedPosts, deletedComments,
      totalUsers, totalModerators, totalAdmins,
    };
  } catch {
    // Non-fatal — show zeros
  }

  const statCards: StatCard[] = [
    {
      label: isKo ? "전체 게시글" : "Total Posts",
      value: stats.totalPosts,
      color: "#3b82f6",
      icon: "📝",
    },
    {
      label: isKo ? "전체 댓글" : "Total Comments",
      value: stats.totalComments,
      color: "#3b82f6",
      icon: "💬",
    },
    {
      label: isKo ? "숨김 게시글" : "Hidden Posts",
      value: stats.hiddenPosts,
      color: "#f59e0b",
      icon: "🙈",
    },
    {
      label: isKo ? "숨김 댓글" : "Hidden Comments",
      value: stats.hiddenComments,
      color: "#f59e0b",
      icon: "🙈",
    },
    {
      label: isKo ? "삭제된 게시글" : "Deleted Posts",
      value: stats.deletedPosts,
      color: "#ef4444",
      icon: "🗑️",
    },
    {
      label: isKo ? "삭제된 댓글" : "Deleted Comments",
      value: stats.deletedComments,
      color: "#ef4444",
      icon: "🗑️",
    },
    {
      label: isKo ? "전체 사용자" : "Total Users",
      value: stats.totalUsers,
      color: "#059669",
      icon: "👥",
    },
    {
      label: isKo ? "모더레이터" : "Moderators",
      value: stats.totalModerators,
      color: "#3b82f6",
      icon: "🛡️",
    },
    {
      label: isKo ? "관리자" : "Admins",
      value: stats.totalAdmins,
      color: "#059669",
      icon: "⭐",
    },
  ];

  const quickLinks = [
    {
      href: `/${loc}/admin/posts`,
      label: isKo ? "게시글 관리" : "Manage Posts",
      desc: isKo ? "게시글 숨김 · 삭제 · 복원" : "Hide · Delete · Restore posts",
      icon: "📝",
    },
    {
      href: `/${loc}/admin/comments`,
      label: isKo ? "댓글 관리" : "Manage Comments",
      desc: isKo ? "댓글 숨김 · 삭제 · 복원" : "Hide · Delete · Restore comments",
      icon: "💬",
    },
    {
      href: `/${loc}/admin/users`,
      label: isKo ? "사용자 관리" : "Manage Users",
      desc: isKo ? "역할 변경 · 차단 · 차단 해제" : "Change roles · Ban · Unban users",
      icon: "👥",
    },
  ];

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="w-0.5 h-6 rounded-full bg-emerald-600 shrink-0" />
            <h1 className="text-xl font-black text-gray-900">{isKo ? "대시보드" : "Dashboard"}</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 ml-3.5">
            {isKo ? "커뮤니티 현황 및 빠른 관리 링크" : "Community overview and quick moderation links"}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats grid */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3.5 mb-8">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-lg">{card.icon}</span>
                <span className="text-xs font-semibold text-gray-500">{card.label}</span>
              </div>
              <div className="text-3xl font-black tabular-nums" style={{ color: card.color }}>
                {card.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-0.5 h-4 rounded-full bg-emerald-600 shrink-0" />
            <h2 className="text-base font-bold text-gray-900">{isKo ? "빠른 이동" : "Quick Actions"}</h2>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
            {quickLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">{link.icon}</span>
                  <span className="text-sm font-bold text-gray-900">{link.label}</span>
                </div>
                <p className="text-xs text-gray-500">{link.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
