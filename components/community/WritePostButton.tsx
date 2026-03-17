"use client";

import Link from "next/link";

interface WritePostButtonProps {
  locale: "ko" | "en";
}

export default function WritePostButton({ locale }: WritePostButtonProps) {
  return (
    <Link
      href={`/${locale}/community/write`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        backgroundColor: "#22c55e",
        color: "#0d1117",
        fontWeight: 700,
        fontSize: "14px",
        padding: "9px 20px",
        borderRadius: "8px",
        textDecoration: "none",
        transition: "background-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease",
        boxShadow: "0 2px 8px #22c55e44",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.backgroundColor = "#16a34a";
        el.style.transform = "translateY(-1px)";
        el.style.boxShadow = "0 4px 14px #22c55e55";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.backgroundColor = "#22c55e";
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "0 2px 8px #22c55e44";
      }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
      }}
    >
      <span style={{ fontSize: "15px", lineHeight: 1 }}>✏️</span>
      {locale === "ko" ? "글쓰기" : "Write Post"}
    </Link>
  );
}
