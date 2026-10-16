-- ═══════════════════════════════════════════════════════════════════
-- KickVista: trusted point shop — public.kv_shop_purchase(text),
--            public.kv_shop_equip(text)
--
-- Apply AFTER attendance-checkin-rpc.sql (uses its kv_private schema,
-- point_ledger and flags). Additive; safe to re-run.
--
-- Adds:
--   - kv_private.shop_items      catalog with server-side prices (seeded
--                                with the app's current items; a re-run
--                                never changes an existing row)
--   - kv_private.shop_purchases  trusted ownership, one row per user+item
--   - point_ledger kind 'shop_purchase' (+ purchase_id, once per purchase)
--   - kv_private.flags 'shop_purchase', created DISABLED (shop-sales-enable.sql)
--   - kv_shop_purchase(item): caller = auth.uid(); price from the catalog;
--     profile row locked; ownership row, ledger row and the relative balance
--     change in one transaction; the bought item is applied (as today).
--     Already owned -> 'already_owned', nothing charged (retries are safe).
--   - kv_shop_equip(item): applies an owned item, or 'remove_border';
--     ownership only from kv_private.shop_purchases. Not affected by the
--     sales switch (equipping owned items and removing the border stay
--     possible while sales are paused).
--   - kv_shop_catalog(): active items with prices, the CALLER's own owned
--     item ids, the sales switch value, balance and equipped values — for
--     the shop UI; no other user's data, no table access.
--   All three: SECURITY DEFINER, search_path = '', EXECUTE for authenticated only.
--
-- Not used as evidence of ownership or payment: profiles.avatar_border_color
-- / title_badge (currently equipped values) and public.point_logs — both were
-- user-writable. Existing equipped values are left as they are.
-- ═══════════════════════════════════════════════════════════════════

begin;

do $$
begin
  if coalesce(obj_description((select oid from pg_namespace where nspname = 'kv_private'), 'pg_namespace'), '')
       not like 'kickvista:kv_private%' then
    raise exception 'apply attendance-checkin-rpc.sql first (kv_private missing or not managed by KickVista)';
  end if;
  if exists (select 1 from (values ('point_ledger'), ('flags')) v(t)
             where not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                               where n.nspname = 'kv_private' and c.relname = v.t
                                 and coalesce(obj_description(c.oid, 'pg_class'), '') like 'kickvista:' || v.t || '%')) then
    raise exception 'kv_private.point_ledger / flags missing or not managed; apply attendance-checkin-rpc.sql first';
  end if;
  if (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'profiles'
        and column_name in ('total_points', 'title_badge', 'avatar_border_color')) <> 3 then
    raise exception 'public.profiles is missing total_points / title_badge / avatar_border_color';
  end if;
  -- never take over same-name objects this migration did not create
  if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'kv_private' and c.relkind in ('r', 'p', 'v', 'm', 'f')
               and c.relname not in ('checkins', 'point_ledger', 'flags', 'shop_items', 'shop_purchases')) then
    raise exception 'kv_private contains objects not managed by KickVista migrations';
  end if;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'kv_private') then
    raise exception 'kv_private contains functions not managed by KickVista migrations';
  end if;
  if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'kv_private' and c.relname in ('shop_items', 'shop_purchases')
               and coalesce(obj_description(c.oid, 'pg_class'), '') not like 'kickvista:' || c.relname || '%') then
    raise exception 'kv_private.shop_items / shop_purchases exists and is not managed by this migration';
  end if;
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public' and p.proname in ('kv_shop_purchase', 'kv_shop_equip', 'kv_shop_catalog')
               and (pg_get_function_identity_arguments(p.oid)
                      <> case p.proname when 'kv_shop_catalog' then '' else 'p_item text' end
                    or coalesce(obj_description(p.oid, 'pg_proc'), '') not like 'kickvista:shop%')) then
    raise exception 'public.kv_shop_purchase / kv_shop_equip / kv_shop_catalog exists and is not managed by this migration';
  end if;
end
$$;

create table if not exists kv_private.shop_items (
  id     text    primary key,
  kind   text    not null check (kind in ('border', 'badge')),
  value  text    not null,
  price  integer not null check (price > 0),
  active boolean not null default true
);
-- Seeded with app/api/profile/shop/route.ts on main; existing rows (e.g. a
-- price changed by an operator) are never overwritten.
insert into kv_private.shop_items (id, kind, value, price) values
  ('silver_border',  'border', '#64748b',  300),
  ('gold_border',    'border', '#eab308', 1000),
  ('diamond_border', 'border', '#0ea5e9', 3000),
  ('expert_badge',   'badge',  'Expert',  2000),
  ('champion_badge', 'badge',  'Champion', 5000)
on conflict (id) do nothing;

create table if not exists kv_private.shop_purchases (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  item_id    text        not null references kv_private.shop_items (id),
  price      integer     not null check (price > 0),
  created_at timestamptz not null default now(),
  constraint shop_purchases_user_item_unique unique (user_id, item_id)
);

comment on table kv_private.shop_items is 'kickvista:shop_items — server-side shop catalog and prices';
comment on table kv_private.shop_purchases is 'kickvista:shop_purchases — trusted item ownership, one row per user and item';

-- ledger: shop purchases, once per purchase
alter table kv_private.point_ledger
  add column if not exists purchase_id uuid references kv_private.shop_purchases (id) on delete cascade;
alter table kv_private.point_ledger drop constraint if exists point_ledger_kind_check;
alter table kv_private.point_ledger
  add constraint point_ledger_kind_check check (kind in ('daily_checkin', 'shop_purchase'));
alter table kv_private.point_ledger drop constraint if exists point_ledger_purchase_ref;
alter table kv_private.point_ledger
  add constraint point_ledger_purchase_ref check (kind <> 'shop_purchase' or purchase_id is not null);
create unique index if not exists point_ledger_shop_purchase_once
  on kv_private.point_ledger (purchase_id) where kind = 'shop_purchase';

-- sales switch, created disabled; an existing row is never changed here
insert into kv_private.flags (name, enabled) values ('shop_purchase', false)
on conflict (name) do nothing;

alter table kv_private.shop_items     enable row level security;
alter table kv_private.shop_purchases enable row level security;
revoke all on table kv_private.shop_items, kv_private.shop_purchases from public, anon, authenticated, service_role;

create or replace function public.kv_shop_purchase(p_item text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid      uuid := auth.uid();
  v_enabled  boolean;
  v_item     kv_private.shop_items%rowtype;
  v_balance  integer;
  v_purchase uuid;
  v_total    integer;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  -- sales switch (same locking scheme as the attendance payout switch)
  select enabled into v_enabled from kv_private.flags where name = 'shop_purchase' for share;
  if v_enabled is not true then
    return jsonb_build_object('status', 'paused');
  end if;

  select * into v_item from kv_private.shop_items where id = p_item and active;
  if not found then
    return jsonb_build_object('status', 'invalid_item');
  end if;

  -- serialises every balance change of this user (check-in, shop)
  select total_points into v_balance from public.profiles where id = v_uid for update;
  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;

  if exists (select 1 from kv_private.shop_purchases where user_id = v_uid and item_id = v_item.id) then
    return jsonb_build_object('status', 'already_owned', 'total_points', v_balance,
                              'item', jsonb_build_object('type', v_item.kind, 'value', v_item.value));
  end if;

  if v_balance < v_item.price then
    return jsonb_build_object('status', 'insufficient_points', 'total_points', v_balance, 'price', v_item.price);
  end if;

  insert into kv_private.shop_purchases (user_id, item_id, price)
  values (v_uid, v_item.id, v_item.price)
  returning id into v_purchase;

  insert into kv_private.point_ledger (user_id, kind, amount, purchase_id)
  values (v_uid, 'shop_purchase', -v_item.price, v_purchase);

  update public.profiles
     set total_points        = total_points - v_item.price,
         avatar_border_color = case when v_item.kind = 'border' then v_item.value else avatar_border_color end,
         title_badge         = case when v_item.kind = 'badge'  then v_item.value else title_badge end
   where id = v_uid
  returning total_points into v_total;

  return jsonb_build_object('status', 'purchased', 'price', v_item.price, 'total_points', v_total,
                            'item', jsonb_build_object('type', v_item.kind, 'value', v_item.value));
end;
$$;

create or replace function public.kv_shop_equip(p_item text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_item  kv_private.shop_items%rowtype;
  v_total integer;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if p_item = 'remove_border' then
    update public.profiles set avatar_border_color = null where id = v_uid returning total_points into v_total;
    if not found then
      raise exception 'profile not found' using errcode = 'P0002';
    end if;
    return jsonb_build_object('status', 'equipped', 'total_points', v_total,
                              'item', jsonb_build_object('type', 'border', 'value', null));
  end if;

  select * into v_item from kv_private.shop_items where id = p_item;
  if not found then
    return jsonb_build_object('status', 'invalid_item');
  end if;

  perform 1 from public.profiles where id = v_uid for update;
  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;

  if not exists (select 1 from kv_private.shop_purchases where user_id = v_uid and item_id = v_item.id) then
    return jsonb_build_object('status', 'not_owned');
  end if;

  update public.profiles
     set avatar_border_color = case when v_item.kind = 'border' then v_item.value else avatar_border_color end,
         title_badge         = case when v_item.kind = 'badge'  then v_item.value else title_badge end
   where id = v_uid
  returning total_points into v_total;

  return jsonb_build_object('status', 'equipped', 'total_points', v_total,
                            'item', jsonb_build_object('type', v_item.kind, 'value', v_item.value));
end;
$$;

create or replace function public.kv_shop_catalog()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_profile record;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  select total_points, avatar_border_color, title_badge into v_profile from public.profiles where id = v_uid;
  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;
  return jsonb_build_object(
    'items', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'type', i.kind, 'value', i.value, 'price', i.price) order by i.price, i.id)
                       from kv_private.shop_items i where i.active), '[]'::jsonb),
    'owned', coalesce((select jsonb_agg(sp.item_id order by sp.item_id) from kv_private.shop_purchases sp where sp.user_id = v_uid), '[]'::jsonb),
    'sales_enabled', coalesce((select f.enabled from kv_private.flags f where f.name = 'shop_purchase'), false),
    'total_points', v_profile.total_points,
    'equipped', jsonb_build_object('border', v_profile.avatar_border_color, 'badge', v_profile.title_badge));
end;
$$;

comment on function public.kv_shop_purchase(text) is 'kickvista:shop-purchase — buy a catalog item for auth.uid()';
comment on function public.kv_shop_catalog() is 'kickvista:shop-catalog — public catalog + the caller''s own ownership';
comment on function public.kv_shop_equip(text) is 'kickvista:shop-equip — equip an owned item for auth.uid()';
revoke execute on function public.kv_shop_purchase(text), public.kv_shop_equip(text), public.kv_shop_catalog()
  from public, anon, service_role;
grant execute on function public.kv_shop_purchase(text), public.kv_shop_equip(text), public.kv_shop_catalog()
  to authenticated;

do $$
declare f text;
begin
  foreach f in array array['public.kv_shop_purchase(text)', 'public.kv_shop_equip(text)', 'public.kv_shop_catalog()'] loop
    if has_function_privilege('anon', f, 'EXECUTE') or has_function_privilege('service_role', f, 'EXECUTE')
       or exists (select 1 from aclexplode((select coalesce(proacl, acldefault('f', proowner)) from pg_proc
                   where oid = f::regprocedure)) a where a.grantee = 0) then
      raise exception '% is still executable by PUBLIC, anon or service_role', f;
    end if;
    if not has_function_privilege('authenticated', f, 'EXECUTE') then
      raise exception 'authenticated cannot execute %', f;
    end if;
  end loop;
  if not exists (select 1 from kv_private.flags where name = 'shop_purchase') then
    raise exception 'shop_purchase flag row is missing';
  end if;
  if has_schema_privilege('anon', 'kv_private', 'USAGE') or has_schema_privilege('authenticated', 'kv_private', 'USAGE') then
    raise exception 'API roles have USAGE on kv_private';
  end if;
end
$$;

commit;

-- ─── Rollback ────────────────────────────────────────────────────
-- Stop sales with shop-sales-disable.sql first and prefer fixing forward.
-- To stop both RPCs while keeping ownership and ledger rows:
--
--   revoke execute on function public.kv_shop_purchase(text), public.kv_shop_equip(text),
--     public.kv_shop_catalog() from authenticated;
--
-- Dropping the shop objects deletes trusted ownership; only if none exists:
--
--   begin;
--   drop function if exists public.kv_shop_purchase(text);
--   drop function if exists public.kv_shop_equip(text);
--   drop function if exists public.kv_shop_catalog();
--   drop index if exists kv_private.point_ledger_shop_purchase_once;
--   alter table kv_private.point_ledger drop constraint if exists point_ledger_purchase_ref;
--   alter table kv_private.point_ledger drop column if exists purchase_id;
--   alter table kv_private.point_ledger drop constraint if exists point_ledger_kind_check;
--   alter table kv_private.point_ledger add constraint point_ledger_kind_check check (kind in ('daily_checkin'));
--   drop table if exists kv_private.shop_purchases;
--   drop table if exists kv_private.shop_items;
--   delete from kv_private.flags where name = 'shop_purchase';
--   commit;
