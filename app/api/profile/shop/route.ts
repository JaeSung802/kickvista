import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buyOrEquip, equip, getCatalog } from "@/lib/shop";

// Item ids offered by the shop UI. Prices and values live in the server-side
// catalog (kv_private.shop_items, supabase/shop-rpc.sql); the client sends only an id.
export const SHOP_ITEM_IDS = ["silver_border", "gold_border", "diamond_border", "expert_badge", "champion_badge"] as const;

export type ShopItemId = (typeof SHOP_ITEM_IDS)[number] | "remove_border";

/**
 * GET /api/profile/shop
 * Active items with prices, the caller's own owned item ids, whether sales
 * are open, balance and equipped values (kv_shop_catalog()).
 */
export async function GET() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const result = await getCatalog();
    if (result.status === "ok") return NextResponse.json(result.catalog);
    if (result.status === "unauthenticated") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (result.status === "profile_missing") return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    return NextResponse.json({ error: "Failed to load the shop" }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "Failed to load the shop" }, { status: 500 });
  }
}

/**
 * POST /api/profile/shop
 * Body: { itemId: ShopItemId, action?: "buy" | "equip" }
 *
 * "buy" (default): kv_shop_purchase(); an already owned item is applied
 * without a charge. "equip": kv_shop_equip() only — applies an owned item,
 * also while sales are paused. "remove_border" always equips.
 */
export async function POST(req: NextRequest) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as { itemId?: unknown; action?: unknown } | null;
    const itemId = body?.itemId;
    const action = body?.action ?? "buy";
    if (itemId !== "remove_border" && !(SHOP_ITEM_IDS as readonly unknown[]).includes(itemId)) {
      return NextResponse.json({ error: "Invalid item" }, { status: 400 });
    }
    if (action !== "buy" && action !== "equip") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const result =
      itemId === "remove_border" || action === "equip"
        ? await equip(itemId as string)
        : await buyOrEquip(itemId as string);

    switch (result.status) {
      case "purchased":
      case "equipped":
        return NextResponse.json({ success: true, newPoints: result.totalPoints, item: result.item });
      case "insufficient_points":
        return NextResponse.json({ error: "Insufficient points" }, { status: 400 });
      case "invalid_item":
        return NextResponse.json({ error: "Invalid item" }, { status: 400 });
      case "not_owned":
        return NextResponse.json({ error: "Item not owned", code: "not_owned" }, { status: 400 });
      case "paused":
        return NextResponse.json(
          { error: "The shop is temporarily unavailable.", code: "shop_paused" },
          { status: 503 }
        );
      case "unauthenticated":
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      case "profile_missing":
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      default:
        return NextResponse.json({ error: "Purchase failed" }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: "Purchase failed" }, { status: 500 });
  }
}
