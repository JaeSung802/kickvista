"use client";
/**
 * Server Component에서 next/dynamic + ssr:false 를 직접 쓸 수 없으므로
 * 이 Client Component 파일에서 동적 로딩을 담당합니다.
 */
import dynamic from "next/dynamic";

export const WorldCupWidgetDynamic = dynamic(
  () => import("./WorldCupWidget"),
  { ssr: false }
);

export const WorldCupInfoPanelDynamic = dynamic(
  () => import("./WorldCupInfoPanel"),
  { ssr: false }
);

export const WorldCupGroupsDynamic = dynamic(
  () => import("./WorldCupGroups"),
  { ssr: false }
);

export const KoreaMatchScheduleDynamic = dynamic(
  () => import("./KoreaMatchSchedule"),
  { ssr: false }
);
