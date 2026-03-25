"use client";

import { useState, useRef, useEffect } from "react";
import LoginButton from "./LoginButton";
import { createClient } from "@/lib/supabase/client";

interface UserMenuProps {
  user: {
    nickname: string;
    points: number;
    rankBadge: string;
    avatarUrl?: string;
    avatarBorderColor?: string;
    titleBadge?: string;
  } | null;
  locale: "ko" | "en";
}

const t = {
  en: { myPage: "My Page", shop: "Point Shop", settings: "Settings", signOut: "Sign Out" },
  ko: { myPage: "마이페이지", shop: "포인트 상점", settings: "설정", signOut: "로그아웃" },
};

export default function UserMenu({ user, locale }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tx = t[locale];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSignOut() {
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = `/${locale}`;
  }

  if (!user) return <LoginButton locale={locale} />;

  return (
    <div ref={ref} className="relative inline-block">
      {/* Trigger */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 bg-white border border-gray-200 rounded-full hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        {/* Avatar with optional border */}
        <div
          className="shrink-0"
          style={
            user.avatarBorderColor
              ? {
                  borderRadius: "50%",
                  padding: 2,
                  background: `linear-gradient(135deg, ${user.avatarBorderColor}, ${user.avatarBorderColor}99)`,
                }
              : undefined
          }
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.nickname}
              className="w-7 h-7 rounded-full object-cover block"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
              {user.nickname[0]?.toUpperCase()}
            </div>
          )}
        </div>

        <div className="text-left">
          <div className="text-sm font-semibold text-gray-900 leading-tight flex items-center gap-1">
            {user.rankBadge} {user.nickname}
            {user.titleBadge && user.titleBadge !== "Rookie" && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: user.titleBadge === "Champion"
                    ? "linear-gradient(135deg, #b45309, #eab308)"
                    : "linear-gradient(135deg, #7c3aed, #34d399)",
                  color: "#fff",
                }}
              >
                {user.titleBadge === "Champion" ? "👑 " : ""}{user.titleBadge}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 leading-tight">
            {user.points.toLocaleString()} pts
          </div>
        </div>

        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`ml-0.5 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-[calc(100%+6px)] right-0 min-w-44 bg-white border border-gray-200 rounded-xl p-1.5 z-100 shadow-lg">
          {[
            { label: tx.myPage,   href: `/${locale}/mypage` },
            { label: tx.settings, href: `/${locale}/settings` },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors no-underline"
            >
              {item.label}
            </a>
          ))}

          {/* Point Shop — highlighted entry */}
          <a
            href={`/${locale}/settings#point-shop`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold no-underline transition-colors"
            style={{ color: "#b45309", backgroundColor: "#fffbeb" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#fef3c7"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#fffbeb"; }}
          >
            <span style={{ fontSize: 14 }}>🪙</span>
            {tx.shop}
          </a>

          <div className="h-px bg-gray-100 my-1" />

          <button
            onClick={handleSignOut}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            {tx.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
