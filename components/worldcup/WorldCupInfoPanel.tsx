"use client";
/**
 * WorldCupInfoPanel — worldcup-2026 카테고리 선택 시 게시글 목록 상단에 표시
 * 클라이언트 컴포넌트 (정적 데이터만 사용 — 서버 렌더링 예외 방지)
 *
 * 데이터 업데이트: lib/worldcup/data.ts 파일을 수정하세요.
 */
import { useState } from "react";
import { calcDDay, WC_GROUPS, WC_SCHEDULE, WORLDCUP_2026 } from "@/lib/worldcup/data";

interface Props {
  isKo: boolean;
}

const KOREA_GROUP_ID = "A";

export default function WorldCupInfoPanel({ isKo }: Props) {
  const { label } = calcDDay();
  const [activeGroupId, setActiveGroupId] = useState(KOREA_GROUP_ID);

  const activeGroup   = WC_GROUPS.find((g) => g.id === activeGroupId) ?? WC_GROUPS[0];
  const groupSchedule = WC_SCHEDULE[activeGroupId] ?? [];

  const round1 = groupSchedule.filter((m) => m.round === 1);
  const round2 = groupSchedule.filter((m) => m.round === 2);
  const round3 = groupSchedule.filter((m) => m.round === 3);

  return (
    <div className="rounded-xl border border-red-100 overflow-hidden bg-white shadow-sm">
      {/* 헤더 배너 */}
      <div
        className="px-5 py-3 flex items-center gap-3"
        style={{ background: "linear-gradient(90deg, #7f1d1d 0%, #dc2626 100%)" }}
      >
        <span className="text-2xl">🏆</span>
        <div className="flex-1">
          <div className="text-white font-black text-sm leading-tight">
            {isKo ? WORLDCUP_2026.nameKo : WORLDCUP_2026.nameEn}
          </div>
          <div className="text-red-200 text-xs mt-0.5">
            {isKo
              ? `${WORLDCUP_2026.openingDate} 개막 · ${WORLDCUP_2026.finalDate} 결승`
              : `Opens ${WORLDCUP_2026.openingDate} · Final ${WORLDCUP_2026.finalDate}`}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-white font-black text-2xl leading-none">{label}</div>
          <div className="text-red-200 text-[10px] mt-0.5">
            {isKo ? "개막까지" : "to kickoff"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
        {/* 조별 순위 */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="w-0.5 h-4 rounded-full bg-red-500 shrink-0" />
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              {isKo ? "조별 순위" : "Group Standings"}
            </h3>
          </div>

          {/* 그룹 탭 */}
          <div
            className="flex flex-wrap gap-1 mb-3"
          >
            {WC_GROUPS.map((group) => {
              const isActive  = group.id === activeGroupId;
              const hasKorea  = group.teams.some((t) => t.isKorea);
              return (
                <button
                  key={group.id}
                  onClick={() => setActiveGroupId(group.id)}
                  className="shrink-0 relative"
                  style={{
                    padding:         "3px 7px",
                    borderRadius:    "6px",
                    fontSize:        "11px",
                    fontWeight:      isActive ? 800 : 600,
                    border:          isActive ? "1.5px solid #dc2626" : "1.5px solid #e5e7eb",
                    backgroundColor: isActive ? "#dc2626" : "#f9fafb",
                    color:           isActive ? "#fff" : "#6b7280",
                    cursor:          "pointer",
                    transition:      "all 0.1s ease",
                  }}
                >
                  {group.id}
                  {hasKorea && !isActive && (
                    <span
                      style={{
                        position:     "absolute",
                        top:          "-3px",
                        right:        "-3px",
                        width:        "6px",
                        height:       "6px",
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

          {/* 팀 테이블 */}
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="text-left pb-1.5 font-semibold">팀</th>
                <th className="text-center pb-1.5 font-semibold w-6">경</th>
                <th className="text-center pb-1.5 font-semibold w-6">승</th>
                <th className="text-center pb-1.5 font-semibold w-6">무</th>
                <th className="text-center pb-1.5 font-semibold w-6">패</th>
                <th className="text-center pb-1.5 font-semibold w-7 text-red-600">승점</th>
              </tr>
            </thead>
            <tbody>
              {activeGroup.teams.map((team, idx) => (
                <tr
                  key={idx}
                  className={`border-b border-gray-50 ${team.isKorea ? "bg-red-50" : ""}`}
                >
                  <td className="py-1.5 flex items-center gap-1.5">
                    <span>{team.flag}</span>
                    <span className={`font-medium ${team.isKorea ? "text-red-700 font-bold" : "text-gray-700"}`}>
                      {isKo ? team.nameKo : team.nameEn}
                    </span>
                  </td>
                  <td className="text-center text-gray-400">0</td>
                  <td className="text-center text-gray-400">0</td>
                  <td className="text-center text-gray-400">0</td>
                  <td className="text-center text-gray-400">0</td>
                  <td className={`text-center font-black ${team.isKorea ? "text-red-600" : "text-gray-700"}`}>
                    0
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-gray-400 mt-2">
            {isKo ? "* 경기 시작 후 순위가 업데이트돼요" : "* Standings update after matches begin"}
          </p>
        </div>

        {/* 경기 일정 */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: "420px" }}>
          <div className="flex items-center gap-1.5 mb-3">
            <span className="w-0.5 h-4 rounded-full bg-red-500 shrink-0" />
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              {isKo ? `${activeGroupId}조 경기 일정` : `Group ${activeGroupId} Schedule`}
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { label: isKo ? "1차전" : "Round 1", matches: round1 },
              { label: isKo ? "2차전" : "Round 2", matches: round2 },
              { label: isKo ? "3차전" : "Round 3", matches: round3 },
            ].map(({ label: roundLabel, matches }) =>
              matches.length > 0 ? (
                <div key={roundLabel}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    {roundLabel}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {matches.map((match, i) => {
                      const isKoreaMatch =
                        match.homeKo === "대한민국" || match.awayKo === "대한민국";
                      return (
                        <div
                          key={i}
                          className="rounded-lg px-3 py-2 border"
                          style={{
                            background: isKoreaMatch ? "#fef2f2" : "#f9fafb",
                            border:     isKoreaMatch ? "1px solid #fca5a5" : "1px solid #f3f4f6",
                          }}
                        >
                          <div className="text-[10px] text-gray-400 mb-1">
                            {match.dateLabel} · {match.timeKst} KST
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1 flex-1">
                              <span className="text-sm">{match.homeFlag}</span>
                              <span
                                className="text-xs truncate"
                                style={{
                                  fontWeight: match.homeKo === "대한민국" ? 800 : 600,
                                  color:      match.homeKo === "대한민국" ? "#b91c1c" : "#374151",
                                }}
                              >
                                {isKo ? match.homeKo : match.homeKo}
                              </span>
                            </div>
                            <span className="text-[10px] font-black text-gray-400 shrink-0">vs</span>
                            <div className="flex items-center gap-1 flex-1 justify-end">
                              <span
                                className="text-xs truncate"
                                style={{
                                  fontWeight: match.awayKo === "대한민국" ? 800 : 600,
                                  color:      match.awayKo === "대한민국" ? "#b91c1c" : "#374151",
                                }}
                              >
                                {isKo ? match.awayKo : match.awayKo}
                              </span>
                              <span className="text-sm">{match.awayFlag}</span>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5 text-center">
                            📍 {match.venueKo}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            {isKo ? "* 일정 확정 후 업데이트 예정" : "* Will update after schedule confirmed"}
          </p>
        </div>
      </div>
    </div>
  );
}
