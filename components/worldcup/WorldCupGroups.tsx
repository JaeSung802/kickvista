"use client";
/**
 * WorldCupGroups — A~L조 전체 조편성 탭 위젯 (라이트 모드)
 */
import { useState } from "react";
import { WC_GROUPS, type WCGroupTeam } from "@/lib/worldcup/data";

interface Props {
  isKo: boolean;
}

const KOREA_GROUP_ID = "A";

export default function WorldCupGroups({ isKo }: Props) {
  const [activeId, setActiveId] = useState(KOREA_GROUP_ID);
  const activeGroup = WC_GROUPS.find((g) => g.id === activeId) ?? WC_GROUPS[0];

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
      {/* 헤더 */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ background: "linear-gradient(90deg, #7f1d1d 0%, #dc2626 100%)" }}
      >
        <span className="text-lg">🗺️</span>
        <span className="text-white text-sm font-black tracking-wide">
          {isKo ? "2026 월드컵 조편성" : "2026 World Cup Groups"}
        </span>
      </div>

      {/* 탭 */}
      <div
        className="flex gap-1 px-3 pt-3 pb-2 overflow-x-auto"
        style={{ scrollbarWidth: "none", borderBottom: "1px solid #e5e7eb" }}
      >
        {WC_GROUPS.map((group) => {
          const isActive = group.id === activeId;
          const hasKorea = group.teams.some((t) => t.isKorea);
          return (
            <button
              key={group.id}
              onClick={() => setActiveId(group.id)}
              className="shrink-0 relative"
              style={{
                padding:         "5px 12px",
                borderRadius:    "8px",
                fontSize:        "12px",
                fontWeight:      isActive ? 800 : 600,
                border:          isActive ? "1.5px solid #dc2626" : "1.5px solid #e5e7eb",
                backgroundColor: isActive ? "#dc2626" : "#f9fafb",
                color:           isActive ? "#fff" : "#374151",
                cursor:          "pointer",
                transition:      "all 0.12s ease",
              }}
            >
              {group.id}조
              {hasKorea && !isActive && (
                <span
                  style={{
                    position:     "absolute",
                    top:          "-3px",
                    right:        "-3px",
                    width:        "7px",
                    height:       "7px",
                    borderRadius: "50%",
                    background:   "#f59e0b",
                    border:       "1.5px solid #fff",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 조 내용 */}
      <div className="px-4 py-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">
          {isKo ? `${activeGroup.id}조` : `Group ${activeGroup.id}`}
          <span className="ml-2 text-gray-300 font-normal normal-case tracking-normal">
            {isKo ? "· 각 조 상위 2팀 + 와일드카드 8팀 진출" : "· Top 2 + 8 best 3rd advance"}
          </span>
        </p>

        <div className="flex flex-col gap-1">
          {activeGroup.teams.map((team, idx) => (
            <TeamRow key={idx} team={team} isKo={isKo} rank={idx + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TeamRow({ team, isKo, rank }: { team: WCGroupTeam; isKo: boolean; rank: number }) {
  const isTbd = team.nameEn.startsWith("TBD") || team.nameEn.includes("Playoff") || team.nameEn.includes("FIFA");
  const name  = isKo ? team.nameKo : team.nameEn;

  return (
    <div
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
      style={{
        background: team.isKorea ? "#fef2f2" : "#f9fafb",
        border:     team.isKorea ? "1px solid #fca5a5" : "1px solid #f3f4f6",
      }}
    >
      {/* 순번 */}
      <span className="text-xs font-bold text-gray-300 w-3 text-center shrink-0">
        {rank}
      </span>

      {/* 국기 */}
      <span style={{ fontSize: "20px", lineHeight: 1, flexShrink: 0 }}>
        {team.flag}
      </span>

      {/* 팀명 */}
      <span
        className="flex-1 text-sm"
        style={{
          fontWeight: team.isKorea ? 800 : isTbd ? 500 : 700,
          color:      team.isKorea ? "#b91c1c" : isTbd ? "#9ca3af" : "#111827",
          fontStyle:  isTbd ? "italic" : "normal",
        }}
      >
        {name}
      </span>

      {/* 대한민국 뱃지 */}
      {team.isKorea && (
        <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5 shrink-0">
          🇰🇷 우리
        </span>
      )}
    </div>
  );
}
