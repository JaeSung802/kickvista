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
  } | null;
  locale: "ko" | "en";
}

const t = {
  en: { myPage: "My Page", settings: "Settings", signOut: "Sign Out" },
  ko: { myPage: "마이페이지", settings: "설정", signOut: "로그아웃" },
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
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px 6px 6px",
          backgroundColor: "#161b22",
          border: "1px solid #30363d",
          borderRadius: 999,
          cursor: "pointer",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#8b949e")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#30363d")}
      >
        {/* Avatar */}
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.nickname}
            style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              color: "#0d1117",
              flexShrink: 0,
            }}
          >
            {user.nickname[0]?.toUpperCase()}
          </div>
        )}

        <div style={{ textAlign: "left" }}>
          <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>
            {user.rankBadge} {user.nickname}
          </div>
          <div style={{ color: "#8b949e", fontSize: 11, lineHeight: 1.2 }}>
            {user.points.toLocaleString()} pts
          </div>
        </div>

        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#8b949e"
          strokeWidth="2.5"
          style={{
            marginLeft: 2,
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: 160,
            backgroundColor: "#161b22",
            border: "1px solid #30363d",
            borderRadius: 10,
            padding: "6px",
            zIndex: 100,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {[
            { label: tx.myPage, href: `/${locale}/mypage` },
            { label: tx.settings, href: `/${locale}/settings` },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: "block",
                padding: "9px 12px",
                borderRadius: 6,
                color: "#e6edf3",
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                transition: "background-color 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#21262d")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              {item.label}
            </a>
          ))}

          <div style={{ height: 1, backgroundColor: "#30363d", margin: "4px 0" }} />

          <button
            onClick={handleSignOut}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "9px 12px",
              borderRadius: 6,
              color: "#f85149",
              fontSize: 13,
              fontWeight: 500,
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.12s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(248,81,73,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            {tx.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
