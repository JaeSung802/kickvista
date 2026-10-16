/**
 * Point shop through the trusted RPCs (supabase/shop-rpc.sql).
 *
 * kv_shop_purchase(item) takes the price from the server-side catalog,
 * locks the profile row and records ownership, ledger entry and the balance
 * change in one transaction; an owned item is never charged again.
 * kv_shop_equip(item) applies an owned item (or removes the border) and is
 * not affected by the sales switch. kv_shop_catalog() returns the active
 * items with prices and only the caller's own ownership. The caller is
 * auth.uid(); the app sends only the item id.
 */
export type ShopItem = { type: "border" | "badge"; value: string | null };

export type ShopResult =
  | { status: "purchased" | "equipped"; item: ShopItem; totalPoints: number }
  | { status: "insufficient_points" | "invalid_item" | "not_owned" | "paused" | "unauthenticated" | "profile_missing" | "failed" };

type RpcBody = { status?: string; total_points?: number; item?: ShopItem } | null;

async function call(fn: "kv_shop_purchase" | "kv_shop_equip", itemId: string): Promise<{ body: RpcBody; result?: ShopResult }> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(fn, { p_item: itemId });
  if (error) {
    if (error.code === "28000") return { body: null, result: { status: "unauthenticated" } };
    if (error.code === "P0002") return { body: null, result: { status: "profile_missing" } };
    console.error(JSON.stringify({ scope: "shop", event: "rpc_failed", fn, db_code: error.code ?? null }));
    return { body: null, result: { status: "failed" } };
  }
  return { body: data as RpcBody };
}

function done(body: RpcBody, status: "purchased" | "equipped"): ShopResult {
  if (body?.item && typeof body.total_points === "number") return { status, item: body.item, totalPoints: body.total_points };
  console.error(JSON.stringify({ scope: "shop", event: "unexpected_result" }));
  return { status: "failed" };
}

/** Buy (and apply) an item; an item the user already owns is applied without a charge. */
export async function buyOrEquip(itemId: string): Promise<ShopResult> {
  const { body, result } = await call("kv_shop_purchase", itemId);
  if (result) return result;
  switch (body?.status) {
    case "purchased":
      return done(body, "purchased");
    case "already_owned":
      return equip(itemId);
    case "insufficient_points":
    case "invalid_item":
    case "paused":
      return { status: body.status };
    default:
      console.error(JSON.stringify({ scope: "shop", event: "unexpected_result" }));
      return { status: "failed" };
  }
}

/** Apply an owned item, or "remove_border". */
export async function equip(itemId: string): Promise<ShopResult> {
  const { body, result } = await call("kv_shop_equip", itemId);
  if (result) return result;
  switch (body?.status) {
    case "equipped":
      return done(body, "equipped");
    case "not_owned":
    case "invalid_item":
      return { status: body.status };
    default:
      console.error(JSON.stringify({ scope: "shop", event: "unexpected_result" }));
      return { status: "failed" };
  }
}

export type ShopCatalog = {
  items: { id: string; type: "border" | "badge"; value: string; price: number }[];
  owned: string[];
  salesEnabled: boolean;
  totalPoints: number;
  equipped: { border: string | null; badge: string | null };
};

/** Catalog for the shop UI: public item data plus the caller's own ownership. */
export async function getCatalog(): Promise<
  { status: "ok"; catalog: ShopCatalog } | { status: "unauthenticated" | "profile_missing" | "failed" }
> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("kv_shop_catalog");
  if (error) {
    if (error.code === "28000") return { status: "unauthenticated" };
    if (error.code === "P0002") return { status: "profile_missing" };
    console.error(JSON.stringify({ scope: "shop", event: "rpc_failed", fn: "kv_shop_catalog", db_code: error.code ?? null }));
    return { status: "failed" };
  }
  const d = data as { items?: ShopCatalog["items"]; owned?: string[]; sales_enabled?: boolean; total_points?: number; equipped?: ShopCatalog["equipped"] } | null;
  if (!d || !Array.isArray(d.items) || !Array.isArray(d.owned) || typeof d.total_points !== "number" || !d.equipped) {
    console.error(JSON.stringify({ scope: "shop", event: "unexpected_result", fn: "kv_shop_catalog" }));
    return { status: "failed" };
  }
  return {
    status: "ok",
    catalog: { items: d.items, owned: d.owned, salesEnabled: d.sales_enabled === true, totalPoints: d.total_points, equipped: d.equipped },
  };
}
