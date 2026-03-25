"use client";

import { SWITCH_TAB_EVENT } from "./MatchTabNav";

interface GoToRecapButtonProps {
  labelKo: string;
  labelEn: string;
  locale: "ko" | "en";
  recapTabIdx: number;
}

export default function GoToRecapButton({
  labelKo,
  labelEn,
  locale,
  recapTabIdx,
}: GoToRecapButtonProps) {
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent<number>(SWITCH_TAB_EVENT, { detail: recapTabIdx })
    );
  }

  return (
    <button
      onClick={handleClick}
      style={{
        position: "relative",
        zIndex: 20,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#ffffff",
        color: "#059669",
        fontSize: 14,
        fontWeight: 800,
        padding: "12px 28px",
        borderRadius: 999,
        border: "2px solid rgba(255,255,255,0.4)",
        cursor: "pointer",
        transition: "all 0.15s",
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.backgroundColor = "#ecfdf5";
        el.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)";
        el.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.backgroundColor = "#ffffff";
        el.style.boxShadow = "0 2px 12px rgba(0,0,0,0.15)";
        el.style.transform = "translateY(0)";
      }}
    >
      <span>{locale === "ko" ? labelKo : labelEn}</span>
    </button>
  );
}
