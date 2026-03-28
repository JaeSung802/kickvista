/**
 * 2026 월드컵 위젯 노출 기간 관리
 *
 * 기본 노출 기간: 2026-06-01 ~ 2026-07-25
 *
 * 개발/테스트 시 강제 노출:
 *   .env.local 에 NEXT_PUBLIC_WORLDCUP_FORCE_SHOW=true 추가
 */

export const WC_SHOW_FROM = new Date("2026-06-01T00:00:00+09:00");
export const WC_SHOW_TO   = new Date("2026-07-26T00:00:00+09:00"); // 7/25 포함 (당일 자정까지)

/**
 * 현재 시각이 월드컵 위젯 노출 기간 내인지 반환합니다.
 * NEXT_PUBLIC_WORLDCUP_FORCE_SHOW=true 이면 항상 true.
 */
export function isWorldCupVisible(): boolean {
  if (process.env.NEXT_PUBLIC_WORLDCUP_FORCE_SHOW === "true") return true;
  const now = new Date();
  return now >= WC_SHOW_FROM && now < WC_SHOW_TO;
}
