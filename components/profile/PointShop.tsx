"use client";

import { useState } from "react";
import type { ShopItemId } from "@/app/api/profile/shop/route";

interface ShopItem {
  id: ShopItemId;
  nameEn: string;
  nameKo: string;
  descEn: string;
  descKo: string;
  cost: number;
  preview: React.ReactNode;
  isActive: (profile: ShopProfile) => boolean;
}

interface ShopProfile {
  avatar_border_color: string | null;
  title_badge: string;
  total_points: number;
}

interface PointShopProps {
  locale: "ko" | "en";
  profile: ShopProfile;
}

const labels = {
  en: {
    title: "Point Shop",
    subtitle: "Spend your points to stand out from the crowd",
    pts: "pts",
    buy: "Purchase",
    active: "Active",
    insufficient: "Not enough points",
    buying: "Processing…",
    successMsg: "Purchased! Refresh to see your new look.",
    errorMsg: "Purchase failed. Please try again.",
    yourPoints: "Your Points",
    borderCategory: "Avatar Borders",
    badgeCategory: "Title Badges",
    remove: "Remove",
  },
  ko: {
    title: "포인트 상점",
    subtitle: "포인트를 사용하여 커뮤니티에서 나를 표현하세요",
    pts: "pts",
    buy: "구매",
    active: "착용 중",
    insufficient: "포인트 부족",
    buying: "처리 중…",
    successMsg: "구매 완료! 페이지를 새로고침하면 적용됩니다.",
    errorMsg: "구매 실패. 다시 시도해 주세요.",
    yourPoints: "내 포인트",
    borderCategory: "아바타 테두리",
    badgeCategory: "칭호 뱃지",
    remove: "제거",
  },
};

// ─── Avatar preview helper ────────────────────────────────────────────────────

function AvatarPreview({ color }: { color: string }) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        backgroundColor: "#059669",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        fontWeight: 900,
        color: "#fff",
        boxShadow: `0 0 0 3px ${color}, 0 0 0 5px ${color}40`,
      }}
    >
      K
    </div>
  );
}

// ─── Shop items ───────────────────────────────────────────────────────────────

const SHOP_ITEMS: ShopItem[] = [
  {
    id: "silver_border",
    nameEn: "Silver Border",
    nameKo: "실버 테두리",
    descEn: "Add a sleek silver ring around your avatar.",
    descKo: "아바타에 세련된 실버 링을 추가합니다.",
    cost: 300,
    preview: <AvatarPreview color="#64748b" />,
    isActive: (p) => p.avatar_border_color === "#64748b",
  },
  {
    id: "gold_border",
    nameEn: "Golden Border",
    nameKo: "황금 테두리",
    descEn: "Stand out with a premium gold ring around your avatar.",
    descKo: "프리미엄 황금 링으로 눈에 띄세요.",
    cost: 1000,
    preview: <AvatarPreview color="#eab308" />,
    isActive: (p) => p.avatar_border_color === "#eab308",
  },
  {
    id: "diamond_border",
    nameEn: "Diamond Border",
    nameKo: "다이아몬드 테두리",
    descEn: "The rarest border — a brilliant blue diamond glow.",
    descKo: "가장 희귀한 테두리 — 빛나는 블루 다이아몬드.",
    cost: 3000,
    preview: <AvatarPreview color="#0ea5e9" />,
    isActive: (p) => p.avatar_border_color === "#0ea5e9",
  },
  {
    id: "expert_badge",
    nameEn: "Expert Badge",
    nameKo: "전문가 뱃지",
    descEn: "Display the 'Expert' title next to your nickname.",
    descKo: "닉네임 옆에 '전문가' 칭호를 표시합니다.",
    cost: 2000,
    preview: (
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          background: "linear-gradient(135deg, #7c3aed, #34d399)",
          color: "#fff",
          padding: "3px 8px",
          borderRadius: 999,
        }}
      >
        Expert
      </span>
    ),
    isActive: (p) => p.title_badge === "Expert",
  },
  {
    id: "champion_badge",
    nameEn: "Champion Badge",
    nameKo: "챔피언 뱃지",
    descEn: "The ultimate title — show the community you're the best.",
    descKo: "최고의 칭호 — 커뮤니티에서 당신이 최고임을 증명하세요.",
    cost: 5000,
    preview: (
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          background: "linear-gradient(135deg, #b45309, #eab308)",
          color: "#fff",
          padding: "3px 8px",
          borderRadius: 999,
        }}
      >
        👑 Champion
      </span>
    ),
    isActive: (p) => p.title_badge === "Champion",
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function PointShop({ locale, profile }: PointShopProps) {
  const t = labels[locale];
  const isKo = locale === "ko";

  const [points, setPoints] = useState(profile.total_points);
  const [activeProfile, setActiveProfile] = useState(profile);
  const [buying, setBuying] = useState<ShopItemId | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function handlePurchase(item: ShopItem) {
    if (points < item.cost) return;
    setBuying(item.id);
    setMessage(null);

    try {
      const res = await fetch("/api/profile/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ text: data.error ?? t.errorMsg, ok: false });
        return;
      }

      setPoints(data.newPoints as number);
      setActiveProfile((prev) => ({
        ...prev,
        ...(data.item.type === "border" ? { avatar_border_color: data.item.value as string } : {}),
        ...(data.item.type === "badge"  ? { title_badge: data.item.value as string } : {}),
      }));
      setMessage({ text: t.successMsg, ok: true });
    } catch {
      setMessage({ text: t.errorMsg, ok: false });
    } finally {
      setBuying(null);
    }
  }

  async function handleRemoveBorder() {
    setBuying("silver_border"); // any non-null value
    try {
      const res = await fetch("/api/profile/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: "remove_border" }),
      });
      if (res.ok) {
        setActiveProfile((prev) => ({ ...prev, avatar_border_color: null }));
      }
    } catch { /* silent */ }
    setBuying(null);
  }

  const borders = SHOP_ITEMS.filter((i) => i.id.includes("border"));
  const badges  = SHOP_ITEMS.filter((i) => i.id.includes("badge"));

  return (
    <div className="flex flex-col gap-6">
      {/* Points display */}
      <div
        className="flex items-center gap-3 rounded-xl p-4"
        style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a" }}
      >
        <span style={{ fontSize: 24 }}>🪙</span>
        <div>
          <div className="text-xs font-bold text-amber-600 uppercase tracking-wide">{t.yourPoints}</div>
          <div className="text-2xl font-black text-amber-900 tabular-nums">
            {points.toLocaleString()} <span className="text-sm font-semibold">{t.pts}</span>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className="rounded-lg px-4 py-3 text-sm font-semibold"
          style={{
            backgroundColor: message.ok ? "#ecfdf5" : "#fef2f2",
            color: message.ok ? "#064E3B" : "#dc2626",
            border: `1px solid ${message.ok ? "#a7f3d0" : "#fecaca"}`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Border section */}
      <div>
        <h3 className="text-sm font-extrabold text-gray-700 mb-3">{t.borderCategory}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {borders.map((item) => {
            const isActive = item.isActive(activeProfile);
            const canAfford = points >= item.cost;
            const isBuying = buying === item.id;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border p-4 flex flex-col gap-3"
                style={{
                  borderColor: isActive ? "#059669" : "#e5e7eb",
                  boxShadow: isActive ? "0 0 0 1px #05966920" : undefined,
                }}
              >
                <div className="flex items-center gap-3">
                  {item.preview}
                  <div>
                    <div className="text-sm font-bold text-gray-900">
                      {isKo ? item.nameKo : item.nameEn}
                    </div>
                    <div className="text-xs text-amber-600 font-bold">
                      🪙 {item.cost.toLocaleString()} {t.pts}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {isKo ? item.descKo : item.descEn}
                </p>
                <button
                  onClick={() => handlePurchase(item)}
                  disabled={isActive || !canAfford || isBuying}
                  className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                      : !canAfford
                      ? "bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed"
                      : isBuying
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-amber-500 text-white hover:bg-amber-600 cursor-pointer"
                  }`}
                >
                  {isActive ? `✓ ${t.active}` : !canAfford ? t.insufficient : isBuying ? t.buying : t.buy}
                </button>
              </div>
            );
          })}
        </div>
        {/* Remove border option */}
        {activeProfile.avatar_border_color && (
          <button
            onClick={handleRemoveBorder}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline"
          >
            {t.remove}
          </button>
        )}
      </div>

      {/* Badge section */}
      <div>
        <h3 className="text-sm font-extrabold text-gray-700 mb-3">{t.badgeCategory}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {badges.map((item) => {
            const isActive = item.isActive(activeProfile);
            const canAfford = points >= item.cost;
            const isBuying = buying === item.id;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border p-4 flex flex-col gap-3"
                style={{
                  borderColor: isActive ? "#059669" : "#e5e7eb",
                  boxShadow: isActive ? "0 0 0 1px #05966920" : undefined,
                }}
              >
                <div className="flex items-center gap-3">
                  <div style={{ minWidth: 60 }}>{item.preview}</div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">
                      {isKo ? item.nameKo : item.nameEn}
                    </div>
                    <div className="text-xs text-amber-600 font-bold">
                      🪙 {item.cost.toLocaleString()} {t.pts}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {isKo ? item.descKo : item.descEn}
                </p>
                <button
                  onClick={() => handlePurchase(item)}
                  disabled={isActive || !canAfford || isBuying}
                  className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                      : !canAfford
                      ? "bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed"
                      : isBuying
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-amber-500 text-white hover:bg-amber-600 cursor-pointer"
                  }`}
                >
                  {isActive ? `✓ ${t.active}` : !canAfford ? t.insufficient : isBuying ? t.buying : t.buy}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
