"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ShopItemId } from "@/app/api/profile/shop/route";

// Display data only; prices, availability and ownership come from GET /api/profile/shop.
interface ShopItemDisplay {
  id: ShopItemId;
  nameEn: string;
  nameKo: string;
  descEn: string;
  descKo: string;
  preview: React.ReactNode;
}

interface CatalogItem {
  id: string;
  type: "border" | "badge";
  value: string;
  price: number;
}

interface Catalog {
  items: CatalogItem[];
  owned: string[];
  salesEnabled: boolean;
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
    equip: "Equip",
    active: "Equipped",
    owned: "Owned",
    insufficient: "Not enough points",
    salesPaused: "Sales paused",
    working: "Processing…",
    loading: "Loading the shop…",
    loadError: "Couldn't load the shop.",
    retry: "Try again",
    purchased: "Purchased and equipped.",
    equipped: "Equipped.",
    removed: "Border removed.",
    pausedMsg: "New purchases are temporarily paused. Items you own can still be equipped.",
    insufficientMsg: "Not enough points for this item.",
    notOwnedMsg: "You don't own this item yet.",
    signInMsg: "Please sign in again.",
    errorMsg: "Something went wrong. Please try again.",
    legacyHint: "Not in your purchases — after switching, it has to be bought to use again.",
    yourPoints: "Your Points",
    borderCategory: "Avatar Borders",
    badgeCategory: "Title Badges",
    remove: "Remove border",
  },
  ko: {
    title: "포인트 상점",
    subtitle: "포인트를 사용하여 커뮤니티에서 나를 표현하세요",
    pts: "pts",
    buy: "구매",
    equip: "장착",
    active: "착용 중",
    owned: "보유",
    insufficient: "포인트 부족",
    salesPaused: "판매 일시 중지",
    working: "처리 중…",
    loading: "상점 정보를 불러오는 중…",
    loadError: "상점 정보를 불러오지 못했습니다.",
    retry: "다시 시도",
    purchased: "구매하고 장착했습니다.",
    equipped: "장착했습니다.",
    removed: "테두리를 제거했습니다.",
    pausedMsg: "신규 구매가 일시 중지되었습니다. 보유한 아이템은 계속 장착할 수 있습니다.",
    insufficientMsg: "포인트가 부족합니다.",
    notOwnedMsg: "아직 보유하지 않은 아이템입니다.",
    signInMsg: "다시 로그인해 주세요.",
    errorMsg: "처리하지 못했습니다. 다시 시도해 주세요.",
    legacyHint: "구매 기록이 없는 아이템이에요. 다른 아이템으로 바꾸면 다시 쓰려면 구매가 필요합니다.",
    yourPoints: "내 포인트",
    borderCategory: "아바타 테두리",
    badgeCategory: "칭호 뱃지",
    remove: "테두리 제거",
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

const SHOP_ITEMS: ShopItemDisplay[] = [
  {
    id: "silver_border",
    nameEn: "Silver Border",
    nameKo: "실버 테두리",
    descEn: "Add a sleek silver ring around your avatar.",
    descKo: "아바타에 세련된 실버 링을 추가합니다.",
    preview: <AvatarPreview color="#64748b" />,
  },
  {
    id: "gold_border",
    nameEn: "Golden Border",
    nameKo: "황금 테두리",
    descEn: "Stand out with a premium gold ring around your avatar.",
    descKo: "프리미엄 황금 링으로 눈에 띄세요.",
    preview: <AvatarPreview color="#eab308" />,
  },
  {
    id: "diamond_border",
    nameEn: "Diamond Border",
    nameKo: "다이아몬드 테두리",
    descEn: "The rarest border — a brilliant blue diamond glow.",
    descKo: "가장 희귀한 테두리 — 빛나는 블루 다이아몬드.",
    preview: <AvatarPreview color="#0ea5e9" />,
  },
  {
    id: "expert_badge",
    nameEn: "Expert Badge",
    nameKo: "전문가 뱃지",
    descEn: "Display the 'Expert' title next to your nickname.",
    descKo: "닉네임 옆에 '전문가' 칭호를 표시합니다.",
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
  },
  {
    id: "champion_badge",
    nameEn: "Champion Badge",
    nameKo: "챔피언 뱃지",
    descEn: "The ultimate title — show the community you're the best.",
    descKo: "최고의 칭호 — 커뮤니티에서 당신이 최고임을 증명하세요.",
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
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

type Message = { text: string; ok: boolean };

export default function PointShop({ locale, profile }: PointShopProps) {
  const t = labels[locale];
  const isKo = locale === "ko";

  const [points, setPoints] = useState(profile.total_points);
  const [equipped, setEquipped] = useState<{ border: string | null; badge: string | null }>({
    border: profile.avatar_border_color,
    badge: profile.title_badge,
  });
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState<string | null>(null);
  const busyRef = useRef(false); // blocks a second click before the re-render
  const [message, setMessage] = useState<Message | null>(null);

  const load = useCallback(async () => {
    setLoadState("loading");
    try {
      const res = await fetch("/api/profile/shop", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setCatalog({ items: data.items, owned: data.owned, salesEnabled: data.salesEnabled === true });
      setPoints(data.totalPoints);
      setEquipped(data.equipped);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(itemId: ShopItemId, action: "buy" | "equip") {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(itemId);
    setMessage(null);
    try {
      const res = await fetch("/api/profile/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, action }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPoints(data.newPoints as number);
        setEquipped((prev) => ({
          border: data.item?.type === "border" ? (data.item.value as string | null) : prev.border,
          badge: data.item?.type === "badge" ? (data.item.value as string) : prev.badge,
        }));
        if (action === "buy" && itemId !== "remove_border") {
          setCatalog((prev) => (prev && !prev.owned.includes(itemId) ? { ...prev, owned: [...prev.owned, itemId] } : prev));
        }
        setMessage({ text: itemId === "remove_border" ? t.removed : action === "buy" ? t.purchased : t.equipped, ok: true });
        return;
      }
      if (res.status === 503 && data.code === "shop_paused") {
        setCatalog((prev) => (prev ? { ...prev, salesEnabled: false } : prev));
        setMessage({ text: t.pausedMsg, ok: false });
      } else if (res.status === 400 && data.error === "Insufficient points") {
        setMessage({ text: t.insufficientMsg, ok: false });
        void load();
      } else if (res.status === 400 && data.code === "not_owned") {
        setMessage({ text: t.notOwnedMsg, ok: false });
        void load();
      } else if (res.status === 401) {
        setMessage({ text: t.signInMsg, ok: false });
      } else {
        setMessage({ text: t.errorMsg, ok: false });
      }
    } catch {
      setMessage({ text: t.errorMsg, ok: false });
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  }

  const byId = new Map((catalog?.items ?? []).map((i) => [i.id, i]));
  const shown = SHOP_ITEMS.filter((i) => byId.has(i.id));
  const borders = shown.filter((i) => byId.get(i.id)!.type === "border");
  const badges = shown.filter((i) => byId.get(i.id)!.type === "badge");

  function renderItem(item: ShopItemDisplay, wide: boolean) {
    const c = byId.get(item.id)!;
    const isEquipped = c.type === "border" ? equipped.border === c.value : equipped.badge === c.value;
    const isOwned = catalog!.owned.includes(item.id);
    const canAfford = points >= c.price;
    const isBusy = busy === item.id;
    const anyBusy = busy !== null;

    let label: string;
    let action: "buy" | "equip" | null = null;
    if (isEquipped) label = `✓ ${t.active}`;
    else if (isOwned) { label = t.equip; action = "equip"; }
    else if (!catalog!.salesEnabled) label = t.salesPaused;
    else if (!canAfford) label = t.insufficient;
    else { label = t.buy; action = "buy"; }
    if (isBusy) label = t.working;
    const disabled = action === null || anyBusy;

    return (
      <div
        key={item.id}
        className="bg-white rounded-xl border p-4 flex flex-col gap-3"
        style={{
          borderColor: isEquipped ? "#059669" : "#e5e7eb",
          boxShadow: isEquipped ? "0 0 0 1px #05966920" : undefined,
        }}
      >
        <div className="flex items-center gap-3">
          {wide ? <div style={{ minWidth: 60 }}>{item.preview}</div> : item.preview}
          <div>
            <div className="text-sm font-bold text-gray-900">{isKo ? item.nameKo : item.nameEn}</div>
            <div className="text-xs text-amber-600 font-bold flex items-center gap-1.5 flex-wrap">
              <span>🪙 {c.price.toLocaleString()} {t.pts}</span>
              {isOwned && (
                <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {t.owned}
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">{isKo ? item.descKo : item.descEn}</p>
        {isEquipped && !isOwned && <p className="text-[11px] text-gray-500 leading-relaxed">{t.legacyHint}</p>}
        <button
          onClick={action ? () => submit(item.id, action) : undefined}
          disabled={disabled}
          aria-busy={isBusy || undefined}
          className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${
            isEquipped
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
              : action === null
              ? "bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed"
              : anyBusy
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : action === "equip"
              ? "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
              : "bg-amber-500 text-white hover:bg-amber-600 cursor-pointer"
          }`}
        >
          {label}
        </button>
      </div>
    );
  }

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

      {/* Sales paused notice */}
      {loadState === "ready" && catalog && !catalog.salesEnabled && (
        <p role="status" className="rounded-lg px-4 py-3 text-xs leading-relaxed"
           style={{ backgroundColor: "#f9fafb", color: "#4b5563", border: "1px solid #e5e7eb" }}>
          {t.pausedMsg}
        </p>
      )}

      {/* Message */}
      {message && (
        <div
          role={message.ok ? "status" : "alert"}
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

      {loadState === "loading" && <p className="text-sm text-gray-400">{t.loading}</p>}
      {loadState === "error" && (
        <div className="flex items-center gap-3 text-sm text-red-600">
          <span>{t.loadError}</span>
          <button onClick={() => void load()} className="text-xs font-bold underline text-gray-600">{t.retry}</button>
        </div>
      )}

      {loadState === "ready" && catalog && (
        <>
          {/* Border section */}
          <div>
            <h3 className="text-sm font-extrabold text-gray-700 mb-3">{t.borderCategory}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{borders.map((item) => renderItem(item, false))}</div>
            {/* Remove border: free, also while sales are paused */}
            {equipped.border && (
              <button
                onClick={() => submit("remove_border", "equip")}
                disabled={busy !== null}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline disabled:cursor-not-allowed"
              >
                {busy === "remove_border" ? t.working : t.remove}
              </button>
            )}
          </div>

          {/* Badge section */}
          <div>
            <h3 className="text-sm font-extrabold text-gray-700 mb-3">{t.badgeCategory}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{badges.map((item) => renderItem(item, true))}</div>
          </div>
        </>
      )}
    </div>
  );
}
