"use client";
/**
 * WorldCupGroups — A~L조 전체 조편성 탭 위젯
 * 다크 모드 기준 디자인, 가로 스크롤 탭, 대한민국 강조 표시
 */
import { useState } from "react";
import { WC_GROUPS, type WCGroupTeam } from "@/lib/worldcup/data";

interface Props {
  isKo: boolean;
}

const KOREA_GROUP_ID = "A"; // 대한민국 소속 조 — 기본 선택값

export default function WorldCupGroups({ isKo }: Props) {
  const [activeId, setActiveId] = useState(KOREA_GROUP_ID);
  const activeGroup = WC_GROUPS.find((g) => g.id === activeId) ?? WC_GROUPS[0];

  return (
    <div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-900">
      {/* 헤더 */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ background: "linear-gradient(90deg, #7f1d1d 0%, #dc2626 100%)" }}
      >
        <span className="text-lg">🏆</span>
        <span className="text-white text-sm font-black tracking-wide">
          {isKo ? "2026 월드컵 조편성" : "2026 World Cup Groups"}
        </span>
      </div>

      {/* 탭 */}
      <div
        className="flex gap-1 px-3 py-2.5 overflow-x-auto"
        style={{ scrollbarWidth: "none", borderBottom: "1px solid #374151" }}
      >
        {WC_GROUPS.map((group) => {
          const isActive    = group.id === activeId;
          const hasKorea    = group.teams.some((t) => t.isKorea);
          return (
            <button
              key={group.id}
              onClick={() => setActiveId(group.id)}
              className="shrink-0 relative"
              style={{
                padding:         "4px 11px",
                borderRadius:    "6px",
                fontSize:        "12px",
                fontWeight:      isActive ? 800 : 500,
                border:          isActive
                  ? "1px solid #dc2626"
                  : "1px solid #374151",
                backgroundColor: isActive ? "#dc2626" : "transparent",
                color:           isActive ? "#fff" : "#9ca3af",
                cursor:          "pointer",
                transition:      "all 0.12s ease",
              }}
            >
              {group.id}조
              {hasKorea && (
                <span
                  style={{
                    position:   "absolute",
                    top:        "-3px",
                    right:      "-3px",
                    width:      "7px",
                    height:     "7px",
                    borderRadius: "50%",
                    background: "#f59e0b",
                    border:     "1.5px solid #111827",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 조 내용 */}
      <div className="px-4 py-3">
        <div className="text-xs font-bold text-gray-400 mb-2.5 uppercase tracking-wider">
          {isKo ? `${activeGroup.id}조` : `Group ${activeGroup.id}`}
        </div>

        <div className="flex flex-col gap-1.5">
          {activeGroup.teams.map((team, idx) => (
            <TeamRow key={idx} team={team} isKo={isKo} rank={idx + 1} />
          ))}
        </div>

        {/* 미정 안내 */}
        {activeGroup.teams.some((t) => t.nameEn === "TBD") && (
          <p className="text-[10px] text-gray-500 mt-3">
            {isKo
              ? "* 대진 미확정 팀은 추후 업데이트 예정이에요."
              : "* TBD slots will be updated after the draw is confirmed."}
          </p>
        )}
      </div>
    </div>
  );
}

function TeamRow({
  team,
  isKo,
  rank,
}: {
  team: WCGroupTeam;
  isKo: boolean;
  rank: number;
}) {
  const isTbd   = team.nameEn === "TBD";
  const name    = isKo ? team.nameKo : team.nameEn;

  return (
    <div
      className="flex items-center gap-3 rounded-lg px-3 py-2.5"
      style={{
        background:  team.isKorea ? "rgba(220,38,38,0.12)" : "rgba(255,255,255,0.04)",
        border:      team.isKorea ? "1px solid rgba(220,38,38,0.3)" : "1px solid transparent",
      }}
    >
      {/* 번호 */}
      <span
        style={{
          fontSize:   "11px",
          fontWeight: 700,
          color:      "#6b7280",
          width:      "14px",
          textAlign:  "center",
          flexShrink: 0,
        }}
      >
        {rank}
      </span>

      {/* 국기 */}
      <span style={{ fontSize: "20px", lineHeight: 1, flexShrink: 0 }}>
        {team.flag}
      </span>

      {/* 팀명 */}
      <span
        style={{
          fontSize:   "13px",
          fontWeight: team.isKorea ? 800 : isTbd ? 400 : 600,
          color:      team.isKorea ? "#fca5a5" : isTbd ? "#4b5563" : "#e5e7eb",
          fontStyle:  isTbd ? "italic" : "normal",
          flex:       1,
        }}
      >
        {name}
      </span>

      {/* 대한민국 뱃지 */}
      {team.isKorea && (
        <span
          style={{
            fontSize:        "10px",
            fontWeight:      700,
            color:           "#dc2626",
            background:      "rgba(220,38,38,0.15)",
            border:          "1px solid rgba(220,38,38,0.3)",
            borderRadius:    "4px",
            padding:         "1px 6px",
            flexShrink:      0,
          }}
        >
          🇰🇷 우리
        </span>
      )}
    </div>
  );
}
