"use client";
/**
 * KoreaMatchSchedule — 홈 사이드바용 대한민국 조별리그 경기 일정 위젯
 *
 * 노출 기간: 2026-06-01 ~ 2026-07-25
 * 강제 노출: NEXT_PUBLIC_WORLDCUP_FORCE_SHOW=true
 */
import { WC_SCHEDULE } from "@/lib/worldcup/data";
import { isWorldCupVisible } from "@/lib/worldcup/visibility";

interface Props {
  isKo: boolean;
}

const KOREA_NAME = "대한민국";

export default function KoreaMatchSchedule({ isKo }: Props) {
  if (!isWorldCupVisible()) return null;

  const koreaMatches = (WC_SCHEDULE["A"] ?? []).filter(
    (m) => m.homeKo === KOREA_NAME || m.awayKo === KOREA_NAME,
  );

  return (
    <div className="rounded-xl overflow-hidden border border-red-100 bg-white shadow-sm">
      {/* 헤더 */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ background: "linear-gradient(90deg, #7f1d1d 0%, #dc2626 100%)" }}
      >
        <span className="text-lg">🇰🇷</span>
        <span className="text-white text-sm font-black tracking-wide">
          {isKo ? "대한민국 경기 일정" : "Korea Republic Schedule"}
        </span>
      </div>

      {/* 경기 목록 */}
      <div className="p-3 flex flex-col gap-2">
        {koreaMatches.map((match, i) => {
          const isHomeKorea = match.homeKo === KOREA_NAME;
          const round = match.round;
          return (
            <div
              key={i}
              className="rounded-lg px-3 py-2.5 border border-red-100 bg-red-50"
            >
              {/* 차수 + 날짜 */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wide">
                  {isKo ? `${round}차전` : `Round ${round}`}
                </span>
                <span className="text-[10px] text-gray-400">
                  {match.dateLabel} · {match.timeKst} KST
                </span>
              </div>

              {/* 홈 vs 어웨이 */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-base">{match.homeFlag}</span>
                  <span
                    className="text-xs truncate"
                    style={{
                      fontWeight: isHomeKorea ? 800 : 600,
                      color:      isHomeKorea ? "#b91c1c" : "#374151",
                    }}
                  >
                    {match.homeKo}
                  </span>
                </div>
                <span className="text-[10px] font-black text-gray-400 shrink-0 w-6 text-center">
                  vs
                </span>
                <div className="flex items-center gap-1 flex-1 justify-end">
                  <span
                    className="text-xs truncate text-right"
                    style={{
                      fontWeight: !isHomeKorea ? 800 : 600,
                      color:      !isHomeKorea ? "#b91c1c" : "#374151",
                    }}
                  >
                    {match.awayKo}
                  </span>
                  <span className="text-base">{match.awayFlag}</span>
                </div>
              </div>

              {/* 경기장 */}
              <div className="text-[10px] text-gray-400 mt-1 text-center">
                📍 {match.venueKo}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-3 pb-3">
        <p className="text-[10px] text-gray-400">
          {isKo ? "* 모든 시간은 한국 표준시 (KST) 기준" : "* All times in Korea Standard Time (KST)"}
        </p>
      </div>
    </div>
  );
}
