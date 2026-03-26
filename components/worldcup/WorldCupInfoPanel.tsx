"use client";
/**
 * WorldCupInfoPanel — worldcup-2026 카테고리 선택 시 게시글 목록 상단에 표시
 * 클라이언트 컴포넌트 (정적 데이터만 사용 — 서버 렌더링 예외 방지)
 *
 * 데이터 업데이트: lib/worldcup/data.ts 파일을 수정하세요.
 */
import { calcDDay, KOREA_GROUP, KOREA_MATCHES, WORLDCUP_2026 } from "@/lib/worldcup/data";

interface Props {
  isKo: boolean;
}

export default function WorldCupInfoPanel({ isKo }: Props) {
  const { label } = calcDDay();

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
              {isKo
                ? `대한민국 ${KOREA_GROUP.groupName}`
                : `Korea Group ${KOREA_GROUP.groupId}`}
            </h3>
          </div>

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
              {KOREA_GROUP.standings.map((team, idx) => {
                const isKorea = team.teamEn === "Korea Republic";
                return (
                  <tr
                    key={idx}
                    className={`border-b border-gray-50 ${isKorea ? "bg-red-50" : ""}`}
                  >
                    <td className="py-1.5 flex items-center gap-1.5">
                      <span>{team.flag}</span>
                      <span className={`font-medium ${isKorea ? "text-red-700 font-bold" : "text-gray-700"}`}>
                        {isKo ? team.teamKo : team.teamEn}
                      </span>
                    </td>
                    <td className="text-center text-gray-500">{team.played}</td>
                    <td className="text-center text-gray-500">{team.won}</td>
                    <td className="text-center text-gray-500">{team.drawn}</td>
                    <td className="text-center text-gray-500">{team.lost}</td>
                    <td className={`text-center font-black ${isKorea ? "text-red-600" : "text-gray-700"}`}>
                      {team.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-[10px] text-gray-400 mt-2">
            {isKo ? "* 대진 확정 후 업데이트 예정" : "* Will update after group draw"}
          </p>
        </div>

        {/* 경기 일정 */}
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="w-0.5 h-4 rounded-full bg-red-500 shrink-0" />
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              {isKo ? "🇰🇷 대한민국 경기 일정" : "🇰🇷 Korea Schedule"}
            </h3>
          </div>

          <div className="flex flex-col gap-2">
            {KOREA_MATCHES.map((match) => {
              const isHomeKorea = match.homeTeamEn === "Korea Republic";
              return (
                <div
                  key={match.id}
                  className="bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-gray-400 font-medium">
                      {match.date} · {match.timeKst}
                    </span>
                    {match.status === "live" && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
                        LIVE
                      </span>
                    )}
                    {match.status === "finished" && (
                      <span className="text-[10px] text-gray-400">종료</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className={`flex items-center gap-1.5 flex-1 ${isHomeKorea ? "font-bold" : ""}`}>
                      <span className="text-base">{match.homeFlag}</span>
                      <span className={`text-xs ${isHomeKorea ? "text-red-700" : "text-gray-700"}`}>
                        {isKo ? match.homeTeamKo : match.homeTeamEn}
                      </span>
                    </div>
                    <div className="text-xs font-black text-gray-400 shrink-0 w-10 text-center">
                      {match.status === "finished" || match.status === "live"
                        ? `${match.homeScore ?? 0} : ${match.awayScore ?? 0}`
                        : "vs"}
                    </div>
                    <div className={`flex items-center gap-1.5 flex-1 justify-end ${!isHomeKorea ? "font-bold" : ""}`}>
                      <span className={`text-xs ${!isHomeKorea ? "text-red-700" : "text-gray-700"}`}>
                        {isKo ? match.awayTeamKo : match.awayTeamEn}
                      </span>
                      <span className="text-base">{match.awayFlag}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1 text-center">
                    📍 {isKo ? match.venueKo : match.venueEn}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            {isKo ? "* 일정 확정 후 업데이트 예정" : "* Will update after schedule confirmed"}
          </p>
        </div>
      </div>
    </div>
  );
}
