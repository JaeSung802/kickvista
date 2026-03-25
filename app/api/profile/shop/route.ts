import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Shop items catalogue ─────────────────────────────────────────────────────

export const SHOP_ITEMS = {
  silver_border: {
    id: "silver_border",
    cost: 300,
    type: "border" as const,
    value: "#64748b",
  },
  gold_border: {
    id: "gold_border",
    cost: 1000,
    type: "border" as const,
    value: "#eab308",
  },
  diamond_border: {
    id: "diamond_border",
    cost: 3000,
    type: "border" as const,
    value: "#0ea5e9",
  },
  expert_badge: {
    id: "expert_badge",
    cost: 2000,
    type: "badge" as const,
    value: "Expert",
  },
  champion_badge: {
    id: "champion_badge",
    cost: 5000,
    type: "badge" as const,
    value: "Champion",
  },
} as const;

export type ShopItemId = keyof typeof SHOP_ITEMS | "remove_border";

/**
 * POST /api/profile/shop
 * Body: { itemId: ShopItemId }
 *
 * Deducts points and applies the item to the user's profile.
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

    const { itemId } = (await req.json()) as { itemId: ShopItemId };

    // Free action: remove avatar border
    if (itemId === "remove_border") {
      await supabase.from("profiles").update({ avatar_border_color: null }).eq("id", user.id);
      return NextResponse.json({ success: true, item: { type: "border", value: null } });
    }

    const item = SHOP_ITEMS[itemId as keyof typeof SHOP_ITEMS];

    if (!item) {
      return NextResponse.json({ error: "Invalid item" }, { status: 400 });
    }

    // Check current points
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_points")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.total_points < item.cost) {
      return NextResponse.json({ error: "Insufficient points" }, { status: 400 });
    }

    // Build the profile update
    const profileUpdate: Record<string, unknown> = {
      total_points: profile.total_points - item.cost,
    };

    if (item.type === "border") {
      profileUpdate.avatar_border_color = item.value;
    } else if (item.type === "badge") {
      profileUpdate.title_badge = item.value;
    }

    const { error: updateErr } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", user.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Log the deduction
    await supabase.from("point_logs").insert({
      user_id: user.id,
      amount: -item.cost,
      reason: "match_bet", // reusing closest reason; extend enum if needed
      reference_id: itemId,
    });

    return NextResponse.json({
      success: true,
      newPoints: profile.total_points - item.cost,
      item: { type: item.type, value: item.value },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Purchase failed", detail: String(error) },
      { status: 500 }
    );
  }
}
