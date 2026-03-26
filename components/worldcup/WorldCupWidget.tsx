/**
 * WorldCupWidget — 커뮤니티 사이드바용 컴팩트 위젯
 * 서버 컴포넌트 (D-Day 서버 사이드 계산)
 */
import { calcDDay, WORLDCUP_2026 } from "@/lib/worldcup/data";

interface Props {
  locale: string;
  isKo:   boolean;
}

export default function WorldCupWidget({ locale, isKo }: Props) {
  const { label, days } = calcDDay();
  const isOver = days < 0;

  return (
    <a
      href={`/${locale}/community?category=worldcup-2026`}
      className="block no-underline"
    >
      <div
        className="rounded-xl overflow-hidden border border-red-200 hover:border-red-300 transition-colors"
        style={{ background: "linear-gradient(135deg, #7f1d1d 0%, #dc2626 60%, #ef4444 100%)" }}
      >
        {/* 헤더 */}
        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <span className="text-lg">🏆</span>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-bold leading-tight truncate">
              {isKo ? WORLDCUP_2026.nameKo : WORLDCUP_2026.nameEn}
            </div>
            <div className="text-red-200 text-[10px] leading-tight">
              {isKo ? "2026.6.11 개막" : "Opening Jun 11, 2026"}
            </div>
          </div>
        </div>

        {/* D-Day */}
        <div className="px-4 pb-4 flex items-end gap-2">
          <div>
            <div
              className="font-black text-white leading-none"
              style={{ fontSize: isOver ? 28 : 36 }}
            >
              {label}
            </div>
            <div className="text-red-100 text-[11px] mt-1 font-medium">
              {isOver
                ? (isKo ? "월드컵 진행 중! 🔥" : "World Cup is ON! 🔥")
                : (isKo ? "월드컵까지" : "to kickoff")}
            </div>
          </div>
          <div className="ml-auto flex flex-col items-end gap-1 pb-0.5">
            <span className="text-2xl">🇺🇸🇨🇦🇲🇽</span>
            <span className="text-red-100 text-[10px] font-semibold">
              {isKo ? "북중미 공동개최" : "USA · CAN · MEX"}
            </span>
          </div>
        </div>

        {/* 하단 CTA */}
        <div
          className="px-4 py-2 flex items-center justify-between"
          style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
        >
          <span className="text-red-100 text-[11px] font-medium">
            {isKo ? "월드컵 소식 보러가기" : "See World Cup news"}
          </span>
          <span className="text-red-100 text-xs">→</span>
        </div>
      </div>
    </a>
  );
}
